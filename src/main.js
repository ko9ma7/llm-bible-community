import {
  APP_CONFIG, isBackendConfigured, getSessionState, onAuthChange, signIn, signOut, signUp,
  listPublishedSubmissions, getPublishedSubmission, listMySubmissions, createSubmission,
  listModerationQueue, moderateSubmission
} from './lib/repository.js';
import { normalizeMedia } from './lib/media.js';
import { $, $$, debounce, escapeHtml, formatBytes, formatDate, formatDateTime, routeName, routeParam, setBusy, toast } from './lib/utils.js';

const curated = window.LLM_BIBLE_DATA || { roadmap: [], models: [], knowledge: [] };
const appState = {
  user: null,
  profile: null,
  theme: localStorage.getItem('llmBibleTheme') || 'system',
  favorites: new Set(JSON.parse(localStorage.getItem('llmBibleFavorites') || '[]')),
  authBusy: false
};

function applyTheme() {
  document.documentElement.dataset.theme = appState.theme;
}
applyTheme();

function appShell(content) {
  const isAdmin = appState.profile?.role === 'admin';
  const userLabel = appState.profile?.display_name || appState.user?.email || '계정';
  return `
    <header class="site-header">
      <div class="header-inner shell">
        <a class="brand" href="#/home" aria-label="LLM Bible 홈"><span class="brand-mark">LB</span><span><strong>LLM Bible</strong><small>Evidence + Community</small></span></a>
        <nav class="desktop-nav" aria-label="주요 메뉴">
          <a data-nav="home" href="#/home">시작</a>
          <a data-nav="library" href="#/library">지식</a>
          <a data-nav="community" href="#/community">공유 사례</a>
          <a data-nav="submit" href="#/submit">업로드</a>
          ${isAdmin ? '<a data-nav="admin" href="#/admin">관리자</a>' : ''}
        </nav>
        <div class="header-actions">
          <button id="themeButton" class="icon-button" type="button" title="테마 변경" aria-label="테마 변경">◐</button>
          <a class="account-chip" href="#/account">${escapeHtml(userLabel)}</a>
          <button id="menuButton" class="icon-button mobile-only" type="button" aria-expanded="false" aria-controls="mobileNav">☰</button>
        </div>
      </div>
      <nav id="mobileNav" class="mobile-nav shell" hidden>
        <a href="#/home">시작</a><a href="#/library">지식</a><a href="#/community">공유 사례</a><a href="#/submit">업로드</a>${isAdmin ? '<a href="#/admin">관리자</a>' : ''}<a href="#/account">계정</a>
      </nav>
    </header>
    <main id="main">${content}</main>
    <footer class="site-footer"><div class="shell footer-inner"><div><strong>LLM Bible</strong><p>근거 중심 LLM 지식과 검수형 프롬프트 커뮤니티.</p></div><div><span>Research snapshot · 2026-09-21</span><span>${isBackendConfigured() ? 'Supabase connected' : 'Static preview mode'}</span></div></div></footer>
    <dialog id="appDialog" class="app-dialog"><button class="dialog-close" type="button" data-close-dialog aria-label="닫기">×</button><div id="dialogBody"></div></dialog>`;
}

function backendNotice() {
  if (isBackendConfigured()) return '';
  return `<div class="callout warning"><strong>현재는 정적 Preview 모드입니다.</strong> 커뮤니티 업로드·로그인·관리자 기능을 사용하려면 <code>.env</code>와 Supabase 스키마를 설정하세요. README의 Backend Setup을 그대로 따라가면 됩니다.</div>`;
}

function renderHome() {
  const roadmap = curated.roadmap.slice(0, 6).map((item) => `
    <a class="roadmap-card" href="#/library?open=${encodeURIComponent(item.ids?.[0] || '')}"><span class="roadmap-step">${escapeHtml(item.step)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc)}</p></div><span>↗</span></a>`).join('');
  const featured = curated.knowledge.slice(0, 4).map(curatedCard).join('');
  return appShell(`
    <section class="hero shell">
      <div class="hero-copy"><div class="eyebrow"><span class="status-dot"></span> KNOWLEDGE + REVIEWED COMMUNITY</div><h1>AI·LLM을 배우고,<br><span>검증된 실제 사례까지</span> 이어서 봅니다.</h1><p>공식 문서와 원논문 기반의 기초 지식에, 사용자가 직접 만든 프롬프트·결과를 더합니다. 공유 사례는 모두 관리자 검수를 통과한 뒤 공개됩니다.</p><div class="hero-actions"><a class="button primary" href="#/library">기초부터 보기</a><a class="button secondary" href="#/community">검수된 사례 보기</a></div><div class="hero-meta"><span>✓ Evidence tier</span><span>✓ Prompt → Result</span><span>✓ Admin reviewed</span><span>✓ WebP / WebM</span></div></div>
      <aside class="hero-card"><span class="pill official">COMMUNITY PIPELINE</span><h2>제출 → 변환 → 비공개 저장 → 검수 → 공개</h2><ol class="pipeline-list"><li><b>1</b><span>회원이 프롬프트·결과·예시 업로드</span></li><li><b>2</b><span>이미지 WebP / 영상 WebM 자동 변환</span></li><li><b>3</b><span>관리자가 품질·재현성·안전성 검수</span></li><li><b>4</b><span>공개 / 보관 / 폐기 결정</span></li></ol></aside>
    </section>
    <section class="signal-strip"><div><strong>Evidence</strong><span>공식·원논문·재현 구분</span></div><div><strong>Community</strong><span>사례는 관리자 승인 후 공개</span></div><div><strong>Storage</strong><span>Pending과 Published 분리</span></div><div><strong>Audit</strong><span>관리자 결정 이력 보존</span></div></section>
    ${backendNotice()}
    <section class="section shell"><div class="section-heading"><div><span class="eyebrow">BEGINNER ROADMAP</span><h2>처음이라면 이 순서로</h2></div><p>개념을 익힌 뒤 실제 공유 사례에서 같은 패턴이 어떻게 쓰였는지 확인하세요.</p></div><div class="roadmap-grid">${roadmap}</div></section>
    <section class="section shell"><div class="section-heading"><div><span class="eyebrow">CURATED FOUNDATION</span><h2>먼저 알아야 할 핵심 지식</h2></div><a class="text-link" href="#/library">전체 라이브러리 →</a></div><div class="knowledge-grid">${featured}</div></section>
    <section class="section shell final-cta"><div><span class="eyebrow">SHARE WHAT WORKED</span><h2>좋은 프롬프트는 결과와 함께 남길 때 가치가 생깁니다.</h2><p>모델·버전·프롬프트·결과·예시 미디어를 함께 제출하면 관리자가 검수하여 커뮤니티 지식으로 공개할 수 있습니다.</p></div><a class="button primary" href="#/submit">내 사례 제출하기</a></section>
  `);
}

function curatedCard(item) {
  const saved = appState.favorites.has(item.id);
  return `<article class="knowledge-card"><div class="card-topline"><span class="pill tier-${item.tier?.toLowerCase()}">Tier ${escapeHtml(item.tier || '-')}</span><button class="favorite-button ${saved ? 'active' : ''}" type="button" data-favorite="${escapeHtml(item.id)}" aria-label="즐겨찾기">${saved ? '★' : '☆'}</button></div><div><p class="card-category">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div><div class="card-meta"><span>검증 ${escapeHtml(item.freshness || '-')}</span><span>${escapeHtml(item.risk || '위험도 미상')}</span></div><button class="text-button" type="button" data-curated-open="${escapeHtml(item.id)}">예시와 근거 보기 →</button></article>`;
}

function renderLibrary() {
  return appShell(`
    <section class="page-hero shell"><span class="eyebrow">CURATED KNOWLEDGE</span><h1>근거가 붙은 LLM 지식</h1><p>프롬프트 문장 자체가 아니라 언제 적용되는지, 어떻게 평가할지, 무엇이 실패 조건인지까지 함께 봅니다.</p></section>
    <section class="section shell"><div class="search-panel"><label class="search-box"><span>⌕</span><input id="librarySearch" type="search" placeholder="RAG, 캐싱, LoRA, 평가…"></label><div id="categoryFilters" class="filter-row"></div><div class="utility-row"><label>근거 수준 <select id="evidenceFilter"><option value="all">전체</option><option value="A">Tier A</option><option value="B">Tier B</option><option value="C">Tier C</option><option value="D">Tier D</option></select></label><label class="check-label"><input id="favoriteOnly" type="checkbox"> 즐겨찾기만</label><button id="resetLibrary" class="text-button" type="button">초기화</button></div></div><p id="libraryCount" class="result-count"></p><div id="knowledgeGrid" class="knowledge-grid"></div><div id="libraryEmpty" class="empty-state" hidden><h3>검색 결과가 없습니다.</h3><p>검색어나 필터를 바꿔보세요.</p></div></section>
  `);
}

async function renderCommunity() {
  const detail = routeParam();
  if (detail) return renderCommunityDetail(detail);
  let items = [];
  let error = '';
  try { items = await listPublishedSubmissions(); } catch (e) { error = e.message; }
  const cards = items.map(communityCard).join('');
  return appShell(`
    <section class="page-hero shell"><span class="eyebrow">REVIEWED COMMUNITY</span><h1>실제로 만들어 본 프롬프트와 결과</h1><p>회원이 제출한 사례 중 관리자가 공개 승인한 항목만 보입니다. 모델·버전·프롬프트·결과·예시 미디어를 한 묶음으로 확인하세요.</p></section>
    <section class="section shell">${backendNotice()}${error ? `<div class="callout danger">${escapeHtml(error)}</div>` : ''}<div class="toolbar"><label class="search-box"><span>⌕</span><input id="communitySearch" type="search" placeholder="공유 사례 검색"></label><select id="communityCategory"><option value="all">모든 카테고리</option>${categoryOptions()}</select></div><div id="communityGrid" class="community-grid">${cards || `<div class="empty-state wide"><h3>아직 공개된 사례가 없습니다.</h3><p>첫 번째 고품질 사례를 제출해 보세요.</p><a class="button primary" href="#/submit">사례 제출하기</a></div>`}</div></section>
  `);
}

function communityCard(item) {
  const media = item.media?.[0];
  const visual = media?.publicUrl ? (media.kind === 'video'
    ? `<video class="community-thumb" src="${escapeHtml(media.publicUrl)}" muted playsinline preload="metadata"></video>`
    : `<img class="community-thumb" src="${escapeHtml(media.publicUrl)}" alt="${escapeHtml(media.alt_text || item.title)}" loading="lazy">`) : `<div class="community-thumb placeholder">PROMPT</div>`;
  return `<article class="community-card">${visual}<div class="community-card-body"><div class="card-topline"><span class="pill official">검수 공개</span><span>${formatDate(item.published_at)}</span></div><p class="card-category">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><div class="card-meta"><span>${escapeHtml(item.model_name || '모델 미상')}${item.model_version ? ` · ${escapeHtml(item.model_version)}` : ''}</span><span>by ${escapeHtml(item.author_display_name || '회원')}</span></div><a class="text-link" href="#/community/${encodeURIComponent(item.slug || item.id)}">Prompt → Result 보기 →</a></div></article>`;
}

async function renderCommunityDetail(slug) {
  let item = null;
  let error = '';
  try { item = await getPublishedSubmission(decodeURIComponent(slug)); } catch (e) { error = e.message; }
  if (!item) return appShell(`<section class="section shell narrow"><a class="back-link" href="#/community">← 공유 사례</a><div class="empty-state"><h2>사례를 찾을 수 없습니다.</h2><p>${escapeHtml(error || '삭제되었거나 공개 상태가 아닙니다.')}</p></div></section>`);
  const media = (item.media || []).map((m) => m.kind === 'video'
    ? `<figure><video controls preload="metadata" src="${escapeHtml(m.publicUrl || '')}"></video>${m.alt_text ? `<figcaption>${escapeHtml(m.alt_text)}</figcaption>` : ''}</figure>`
    : `<figure><img loading="lazy" src="${escapeHtml(m.publicUrl || '')}" alt="${escapeHtml(m.alt_text || item.title)}">${m.alt_text ? `<figcaption>${escapeHtml(m.alt_text)}</figcaption>` : ''}</figure>`).join('');
  return appShell(`<article class="section shell article-detail"><a class="back-link" href="#/community">← 공유 사례</a><div class="detail-heading"><div><span class="pill official">관리자 검수 완료</span><p class="eyebrow">${escapeHtml(item.category)}</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p></div><dl class="meta-list"><div><dt>작성자</dt><dd>${escapeHtml(item.author_display_name || '회원')}</dd></div><div><dt>모델</dt><dd>${escapeHtml(item.model_name || '-')} ${escapeHtml(item.model_version || '')}</dd></div><div><dt>공개일</dt><dd>${formatDate(item.published_at)}</dd></div></dl></div><div class="prompt-result-grid"><section><span class="eyebrow">PROMPT</span><pre>${escapeHtml(item.prompt_text)}</pre></section><section><span class="eyebrow">RESULT</span><pre>${escapeHtml(item.result_text)}</pre></section></div>${item.source_notes ? `<section class="detail-block"><h2>재현·출처 메모</h2><p>${escapeHtml(item.source_notes)}</p></section>` : ''}${media ? `<section class="detail-block"><h2>예시 미디어</h2><div class="media-gallery">${media}</div></section>` : ''}</article>`);
}

function categoryOptions() {
  return ['프롬프트','RAG','에이전트','코딩','이미지','영상','데이터','업무자동화','기타'].map((x) => `<option value="${x}">${x}</option>`).join('');
}

function renderSubmit() {
  if (!appState.user) return appShell(`<section class="section shell narrow"><div class="auth-gate"><span class="eyebrow">MEMBER SUBMISSION</span><h1>로그인 후 사례를 제출할 수 있습니다.</h1><p>제출물은 즉시 공개되지 않습니다. 관리자 검수 전에는 비공개 상태로 보관됩니다.</p><a class="button primary" href="#/account">로그인 / 회원가입</a></div></section>`);
  return appShell(`<section class="page-hero shell"><span class="eyebrow">SUBMIT A CASE</span><h1>Prompt → Result 사례 제출</h1><p>다른 사람이 재현할 수 있도록 구체적으로 작성해 주세요. 업로드 미디어는 공개 전 비공개 버킷에 저장됩니다.</p></section><section class="section shell form-shell"><form id="submissionForm" class="panel-form"><div class="form-grid"><label>제목<input name="title" minlength="5" maxlength="100" required placeholder="예: 제품 리뷰 500건에서 불만 유형을 안정적으로 추출한 프롬프트"></label><label>카테고리<select name="category" required><option value="">선택</option>${categoryOptions()}</select></label></div><label>한 줄 요약<textarea name="summary" minlength="20" maxlength="500" rows="3" required placeholder="어떤 문제를 어떤 방식으로 개선했는지 요약하세요."></textarea></label><div class="form-grid"><label>사용 모델<input name="modelName" maxlength="80" required placeholder="예: GPT 계열, Claude, Gemini, Llama…"></label><label>모델 버전 / ID<input name="modelVersion" maxlength="120" placeholder="가능하면 정확한 API model ID"></label></div><label>프롬프트<textarea name="promptText" minlength="30" maxlength="30000" rows="14" required spellcheck="false" placeholder="실제로 사용한 전체 프롬프트를 붙여 넣으세요."></textarea></label><label>결과<textarea name="resultText" minlength="30" maxlength="30000" rows="14" required spellcheck="false" placeholder="이 프롬프트로 얻은 대표 결과를 붙여 넣으세요."></textarea></label><label>재현·출처 메모<textarea name="sourceNotes" maxlength="5000" rows="5" placeholder="temperature, tools, RAG 조건, 데이터셋, 평가 방법, 출처 링크 등"></textarea></label><fieldset class="media-field"><legend>예시 미디어 · 최대 ${APP_CONFIG.maxMediaCount}개</legend><p>이미지는 최대 ${formatBytes(APP_CONFIG.maxImageBytes)} → WebP, 영상은 최대 ${formatBytes(APP_CONFIG.maxVideoBytes)} / ${APP_CONFIG.maxVideoDuration}초 → WebM으로 브라우저에서 변환 후 업로드합니다.</p><input id="mediaInput" name="media" type="file" accept="image/*,video/*" multiple><div id="mediaSelection" class="media-selection"></div><div id="conversionProgress" class="progress-box" hidden><div class="progress-track"><span id="progressBar"></span></div><p id="progressText">변환 준비 중…</p></div></fieldset><label class="consent-row"><input name="rights" type="checkbox" required><span>개인정보·비밀키·저작권 침해 자료를 포함하지 않았으며, 공개 승인 시 이 사례가 서비스에 표시되는 것에 동의합니다.</span></label><div class="callout info"><strong>검수 기준:</strong> 문제와 목적이 명확한가 · Prompt/Result가 충분한가 · 다른 사람이 재현 가능한가 · 과장/위험 정보가 없는가 · 공개할 만한 학습 가치가 있는가</div><button class="button primary" type="submit">검수 요청 제출</button></form></section>`);
}

function renderAccount() {
  if (!isBackendConfigured()) return appShell(`<section class="section shell narrow">${backendNotice()}<div class="auth-gate"><h1>Backend 설정이 필요합니다.</h1><p>Supabase 연결 뒤 회원가입/로그인이 활성화됩니다.</p></div></section>`);
  if (!appState.user) {
    return appShell(`<section class="section shell auth-layout"><div class="auth-intro"><span class="eyebrow">ACCOUNT</span><h1>내 사례를 제출하고 검수 상태를 확인하세요.</h1><p>관리자도 같은 Supabase Auth를 사용합니다. 관리자 계정은 가입 후 DB의 <code>profiles.role</code>을 <code>admin</code>으로 승격합니다.</p></div><div class="auth-panels"><form id="loginForm" class="panel-form compact"><h2>로그인</h2><label>이메일<input name="email" type="email" autocomplete="email" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" minlength="8" required></label><button class="button primary" type="submit">로그인</button></form><form id="signupForm" class="panel-form compact"><h2>회원가입</h2><label>표시 이름<input name="displayName" minlength="2" maxlength="40" required></label><label>이메일<input name="email" type="email" autocomplete="email" required></label><label>비밀번호<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="button secondary" type="submit">회원가입</button><small>프로젝트의 이메일 확인 설정에 따라 확인 메일이 발송될 수 있습니다.</small></form></div></section>`);
  }
  return appShell(`<section class="page-hero shell"><span class="eyebrow">MY ACCOUNT</span><h1>${escapeHtml(appState.profile?.display_name || appState.user.email)}</h1><p>${escapeHtml(appState.user.email)} · 권한 ${escapeHtml(appState.profile?.role || 'user')}</p><div class="hero-actions"><a class="button primary" href="#/submit">새 사례 제출</a>${appState.profile?.role === 'admin' ? '<a class="button secondary" href="#/admin">관리자 검수</a>' : ''}<button id="logoutButton" class="button ghost" type="button">로그아웃</button></div></section><section class="section shell"><div class="section-heading"><div><span class="eyebrow">MY SUBMISSIONS</span><h2>내 제출 상태</h2></div></div><div id="mySubmissions" class="status-list"><div class="skeleton-line"></div></div></section>`);
}

function statusLabel(status) {
  return ({ pending:'검수 대기', published:'공개', archived:'보관', rejected:'폐기' })[status] || status;
}

function renderAdmin() {
  if (!appState.user) return appShell(`<section class="section shell narrow"><div class="auth-gate"><span class="eyebrow">ADMIN</span><h1>관리자 로그인</h1><p>관리자 ID는 Supabase Auth의 이메일 계정을 사용합니다.</p><form id="adminLoginForm" class="panel-form compact"><label>관리자 ID (이메일)<input name="email" type="email" required></label><label>비밀번호<input name="password" type="password" required></label><button class="button primary" type="submit">관리자 로그인</button></form></div></section>`);
  if (appState.profile?.role !== 'admin') return appShell(`<section class="section shell narrow"><div class="auth-gate"><span class="eyebrow">ADMIN</span><h1>관리자 권한이 없습니다.</h1><p>로그인은 되었지만 <code>profiles.role = admin</code>인 계정만 접근할 수 있습니다.</p><button id="logoutButton" class="button secondary" type="button">다른 계정으로 로그인</button></div></section>`);
  return appShell(`<section class="page-hero shell"><span class="eyebrow">MODERATION DESK</span><h1>프롬프트 사례 검수</h1><p>Prompt/Result·재현성·결과 품질·안전성·학습 가치를 확인하고 공개/보관/폐기를 결정합니다.</p></section><section class="section shell"><div class="admin-toolbar"><div class="segmented" id="adminStatus"><button class="active" data-status="pending">대기</button><button data-status="archived">보관</button><button data-status="published">공개</button><button data-status="rejected">폐기</button><button data-status="all">전체</button></div><button id="refreshAdmin" class="button ghost" type="button">새로고침</button></div><div id="adminQueue" class="admin-queue"><div class="skeleton-line"></div></div></section>`);
}

function notFound() {
  return appShell(`<section class="section shell narrow"><div class="empty-state"><h1>페이지를 찾을 수 없습니다.</h1><p>주소를 확인하거나 홈으로 이동하세요.</p><a class="button primary" href="#/home">홈으로</a></div></section>`);
}

async function render() {
  const route = routeName();
  let html;
  if (route === 'home') html = renderHome();
  else if (route === 'library') html = renderLibrary();
  else if (route === 'community') html = await renderCommunity();
  else if (route === 'submit') html = renderSubmit();
  else if (route === 'account') html = renderAccount();
  else if (route === 'admin') html = renderAdmin();
  else html = notFound();
  $('#app').innerHTML = html;
  markActiveNav(route);
  bindGlobal();
  if (route === 'library') initLibrary();
  if (route === 'community' && !routeParam()) initCommunity();
  if (route === 'submit') initSubmit();
  if (route === 'account') initAccount();
  if (route === 'admin') initAdmin();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function markActiveNav(route) {
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route));
}

function bindGlobal() {
  $('#themeButton')?.addEventListener('click', () => {
    const order = ['system','light','dark'];
    appState.theme = order[(order.indexOf(appState.theme) + 1) % order.length];
    localStorage.setItem('llmBibleTheme', appState.theme);
    applyTheme();
    toast(`테마: ${appState.theme}`);
  });
  $('#menuButton')?.addEventListener('click', (event) => {
    const nav = $('#mobileNav');
    const hidden = !nav.hidden;
    nav.hidden = hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!hidden));
  });
  $('[data-close-dialog]')?.addEventListener('click', () => $('#appDialog')?.close());
  $('#logoutButton')?.addEventListener('click', async () => {
    await signOut();
    toast('로그아웃했습니다.');
    location.hash = '#/home';
  });
  $$('[data-favorite]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.favorite;
    appState.favorites.has(id) ? appState.favorites.delete(id) : appState.favorites.add(id);
    localStorage.setItem('llmBibleFavorites', JSON.stringify([...appState.favorites]));
    render();
  }));
  $$('[data-curated-open]').forEach((button) => button.addEventListener('click', () => openCurated(button.dataset.curatedOpen)));
}

function openCurated(id) {
  const item = curated.knowledge.find((x) => x.id === id);
  if (!item) return;
  const dialog = $('#appDialog');
  $('#dialogBody').innerHTML = `<div class="detail-modal"><div class="card-topline"><span class="pill tier-${item.tier?.toLowerCase()}">Tier ${escapeHtml(item.tier)}</span><span>검증 ${escapeHtml(item.freshness)}</span></div><p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2><p class="lead">${escapeHtml(item.summary)}</p><div class="detail-block"><h3>핵심</h3><p>${escapeHtml(item.insight)}</p></div><div class="before-after"><div><span>BEFORE</span><p>${escapeHtml(item.before)}</p></div><div><span>AFTER</span><p>${escapeHtml(item.after)}</p></div></div>${item.code ? `<div class="detail-block"><h3>예시</h3><pre>${escapeHtml(item.code)}</pre></div>` : ''}<div class="detail-block"><h3>근거 메모</h3><p>${escapeHtml(item.evidence)}</p></div><div class="metric-row">${(item.metrics || []).map((m) => `<span>${escapeHtml(m)}</span>`).join('')}</div></div>`;
  dialog.showModal();
}

function initLibrary() {
  const categories = ['전체', ...new Set(curated.knowledge.map((x) => x.category))];
  const state = { q:'', category:'전체', evidence:'all', favoritesOnly:false };
  $('#categoryFilters').innerHTML = categories.map((x, i) => `<button type="button" class="filter-chip ${i === 0 ? 'active' : ''}" data-category="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('');
  const draw = () => {
    const q = state.q.toLowerCase();
    const items = curated.knowledge.filter((item) => {
      const text = [item.title,item.summary,item.category,...(item.tags || [])].join(' ').toLowerCase();
      return (!q || text.includes(q)) && (state.category === '전체' || item.category === state.category) && (state.evidence === 'all' || item.tier === state.evidence) && (!state.favoritesOnly || appState.favorites.has(item.id));
    });
    $('#knowledgeGrid').innerHTML = items.map(curatedCard).join('');
    $('#libraryCount').textContent = `${items.length}개 항목`;
    $('#libraryEmpty').hidden = Boolean(items.length);
    $$('[data-curated-open]').forEach((b) => b.addEventListener('click', () => openCurated(b.dataset.curatedOpen)));
    $$('[data-favorite]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.favorite; appState.favorites.has(id) ? appState.favorites.delete(id) : appState.favorites.add(id);
      localStorage.setItem('llmBibleFavorites', JSON.stringify([...appState.favorites])); draw();
    }));
  };
  $('#librarySearch').addEventListener('input', debounce((e) => { state.q = e.target.value.trim(); draw(); }));
  $('#categoryFilters').addEventListener('click', (e) => { const b = e.target.closest('[data-category]'); if (!b) return; state.category = b.dataset.category; $$('.filter-chip').forEach((x) => x.classList.toggle('active', x === b)); draw(); });
  $('#evidenceFilter').addEventListener('change', (e) => { state.evidence = e.target.value; draw(); });
  $('#favoriteOnly').addEventListener('change', (e) => { state.favoritesOnly = e.target.checked; draw(); });
  $('#resetLibrary').addEventListener('click', () => { state.q=''; state.category='전체'; state.evidence='all'; state.favoritesOnly=false; $('#librarySearch').value=''; $('#evidenceFilter').value='all'; $('#favoriteOnly').checked=false; $$('.filter-chip').forEach((x) => x.classList.toggle('active', x.dataset.category === '전체')); draw(); });
  draw();
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  if (params.get('open')) openCurated(params.get('open'));
}

function initCommunity() {
  const load = debounce(async () => {
    const grid = $('#communityGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="skeleton-line"></div>';
    try {
      const items = await listPublishedSubmissions({ query: $('#communitySearch').value, category: $('#communityCategory').value });
      grid.innerHTML = items.map(communityCard).join('') || '<div class="empty-state wide"><h3>조건에 맞는 사례가 없습니다.</h3></div>';
    } catch (e) { grid.innerHTML = `<div class="callout danger">${escapeHtml(e.message)}</div>`; }
  }, 220);
  $('#communitySearch')?.addEventListener('input', load);
  $('#communityCategory')?.addEventListener('change', load);
}

function initSubmit() {
  const input = $('#mediaInput');
  input?.addEventListener('change', () => {
    const files = [...input.files].slice(0, APP_CONFIG.maxMediaCount);
    if (input.files.length > APP_CONFIG.maxMediaCount) toast(`미디어는 최대 ${APP_CONFIG.maxMediaCount}개까지 가능합니다.`, 'warning');
    $('#mediaSelection').innerHTML = files.map((file) => `<span class="file-chip">${escapeHtml(file.name)} · ${formatBytes(file.size)}</span>`).join('');
  });
  $('#submissionForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const files = [...$('#mediaInput').files].slice(0, APP_CONFIG.maxMediaCount);
    setBusy(button, true, '변환·업로드 중…');
    const progress = $('#conversionProgress');
    const progressText = $('#progressText');
    const progressBar = $('#progressBar');
    progress.hidden = false;
    try {
      const normalized = [];
      for (let i = 0; i < files.length; i += 1) {
        progressText.textContent = `${i + 1}/${files.length} ${files[i].name} 변환 중…`;
        progressBar.style.width = `${Math.round((i / Math.max(1, files.length)) * 100)}%`;
        const result = await normalizeMedia(files[i], (p) => {
          const combined = ((i + p) / Math.max(1, files.length)) * 100;
          progressBar.style.width = `${Math.round(combined)}%`;
        });
        result.altText = `${form.title.value} 예시 ${i + 1}`;
        normalized.push(result);
      }
      const payload = {
        title: form.title.value,
        category: form.category.value,
        summary: form.summary.value,
        promptText: form.promptText.value,
        resultText: form.resultText.value,
        modelName: form.modelName.value,
        modelVersion: form.modelVersion.value,
        sourceNotes: form.sourceNotes.value
      };
      progressText.textContent = '비공개 검수함에 업로드 중…';
      await createSubmission(payload, normalized, ({ index, total }) => {
        progressBar.style.width = `${Math.round(((index + 0.5) / Math.max(1, total)) * 100)}%`;
      });
      progressBar.style.width = '100%';
      progressText.textContent = '제출 완료';
      toast('검수 요청을 제출했습니다.', 'success');
      location.hash = '#/account';
    } catch (e) {
      toast(e.message, 'danger');
      progressText.textContent = e.message;
    } finally { setBusy(button, false); }
  });
}

function initAccount() {
  $('#loginForm')?.addEventListener('submit', handleLogin);
  $('#signupForm')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); setBusy(button, true);
    const f = event.currentTarget;
    try { const data = await signUp({ email:f.email.value, password:f.password.value, displayName:f.displayName.value }); toast(data.session ? '회원가입되었습니다.' : '회원가입되었습니다. 이메일 확인이 필요할 수 있습니다.', 'success'); await refreshAuth(); await render(); }
    catch (e) { toast(e.message, 'danger'); } finally { setBusy(button, false); }
  });
  if (appState.user) loadMySubmissions();
}

async function handleLogin(event) {
  event.preventDefault(); const button = event.currentTarget.querySelector('button'); setBusy(button, true);
  const f = event.currentTarget;
  try { await signIn({ email:f.email.value, password:f.password.value }); await refreshAuth(); toast('로그인했습니다.', 'success'); await render(); }
  catch (e) { toast(e.message, 'danger'); } finally { setBusy(button, false); }
}

async function loadMySubmissions() {
  const root = $('#mySubmissions'); if (!root || !appState.user) return;
  try {
    const items = await listMySubmissions(appState.user.id);
    root.innerHTML = items.map((x) => `<article class="status-row"><div><span class="status status-${x.status}">${statusLabel(x.status)}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.category)} · 제출 ${formatDateTime(x.created_at)}${x.reviewed_at ? ` · 검수 ${formatDateTime(x.reviewed_at)}` : ''}</p>${x.moderation_note ? `<small>관리자 메모: ${escapeHtml(x.moderation_note)}</small>` : ''}</div>${x.status === 'published' && x.slug ? `<a class="button ghost small" href="#/community/${encodeURIComponent(x.slug)}">공개 페이지</a>` : ''}</article>`).join('') || '<div class="empty-state"><p>아직 제출한 사례가 없습니다.</p></div>';
  } catch (e) { root.innerHTML = `<div class="callout danger">${escapeHtml(e.message)}</div>`; }
}

function initAdmin() {
  $('#adminLoginForm')?.addEventListener('submit', handleLogin);
  if (appState.profile?.role !== 'admin') return;
  let currentStatus = 'pending';
  const load = async () => {
    const root = $('#adminQueue'); root.innerHTML = '<div class="skeleton-line"></div>';
    try {
      const items = await listModerationQueue(currentStatus);
      root.innerHTML = items.map(adminCard).join('') || '<div class="empty-state"><h3>검수할 항목이 없습니다.</h3></div>';
      $$('[data-review-id]').forEach((b) => b.addEventListener('click', () => openAdminReview(items.find((x) => x.id === b.dataset.reviewId))));
    } catch (e) { root.innerHTML = `<div class="callout danger">${escapeHtml(e.message)}</div>`; }
  };
  $('#adminStatus')?.addEventListener('click', (e) => { const b=e.target.closest('[data-status]'); if(!b)return; currentStatus=b.dataset.status; $$('#adminStatus button').forEach((x)=>x.classList.toggle('active',x===b)); load(); });
  $('#refreshAdmin')?.addEventListener('click', load);
  load();
}

function adminCard(item) {
  return `<article class="admin-card"><div><div class="card-topline"><span class="status status-${item.status}">${statusLabel(item.status)}</span><span>${formatDateTime(item.created_at)}</span></div><p class="card-category">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><div class="card-meta"><span>${escapeHtml(item.model_name || '-')} ${escapeHtml(item.model_version || '')}</span><span>by ${escapeHtml(item.author_display_name || '-')}</span><span>미디어 ${(item.media || []).length}개</span></div></div><button class="button secondary" type="button" data-review-id="${item.id}">검수 열기</button></article>`;
}

function openAdminReview(item) {
  if (!item) return;
  const media = (item.media || []).map((m) => m.previewUrl ? (m.kind === 'video' ? `<video controls src="${escapeHtml(m.previewUrl)}"></video>` : `<img src="${escapeHtml(m.previewUrl)}" alt="검수 미디어">`) : '<div class="media-error">미리보기 실패</div>').join('');
  const dialog = $('#appDialog');
  $('#dialogBody').innerHTML = `<div class="admin-review"><div class="card-topline"><span class="status status-${item.status}">${statusLabel(item.status)}</span><span>${formatDateTime(item.created_at)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><dl class="meta-list"><div><dt>작성자</dt><dd>${escapeHtml(item.author_display_name || '-')}</dd></div><div><dt>모델</dt><dd>${escapeHtml(item.model_name || '-')} ${escapeHtml(item.model_version || '')}</dd></div><div><dt>카테고리</dt><dd>${escapeHtml(item.category)}</dd></div></dl><div class="prompt-result-grid"><section><span class="eyebrow">PROMPT</span><pre>${escapeHtml(item.prompt_text)}</pre></section><section><span class="eyebrow">RESULT</span><pre>${escapeHtml(item.result_text)}</pre></section></div>${item.source_notes ? `<div class="detail-block"><h3>재현·출처 메모</h3><p>${escapeHtml(item.source_notes)}</p></div>` : ''}${media ? `<div class="media-gallery review-media">${media}</div>` : ''}<form id="reviewForm" class="review-form"><h3>검수 점수</h3><div class="score-grid">${scoreField('clarity','명확성')}${scoreField('reproducibility','재현성')}${scoreField('resultQuality','결과 품질')}${scoreField('safety','안전성')}${scoreField('learningValue','학습 가치')}</div><label>관리자 메모<textarea name="note" rows="3" maxlength="2000" placeholder="작성자에게 남길 사유 또는 내부 검수 메모"></textarea></label><div class="review-actions"><button class="button success" type="button" data-action="publish">공개 승인</button><button class="button secondary" type="button" data-action="archive">보관만</button><button class="button danger" type="button" data-action="reject">폐기</button></div><small>공개 승인 시 미디어가 공개 버킷으로 복사되고, 폐기 시 비공개 미디어 파일은 삭제됩니다. 결정 이력은 moderation_events에 남습니다.</small></form></div>`;
  dialog.showModal();
  $$('[data-action]', $('#reviewForm')).forEach((button) => button.addEventListener('click', async () => {
    const form = $('#reviewForm');
    const action = button.dataset.action;
    if (action === 'reject' && !confirm('폐기하면 비공개 미디어 파일이 삭제됩니다. 계속할까요?')) return;
    const review = { note: form.note.value.trim(), scores: {
      clarity:Number(form.clarity.value), reproducibility:Number(form.reproducibility.value), resultQuality:Number(form.resultQuality.value), safety:Number(form.safety.value), learningValue:Number(form.learningValue.value)
    }};
    setBusy(button, true);
    try { await moderateSubmission(item.id, action, review); toast(action === 'publish' ? '공개 승인했습니다.' : action === 'archive' ? '보관 처리했습니다.' : '폐기 처리했습니다.', 'success'); dialog.close(); initAdmin(); await render(); }
    catch (e) { toast(e.message, 'danger'); } finally { setBusy(button, false); }
  }));
}

function scoreField(name, label) {
  return `<label>${label}<select name="${name}">${[1,2,3,4,5].map((n) => `<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}</select></label>`;
}

async function refreshAuth() {
  try {
    const state = await getSessionState(); appState.user = state.user; appState.profile = state.profile;
  } catch (e) { appState.user = null; appState.profile = null; console.error(e); }
}

window.addEventListener('hashchange', render);
document.getElementById('skipToMain')?.addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.getElementById('main');
  if (!main) { location.hash = '#/home'; return; }
  main.setAttribute('tabindex', '-1');
  main.focus({ preventScroll: false });
});
await refreshAuth();
onAuthChange(async () => { if (appState.authBusy) return; appState.authBusy = true; await refreshAuth(); appState.authBusy = false; });
if (!location.hash || location.hash === '#app' || location.hash === '#main') {
  history.replaceState(null, '', `${location.pathname}${location.search}#/home`);
}
await render();
window.__LLM_BIBLE_BOOTED__ = true;
