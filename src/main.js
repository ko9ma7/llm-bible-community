import {
  APP_CONFIG, isBackendConfigured, getBackendDiagnostics, getSessionState, onAuthChange, signIn, signOut, signUp,
  listPublishedSubmissions, getPublishedSubmission, listMySubmissions, createSubmission,
  listModerationQueue, moderateSubmission
} from './lib/repository.js';
import { normalizeMedia } from './lib/media.js';
import { getCatalog, getCollection, loadCategory, loadCollectionIndex, loadSources, resolveRecord } from './lib/data.js';
import { $, $$, debounce, escapeHtml, formatBytes, formatDate, formatDateTime, routeName, routeParam, setBusy, toast } from './lib/utils.js';

const R = getCatalog();
let sourceMap = new Map();
let sourcesLoaded = false;
const appState = {
  user: null,
  profile: null,
  theme: localStorage.getItem('llmBibleTheme') || 'system',
  favorites: new Set(JSON.parse(localStorage.getItem('llmBibleFavorites') || '[]')),
  authBusy: false,
  backend: { configured: isBackendConfigured(), authReachable: false, schemaReady: false, detail: '' }
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
          <a data-nav="prompts" href="#/prompts">프롬프트</a>
          <a data-nav="tools" href="#/tools">스킬·MCP</a>
          <a data-nav="recipes" href="#/recipes">레시피</a>
          <a data-nav="failures" href="#/failures">실패·점검</a>
          <a data-nav="community" href="#/community">공유 사례</a>
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
        <a href="#/home">시작</a><a href="#/prompts">프롬프트</a><a href="#/tools">스킬·MCP</a><a href="#/recipes">레시피</a><a href="#/failures">실패·점검</a><a href="#/community">공유 사례</a><a href="#/submit">업로드</a>${isAdmin ? '<a href="#/admin">관리자</a>' : ''}<a href="#/account">계정</a>
      </nav>
    </header>
    <main id="main">${content}</main>
    <footer class="site-footer"><div class="shell footer-inner"><div><strong>LLM Bible</strong><p>공식 근거 · 실제 예시 · 실패 패턴 · 검수형 커뮤니티.</p></div><div><span>Research snapshot · ${escapeHtml(R.meta?.snapshot || '2026-09-21')}</span><span>${appState.backend.schemaReady ? 'Supabase community ready' : appState.backend.configured && appState.backend.authReachable ? 'Supabase Auth connected · schema setup pending' : appState.backend.configured ? 'Supabase Auth connection error' : 'Static preview mode'}</span></div></div></footer>
    <dialog id="appDialog" class="app-dialog"><button class="dialog-close" type="button" data-close-dialog aria-label="닫기">×</button><div id="dialogBody"></div></dialog>`;
}

function backendNotice() {
  if (!appState.backend.configured) return `<div class="callout warning"><strong>백엔드 연결값이 없습니다.</strong> 정적 지식은 모두 사용할 수 있지만 로그인·업로드는 비활성입니다.</div>`;
  if (!appState.backend.authReachable) return `<div class="callout danger"><strong>Supabase 연결값은 있지만 Auth endpoint에 연결하지 못했습니다.</strong><br>${escapeHtml(appState.backend.detail || '네트워크, Project URL, Publishable Key를 확인하세요.')}<br><code>verify-backend.cmd</code>로 상태를 확인할 수 있습니다.</div>`;
  if (!appState.backend.schemaReady) return `<div class="callout info"><strong>기존 Supabase Auth 연결은 활성화되었습니다.</strong> 로그인/회원가입은 사용할 수 있습니다. LLM Bible의 커뮤니티·관리자 DB 기능은 <code>supabase/schema.sql</code>을 같은 프로젝트에 1회 적용하면 활성화됩니다.</div>`;
  return '';
}

function countCard(value, label, hint, href) {
  return `<a class="metric-card" href="${href}"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(hint)}</small></a>`;
}

function renderHome() {
  const modeCards = (R.modes || []).map((m) => `<article class="mode-card"><div class="mode-head"><span>${escapeHtml(m.title)}</span><b>${escapeHtml(m.ko)}</b></div><p>${escapeHtml(m.summary)}</p><small>${escapeHtml(m.rule)}</small><div class="mini-tags">${(m.check||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></article>`).join('');
  const curriculum = (R.curriculum || []).slice(0, 8).map((x) => `<article class="learn-step"><span>${escapeHtml(x.step)}</span><div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.summary)}</p></div></article>`).join('');
  return appShell(`
    <section class="hero shell research-hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="status-dot"></span> 2026-09-21 RESEARCH SNAPSHOT</div>
        <h1>LLM을 처음 배우는 사람도<br><span>실무 패턴까지 연결되는 바이블</span></h1>
        <p>프롬프트 문장만 모으지 않습니다. 언제 쓰는지, 언제 실패하는지, Skill·MCP·Agent로 언제 넘어가야 하는지, 무엇을 평가해야 하는지를 한 흐름으로 연결합니다.</p>
        <div class="hero-actions"><a class="button primary" href="#/prompts">프롬프트 찾기</a><a class="button secondary" href="#/learn">18단계 학습 시작</a><a class="button ghost" href="#/tools">Prompt vs Skill vs MCP</a></div>
      </div>
      <aside class="hero-card research-summary"><span class="pill official">RESEARCH CORPUS</span><h2>자료를 “검색 가능한 실전 자산”으로 변환</h2><div class="corpus-mini-grid"><b>${R.meta.prompt_count || 240}<small>Prompt</small></b><b>${R.meta.skill_count || 120}<small>Skills</small></b><b>${R.meta.recipe_count || 50}<small>Recipes</small></b><b>${R.meta.failure_count || 30}<small>Failures</small></b></div><p>개별 benchmark가 없는 예시는 <strong>로컬 eval 필요</strong>로 표시합니다.</p></aside>
    </section>
    <section class="metric-strip shell">
      ${countCard(R.meta.prompt_count || 240,'프롬프트 예시','12 패턴 × 20 업무 상황','#/prompts')}
      ${countCard(R.meta.skill_count || 120,'Skill / Plugin 패턴','재사용 가능한 작업 모듈','#/tools')}
      ${countCard(R.meta.recipe_count || 50,'MCP / Agent Recipe','단계·도구·검증','#/recipes')}
      ${countCard(R.meta.source_count || 41,'원천 소스','공식 문서·원 논문','#/tools?sources=1')}
    </section>
    ${backendNotice()}
    <section class="section shell"><div class="section-heading"><div><span class="eyebrow">WHAT ARE YOU TRYING TO DO?</span><h2>무엇을 하려나요?</h2></div><p>검색어를 몰라도 작업 유형에서 시작할 수 있습니다.</p></div><div class="task-first-grid">
      <a href="#/prompts?q=요약"><b>긴 문서 요약</b><span>Long context · Verification</span></a>
      <a href="#/prompts?q=리서치"><b>최신 정보 조사</b><span>RAG · Grounded</span></a>
      <a href="#/prompts?q=코딩"><b>코드 리뷰·디버깅</b><span>Tool · Multi-stage</span></a>
      <a href="#/tools?q=MCP"><b>외부 시스템 연결</b><span>Skill · Tool · MCP</span></a>
      <a href="#/failures?q=비용"><b>더 빠르고 싸게</b><span>Cache · Router · Quick</span></a>
      <a href="#/failures?q=환각"><b>정확도가 낮아요</b><span>Grounding · Eval · Verify</span></a>
    </div></section>
    <section class="section shell category-map-section"><div class="section-heading"><div><span class="eyebrow">LLM BIBLE MAP</span><h2>12개 큰 카테고리로 먼저 찾기</h2></div><p>설명 데이터는 카테고리를 연 뒤 필요한 부분만 추가로 로드합니다.</p></div><div class="category-map-grid">
      <a href="#/learn"><b>01 시작·기초</b><span>LLM · Token · Context · 학습 코스</span></a>
      <a href="#/prompts"><b>02 Prompt Library</b><span>12 patterns · 240 examples</span></a>
      <a href="#/tools"><b>03 Skills·Plugins</b><span>120 reusable patterns</span></a>
      <a href="#/tools"><b>04 MCP·Tool Calling</b><span>Function · Connector · Permission</span></a>
      <a href="#/recipes?cat=agent-architecture"><b>05 Agent Recipes</b><span>Planner · Router · Reliability</span></a>
      <a href="#/recipes?cat=rag-grounding"><b>06 RAG·Grounding</b><span>Retrieve · Rerank · Citation</span></a>
      <a href="#/recipes?cat=optimization-eval"><b>07 Evaluation</b><span>Quality · Faithfulness · Success</span></a>
      <a href="#/failures?cat=cost-performance"><b>08 Cost·Latency·Caching</b><span>Quick · Cache · Router</span></a>
      <a href="#/failures"><b>09 실패·Troubleshooting</b><span>증상 → 원인 → 수정 → Eval</span></a>
      <a href="#/failures?cat=security-permission"><b>10 Security</b><span>Injection · Secret · Permission</span></a>
      <a href="#/learn"><b>11 Model Guide</b><span>용도 · Snapshot · Freshness</span></a>
      <a href="#/community"><b>12 Community</b><span>Prompt → Result · 관리자 검수</span></a>
    </div></section>
    <section class="section shell"><div class="section-heading"><div><span class="eyebrow">WORK MODES</span><h2>복잡도를 상황에 맞게 줄이세요</h2></div><a class="text-link" href="#/failures">빠른 점검 보기 →</a></div><div class="mode-grid">${modeCards}</div></section>
    <section class="section shell"><div class="section-heading"><div><span class="eyebrow">BEGINNER → PRODUCTION</span><h2>18단계 학습 코스</h2></div><a class="text-link" href="#/learn">전체 과정 →</a></div><div class="learn-grid compact">${curriculum}</div></section>
    <section class="section shell final-cta"><div><span class="eyebrow">COMMUNITY EVIDENCE</span><h2>직접 성공한 사례는 Prompt와 Result를 함께 남깁니다.</h2><p>로그인 후 사용 모델·버전·프롬프트·결과·재현 메모를 제출하면 관리자 검수 후 공개할 수 있습니다.</p></div><div class="hero-actions"><a class="button primary" href="#/submit">사례 제출</a><a class="button secondary" href="#/community">검수된 사례</a></div></section>
  `);
}

function renderLearn() {
  const steps=(R.curriculum||[]).map((x)=>`<article class="curriculum-card"><span class="step-no">${escapeHtml(x.step)}</span><div><h2>${escapeHtml(x.title)}</h2><p>${escapeHtml(x.summary)}</p><dl><div><dt>실습</dt><dd>${escapeHtml(x.practice)}</dd></div><div><dt>체크포인트</dt><dd>${escapeHtml(x.checkpoint)}</dd></div><div><dt>흔한 오해</dt><dd>${escapeHtml(x.misconception)}</dd></div></dl></div></article>`).join('');
  const models=(R.models||[]).map(m=>`<tr><td><strong>${escapeHtml(m.name)}</strong></td><td>${escapeHtml(m.role)}</td><td>${escapeHtml(m.notes)}</td><td>${escapeHtml(m.snapshot)}</td></tr>`).join('');
  const metrics=(R.eval_metrics||[]).map(m=>`<tr><td><strong>${escapeHtml(m.target)}</strong></td><td>${(m.metrics||[]).map(x=>`<span class="metric-token">${escapeHtml(x)}</span>`).join(' ')}</td><td>${escapeHtml(m.note)}</td></tr>`).join('');
  const freshness=(R.freshness_policy||[]).map(x=>`<tr><td>${escapeHtml(x.type)}</td><td><strong>${escapeHtml(x.interval)}</strong></td></tr>`).join('');
  return appShell(`<section class="page-hero shell"><span class="eyebrow">CURRICULUM</span><h1>초보부터 운영까지 18단계</h1><p>기능 이름을 외우는 대신, 프롬프트 → RAG → Tools → MCP → Agent → Eval → 운영 순서로 연결해 이해합니다.</p><div class="hero-actions"><a class="button ghost" href="./research/deep-research-report-2026-09-21.md" target="_blank" rel="noopener">전체 리서치 원문 보기</a></div></section><section class="section shell"><div class="curriculum-list">${steps}</div></section><section class="section shell"><div class="section-heading"><div><span class="eyebrow">MODEL SNAPSHOT</span><h2>모델은 순위가 아니라 용도로 비교</h2></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>모델</th><th>표시 역할</th><th>기록할 것</th><th>Snapshot</th></tr></thead><tbody>${models}</tbody></table></div></section><section class="section shell"><div class="section-heading"><div><span class="eyebrow">EVALUATION</span><h2>업무마다 다른 평가축을 사용합니다.</h2></div><p>하나의 종합 점수로 Prompt·RAG·Agent를 섞지 않습니다.</p></div><div class="table-wrap"><table class="data-table"><thead><tr><th>대상</th><th>핵심 Metric</th><th>주의</th></tr></thead><tbody>${metrics}</tbody></table></div></section><section class="section shell split-info"><div><div class="section-heading"><div><span class="eyebrow">FRESHNESS</span><h2>정보 종류별 재검증 주기</h2></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>정보</th><th>권장 주기</th></tr></thead><tbody>${freshness}</tbody></table></div></div><div><div class="section-heading"><div><span class="eyebrow">EVIDENCE TIERS</span><h2>최신성과 근거 수준을 분리</h2></div></div><div class="tier-stack">${(R.source_tiers||[]).map(x=>`<article><b>${escapeHtml(x.tier)}</b><p>${escapeHtml(x.use)}</p><small>${escapeHtml(x.rule)}</small></article>`).join('')}</div></div></section>`);
}
function collectionHero(eyebrow,title,desc,stats='') { return `<section class="page-hero shell"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p>${stats}</section>`; }

function researchCard(item, type) {
  const meta = type==='prompt' ? `${item.pattern} · ${item.domain}` : type==='skill' ? `${item.domain} · ${item.kind}` : type==='recipe' ? item.category : 'Anti-pattern';
  const title = item.title || item.name;
  const summary = item.intent || item.purpose || item.problem || item.symptom;
  const difficulty = item.difficulty || '중급';
  const shard = item.shard || '';
  return `<article class="research-card"><div class="card-topline"><span class="pill soft">${escapeHtml(meta)}</span><span>${escapeHtml(difficulty)}</span></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary)}</p><div class="card-meta"><span>검증 ${escapeHtml(item.last_verified || R.meta?.snapshot || '-')}</span>${item.measurement_status ? `<span>${escapeHtml(item.measurement_status)}</span>`:''}</div><button class="text-button" type="button" data-research-open="${type}:${escapeHtml(item.id)}" data-research-shard="${escapeHtml(shard)}">상세·복사 보기 →</button></article>`;
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
  return appShell(`${collectionHero('PROMPT LIBRARY','240개 프롬프트를 카테고리부터 탐색','한 번에 240개 설명을 모두 내려받지 않습니다. 패턴을 고르면 해당 20개만 로드하고, 전체 검색이 필요할 때만 검색 인덱스를 사용합니다.',`<div class="hero-badges"><span>12 patterns</span><span>20 use cases each</span><span>Copy-ready</span></div>`)}<section class="section shell">${categoryIntro('prompts')}<div class="section-heading compact-heading"><div><span class="eyebrow">CHOOSE A PATTERN</span><h2>먼저 패턴을 고르세요</h2></div></div>${categoryCards('prompts','prompt')}<div class="search-panel lazy-search-panel"><label class="search-box"><span>⌕</span><input id="promptSearch" type="search" placeholder="전체 240개에서 목적·업무·제목 검색"></label><div class="utility-row"><label>난이도<select id="promptDifficulty"><option value="all">전체</option><option>초급</option><option>중급</option><option>고급</option></select></label><button id="resetPrompts" class="text-button" type="button">카테고리 선택 초기화</button></div></div><div id="promptLoadNote" class="data-load-note">카테고리를 선택하면 해당 데이터만 불러옵니다.</div><div class="result-toolbar"><p id="promptCount" class="result-count"></p><div id="promptPager" class="pager"></div></div><div id="promptGrid" class="research-grid"></div></section>`);
}

function renderTools() {
  const toolRows=(R.comparisons?.tool_types||[]).map(x=>`<tr><td><strong>${escapeHtml(x.type)}</strong></td><td>${escapeHtml(x.purpose)}</td><td>${escapeHtml(x.runtime)}</td><td>${escapeHtml(x.permission)}</td></tr>`).join('');
  const decision=(R.comparisons?.decision||[]).map((x,i)=>`<article class="decision-row"><span>${i+1}</span><div><b>${escapeHtml(x.question)}</b><p>Yes → ${escapeHtml(x.yes)} · No → ${escapeHtml(x.no)}</p></div></article>`).join('');
  return appShell(`${collectionHero('SKILLS · PLUGINS · MCP','Prompt 다음에 무엇을 써야 하나?','Skill, Function Tool, Plugin/Connector, MCP, Agent를 실행 위치·권한과 함께 구분하고, 실제 업무 Skill 120개를 분야별로 나눠 불러옵니다.')}<section class="section shell"><div class="section-heading"><div><span class="eyebrow">DECISION GUIDE</span><h2>Prompt vs Skill vs MCP vs Agent</h2></div></div><div class="decision-list">${decision}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>타입</th><th>목적</th><th>실행 위치</th><th>권한 모델</th></tr></thead><tbody>${toolRows}</tbody></table></div></section><section class="section shell">${categoryIntro('skills')}<div class="section-heading compact-heading"><div><span class="eyebrow">120 SKILL / PLUGIN PATTERNS</span><h2>업무 영역별로 나눠 보기</h2></div><button id="sourceToggle" class="button ghost small" type="button">41개 원천 소스 보기</button></div>${categoryCards('skills','skill')}<div class="search-panel lazy-search-panel"><label class="search-box"><span>⌕</span><input id="skillSearch" type="search" placeholder="전체 120개에서 PR 리뷰, 논문 비교, GitHub, Jira…"></label><div class="utility-row"><button id="resetSkills" class="text-button" type="button">카테고리 선택 초기화</button></div></div><div id="skillLoadNote" class="data-load-note">영역을 선택하면 해당 10개 Skill만 불러옵니다.</div><p id="skillCount" class="result-count"></p><div id="skillGrid" class="research-grid"></div><div id="sourcesPanel" class="sources-panel" hidden></div></section>`);
}

function renderRecipes() {
  return appShell(`${collectionHero('50 MCP / AGENT RECIPES','복잡한 업무는 단계·도구·검증으로 쪼갭니다.','세부 기술 이름을 20여 개로 늘어놓는 대신 초보자가 이해하기 쉬운 7개 상위 카테고리로 먼저 묶었습니다.')}<section class="section shell">${categoryIntro('recipes')}<div class="section-heading compact-heading"><div><span class="eyebrow">WORKFLOW CATEGORIES</span><h2>문제 유형부터 선택</h2></div></div>${categoryCards('recipes','recipe')}<div class="search-panel lazy-search-panel"><label class="search-box"><span>⌕</span><input id="recipeSearch" type="search" placeholder="전체 50개에서 RAG, GitHub issue, 비용 라우터…"></label><div class="utility-row"><button id="resetRecipes" class="text-button" type="button">카테고리 선택 초기화</button></div></div><div id="recipeLoadNote" class="data-load-note">카테고리를 선택하면 해당 Recipe만 불러옵니다.</div><p id="recipeCount" class="result-count"></p><div id="recipeGrid" class="research-grid"></div></section>`);
}

function renderFailures() {
  const quick=(R.modes||[]).map(m=>`<article class="quick-card"><span>${escapeHtml(m.title)}</span><h3>${escapeHtml(m.ko)}</h3><p>${escapeHtml(m.rule)}</p><ul>${(m.check||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></article>`).join('');
  return appShell(`${collectionHero('FAILURES · QUICK CHECKS','왜 안 되나요? 실패 증상에서 찾기','프롬프트·RAG·Tool·Agent·평가·비용에서 반복되는 실패를 증상 → 원인 → 수정 → eval 순서로 봅니다.')}<section class="section shell"><div class="section-heading"><div><span class="eyebrow">QUICK MODE</span><h2>30초 점검부터 시작</h2></div></div><div class="quick-grid">${quick}</div><div class="one-minute-check"><b>1분 체크리스트</b><span>① 성공 기준이 있는가</span><span>② 최신 정보면 검색/RAG가 있는가</span><span>③ 출력 형식 검증이 있는가</span><span>④ tool 권한이 최소인가</span><span>⑤ token/cost/latency를 측정하는가</span><span>⑥ 모델 변경 후 regression을 돌렸는가</span></div></section><section class="section shell"><div class="section-heading"><div><span class="eyebrow">PROGRESSIVE OPTIMIZATION</span><h2>가장 작은 변화부터 적용</h2></div></div><div class="optimization-ladder"><span>1. 성공 기준 / Eval</span><b>→</b><span>2. Prompt 구조</span><b>→</b><span>3. Structured Output</span><b>→</b><span>4. Search / RAG</span><b>→</b><span>5. Tool / Skill</span><b>→</b><span>6. Agent</span><b>→</b><span>7. Fine-tuning</span></div><p class="subtle">복잡한 Agent나 Fine-tuning을 먼저 도입하지 말고, 더 단순한 구조로 목표 품질을 달성할 수 있는지 먼저 검증합니다.</p></section><section class="section shell">${categoryIntro('failures')}<div class="section-heading compact-heading"><div><span class="eyebrow">TROUBLESHOOT BY AREA</span><h2>실패 유형부터 고르세요</h2></div></div>${categoryCards('failures','failure')}<div class="search-panel lazy-search-panel"><label class="search-box"><span>⌕</span><input id="failureSearch" type="search" placeholder="전체 30개에서 환각, 비용, tool loop, cache miss…"></label><div class="utility-row"><button id="resetFailures" class="text-button" type="button">카테고리 선택 초기화</button></div></div><div id="failureLoadNote" class="data-load-note">문제 영역을 선택하면 관련 실패 패턴만 불러옵니다.</div><p id="failureCount" class="result-count"></p><div id="failureGrid" class="research-grid"></div></section>`);
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

function renderAccount() {
  if(!isBackendConfigured()) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><h1>Supabase 연결값이 없습니다.</h1></div></section>`);
  if(!appState.user) return appShell(`<section class="section shell auth-layout">${backendNotice()}<div class="auth-intro"><span class="eyebrow">ACCOUNT</span><h1>${appState.backend.authReachable?'기존 Supabase Auth 프로젝트에 연결되었습니다.':'Supabase Auth 연결 상태를 확인하세요.'}</h1><p>${appState.backend.authReachable?'회원가입/로그인은 바로 사용할 수 있습니다. 커뮤니티 DB 스키마가 아직 없으면 로그인은 되지만 제출·관리자 기능만 대기 상태로 표시됩니다.':'아래 폼은 그대로 두되, 먼저 verify-backend.cmd 또는 위 진단 메시지로 Project URL / Publishable Key / 네트워크 상태를 확인하세요.'}</p></div><div class="auth-panels"><form id="loginForm" class="panel-form compact"><h2>로그인</h2><label>이메일<input name="email" type="email" autocomplete="email" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" minlength="8" required></label><button class="button primary" type="submit">로그인</button></form><form id="signupForm" class="panel-form compact"><h2>회원가입</h2><label>표시 이름<input name="displayName" minlength="2" maxlength="40" required></label><label>이메일<input name="email" type="email" autocomplete="email" required></label><label>비밀번호<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="button secondary" type="submit">회원가입</button><small>Supabase의 이메일 확인 설정에 따라 확인 메일이 발송될 수 있습니다.</small></form></div></section>`);
  return appShell(`<section class="page-hero shell"><span class="eyebrow">MY ACCOUNT</span><h1>${escapeHtml(appState.profile?.display_name||appState.user.email)}</h1><p>${escapeHtml(appState.user.email)} · 권한 ${escapeHtml(appState.profile?.role||'user')}</p><div class="hero-actions">${appState.backend.schemaReady?'<a class="button primary" href="#/submit">새 사례 제출</a>':''}${appState.profile?.role==='admin'?'<a class="button secondary" href="#/admin">관리자 검수</a>':''}<button id="logoutButton" class="button ghost" type="button">로그아웃</button></div></section><section class="section shell">${backendNotice()}<div class="section-heading"><div><span class="eyebrow">MY SUBMISSIONS</span><h2>내 제출 상태</h2></div></div><div id="mySubmissions" class="status-list">${appState.backend.schemaReady?'<div class="skeleton-line"></div>':'<div class="empty-state"><p>커뮤니티 스키마 적용 후 제출 목록을 사용할 수 있습니다.</p></div>'}</div></section>`);
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
  const q=$('#skillSearch'), grid=$('#skillGrid'), count=$('#skillCount'), note=$('#skillLoadNote'); let selected=queryParams().get('cat')||''; let current=[]; let mode='category'; q.value=initialSearch();
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
  if(type==='recipe')body=`<div class="research-detail"><div class="card-topline"><span class="pill official">Recipe</span><span>${escapeHtml(item.category)} · ${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.problem)}</p>${copyActionBar([{label:'Prompt 복사',text:item.prompt_template,kind:'primary'},{label:'단계 복사',text:(item.steps||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')},{label:'Architecture',text:item.architecture},{label:'검증 체크',text:item.verification},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}<section><h3>Architecture</h3><div class="architecture-line">${(item.steps||[]).map((s,i)=>`<span>${i+1}. ${escapeHtml(s)}</span>`).join('<b>→</b>')}</div></section><h3>Prompt Template</h3>${codeBlock(item.prompt_template)}<div class="detail-grid"><section><h3>측정 지표</h3><ul>${(item.metrics||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section><section><h3>검증</h3><p>${escapeHtml(item.verification)}</p></section></div><section><h3>흔한 실패</h3><p>${escapeHtml(item.common_failure)}</p></section><section><h3>보안</h3><p>${escapeHtml(item.security)}</p></section><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  if(type==='failure')body=`<div class="research-detail"><div class="card-topline"><span class="pill danger-soft">Anti-pattern</span><span>${escapeHtml(item.last_verified)}</span></div><h2>${escapeHtml(item.title)}</h2>${copyActionBar([{label:'수정안 복사',text:item.corrected_example,kind:'primary'},{label:'예방책 복사',text:item.prevention},{label:'Test/Eval 복사',text:item.test_eval},{label:'전체 체크 복사',text:recordPack(type,item)},{label:'JSON 복사',text:JSON.stringify(item,null,2)}])}<div class="failure-flow"><section><span>증상</span><p>${escapeHtml(item.symptom)}</p></section><section><span>원인</span><p>${escapeHtml(item.root_cause)}</p></section><section><span>잘못된 예</span><p>${escapeHtml(item.bad_example)}</p></section><section><span>수정</span><p>${escapeHtml(item.corrected_example)}</p></section><section><span>예방</span><p>${escapeHtml(item.prevention)}</p></section><section><span>Test / Eval</span><p>${escapeHtml(item.test_eval)}</p></section></div><div class="source-links">${sourceLinks(item.source_refs)}</div></div>`;
  $('#dialogBody').innerHTML=body;bindCopyControls(dialog,item,type);
}

function initCommunity(){ const search=$('#communitySearch'), cat=$('#communityCategory'), cards=$$('.community-card'); const apply=()=>{const q=search.value.toLowerCase(); cards.forEach(card=>{const ok=(!q||card.textContent.toLowerCase().includes(q))&&(cat.value==='all'||card.querySelector('.card-category')?.textContent===cat.value);card.hidden=!ok;});};search?.addEventListener('input',debounce(apply));cat?.addEventListener('change',apply); }

function initSubmit(){
  const input=$('#mediaInput'); input?.addEventListener('change',()=>{const files=[...input.files].slice(0,APP_CONFIG.maxMediaCount);if(input.files.length>APP_CONFIG.maxMediaCount)toast(`최대 ${APP_CONFIG.maxMediaCount}개까지 가능합니다.`,'warning');$('#mediaSelection').innerHTML=files.map(file=>`<span class="file-chip">${escapeHtml(file.name)} · ${formatBytes(file.size)}</span>`).join('');});
  $('#submissionForm')?.addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]'),files=[...$('#mediaInput').files].slice(0,APP_CONFIG.maxMediaCount);setBusy(button,true,'변환·업로드 중…');const progress=$('#conversionProgress'),progressText=$('#progressText'),progressBar=$('#progressBar');progress.hidden=false;try{const normalized=[];for(let i=0;i<files.length;i++){progressText.textContent=`${i+1}/${files.length} ${files[i].name} 변환 중…`;const result=await normalizeMedia(files[i],p=>{progressBar.style.width=`${Math.round(((i+p)/Math.max(1,files.length))*100)}%`;});result.altText=`${form.title.value} 예시 ${i+1}`;normalized.push(result);}const payload={title:form.title.value,category:form.category.value,summary:form.summary.value,promptText:form.promptText.value,resultText:form.resultText.value,modelName:form.modelName.value,modelVersion:form.modelVersion.value,sourceNotes:form.sourceNotes.value};await createSubmission(payload,normalized,({index,total})=>{progressBar.style.width=`${Math.round(((index+.5)/Math.max(1,total))*100)}%`;});progressBar.style.width='100%';progressText.textContent='제출 완료';toast('검수 요청을 제출했습니다.','success');location.hash='#/account';}catch(e){toast(e.message,'danger');progressText.textContent=e.message;}finally{setBusy(button,false);}});
}

function initAccount(){ $('#loginForm')?.addEventListener('submit',handleLogin); $('#signupForm')?.addEventListener('submit',async(event)=>{event.preventDefault();const button=event.currentTarget.querySelector('button');setBusy(button,true);const f=event.currentTarget;try{const data=await signUp({email:f.email.value,password:f.password.value,displayName:f.displayName.value});toast(data.session?'회원가입 및 로그인되었습니다.':'회원가입되었습니다. 이메일 확인이 필요할 수 있습니다.','success');await refreshAuth();await render();}catch(e){toast(e.message,'danger');}finally{setBusy(button,false);}}); if(appState.user&&appState.backend.schemaReady)loadMySubmissions(); }
async function handleLogin(event){event.preventDefault();const button=event.currentTarget.querySelector('button');setBusy(button,true);const f=event.currentTarget;try{await signIn({email:f.email.value,password:f.password.value});await refreshAuth();toast('로그인했습니다.','success');await render();}catch(e){toast(e.message,'danger');}finally{setBusy(button,false);}}
async function loadMySubmissions(){const root=$('#mySubmissions');if(!root||!appState.user)return;try{const items=await listMySubmissions(appState.user.id);root.innerHTML=items.map(x=>`<article class="status-row"><div><span class="status status-${x.status}">${statusLabel(x.status)}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.category)} · 제출 ${formatDateTime(x.created_at)}${x.reviewed_at?` · 검수 ${formatDateTime(x.reviewed_at)}`:''}</p>${x.moderation_note?`<small>관리자 메모: ${escapeHtml(x.moderation_note)}</small>`:''}</div>${x.status==='published'&&x.slug?`<a class="button ghost small" href="#/community/${encodeURIComponent(x.slug)}">공개 페이지</a>`:''}</article>`).join('')||'<div class="empty-state"><p>아직 제출한 사례가 없습니다.</p></div>';}catch(e){root.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}}

function initAdmin(){ $('#adminLoginForm')?.addEventListener('submit',handleLogin); if(appState.profile?.role!=='admin'||!appState.backend.schemaReady)return;let currentStatus='pending';const load=async()=>{const root=$('#adminQueue');root.innerHTML='<div class="skeleton-line"></div>';try{const items=await listModerationQueue(currentStatus);root.innerHTML=items.map(adminCard).join('')||'<div class="empty-state"><h3>검수할 항목이 없습니다.</h3></div>';$$('[data-review-id]').forEach(b=>b.addEventListener('click',()=>openAdminReview(items.find(x=>x.id===b.dataset.reviewId))));}catch(e){root.innerHTML=`<div class="callout danger">${escapeHtml(e.message)}</div>`;}};$('#adminStatus')?.addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;currentStatus=b.dataset.status;$$('#adminStatus button').forEach(x=>x.classList.toggle('active',x===b));load();});$('#refreshAdmin')?.addEventListener('click',load);load();}
function adminCard(item){return `<article class="admin-card"><div><div class="card-topline"><span class="status status-${item.status}">${statusLabel(item.status)}</span><span>${formatDateTime(item.created_at)}</span></div><p class="card-category">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><div class="card-meta"><span>${escapeHtml(item.model_name||'-')} ${escapeHtml(item.model_version||'')}</span><span>by ${escapeHtml(item.author_display_name||'-')}</span><span>미디어 ${(item.media||[]).length}개</span></div></div><button class="button secondary" type="button" data-review-id="${item.id}">검수 열기</button></article>`;}
function openAdminReview(item){if(!item)return;const media=(item.media||[]).map(m=>m.previewUrl?(m.kind==='video'?`<video controls src="${escapeHtml(m.previewUrl)}"></video>`:`<img src="${escapeHtml(m.previewUrl)}" alt="검수 미디어">`):'<div class="media-error">미리보기 실패</div>').join('');const dialog=$('#appDialog');$('#dialogBody').innerHTML=`<div class="admin-review"><div class="card-topline"><span class="status status-${item.status}">${statusLabel(item.status)}</span><span>${formatDateTime(item.created_at)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><dl class="meta-list"><div><dt>작성자</dt><dd>${escapeHtml(item.author_display_name||'-')}</dd></div><div><dt>모델</dt><dd>${escapeHtml(item.model_name||'-')} ${escapeHtml(item.model_version||'')}</dd></div></dl>${copyActionBar([{label:'Prompt 복사',text:item.prompt_text,kind:'primary'},{label:'Result 복사',text:item.result_text}])}<div class="prompt-result-grid"><section><span class="eyebrow">PROMPT</span>${codeBlock(item.prompt_text,'Prompt 복사')}</section><section><span class="eyebrow">RESULT</span>${codeBlock(item.result_text,'Result 복사')}</section></div>${media?`<div class="media-gallery review-media">${media}</div>`:''}<form id="reviewForm" class="review-form"><h3>검수 점수</h3><div class="score-grid">${scoreField('clarity','명확성')}${scoreField('reproducibility','재현성')}${scoreField('resultQuality','결과 품질')}${scoreField('accuracy','정확성')}${scoreField('safety','안전성')}${scoreField('learningValue','학습 가치')}</div><label>관리자 메모<textarea name="note" rows="3" maxlength="2000"></textarea></label><div class="review-actions"><button class="button success" type="button" data-action="publish">공개 승인</button><button class="button secondary" type="button" data-action="archive">보관만</button><button class="button danger" type="button" data-action="reject">폐기</button></div></form></div>`;dialog.showModal();bindCopyButtons(dialog);$$('[data-action]',$('#reviewForm')).forEach(button=>button.addEventListener('click',async()=>{const form=$('#reviewForm'),action=button.dataset.action;if(action==='reject'&&!confirm('폐기하면 비공개 미디어 파일이 삭제됩니다. 계속할까요?'))return;const review={note:form.note.value.trim(),scores:{clarity:Number(form.clarity.value),reproducibility:Number(form.reproducibility.value),resultQuality:Number(form.resultQuality.value),accuracy:Number(form.accuracy.value),safety:Number(form.safety.value),learningValue:Number(form.learningValue.value)}};setBusy(button,true);try{await moderateSubmission(item.id,action,review);toast(action==='publish'?'공개 승인했습니다.':action==='archive'?'보관 처리했습니다.':'폐기 처리했습니다.','success');dialog.close();await render();}catch(e){toast(e.message,'danger');}finally{setBusy(button,false);}}));}
function scoreField(name,label){return `<label>${label}<select name="${name}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}</select></label>`;}

async function refreshAuth(){
  appState.backend=await getBackendDiagnostics().catch(e=>({configured:isBackendConfigured(),authReachable:false,schemaReady:false,detail:e.message}));
  try{const state=await getSessionState();appState.user=state.user;appState.profile=state.profile;}catch(e){appState.user=null;appState.profile=null;console.error(e);}
}

window.addEventListener('hashchange',render);
document.getElementById('skipToMain')?.addEventListener('click',event=>{event.preventDefault();const main=document.getElementById('main');if(!main){location.hash='#/home';return;}main.setAttribute('tabindex','-1');main.focus({preventScroll:false});});
await refreshAuth();
onAuthChange(async()=>{if(appState.authBusy)return;appState.authBusy=true;await refreshAuth();appState.authBusy=false;await render();});
if(!location.hash||location.hash==='#app'||location.hash==='#main') history.replaceState(null,'',`${location.pathname}${location.search}#/home`);
await render();
window.__LLM_BIBLE_BOOTED__=true;
