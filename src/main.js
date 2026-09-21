import {
  APP_CONFIG, isBackendConfigured, getBackendDiagnostics, getSessionState, onAuthChange, signIn, signOut, signUp,
  listPublishedSubmissions, getPublishedSubmission, listMySubmissions, createSubmission,
  listModerationQueue, moderateSubmission, resendSignupConfirmation
} from './lib/repository.js';
import { normalizeMedia } from './lib/media.js';
import { getCatalog, getCollection, loadCategory, loadCollectionIndex, loadSources, resolveRecord } from './lib/data.js';
import { $, $$, debounce, escapeHtml, formatBytes, formatDate, formatDateTime, routeName, routeParam, setBusy, toast } from './lib/utils.js';
import { TAXONOMY, QUICK_ENTRIES } from './data/taxonomy.js';

const R = getCatalog();
let sourceMap = new Map();
let sourcesLoaded = false;
const appState = {
  user: null,
  profile: null,
  theme: localStorage.getItem('llmBibleTheme') || 'system',
  favorites: new Set(JSON.parse(localStorage.getItem('llmBibleFavorites') || '[]')),
  authBusy: false,
  pendingEmail: localStorage.getItem('llmBiblePendingEmail') || '',
  authNotice: '',
  backend: { configured: isBackendConfigured(), authReachable: false, schemaReady: false, detail: '', missingTables: [] }
};

function queryParams() {
  const raw = location.hash.split('?')[1] || '';
  return new URLSearchParams(raw);
}

function applyTheme() { document.documentElement.dataset.theme = appState.theme; }
applyTheme();

function statusBadge() {
  if (!appState.backend.configured) return '<span class="backend-dot offline"></span> Preview';
  if (!appState.backend.authReachable) return '<span class="backend-dot offline"></span> Auth 오류';
  if (appState.backend.schemaReady) return '<span class="backend-dot online"></span> Supabase';
  return '<span class="backend-dot warn"></span> Auth 연결';
}

function appShell(content) {
  const isAdmin = appState.profile?.role === 'admin';
  const userLabel = appState.profile?.display_name || appState.user?.email || '계정';
  return `
    <header class="site-header">
      <div class="header-inner shell">
        <a class="brand" href="#/home" aria-label="LLM Bible 홈"><span class="brand-mark">LB</span><span><strong>LLM Bible</strong><small>Evidence + Practice</small></span></a>
        <nav class="desktop-nav" aria-label="주요 메뉴">
          <a data-nav="home" href="#/home">시작</a>
          <a data-nav="map" href="#/map">전체 지도</a>
          <a data-nav="prompts" href="#/prompts">프롬프트</a>
          <a data-nav="tools" href="#/tools">스킬·MCP</a>
          <a data-nav="recipes" href="#/recipes">레시피</a>
          <a data-nav="failures" href="#/failures">문제해결</a>
          <a data-nav="community" href="#/community">공유</a>
          ${isAdmin ? '<a data-nav="admin" href="#/admin">관리자</a>' : ''}
        </nav>
        <div class="header-actions">
          <span class="backend-chip">${statusBadge()}</span>
          <button id="themeButton" class="icon-button" type="button" title="테마 변경" aria-label="테마 변경">◐</button>
          <a class="account-chip" href="#/account">${escapeHtml(userLabel)}</a>
          <button id="menuButton" class="icon-button mobile-only" type="button" aria-expanded="false" aria-controls="mobileNav">☰</button>
        </div>
      </div>
      <nav id="mobileNav" class="mobile-nav shell" hidden>
        <a href="#/home">시작</a><a href="#/map">전체 지도</a><a href="#/prompts">프롬프트</a><a href="#/tools">스킬·MCP</a><a href="#/recipes">레시피</a><a href="#/failures">문제해결</a><a href="#/community">공유</a><a href="#/submit">업로드</a>${isAdmin ? '<a href="#/admin">관리자</a>' : ''}<a href="#/account">계정</a>
      </nav>
    </header>
    <main id="main">${content}</main>
    <footer class="site-footer"><div class="shell footer-inner"><div><strong>LLM Bible</strong><p>공식 근거 · 실제 예시 · 실패 패턴 · 검수형 커뮤니티.</p></div><div><span>Research snapshot · ${escapeHtml(R.meta?.snapshot || '2026-09-21')}</span><span>${appState.backend.schemaReady ? 'Supabase community ready' : appState.backend.configured && appState.backend.authReachable ? 'Supabase Auth connected · schema setup pending' : appState.backend.configured ? 'Supabase Auth connection error' : 'Static preview mode'}</span></div></div></footer>
    <dialog id="appDialog" class="app-dialog"><button class="dialog-close" type="button" data-close-dialog aria-label="닫기">×</button><div id="dialogBody"></div></dialog>`;
}

function backendNotice() {
  if (!appState.backend.configured) return `<div class="callout warning"><strong>백엔드 연결값이 없습니다.</strong> 정적 지식은 모두 사용할 수 있지만 로그인·업로드는 비활성입니다.</div>`;
  if (!appState.backend.authReachable) return `<div class="callout danger"><strong>Supabase 연결값은 있지만 Auth endpoint에 연결하지 못했습니다.</strong><br>${escapeHtml(appState.backend.detail || '네트워크, Project URL, Publishable Key를 확인하세요.')}<br><code>verify-backend.cmd</code>로 상태를 확인할 수 있습니다.</div>`;
  if (!appState.backend.schemaReady) {
    const missing=(appState.backend.missingTables||[]).join(', ');
    return `<div class="callout setup-callout"><div><strong>로그인은 정상입니다. 커뮤니티 DB 설치만 남았습니다.</strong><p>${missing?`현재 없는 테이블: <code>${escapeHtml(missing)}</code>`:'LLM Bible 전용 테이블을 확인하지 못했습니다.'}</p><p>프로젝트 폴더의 <code>setup-permissions.cmd</code>를 실행하면 SQL Editor와 권한 설정을 순서대로 안내합니다.</p></div><div class="callout-actions"><a class="button secondary small" href="setup/schema.sql" target="_blank" rel="noopener">schema.sql 보기</a>${copyButton('명령 복사','setup-permissions.cmd','ghost')}</div></div>`;
  }
  return '';
}

function countCard(value, label, hint, href) {
  return `<a class="metric-card" href="${href}"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(hint)}</small></a>`;
}

function renderHome() {
  const framework = TAXONOMY.slice(0,6).map((area)=>`<a class="home-map-card" href="${escapeHtml(area.href)}"><span>${escapeHtml(area.order)}</span><div><b>${escapeHtml(area.title)}</b><small>${escapeHtml(area.summary)}</small></div><em>→</em></a>`).join('');
  return appShell(`
    <section class="home-hero shell">
      <div class="home-hero-copy"><span class="eyebrow">LLM BIBLE · EVIDENCE + PRACTICE</span><h1>AI를 잘 쓰는 법을<br><span>상황별로 찾는 지도</span></h1><p>무작정 프롬프트를 모으지 않습니다. 지금 하려는 일에서 시작해 Prompt → Skill → MCP → Agent → Eval까지 필요한 만큼만 확장합니다.</p><div class="hero-actions"><a class="button primary" href="#/map">전체 지도부터 보기</a><a class="button secondary" href="#/prompts">바로 쓸 프롬프트</a></div></div>
      <div class="home-start-card"><span class="eyebrow">어디서 시작할까요?</span><div class="start-lanes"><a href="#/learn"><b>배우기</b><span>처음부터 개념과 실습 순서</span></a><a href="#/failures"><b>문제 해결</b><span>안 되는 증상에서 원인 찾기</span></a><a href="#/recipes"><b>만들기</b><span>실전 workflow와 agent recipe</span></a></div><div class="corpus-status"><span><b>${R.meta.prompt_count||240}</b> Prompt seed</span><span><b>${R.meta.skill_count||120}</b> Skill seed</span><span><b>${getCollection('mcp').total||72}</b> MCP starter</span><span><b>${R.meta.recipe_count||50}</b> Recipe seed</span></div></div>
    </section>
    ${backendNotice()}
    <section class="section shell home-quick"><div class="section-heading"><div><span class="eyebrow">QUICK ENTRY</span><h2>지금 겪는 상황에서 바로 시작</h2></div><a class="text-link" href="#/map">전체 분류 보기 →</a></div><div class="quick-strip">${QUICK_ENTRIES.map(x=>`<a href="${escapeHtml(x.href)}"><b>${escapeHtml(x.title)}</b><span>${escapeHtml(x.hint)}</span></a>`).join('')}</div></section>
    <section class="section shell home-framework"><div class="section-heading"><div><span class="eyebrow">BIBLE MAP</span><h2>큰 틀은 고정하고, 데이터만 계속 채웁니다.</h2></div><p>현재 데이터가 적은 분야도 메뉴 자리를 먼저 만들어 두었습니다.</p></div><div class="home-map-grid">${framework}</div><a class="map-more" href="#/map">12개 전체 영역과 세부 분류 모두 보기 →</a></section>
    <section class="section shell home-principle"><div class="principle-card"><span>01</span><div><b>작은 방법부터</b><p>Prompt → Structured Output → RAG → Tool → Agent → Fine-tuning 순으로 복잡도를 올립니다.</p></div></div><div class="principle-card"><span>02</span><div><b>복사만 하지 말고 검증</b><p>모델·버전·입력·출력·Eval·Last verified를 함께 봅니다.</p></div></div><div class="principle-card"><span>03</span><div><b>공유 사례는 결과까지</b><p>Prompt만 올리는 것이 아니라 실제 Result와 재현 조건을 같이 제출합니다.</p></div></div></section>`);
}

function collectionHero(eyebrow,title,desc,stats='') { return `<section class="page-hero shell"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p>${stats}</section>`; }

function researchCard(item, type) {
  const meta = type==='prompt' ? `${item.pattern} · ${item.domain}` : type==='skill' ? `${item.domain} · ${item.kind}` : type==='mcp' ? `MCP · ${item.category}` : type==='recipe' ? item.category : 'Anti-pattern';
  const title = item.title || item.name;
  const summary = item.intent || item.purpose || item.summary || item.problem || item.symptom;
  const difficulty = item.difficulty || '중급';
  const shard = item.shard || '';
  return `<article class="research-card"><div class="card-topline"><span class="pill soft">${escapeHtml(meta)}</span><span>${escapeHtml(difficulty)}</span></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary)}</p><div class="card-meta"><span>검증 ${escapeHtml(item.last_verified || R.meta?.snapshot || '-')}</span>${item.measurement_status ? `<span>${escapeHtml(item.measurement_status)}</span>`:''}</div><button class="text-button" type="button" data-research-open="${type}:${escapeHtml(item.id)}" data-research-shard="${escapeHtml(shard)}">상세·복사 보기 →</button></article>`;
}


function renderMap() {
  const areas = TAXONOMY.map((area) => {
    const slotCount=area.groups.reduce((sum,[,items])=>sum+items.length,0);
    const groups = area.groups.map(([name, items]) => `<details class="map-group"><summary><b>${escapeHtml(name)}</b><em>${items.length}</em></summary><div>${items.map((item)=>`<span>${escapeHtml(item)}</span>`).join('')}</div></details>`).join('');
    const progress = area.current ? `<span class="framework-progress">현재 ${Number(area.current).toLocaleString()} · 목표 ${escapeHtml(area.target || '확장')}</span>` : `<span class="framework-progress muted">분류 슬롯 ${slotCount}</span>`;
    return `<article class="framework-card" id="framework-${escapeHtml(area.id)}"><div class="framework-card-head"><span class="framework-icon">${escapeHtml(area.icon)}</span><div><small>${escapeHtml(area.order)}</small><h2>${escapeHtml(area.title)}</h2></div>${progress}</div><p>${escapeHtml(area.summary)}</p><div class="map-groups">${groups}</div><a class="button secondary small" href="${escapeHtml(area.href)}">이 영역 열기</a></article>`;
  }).join('');
  return appShell(`
    <section class="page-hero shell map-hero"><span class="eyebrow">INFORMATION ARCHITECTURE</span><h1>데이터보다 먼저, <span>LLM Bible의 전체 틀</span></h1><p>현재 데이터가 있는 분류와 앞으로 리서치로 채울 분류를 분리했습니다. 메뉴 구조는 고정하고, 데이터만 단계적으로 추가합니다.</p></section>
    <section class="section shell"><div class="framework-guide"><div><b>1. 틀 고정</b><span>카테고리·세부 분류·상세 화면 규칙을 먼저 결정</span></div><div><b>2. Seed</b><span>공식 근거가 있는 최소 예시를 넣어 동작 검증</span></div><div><b>3. 확장</b><span>심층 리서치 결과를 분류별로 나누어 추가</span></div><div><b>4. 검증</b><span>Evidence·Last verified·Eval 상태를 갱신</span></div></div><div class="framework-list">${areas}</div></section>`);
}

function categoryRail(collectionName, attrName) {
  const categories = getCollection(collectionName).categories || [];
  return `<aside class="explorer-rail"><div class="rail-title"><span>분류</span><small>${Number(getCollection(collectionName).total||0).toLocaleString()} seed</small></div><div class="rail-list">${categories.map((c)=>`<button class="rail-item" type="button" data-${attrName}-category="${escapeHtml(c.id)}"><span><b>${escapeHtml(c.label)}</b><small>${escapeHtml(c.description||'')}</small></span><em>${Number(c.count||0).toLocaleString()}</em></button>`).join('')}</div><a class="rail-map-link" href="#/map">전체 분류 지도 보기 →</a></aside>`;
}
function categoryCards(collectionName, attrName) {
  const categories = getCollection(collectionName).categories || [];
  return `<div class="category-grid" id="${attrName}Categories">${categories.map((c) => `<button class="category-card" type="button" data-${attrName}-category="${escapeHtml(c.id)}"><span class="category-count">${Number(c.count || 0).toLocaleString()}개</span><strong>${escapeHtml(c.label)}</strong><p>${escapeHtml(c.description || '')}</p>${c.difficulty ? `<small>${escapeHtml(c.difficulty)} · ${escapeHtml(c.evidence || '')}</small>` : ''}</button>`).join('')}</div>`;
}

function categoryIntro(collectionName) {
  const total = getCollection(collectionName).total || 0;
  return `<div class="category-first-note"><b>카테고리 우선 로딩</b><span>처음에는 목차만 표시하고, 선택한 카테고리의 상세 데이터만 내려받습니다.</span><span>전체 검색을 입력할 때만 가벼운 검색 인덱스를 추가로 불러옵니다.</span><em>총 ${Number(total).toLocaleString()}개</em></div>`;
}

function renderPrompts() {
  return appShell(`${collectionHero('PROMPT LIBRARY','프롬프트는 “패턴 → 목적 → 예시” 순서로 찾습니다.','240개 seed는 유지하되, 화면에는 분류를 먼저 보여주고 선택한 범위만 로드합니다. 앞으로 Context·Multimodal·Coding·Research 등 빈 슬롯을 같은 구조에 계속 추가합니다.',`<div class="hero-badges"><span>12 seeded patterns</span><span>확장 분류 준비</span><span>Copy-ready</span></div>`)}<section class="section shell explorer-shell"><div class="explorer-layout">${categoryRail('prompts','prompt')}<div class="explorer-main"><div class="explorer-top"><div><span class="eyebrow">PROMPT EXPLORER</span><h2>하나의 패턴만 열어 집중해서 보기</h2><p>검색은 필요할 때만 전체 인덱스를 불러옵니다.</p></div><a class="button ghost small" href="#/map#framework-prompts">확장 분류 보기</a></div><div class="search-panel compact-search"><label class="search-box"><span>⌕</span><input id="promptSearch" type="search" placeholder="목적·업무·제목 검색"></label><label>난이도<select id="promptDifficulty"><option value="all">전체</option><option>초급</option><option>중급</option><option>고급</option></select></label><button id="resetPrompts" class="text-button" type="button">초기화</button></div><div id="promptLoadNote" class="data-load-note">왼쪽에서 패턴을 선택하세요.</div><div class="result-toolbar"><p id="promptCount" class="result-count"></p><div id="promptPager" class="pager"></div></div><div id="promptGrid" class="research-grid"></div></div></div></section>`);
}

function renderTools() {
  const view=queryParams().get('view')||'skill';
  const toolRows=(R.comparisons?.tool_types||[]).map(x=>`<tr><td><strong>${escapeHtml(x.type)}</strong></td><td>${escapeHtml(x.purpose)}</td><td>${escapeHtml(x.runtime)}</td><td>${escapeHtml(x.permission)}</td></tr>`).join('');
  const switcher=`<div class="tool-view-switch"><a class="${view==='skill'?'active':''}" href="#/tools?view=skill">Skill</a><a class="${view==='connector'?'active':''}" href="#/tools?view=connector">Plugin / Connector</a><a class="${view==='mcp'?'active':''}" href="#/tools?view=mcp">MCP · Tool Calling</a><a href="#/recipes?cat=agent-architecture">Agent Recipes</a></div>`;
  if(view==='mcp') {
    return appShell(`${collectionHero('MCP · TOOL CALLING','MCP는 “개념 → Tool 설계 → 권한 → 연결 → Workflow” 순서로 봅니다.','72개 starter record를 먼저 넣고, 이후 실제 서버·SDK·코드 예시를 같은 분류에 계속 추가합니다.',`<div class="hero-badges"><span>${getCollection('mcp').total||72} starter</span><span>공식 개념 기반</span><span>Copy-ready</span></div>`)}<section class="section shell">${switcher}<div class="framework-guide compact"><div><b>1. Core</b><span>Client·Server·Tool·Resource</span></div><div><b>2. Design</b><span>Schema·retry·idempotency</span></div><div><b>3. Security</b><span>OAuth·scope·approval</span></div><div><b>4. Integrate</b><span>GitHub·DB·Browser·Slack</span></div></div></section><section class="section shell explorer-shell"><div class="explorer-layout">${categoryRail('mcp','mcp')}<div class="explorer-main"><div class="explorer-top"><div><span class="eyebrow">MCP STARTER EXPLORER</span><h2>한 범주씩 열어 설계 원칙부터 익히기</h2><p>각 항목에는 언제 쓰는지, 피해야 할 상황, 복사 가능한 starter template과 체크리스트가 들어 있습니다.</p></div><a class="button ghost small" href="#/map#framework-mcp">MCP 전체 분류</a></div><div class="search-panel compact-search"><label class="search-box"><span>⌕</span><input id="mcpSearch" type="search" placeholder="OAuth, tool schema, GitHub, retry…"></label><button id="resetMcp" class="text-button" type="button">초기화</button></div><div id="mcpLoadNote" class="data-load-note">왼쪽에서 MCP 범주를 선택하세요.</div><p id="mcpCount" class="result-count"></p><div id="mcpGrid" class="research-grid"></div></div></div></section>`);
  }
  const connectorMode=view==='connector';
  return appShell(`${collectionHero('SKILLS · PLUGINS · CONNECTORS','프롬프트 다음 도구를 쉽게 구분합니다.','Skill은 반복 가능한 지식 모듈, Connector/Plugin은 외부 서비스 연결, MCP는 표준화된 도구·리소스 연결, Agent는 여러 단계를 실행하는 런타임으로 나눠 봅니다.')}<section class="section shell tool-choice">${switcher}<div class="choice-grid"><a href="#/tools?view=skill"><b>Skill</b><span>반복 업무 지침 + 파일 + 도구 묶음</span></a><a href="#/tools?view=connector"><b>Plugin / Connector</b><span>메일·캘린더·GitHub·Figma 등 앱 연결</span></a><a href="#/tools?view=mcp"><b>MCP</b><span>Tool / Resource / Prompt를 표준 방식으로 연결</span></a><a href="#/recipes?cat=agent-architecture"><b>Agent</b><span>계획·도구·검증을 여러 단계로 실행</span></a></div><details class="comparison-details"><summary>기술적 차이 표 보기</summary><div class="table-wrap"><table class="data-table"><thead><tr><th>타입</th><th>목적</th><th>실행 위치</th><th>권한 모델</th></tr></thead><tbody>${toolRows}</tbody></table></div></details></section><section class="section shell explorer-shell"><div class="explorer-layout">${categoryRail('skills','skill')}<div class="explorer-main"><div class="explorer-top"><div><span class="eyebrow">${connectorMode?'CONNECTOR SEED':'SKILL / PLUGIN SEED'}</span><h2>${connectorMode?'외부 서비스 연결 사례부터 보기':'업무 영역을 하나씩 열어 보기'}</h2><p>${connectorMode?'Connectors 카테고리를 기본 선택하고, 관련 Skill/Plugin 패턴을 함께 봅니다.':'현재 120개 seed를 기반으로 Design·DevOps·CRM·개인 생산성 등 분류는 틀에 먼저 확보해 두었습니다.'}</p></div><div class="top-actions"><button id="sourceToggle" class="button ghost small" type="button">원천 소스</button><a class="button ghost small" href="#/tools?view=mcp">MCP 72개 보기</a></div></div><div class="search-panel compact-search"><label class="search-box"><span>⌕</span><input id="skillSearch" type="search" placeholder="PR 리뷰, 논문 비교, GitHub, Jira…"></label><button id="resetSkills" class="text-button" type="button">초기화</button></div><div id="skillLoadNote" class="data-load-note">왼쪽에서 업무 영역을 선택하세요.</div><p id="skillCount" class="result-count"></p><div id="skillGrid" class="research-grid"></div><div id="sourcesPanel" class="sources-panel" hidden></div></div></div></section>`);
}

function renderRecipes() {
  return appShell(`${collectionHero('PRACTICAL RECIPES','복잡한 설명보다 “이 상황에서는 이렇게”','문제 → 접근 → Prompt/Skill/MCP → 실행 → 검증의 한 묶음으로 봅니다.')}<section class="section shell explorer-shell"><div class="explorer-layout">${categoryRail('recipes','recipe')}<div class="explorer-main"><div class="explorer-top"><div><span class="eyebrow">RECIPE EXPLORER</span><h2>상황을 골라 필요한 절차만 보기</h2><p>현재 50개 seed, 이후 150+까지 같은 틀로 확장합니다.</p></div><a class="button ghost small" href="#/map#framework-recipes">확장 분류 보기</a></div><div class="search-panel compact-search"><label class="search-box"><span>⌕</span><input id="recipeSearch" type="search" placeholder="RAG, GitHub issue, 비용 라우터…"></label><button id="resetRecipes" class="text-button" type="button">초기화</button></div><div id="recipeLoadNote" class="data-load-note">왼쪽에서 문제 유형을 선택하세요.</div><p id="recipeCount" class="result-count"></p><div id="recipeGrid" class="research-grid"></div></div></div></section>`);
}

function renderFailures() {
  const quick=(R.modes||[]).map(m=>`<article class="quick-card"><span>${escapeHtml(m.title)}</span><h3>${escapeHtml(m.ko)}</h3><p>${escapeHtml(m.rule)}</p></article>`).join('');
  return appShell(`${collectionHero('TROUBLESHOOTING','왜 안 되는지 “증상”부터 찾습니다.','실패 패턴은 원인 → 수정 → 예방 → Eval 순서로 정리합니다.')}<section class="section shell"><div class="quick-strip">${QUICK_ENTRIES.map(x=>`<a href="${escapeHtml(x.href)}"><b>${escapeHtml(x.title)}</b><span>${escapeHtml(x.hint)}</span></a>`).join('')}</div><details class="comparison-details"><summary>30초 Quick Mode 보기</summary><div class="quick-grid">${quick}</div></details></section><section class="section shell explorer-shell"><div class="explorer-layout">${categoryRail('failures','failure')}<div class="explorer-main"><div class="explorer-top"><div><span class="eyebrow">SYMPTOM-FIRST</span><h2>문제 영역을 하나씩 점검</h2><p>현재 30개 seed, 목표 100+ 실패 패턴.</p></div><a class="button ghost small" href="#/map#framework-failures">확장 분류 보기</a></div><div class="search-panel compact-search"><label class="search-box"><span>⌕</span><input id="failureSearch" type="search" placeholder="환각, 비용, tool loop, cache miss…"></label><button id="resetFailures" class="text-button" type="button">초기화</button></div><div id="failureLoadNote" class="data-load-note">왼쪽에서 문제 영역을 선택하세요.</div><p id="failureCount" class="result-count"></p><div id="failureGrid" class="research-grid"></div></div></div></section>`);
}

async function renderCommunity() {
  const detail = routeParam(); if (detail) return renderCommunityDetail(detail);
  let items=[]; let error='';
  try { items=await listPublishedSubmissions(); } catch(e){ error=e.message; }
  const cards=items.map(communityCard).join('');
  return appShell(`${collectionHero('REVIEWED COMMUNITY','관리자 검수를 통과한 Prompt → Result','사용 모델·버전·프롬프트·결과·재현 메모를 한 묶음으로 확인합니다.')}<section class="section shell">${backendNotice()}${error?`<div class="callout danger">${escapeHtml(error)}</div>`:''}<div class="toolbar"><label class="search-box"><span>⌕</span><input id="communitySearch" type="search" placeholder="공유 사례 검색"></label><select id="communityCategory"><option value="all">모든 카테고리</option>${categoryOptions()}</select></div><div id="communityGrid" class="community-grid">${cards || `<div class="empty-state wide"><h3>아직 공개된 사례가 없습니다.</h3><p>로그인과 커뮤니티 스키마 설정 후 첫 사례를 제출할 수 있습니다.</p><a class="button primary" href="#/submit">사례 제출하기</a></div>`}</div></section>`);
}

function communityCard(item) {
  const media=item.media?.[0];
  const visual=media?.publicUrl ? (media.kind==='video'?`<video class="community-thumb" src="${escapeHtml(media.publicUrl)}" muted playsinline preload="metadata"></video>`:`<img class="community-thumb" src="${escapeHtml(media.publicUrl)}" alt="${escapeHtml(media.alt_text||item.title)}" loading="lazy">`) : `<div class="community-thumb placeholder">PROMPT</div>`;
  return `<article class="community-card">${visual}<div class="community-card-body"><div class="card-topline"><span class="pill official">검수 공개</span><span>${formatDate(item.published_at)}</span></div><p class="card-category">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><div class="card-meta"><span>${escapeHtml(item.model_name||'모델 미상')}${item.model_version?` · ${escapeHtml(item.model_version)}`:''}</span><span>by ${escapeHtml(item.author_display_name||'회원')}</span></div><a class="text-link" href="#/community/${encodeURIComponent(item.slug||item.id)}">Prompt → Result 보기 →</a></div></article>`;
}

async function renderCommunityDetail(slug) {
  let item=null; let error=''; try { item=await getPublishedSubmission(decodeURIComponent(slug)); } catch(e){ error=e.message; }
  if(!item) return appShell(`<section class="section shell narrow"><a class="back-link" href="#/community">← 공유 사례</a><div class="empty-state"><h2>사례를 찾을 수 없습니다.</h2><p>${escapeHtml(error||'삭제되었거나 공개 상태가 아닙니다.')}</p></div></section>`);
  const media=(item.media||[]).map(m=>m.kind==='video'?`<figure><video controls preload="metadata" src="${escapeHtml(m.publicUrl||'')}"></video>${m.alt_text?`<figcaption>${escapeHtml(m.alt_text)}</figcaption>`:''}</figure>`:`<figure><img loading="lazy" src="${escapeHtml(m.publicUrl||'')}" alt="${escapeHtml(m.alt_text||item.title)}">${m.alt_text?`<figcaption>${escapeHtml(m.alt_text)}</figcaption>`:''}</figure>`).join('');
  return appShell(`<article class="section shell article-detail"><a class="back-link" href="#/community">← 공유 사례</a><div class="detail-heading"><div><span class="pill official">관리자 검수 완료</span><p class="eyebrow">${escapeHtml(item.category)}</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p></div><dl class="meta-list"><div><dt>작성자</dt><dd>${escapeHtml(item.author_display_name||'회원')}</dd></div><div><dt>모델</dt><dd>${escapeHtml(item.model_name||'-')} ${escapeHtml(item.model_version||'')}</dd></div><div><dt>공개일</dt><dd>${formatDate(item.published_at)}</dd></div></dl></div>${copyActionBar([{label:'Prompt 복사',text:item.prompt_text,kind:'primary'},{label:'Result 복사',text:item.result_text},{label:'Prompt + Result',text:`PROMPT\n${item.prompt_text}\n\nRESULT\n${item.result_text}`}])}<div class="prompt-result-grid"><section><span class="eyebrow">PROMPT</span>${codeBlock(item.prompt_text,'Prompt 복사')}</section><section><span class="eyebrow">RESULT</span>${codeBlock(item.result_text,'Result 복사')}</section></div>${item.source_notes?`<section class="detail-block"><h2>재현·출처 메모</h2><p>${escapeHtml(item.source_notes)}</p></section>`:''}${media?`<section class="detail-block"><h2>예시 미디어</h2><div class="media-gallery">${media}</div></section>`:''}</article>`);
}

function categoryOptions(){ return ['프롬프트','RAG','에이전트','코딩','이미지','영상','데이터','업무자동화','기타'].map(x=>`<option value="${x}">${x}</option>`).join(''); }

function renderSubmit() {
  if(!appState.user) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><span class="eyebrow">MEMBER SUBMISSION</span><h1>로그인 후 사례를 제출할 수 있습니다.</h1><p>제출물은 즉시 공개되지 않고 관리자 검수 전 비공개로 유지됩니다.</p><a class="button primary" href="#/account">로그인 / 회원가입</a></div></section>`);
  if(!appState.backend.schemaReady) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><h1>로그인은 연결되었습니다.</h1><p>사례 업로드를 사용하려면 동일 Supabase 프로젝트에 LLM Bible 스키마를 1회 적용해야 합니다.</p><code>backend-bootstrap.cmd</code></div></section>`);
  return appShell(`${collectionHero('SUBMIT A CASE','Prompt → Result 사례 제출','다른 사람이 재현할 수 있도록 모델·버전·전체 프롬프트·대표 결과·검증 메모를 함께 남겨주세요.')}<section class="section shell form-shell"><form id="submissionForm" class="panel-form"><div class="form-grid"><label>제목<input name="title" minlength="5" maxlength="100" required></label><label>카테고리<select name="category" required><option value="">선택</option>${categoryOptions()}</select></label></div><label>한 줄 요약<textarea name="summary" minlength="20" maxlength="500" rows="3" required></textarea></label><div class="form-grid"><label>사용 모델<input name="modelName" maxlength="80" required></label><label>모델 버전 / ID<input name="modelVersion" maxlength="120"></label></div><label>프롬프트<textarea name="promptText" minlength="30" maxlength="30000" rows="14" required spellcheck="false"></textarea></label><label>결과<textarea name="resultText" minlength="30" maxlength="30000" rows="14" required spellcheck="false"></textarea></label><label>재현·출처 메모<textarea name="sourceNotes" maxlength="5000" rows="5" placeholder="temperature, tools, RAG 조건, 데이터셋, 평가 방법, 출처 링크 등"></textarea></label><fieldset class="media-field"><legend>예시 미디어 · 최대 ${APP_CONFIG.maxMediaCount}개</legend><p>커뮤니티 저장 인프라에서는 이미지는 WebP, 영상은 WebM으로 정규화합니다. 이 기능은 지식 리서치 내용과 별도인 업로드 운영 기능입니다.</p><input id="mediaInput" name="media" type="file" accept="image/*,video/*" multiple><div id="mediaSelection" class="media-selection"></div><div id="conversionProgress" class="progress-box" hidden><div class="progress-track"><span id="progressBar"></span></div><p id="progressText">변환 준비 중…</p></div></fieldset><label class="consent-row"><input name="rights" type="checkbox" required><span>개인정보·비밀키·저작권 침해 자료를 포함하지 않았으며 공개 승인에 동의합니다.</span></label><div class="callout info"><strong>검수 기준:</strong> 명확성 · 재현성 · 결과 품질 · 정확성 · 안전성 · 학습 가치</div><button class="button primary" type="submit">검수 요청 제출</button></form></section>`);
}

function adminPromotionSql(email){
  const safe=String(email||'').replaceAll("'","''");
  return `insert into public.profiles(id,display_name,role)\nselect id, coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'), 'admin'\nfrom auth.users\nwhere email='${safe}'\non conflict(id) do update set role='admin';`;
}
function permissionPanel(){
  if(!appState.user)return '';
  if(!appState.backend.schemaReady){
    const missing=(appState.backend.missingTables||[]).join(', ');
    return `<section class="permission-panel"><div><span class="eyebrow">BACKEND SETUP</span><h2>① DB 스키마부터 설치</h2><p>로그인은 이미 정상입니다. 커뮤니티 기능은 LLM Bible 전용 테이블을 같은 Supabase 프로젝트에 한 번 생성해야 합니다.</p>${missing?`<p>확인된 누락: <code>${escapeHtml(missing)}</code></p>`:''}</div><div class="permission-steps"><div><b>1</b><span><code>setup-permissions.cmd</code> 실행</span></div><div><b>2</b><span>열리는 SQL Editor에서 <code>schema.sql</code> Run</span></div><div><b>3</b><span>관리자 이메일 승격 SQL Run</span></div><div><b>4</b><span><code>redeploy-pages.cmd</code> 실행 후 새로고침</span></div></div><div class="copy-action-bar"><a class="button secondary small" href="setup/schema.sql" target="_blank" rel="noopener">schema.sql 보기</a>${copyButton('setup 명령 복사','setup-permissions.cmd','primary')}</div></section>`;
  }
  if(appState.profile?.role==='admin')return `<section class="permission-panel success-panel"><div><span class="eyebrow">PERMISSION</span><h2>관리자 권한이 활성화되어 있습니다.</h2><p>검수 큐, 공개/보관/폐기, 관리자용 평가 데이터를 사용할 수 있습니다.</p></div><a class="button primary" href="#/admin">관리자 검수 열기</a></section>`;
  const sql=adminPromotionSql(appState.user.email);
  return `<section class="permission-panel"><div><span class="eyebrow">PERMISSION</span><h2>② 현재 권한: 일반 사용자</h2><p>일반 사용자는 사례 제출과 자신의 제출 조회만 가능합니다. 관리자 권한은 브라우저에서 바꾸지 않고 Supabase SQL Editor에서 서버 측으로 승격합니다.</p></div><div class="callout warning"><strong>프로젝트 소유자만 실행하세요.</strong> 아래 SQL을 Supabase Dashboard → SQL Editor에서 1회 실행한 뒤 로그아웃/로그인하면 됩니다.</div>${codeBlock(sql,'관리자 승격 SQL 복사')}<div class="copy-action-bar"><a class="button secondary small" href="https://supabase.com/dashboard" target="_blank" rel="noopener">Supabase Dashboard 열기</a>${copyButton('setup-permissions.cmd 복사','setup-permissions.cmd')}</div></section>`;
}

function renderAccount() {
  if(!isBackendConfigured()) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><h1>Supabase 연결값이 없습니다.</h1></div></section>`);
  if(!appState.user) {
    const pending = appState.pendingEmail;
    const notice = appState.authNotice ? `<div class="callout ${appState.authNotice.includes('인증')?'warning':'info'}">${escapeHtml(appState.authNotice)}</div>` : '';
    const confirmPanel = pending ? `<section class="confirm-panel"><div><span class="eyebrow">EMAIL CONFIRMATION</span><h2>가입은 완료됐고, 이메일 인증만 남았습니다.</h2><p><strong>${escapeHtml(pending)}</strong> 받은편지함과 스팸함에서 Supabase 인증 메일을 확인하세요. 링크를 누른 뒤 이 페이지로 돌아와 로그인하면 됩니다.</p></div><div class="confirm-actions"><button id="resendConfirmButton" class="button primary" type="button" data-email="${escapeHtml(pending)}">인증 메일 다시 보내기</button><button id="clearPendingEmail" class="button ghost" type="button">다른 이메일 사용</button></div><ol class="confirm-steps"><li>메일함에서 <b>Confirm your email</b> 또는 인증 링크 확인</li><li>링크 클릭 후 GitHub Pages의 LLM Bible로 돌아오기</li><li>같은 이메일/비밀번호로 로그인</li></ol><small>메일이 오지 않으면 Supabase Dashboard → Authentication → Email 설정과 Redirect URL을 확인하세요.</small></section>` : '';
    return appShell(`<section class="section shell auth-layout-v2"><div class="auth-intro-v2"><span class="eyebrow">ACCOUNT</span><h1>로그인은 <span>두 단계</span>만 확인하면 됩니다.</h1><p>① 회원가입 → ② 이메일 인증. 인증 전에는 비밀번호가 맞아도 <code>Email not confirmed</code>가 표시됩니다.</p><div class="auth-status-list"><div class="ok"><b>Supabase 연결</b><span>${appState.backend.authReachable?'정상':'확인 필요'}</span></div><div class="${pending?'pending':'muted'}"><b>이메일 인증</b><span>${pending?'대기 중':'가입 후 필요'}</span></div><div class="muted"><b>커뮤니티 DB</b><span>${appState.backend.schemaReady?'준비됨':'schema 설치 후 활성'}</span></div></div></div><div class="auth-workspace">${notice}${confirmPanel}<div class="auth-cards"><form id="loginForm" class="panel-form compact"><span class="eyebrow">SIGN IN</span><h2>로그인</h2><label>이메일<input name="email" type="email" autocomplete="email" value="${escapeHtml(pending)}" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" minlength="8" required></label><button class="button primary" type="submit">로그인</button><small>인증이 끝난 계정만 로그인됩니다.</small></form><form id="signupForm" class="panel-form compact"><span class="eyebrow">CREATE ACCOUNT</span><h2>회원가입</h2><label>표시 이름<input name="displayName" minlength="2" maxlength="40" required></label><label>이메일<input name="email" type="email" autocomplete="email" value="${escapeHtml(pending)}" required></label><label>비밀번호<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="button secondary" type="submit">회원가입</button><small>가입 후 이메일 인증 링크를 한 번 눌러야 합니다.</small></form></div></div></section>`);
  }
  return appShell(`<section class="page-hero shell"><span class="eyebrow">MY ACCOUNT</span><h1>${escapeHtml(appState.profile?.display_name||appState.user.email)}</h1><p>${escapeHtml(appState.user.email)} · 권한 ${escapeHtml(appState.profile?.role||'user')}</p><div class="hero-actions">${appState.backend.schemaReady?'<a class="button primary" href="#/submit">새 사례 제출</a>':''}${appState.profile?.role==='admin'?'<a class="button secondary" href="#/admin">관리자 검수</a>':''}<button id="logoutButton" class="button ghost" type="button">로그아웃</button></div></section><section class="section shell">${backendNotice()}${permissionPanel()}<div class="section-heading"><div><span class="eyebrow">MY SUBMISSIONS</span><h2>내 제출 상태</h2></div></div><div id="mySubmissions" class="status-list">${appState.backend.schemaReady?'<div class="skeleton-line"></div>':'<div class="empty-state"><h3>DB 설치 후 활성화됩니다.</h3><p>현재 로그인은 정상이며, <code>submissions</code> 테이블 설치만 남았습니다.</p></div>'}</div></section>`);
}

function statusLabel(status){ return ({pending:'검수 대기',published:'공개',archived:'보관',rejected:'폐기'})[status]||status; }

function renderAdmin(){
  if(!appState.user) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><span class="eyebrow">ADMIN</span><h1>관리자 로그인</h1><form id="adminLoginForm" class="panel-form compact"><label>관리자 이메일<input name="email" type="email" required></label><label>비밀번호<input name="password" type="password" required></label><button class="button primary" type="submit">관리자 로그인</button></form></div></section>`);
  if(!appState.backend.schemaReady) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><h1>Auth는 연결되었지만 관리자 스키마가 아직 없습니다.</h1><p><code>backend-bootstrap.cmd</code>로 schema.sql을 적용하고 현재 계정을 <code>profiles.role='admin'</code>으로 승격하세요.</p></div></section>`);
  if(appState.profile?.role!=='admin') return appShell(`<section class="section shell narrow"><div class="auth-gate"><span class="eyebrow">ADMIN</span><h1>관리자 권한이 없습니다.</h1><p>현재 계정은 일반 사용자입니다. 관리자 역할은 DB에서 서버 측으로 관리합니다.</p><button id="logoutButton" class="button secondary" type="button">다른 계정으로 로그인</button></div></section>`);
  return appShell(`${collectionHero('MODERATION DESK','커뮤니티 사례 검수','Prompt/Result·재현성·결과 품질·안전성·학습 가치를 확인하고 공개/보관/폐기를 결정합니다.')}<section class="section shell"><div class="admin-toolbar"><div class="segmented" id="adminStatus"><button class="active" data-status="pending">대기</button><button data-status="archived">보관</button><button data-status="published">공개</button><button data-status="rejected">폐기</button><button data-status="all">전체</button></div><button id="refreshAdmin" class="button ghost" type="button">새로고침</button></div><div id="adminQueue" class="admin-queue"><div class="skeleton-line"></div></div></section>`);
}

function notFound(){ return appShell(`<section class="section shell narrow"><div class="empty-state"><h1>페이지를 찾을 수 없습니다.</h1><a class="button primary" href="#/home">홈으로</a></div></section>`); }

async function render(){
  const route=routeName(); let html;
  if(route==='home') html=renderHome();
  else if(route==='map') html=renderMap();
  else if(route==='learn'||route==='library') html=renderLearn();
  else if(route==='prompts') html=renderPrompts();
  else if(route==='tools') html=renderTools();
  else if(route==='recipes') html=renderRecipes();
  else if(route==='failures') html=renderFailures();
  else if(route==='community') html=await renderCommunity();
  else if(route==='submit') html=renderSubmit();
  else if(route==='account') html=renderAccount();
  else if(route==='admin') html=renderAdmin();
  else html=notFound();
  $('#app').innerHTML=html; markActiveNav(route); bindGlobal();
  if(route==='prompts') initPrompts();
  if(route==='tools') initTools();
  if(route==='recipes') initRecipes();
  if(route==='failures') initFailures();
  if(route==='community'&&!routeParam()) initCommunity();
  if(route==='submit') initSubmit();
  if(route==='account') initAccount();
  if(route==='admin') initAdmin();
  window.scrollTo({top:0,behavior:'auto'});
}

function markActiveNav(route){ const mapped=route==='learn'?'home':route; $$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===mapped)); }

function bindCopyButtons(root=document){
  $$('[data-copy-text]',root).forEach((button)=>{
    if(button.dataset.copyBound==='1') return;
    button.dataset.copyBound='1';
    button.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(decodeURIComponent(button.dataset.copyText||''));toast('복사했습니다.','success');}
      catch{toast('복사하지 못했습니다.','danger');}
    });
  });
}

function bindGlobal(){
  $('#themeButton')?.addEventListener('click',()=>{ const seq=['system','light','dark']; appState.theme=seq[(seq.indexOf(appState.theme)+1)%seq.length]; localStorage.setItem('llmBibleTheme',appState.theme); applyTheme(); toast(`테마: ${appState.theme}`); });
  $('#menuButton')?.addEventListener('click',(e)=>{ const n=$('#mobileNav'); n.hidden=!n.hidden; e.currentTarget.setAttribute('aria-expanded',String(!n.hidden)); });
  $('#logoutButton')?.addEventListener('click',async()=>{ try{await signOut(); await refreshAuth(); toast('로그아웃했습니다.'); await render();}catch(e){toast(e.message,'danger');} });
  $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>$('#appDialog')?.close()));
  $$('[data-research-open]').forEach(b=>b.addEventListener('click',()=>openResearchDetail(b.dataset.researchOpen,b.dataset.researchShard||'').catch(e=>toast(e.message,'danger'))));
  bindCopyButtons(document);
}

function filterText(item){ return Object.values(item).filter(v=>typeof v==='string').join(' ').toLowerCase(); }
function initialSearch(){ return queryParams().get('q')||''; }

function setActiveCategory(prefix, id) {
  const key = `${prefix}Category`;
  $$(`[data-${prefix}-category]`).forEach((button) => button.classList.toggle('active', button.dataset[key] === id));
}

function loadingState(grid, note, message) {
  if (note) note.innerHTML = `<span class="spinner tiny"></span> ${escapeHtml(message)}`;
  if (grid) grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
}

function emptyCategoryState(grid, count, note, message) {
  if (count) count.textContent = '';
  if (note) note.textContent = message;
  if (grid) grid.innerHTML = '<div class="empty-state wide"><h3>카테고리를 먼저 선택하세요.</h3><p>필요한 설명 데이터만 내려받도록 구성했습니다.</p></div>';
}

function initPrompts(){
  const q=$('#promptSearch'), dif=$('#promptDifficulty'), grid=$('#promptGrid'), count=$('#promptCount'), pager=$('#promptPager'), note=$('#promptLoadNote');
  let selected=queryParams().get('cat')||''; let current=[]; let mode='category'; let page=1; const per=36;
  q.value=initialSearch();
  const draw=()=>{
    let items=current;
    if(dif.value!=='all') items=items.filter(x=>x.difficulty===dif.value);
    const pages=Math.max(1,Math.ceil(items.length/per)); page=Math.min(page,pages); const shown=items.slice((page-1)*per,page*per);
    count.textContent=`${items.length.toLocaleString()}개${mode==='search'?' · 전체 검색':' · 선택 카테고리'} · ${page}/${pages} 페이지`;
    grid.innerHTML=shown.map(x=>researchCard(x,'prompt')).join('')||'<div class="empty-state wide"><h3>검색 결과가 없습니다.</h3></div>';
    pager.innerHTML=items.length>per?`<button ${page<=1?'disabled':''} data-page="prev">← 이전</button><span>${page} / ${pages}</span><button ${page>=pages?'disabled':''} data-page="next">다음 →</button>`:'';
    bindResearchButtons();
    $$('[data-page]',pager).forEach(b=>b.addEventListener('click',()=>{page+=b.dataset.page==='next'?1:-1;draw();}));
  };
  const loadSelected=async(id)=>{
    const category=getCollection('prompts').categories.find(x=>x.id===id); if(!category)return;
    selected=id; mode='category'; page=1; q.value=''; setActiveCategory('prompt',id); loadingState(grid,note,`${category.label} ${category.count}개를 불러오는 중…`);
    try{current=await loadCategory('prompts',id); note.innerHTML=`<b>${escapeHtml(category.label)}</b> · ${category.count}개만 로드됨 · ${escapeHtml(category.description)}`; draw();}
    catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}
  };
  const runSearch=async()=>{
    const term=q.value.trim().toLowerCase(); page=1;
    if(!term){ if(selected){mode='category'; await loadSelected(selected);} else emptyCategoryState(grid,count,note,'카테고리를 선택하면 해당 데이터만 불러옵니다.'); return; }
    mode='search'; loadingState(grid,note,'전체 프롬프트 검색 인덱스를 불러오는 중…');
    try{const index=await loadCollectionIndex('prompts'); current=index.filter(x=>filterText(x).includes(term)); note.innerHTML=`전체 240개용 <b>경량 검색 인덱스</b>에서 “${escapeHtml(q.value.trim())}” 검색`; draw();}
    catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}
  };
  $$('[data-prompt-category]').forEach(b=>b.addEventListener('click',()=>loadSelected(b.dataset.promptCategory)));
  q.addEventListener('input',debounce(runSearch,220)); dif.addEventListener('change',()=>{page=1;draw();});
  $('#resetPrompts')?.addEventListener('click',()=>{selected='';current=[];mode='category';page=1;q.value='';dif.value='all';setActiveCategory('prompt','');pager.innerHTML='';emptyCategoryState(grid,count,note,'카테고리를 선택하면 해당 데이터만 불러옵니다.');});
  if(q.value.trim()) runSearch(); else if(selected) loadSelected(selected); else emptyCategoryState(grid,count,note,'카테고리를 선택하면 해당 데이터만 불러옵니다.');
}

function initTools(){
  const view=queryParams().get('view')||'skill';
  if(view==='mcp'){
    const q=$('#mcpSearch'),grid=$('#mcpGrid'),count=$('#mcpCount'),note=$('#mcpLoadNote');let selected=queryParams().get('cat')||'';let current=[];let mode='category';q.value=initialSearch();
    const draw=()=>{count.textContent=`${current.length.toLocaleString()}개 MCP starter${mode==='search'?' · 전체 검색':' · 선택 범주'}`;grid.innerHTML=current.map(x=>researchCard(x,'mcp')).join('')||'<div class="empty-state wide">검색 결과가 없습니다.</div>';bindResearchButtons();};
    const loadSelected=async(id)=>{const c=getCollection('mcp').categories.find(x=>x.id===id);if(!c)return;selected=id;mode='category';q.value='';setActiveCategory('mcp',id);loadingState(grid,note,`${c.label} ${c.count}개를 불러오는 중…`);try{current=await loadCategory('mcp',id);note.innerHTML=`<b>${escapeHtml(c.label)}</b> · ${c.count}개만 로드됨 · ${escapeHtml(c.description)}`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
    const runSearch=async()=>{const term=q.value.trim().toLowerCase();if(!term){if(selected)await loadSelected(selected);else emptyCategoryState(grid,count,note,'MCP 범주를 선택하면 해당 starter만 불러옵니다.');return;}mode='search';loadingState(grid,note,'MCP 검색 인덱스를 불러오는 중…');try{const index=await loadCollectionIndex('mcp');current=index.filter(x=>filterText(x).includes(term));note.innerHTML=`전체 ${getCollection('mcp').total}개용 <b>경량 검색 인덱스</b>에서 “${escapeHtml(q.value.trim())}” 검색`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
    $$('[data-mcp-category]').forEach(b=>b.addEventListener('click',()=>loadSelected(b.dataset.mcpCategory)));
    q.addEventListener('input',debounce(runSearch,220));$('#resetMcp')?.addEventListener('click',()=>{selected='';current=[];q.value='';setActiveCategory('mcp','');emptyCategoryState(grid,count,note,'MCP 범주를 선택하면 해당 starter만 불러옵니다.');});
    if(q.value.trim())runSearch();else if(selected)loadSelected(selected);else emptyCategoryState(grid,count,note,'MCP 범주를 선택하면 해당 starter만 불러옵니다.');
    return;
  }
  const q=$('#skillSearch'), grid=$('#skillGrid'), count=$('#skillCount'), note=$('#skillLoadNote'); let selected=queryParams().get('cat')||''; let current=[]; let mode='category'; q.value=initialSearch();
  if(view==='connector'&&!selected) selected='connectors';
  const draw=()=>{count.textContent=`${current.length.toLocaleString()}개 Skill / Plugin 패턴${mode==='search'?' · 전체 검색':' · 선택 영역'}`;grid.innerHTML=current.map(x=>researchCard(x,'skill')).join('')||'<div class="empty-state wide">검색 결과가 없습니다.</div>';bindResearchButtons();};
  const loadSelected=async(id)=>{const c=getCollection('skills').categories.find(x=>x.id===id);if(!c)return;selected=id;mode='category';q.value='';setActiveCategory('skill',id);loadingState(grid,note,`${c.label} ${c.count}개를 불러오는 중…`);try{current=await loadCategory('skills',id);note.innerHTML=`<b>${escapeHtml(c.label)}</b> · ${c.count}개만 로드됨 · ${escapeHtml(c.description)}`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
  const runSearch=async()=>{const term=q.value.trim().toLowerCase();if(!term){if(selected)await loadSelected(selected);else emptyCategoryState(grid,count,note,'영역을 선택하면 해당 10개 Skill만 불러옵니다.');return;}mode='search';loadingState(grid,note,'전체 Skill 검색 인덱스를 불러오는 중…');try{const index=await loadCollectionIndex('skills');current=index.filter(x=>filterText(x).includes(term));note.innerHTML=`전체 120개용 <b>경량 검색 인덱스</b>에서 “${escapeHtml(q.value.trim())}” 검색`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
  $$('[data-skill-category]').forEach(b=>b.addEventListener('click',()=>loadSelected(b.dataset.skillCategory)));
  q.addEventListener('input',debounce(runSearch,220));$('#resetSkills')?.addEventListener('click',()=>{selected='';current=[];q.value='';setActiveCategory('skill','');emptyCategoryState(grid,count,note,'영역을 선택하면 해당 10개 Skill만 불러옵니다.');});
  const panel=$('#sourcesPanel');$('#sourceToggle')?.addEventListener('click',async()=>{panel.hidden=!panel.hidden;if(panel.hidden)return;panel.innerHTML='<div class="skeleton-line"></div>';try{const sources=await ensureSources();panel.innerHTML=sources.map(s=>`<a class="source-row" href="${escapeHtml(s.url)}" target="_blank" rel="noopener"><span class="pill soft">${escapeHtml(s.tier)}</span><b>${escapeHtml(s.title)}</b><small>${escapeHtml(s.last_verified)}</small></a>`).join('');}catch(e){panel.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}});
  if(q.value.trim())runSearch();else if(selected)loadSelected(selected);else emptyCategoryState(grid,count,note,'영역을 선택하면 해당 10개 Skill만 불러옵니다.');
}

function initRecipes(){
  const q=$('#recipeSearch'),grid=$('#recipeGrid'),count=$('#recipeCount'),note=$('#recipeLoadNote');let selected=queryParams().get('cat')||'';let current=[];let mode='category';q.value=initialSearch();
  const draw=()=>{count.textContent=`${current.length}개 Recipe${mode==='search'?' · 전체 검색':' · 선택 카테고리'}`;grid.innerHTML=current.map(x=>researchCard(x,'recipe')).join('')||'<div class="empty-state wide">검색 결과가 없습니다.</div>';bindResearchButtons();};
  const loadSelected=async(id)=>{const c=getCollection('recipes').categories.find(x=>x.id===id);if(!c)return;selected=id;mode='category';q.value='';setActiveCategory('recipe',id);loadingState(grid,note,`${c.label} Recipe를 불러오는 중…`);try{current=await loadCategory('recipes',id);note.innerHTML=`<b>${escapeHtml(c.label)}</b> · ${c.count}개만 로드됨 · ${escapeHtml(c.description)}`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
  const runSearch=async()=>{const term=q.value.trim().toLowerCase();if(!term){if(selected)await loadSelected(selected);else emptyCategoryState(grid,count,note,'카테고리를 선택하면 해당 Recipe만 불러옵니다.');return;}mode='search';loadingState(grid,note,'전체 Recipe 검색 인덱스를 불러오는 중…');try{const index=await loadCollectionIndex('recipes');current=index.filter(x=>filterText(x).includes(term));note.innerHTML=`전체 50개용 <b>경량 검색 인덱스</b>에서 “${escapeHtml(q.value.trim())}” 검색`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
  $$('[data-recipe-category]').forEach(b=>b.addEventListener('click',()=>loadSelected(b.dataset.recipeCategory)));q.addEventListener('input',debounce(runSearch,220));$('#resetRecipes')?.addEventListener('click',()=>{selected='';current=[];q.value='';setActiveCategory('recipe','');emptyCategoryState(grid,count,note,'카테고리를 선택하면 해당 Recipe만 불러옵니다.');});
  if(q.value.trim())runSearch();else if(selected)loadSelected(selected);else emptyCategoryState(grid,count,note,'카테고리를 선택하면 해당 Recipe만 불러옵니다.');
}

function initFailures(){
  const q=$('#failureSearch'),grid=$('#failureGrid'),count=$('#failureCount'),note=$('#failureLoadNote');let selected=queryParams().get('cat')||'';let current=[];let mode='category';q.value=initialSearch();
  const draw=()=>{count.textContent=`${current.length}개 실패 패턴${mode==='search'?' · 전체 검색':' · 선택 영역'}`;grid.innerHTML=current.map(x=>researchCard(x,'failure')).join('')||'<div class="empty-state wide">검색 결과가 없습니다.</div>';bindResearchButtons();};
  const loadSelected=async(id)=>{const c=getCollection('failures').categories.find(x=>x.id===id);if(!c)return;selected=id;mode='category';q.value='';setActiveCategory('failure',id);loadingState(grid,note,`${c.label} 실패 패턴을 불러오는 중…`);try{current=await loadCategory('failures',id);note.innerHTML=`<b>${escapeHtml(c.label)}</b> · ${c.count}개만 로드됨 · ${escapeHtml(c.description)}`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
  const runSearch=async()=>{const term=q.value.trim().toLowerCase();if(!term){if(selected)await loadSelected(selected);else emptyCategoryState(grid,count,note,'문제 영역을 선택하면 관련 실패 패턴만 불러옵니다.');return;}mode='search';loadingState(grid,note,'전체 실패 패턴 검색 인덱스를 불러오는 중…');try{const index=await loadCollectionIndex('failures');current=index.filter(x=>filterText(x).includes(term));note.innerHTML=`전체 30개용 <b>경량 검색 인덱스</b>에서 “${escapeHtml(q.value.trim())}” 검색`;draw();}catch(e){note.textContent=e.message;grid.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};
  $$('[data-failure-category]').forEach(b=>b.addEventListener('click',()=>loadSelected(b.dataset.failureCategory)));q.addEventListener('input',debounce(runSearch,220));$('#resetFailures')?.addEventListener('click',()=>{selected='';current=[];q.value='';setActiveCategory('failure','');emptyCategoryState(grid,count,note,'문제 영역을 선택하면 관련 실패 패턴만 불러옵니다.');});
  if(q.value.trim())runSearch();else if(selected)loadSelected(selected);else emptyCategoryState(grid,count,note,'문제 영역을 선택하면 관련 실패 패턴만 불러옵니다.');
}

function bindResearchButtons(){
  $$('[data-research-open]').forEach(b=>b.addEventListener('click',()=>openResearchDetail(b.dataset.researchOpen,b.dataset.researchShard||'').catch(e=>toast(e.message,'danger'))));
  bindCopyButtons(document);
}

async function ensureSources(){
  if(sourcesLoaded)return [...sourceMap.values()];
  const sources=await loadSources();sourceMap=new Map(sources.map(s=>[s.id,s]));sourcesLoaded=true;return sources;
}
function sourceLinks(refs=[]){return refs.map(id=>sourceMap.get(id)).filter(Boolean).map(s=>`<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)} ↗</a>`).join('');}
function copyButton(label,text,kind='ghost'){return `<button class="button ${kind} small copy-value" type="button" data-copy-text="${encodeURIComponent(String(text??''))}">${escapeHtml(label)}</button>`;}
function codeBlock(text,label='복사'){return `<div class="code-wrap"><button class="copy-button" type="button" data-copy-text="${encodeURIComponent(String(text??''))}">${escapeHtml(label)}</button><pre>${escapeHtml(String(text??''))}</pre></div>`;}
function copyActionBar(actions){return `<div class="copy-action-bar">${actions.filter(x=>x?.text).map(x=>copyButton(x.label,x.text,x.kind||'ghost')).join('')}</div>`;}
function promptVariables(text){const out=[];const re=/{{\s*([^{}]+?)\s*}}/g;let m;while((m=re.exec(String(text||'')))){const key=m[1].trim();if(key&&!out.includes(key))out.push(key);}return out;}
function fillTemplate(template,values){let result=String(template||'');for(const [key,value] of Object.entries(values)){if(!value)continue;const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');result=result.replace(new RegExp(`{{\\s*${escaped}\\s*}}`,'g'),value);}return result;}
function promptVariableEditor(template){const vars=promptVariables(template);if(!vars.length)return '<div class="callout info"><strong>변수 없음</strong> · 이 프롬프트는 그대로 복사해서 사용할 수 있습니다.</div>';return `<section class="variable-editor"><div><h3>변수만 채워서 복사</h3><p><code>{{변수}}</code> 값을 입력하면 최종 프롬프트를 만들어 복사합니다.</p></div><div class="variable-grid">${vars.map((v,i)=>`<label>${escapeHtml(v)}<textarea rows="2" data-prompt-var="${encodeURIComponent(v)}" placeholder="${escapeHtml(v)} 값 입력"></textarea></label>`).join('')}</div><button id="copyFilledPrompt" class="button primary" type="button" data-template="${encodeURIComponent(String(template||''))}">값 적용한 프롬프트 복사</button></section>`;}
function skillMarkdown(item){return `---\nname: ${item.slug||item.name}\ndescription: ${item.purpose}\n---\n\n# ${item.name}\n\n## Purpose\n${item.purpose}\n\n## Inputs\n${(item.inputs||[]).map(x=>`- ${x}`).join('\n')}\n\n## Outputs\n${(item.outputs||[]).map(x=>`- ${x}`).join('\n')}\n\n## Allowed tools\n${item.allowed_tools||''}\n\n## Failure modes\n${(item.failure_modes||[]).map(x=>`- ${x}`).join('\n')}\n\n## Security\n${item.security||''}\n`;}
function recordPack(type,item){
  if(type==='prompt')return `# ${item.title}\n\nPattern: ${item.pattern}\nDomain: ${item.domain}\nDifficulty: ${item.difficulty}\nLast verified: ${item.last_verified}\nEvidence: ${item.evidence_level}\n\n## 언제 쓰는가\n${item.when_to_use}\n\n## Prompt\n${item.prompt_text}\n\n## Quick mode\n${item.quick_mode}\n\n## Verification\n${item.verification}\n\n## Common mistake\n${item.common_mistake}`;
  if(type==='skill')return skillMarkdown(item)+`\n## Sample prompt\n${item.sample_prompt}\n\n## JavaScript\n${item.integration_js}\n\n## Python\n${item.integration_python}`;
  if(type==='mcp')return `# ${item.title}\n\nCategory: ${item.category}\nEvidence: ${item.evidence_level}\nLast verified: ${item.last_verified}\n\n## 요약\n${item.summary}\n\n## 언제 쓰는가\n${item.when_to_use}\n\n## 피해야 할 때\n${item.avoid_when}\n\n## Starter\n${item.starter_template}\n\n## Checklist\n${(item.checklist||[]).map(x=>`- ${x}`).join('\\n')}`;
  if(type==='recipe')return `# ${item.title}\n\n${item.problem}\n\n## Steps\n${(item.steps||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n## Prompt\n${item.prompt_template}\n\n## Metrics\n${(item.metrics||[]).map(x=>`- ${x}`).join('\n')}\n\n## Verification\n${item.verification}\n\n## Common failure\n${item.common_failure}\n\n## Security\n${item.security}`;
  return `# ${item.title}\n\n## 증상\n${item.symptom}\n\n## 원인\n${item.root_cause}\n\n## 수정\n${item.corrected_example}\n\n## 예방\n${item.prevention}\n\n## Test / Eval\n${item.test_eval}`;
}

function bindCopyControls(dialog,item,type){
  bindCopyButtons(dialog);
  $('#copyFilledPrompt')?.addEventListener('click',async(e)=>{const values={};$$('[data-prompt-var]',dialog).forEach(input=>{values[decodeURIComponent(input.dataset.promptVar)]=input.value.trim();});const text=fillTemplate(decodeURIComponent(e.currentTarget.dataset.template),values);try{await navigator.clipboard.writeText(text);toast('변수를 적용한 프롬프트를 복사했습니다.','success');}catch{toast('복사하지 못했습니다.','danger');}});
}

async function openResearchDetail(key,hintShard=''){
  const [type,id]=String(key||'').split(':');
  const dialog=$('#appDialog');$('#dialogBody').innerHTML='<div class="dialog-loading"><span class="spinner"></span><p>상세 데이터를 불러오는 중입니다.</p></div>';dialog.showModal();
  const item=await resolveRecord(type,id,hintShard);if(!item){$('#dialogBody').innerHTML='<div class="empty-state"><h2>항목을 찾지 못했습니다.</h2></div>';return;}
  await ensureSources().catch(()=>[]);
  let body='';
  if(type==='prompt'){
    const template=item.best_example||item.prompt_text;
    body=`<div class="research-detail"><div class="card-topline"><span class="pill official">${escapeHtml(item.evidence_level)}</span><span>${escapeHtml(item.difficulty)} · ${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.intent)}</p>${copyActionBar([{label:'프롬프트 복사',text:item.prompt_text,kind:'primary'},{label:'Quick 복사',text:item.quick_mode},{label:'검증법 복사',text:item.verification},{label:'전체 패키지 복사',text:recordPack(type,item)},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}${promptVariableEditor(template)}<div class="detail-grid"><section><h3>언제 쓰는가</h3><p>${escapeHtml(item.when_to_use)}</p></section><section><h3>언제 쓰지 않는가</h3><p>${escapeHtml(item.when_not_to_use)}</p></section></div><section><h3>Bad → Better → Best</h3><div class="prompt-evolution"><div><span>BAD</span>${codeBlock(item.bad_example||'','Bad 복사')}</div><div><span>BETTER</span>${codeBlock(item.better_example||'','Better 복사')}</div><div><span>BEST</span>${codeBlock(template,'Best 복사')}</div></div><p class="why-box"><strong>왜 좋아지나:</strong> ${escapeHtml(item.why_it_works||'')}</p></section><div class="detail-grid"><section><h3>예상 출력</h3><p>${escapeHtml(item.expected_output)}</p></section><section><h3>Quick Mode</h3><p>${escapeHtml(item.quick_mode)}</p></section></div><section><h3>자주 실패하는 형태</h3><p>${escapeHtml(item.common_mistake)}</p></section><section><h3>검증 방법</h3><p>${escapeHtml(item.verification)}</p><p>${escapeHtml(item.application_tip||'')}</p><p class="measurement-note">측정 상태: ${escapeHtml(item.measurement_status)}</p></section><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  }
  if(type==='skill')body=`<div class="research-detail"><div class="card-topline"><span class="pill official">${escapeHtml(item.evidence_level)}</span><span>${escapeHtml(item.domain)} · ${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.purpose)}</p>${copyActionBar([{label:'SKILL.md 복사',text:skillMarkdown(item),kind:'primary'},{label:'Sample Prompt',text:item.sample_prompt},{label:'JavaScript',text:item.integration_js},{label:'Python',text:item.integration_python},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}<div class="detail-grid"><section><h3>입력</h3><ul>${(item.inputs||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section><section><h3>출력</h3><ul>${(item.outputs||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section></div><section><h3>SKILL.md 권장 섹션</h3><div class="mini-tags">${(item.manifest?.sections||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>${codeBlock(skillMarkdown(item),'SKILL.md 전체 복사')}</section><section><h3>권한</h3><p>${escapeHtml((item.permissions||[]).join(', '))}</p><p>${escapeHtml(item.allowed_tools)}</p></section><h3>Sample Prompt</h3>${codeBlock(item.sample_prompt)}<div class="detail-grid"><section><h3>JavaScript</h3>${codeBlock(item.integration_js)}</section><section><h3>Python</h3>${codeBlock(item.integration_python)}</section></div><section><h3>실패/보안</h3><p>${escapeHtml((item.failure_modes||[]).join(' · '))}</p><p>${escapeHtml(item.security)}</p></section><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  if(type==='mcp')body=`<div class="research-detail"><div class="card-topline"><span class="pill official">${escapeHtml(item.evidence_level)}</span><span>${escapeHtml(item.category)} · ${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p>${copyActionBar([{label:'Starter 복사',text:item.starter_template,kind:'primary'},{label:'Checklist 복사',text:(item.checklist||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')},{label:'전체 패키지',text:recordPack(type,item)},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}<div class="detail-grid"><section><h3>언제 쓰는가</h3><p>${escapeHtml(item.when_to_use)}</p></section><section><h3>피해야 할 때</h3><p>${escapeHtml(item.avoid_when)}</p></section></div><section><h3>Starter template</h3>${codeBlock(item.starter_template,'Starter 복사')}</section><section><h3>설계 체크리스트</h3><ol>${(item.checklist||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></section><div class="callout info"><strong>Starter record</strong> · 공식 개념과 생산 패턴을 학습하기 위한 기본 항목이며, 특정 구현의 benchmark를 의미하지 않습니다.</div><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  if(type==='recipe')body=`<div class="research-detail"><div class="card-topline"><span class="pill official">Recipe</span><span>${escapeHtml(item.category)} · ${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.problem)}</p>${copyActionBar([{label:'Prompt 복사',text:item.prompt_template,kind:'primary'},{label:'단계 복사',text:(item.steps||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')},{label:'Architecture',text:item.architecture},{label:'검증 체크',text:item.verification},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}<section><h3>Architecture</h3><div class="architecture-line">${(item.steps||[]).map((s,i)=>`<span>${i+1}. ${escapeHtml(s)}</span>`).join('<b>→</b>')}</div></section><h3>Prompt Template</h3>${codeBlock(item.prompt_template)}<div class="detail-grid"><section><h3>측정 지표</h3><ul>${(item.metrics||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section><section><h3>검증</h3><p>${escapeHtml(item.verification)}</p></section></div><section><h3>흔한 실패</h3><p>${escapeHtml(item.common_failure)}</p></section><section><h3>보안</h3><p>${escapeHtml(item.security)}</p></section><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  if(type==='failure')body=`<div class="research-detail"><div class="card-topline"><span class="pill danger-soft">Anti-pattern</span><span>${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.title)}</h2>${copyActionBar([{label:'수정안 복사',text:item.corrected_example,kind:'primary'},{label:'예방책 복사',text:item.prevention},{label:'Test/Eval 복사',text:item.test_eval},{label:'전체 체크 복사',text:recordPack(type,item)},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}<div class="failure-flow"><section><span>증상</span><p>${escapeHtml(item.symptom)}</p></section><section><span>원인</span><p>${escapeHtml(item.root_cause)}</p></section><section><span>잘못된 예</span><p>${escapeHtml(item.bad_example)}</p></section><section><span>수정</span><p>${escapeHtml(item.corrected_example)}</p></section><section><span>예방</span><p>${escapeHtml(item.prevention)}</p></section><section><span>Test / Eval</span><p>${escapeHtml(item.test_eval)}</p></section></div><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  $('#dialogBody').innerHTML=body;bindCopyControls(dialog,item,type);
}

function initCommunity(){ const search=$('#communitySearch'), cat=$('#communityCategory'), cards=$$('.community-card'); const apply=()=>{const q=search.value.toLowerCase(); cards.forEach(card=>{const ok=(!q||card.textContent.toLowerCase().includes(q))&&(cat.value==='all'||card.querySelector('.card-category')?.textContent===cat.value);card.hidden=!ok;});};search?.addEventListener('input',debounce(apply));cat?.addEventListener('change',apply); }

function initSubmit(){
  const input=$('#mediaInput'); input?.addEventListener('change',()=>{const files=[...input.files].slice(0,APP_CONFIG.maxMediaCount);if(input.files.length>APP_CONFIG.maxMediaCount)toast(`최대 ${APP_CONFIG.maxMediaCount}개까지 가능합니다.`,'warning');$('#mediaSelection').innerHTML=files.map(file=>`<span class="file-chip">${escapeHtml(file.name)} · ${formatBytes(file.size)}</span>`).join('');});
  $('#submissionForm')?.addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]'),files=[...$('#mediaInput').files].slice(0,APP_CONFIG.maxMediaCount);setBusy(button,true,'변환·업로드 중…');const progress=$('#conversionProgress'),progressText=$('#progressText'),progressBar=$('#progressBar');progress.hidden=false;try{const normalized=[];for(let i=0;i<files.length;i++){progressText.textContent=`${i+1}/${files.length} ${files[i].name} 변환 중…`;const result=await normalizeMedia(files[i],p=>{progressBar.style.width=`${Math.round(((i+p)/Math.max(1,files.length))*100)}%`;});result.altText=`${form.title.value} 예시 ${i+1}`;normalized.push(result);}const payload={title:form.title.value,category:form.category.value,summary:form.summary.value,promptText:form.promptText.value,resultText:form.resultText.value,modelName:form.modelName.value,modelVersion:form.modelVersion.value,sourceNotes:form.sourceNotes.value};await createSubmission(payload,normalized,({index,total})=>{progressBar.style.width=`${Math.round(((index+.5)/Math.max(1,total))*100)}%`;});progressBar.style.width='100%';progressText.textContent='제출 완료';toast('검수 요청을 제출했습니다.','success');location.hash='#/account';}catch(e){toast(e.message,'danger');progressText.textContent=e.message;}finally{setBusy(button,false);}});
}

function initAccount(){
  $('#loginForm')?.addEventListener('submit',handleLogin);
  $('#signupForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault(); const button=event.currentTarget.querySelector('button'); setBusy(button,true); const f=event.currentTarget;
    try{
      const email=f.email.value.trim(); const data=await signUp({email,password:f.password.value,displayName:f.displayName.value});
      if(data.session){ localStorage.removeItem('llmBiblePendingEmail'); appState.pendingEmail=''; appState.authNotice='회원가입과 로그인이 완료되었습니다.'; }
      else { localStorage.setItem('llmBiblePendingEmail',email); appState.pendingEmail=email; appState.authNotice='회원가입은 완료되었습니다. 받은 이메일의 인증 링크를 먼저 눌러 주세요.'; }
      toast(data.session?'회원가입 및 로그인되었습니다.':'인증 메일을 확인해 주세요.','success'); await refreshAuth(); await render();
    }catch(e){ appState.authNotice=e.message; toast(e.message,'danger'); await render(); }
    finally{setBusy(button,false);}
  });
  $('#resendConfirmButton')?.addEventListener('click',async(event)=>{
    const button=event.currentTarget; const email=button.dataset.email || appState.pendingEmail; setBusy(button,true,'전송 중…');
    try{ await resendSignupConfirmation(email); appState.authNotice=`${email}로 인증 메일을 다시 보냈습니다. 스팸함도 확인해 주세요.`; toast('인증 메일을 다시 보냈습니다.','success'); await render(); }
    catch(e){ appState.authNotice=e.message; toast(e.message,'danger'); }
    finally{setBusy(button,false);}
  });
  $('#clearPendingEmail')?.addEventListener('click',()=>{localStorage.removeItem('llmBiblePendingEmail');appState.pendingEmail='';appState.authNotice='';render();});
  if(appState.user&&appState.backend.schemaReady)loadMySubmissions();
}
async function handleLogin(event){
  event.preventDefault(); const button=event.currentTarget.querySelector('button'); setBusy(button,true); const f=event.currentTarget; const email=f.email.value.trim();
  try{ await signIn({email,password:f.password.value}); localStorage.removeItem('llmBiblePendingEmail'); appState.pendingEmail=''; appState.authNotice=''; await refreshAuth(); toast('로그인했습니다.','success'); await render(); }
  catch(e){
    if(/email not confirmed/i.test(String(e.message||''))){ localStorage.setItem('llmBiblePendingEmail',email); appState.pendingEmail=email; appState.authNotice='이메일 인증이 아직 완료되지 않았습니다. 아래에서 인증 메일을 다시 보낼 수 있습니다.'; toast('이메일 인증이 필요합니다.','warning'); await render(); }
    else { appState.authNotice=e.message; toast(e.message,'danger'); }
  } finally { setBusy(button,false); }
}

async function loadMySubmissions(){const root=$('#mySubmissions');if(!root||!appState.user)return;try{const items=await listMySubmissions(appState.user.id);root.innerHTML=items.map(x=>`<article class="status-row"><div><span class="status status-${x.status}">${statusLabel(x.status)}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.category)} · 제출 ${formatDateTime(x.created_at)}${x.reviewed_at?` · 검수 ${formatDateTime(x.reviewed_at)}`:''}</p>${x.moderation_note?`<small>관리자 메모: ${escapeHtml(x.moderation_note)}</small>`:''}</div>${x.status==='published'&&x.slug?`<a class="button ghost small" href="#/community/${encodeURIComponent(x.slug)}">공개 페이지</a>`:''}</article>`).join('')||'<div class="empty-state"><p>아직 제출한 사례가 없습니다.</p></div>';}catch(e){root.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}}

function initAdmin(){ $('#adminLoginForm')?.addEventListener('submit',handleLogin); if(appState.profile?.role!=='admin'||!appState.backend.schemaReady)return;let currentStatus='pending';const load=async()=>{const root=$('#adminQueue');root.innerHTML='<div class="skeleton-line"></div>';try{const items=await listModerationQueue(currentStatus);root.innerHTML=items.map(adminCard).join('')||'<div class="empty-state"><h3>검수할 항목이 없습니다.</h3></div>';$$('[data-review-id]').forEach(b=>b.addEventListener('click',()=>openAdminReview(items.find(x=>x.id===b.dataset.reviewId))));}catch(e){root.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};$('#adminStatus')?.addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;currentStatus=b.dataset.status;$$('#adminStatus button').forEach(x=>x.classList.toggle('active',x===b));load();});$('#refreshAdmin')?.addEventListener('click',load);load();}
function adminCard(item){return `<article class="admin-card"><div><div class="card-topline"><span class="status status-${item.status}">${statusLabel(item.status)}</span><span>${formatDateTime(item.created_at)}</span></div><p class="card-category">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><div class="card-meta"><span>${escapeHtml(item.model_name||'-')} ${escapeHtml(item.model_version||'')}</span><span>by ${escapeHtml(item.author_display_name||'-')}</span><span>미디어 ${(item.media||[]).length}개</span></div></div><button class="button secondary" type="button" data-review-id="${item.id}">검수 열기</button></article>`;}
function openAdminReview(item){if(!item)return;const media=(item.media||[]).map(m=>m.previewUrl?(m.kind==='video'?`<video controls src="${escapeHtml(m.previewUrl)}"></video>`:`<img src="${escapeHtml(m.previewUrl)}" alt="검수 미디어">`):'<div class="media-error">미리보기 실패</div>').join('');const dialog=$('#appDialog');$('#dialogBody').innerHTML=`<div class="admin-review"><div class="card-topline"><span class="status status-${item.status}">${statusLabel(item.status)}</span><span>${formatDateTime(item.created_at)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><dl class="meta-list"><div><dt>작성자</dt><dd>${escapeHtml(item.author_display_name||'-')}</dd></div><div><dt>모델</dt><dd>${escapeHtml(item.model_name||'-')} ${escapeHtml(item.model_version||'')}</dd></div></dl>${copyActionBar([{label:'Prompt 복사',text:item.prompt_text,kind:'primary'},{label:'Result 복사',text:item.result_text}])}<div class="prompt-result-grid"><section><span class="eyebrow">PROMPT</span>${codeBlock(item.prompt_text,'Prompt 복사')}</section><section><span class="eyebrow">RESULT</span>${codeBlock(item.result_text,'Result 복사')}</section></div>${media?`<div class="media-gallery review-media">${media}</div>`:''}<form id="reviewForm" class="review-form"><h3>검수 점수</h3><div class="score-grid">${scoreField('clarity','명확성')}${scoreField('reproducibility','재현성')}${scoreField('resultQuality','결과 품질')}${scoreField('accuracy','정확성')}${scoreField('safety','안전성')}${scoreField('learningValue','학습 가치')}</div><label>관리자 메모<textarea name="note" rows="3" maxlength="2000"></textarea></label><div class="review-actions"><button class="button success" type="button" data-action="publish">공개 승인</button><button class="button secondary" type="button" data-action="archive">보관만</button><button class="button danger" type="button" data-action="reject">폐기</button></div></form></div>`;dialog.showModal();bindCopyButtons(dialog);$$('[data-action]',$('#reviewForm')).forEach(button=>button.addEventListener('click',async()=>{const form=$('#reviewForm'),action=button.dataset.action;if(action==='reject'&&!confirm('폐기하면 비공개 미디어 파일이 삭제됩니다. 계속할까요?'))return;const review={note:form.note.value.trim(),scores:{clarity:Number(form.clarity.value),reproducibility:Number(form.reproducibility.value),resultQuality:Number(form.resultQuality.value),accuracy:Number(form.accuracy.value),safety:Number(form.safety.value),learningValue:Number(form.learningValue.value)}};setBusy(button,true);try{await moderateSubmission(item.id,action,review);toast(action==='publish'?'공개 승인했습니다.':action==='archive'?'보관 처리했습니다.':'폐기 처리했습니다.','success');dialog.close();await render();}catch(e){toast(e.message,'danger');}finally{setBusy(button,false);}}));}
function scoreField(name,label){return `<label>${label}<select name="${name}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}</select></label>`;}

async function refreshAuth(){
  appState.backend=await getBackendDiagnostics().catch(e=>({configured:isBackendConfigured(),authReachable:false,schemaReady:false,detail:e.message,missingTables:[]}));
  try{const state=await getSessionState();appState.user=state.user;appState.profile=state.profile;}catch(e){appState.user=null;appState.profile=null;console.error(e);}
}

window.addEventListener('hashchange',render);
document.getElementById('skipToMain')?.addEventListener('click',event=>{event.preventDefault();const main=document.getElementById('main');if(!main){location.hash='#/home';return;}main.setAttribute('tabindex','-1');main.focus({preventScroll:false});});
await refreshAuth();
onAuthChange(async()=>{if(appState.authBusy)return;appState.authBusy=true;await refreshAuth();appState.authBusy=false;await render();});
if(!location.hash||location.hash==='#app'||location.hash==='#main') history.replaceState(null,'',`${location.pathname}${location.search}#/home`);
await render();
window.__LLM_BIBLE_BOOTED__=true;
