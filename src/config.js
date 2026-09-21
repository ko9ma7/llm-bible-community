export const APP_CONFIG = Object.freeze({
  supabaseUrl: (window.__LLM_BIBLE_CONFIG__?.supabaseUrl || '').trim(),
  supabasePublishableKey: (window.__LLM_BIBLE_CONFIG__?.supabasePublishableKey || '').trim(),
  siteUrl: (window.__LLM_BIBLE_CONFIG__?.siteUrl || window.location.origin + window.location.pathname.replace(/index\.html$/, '')).replace(/\/$/, ''),
  repoName: (window.__LLM_BIBLE_CONFIG__?.repoName || 'llm-bible-community').trim(),
  maxImageBytes: 20 * 1024 * 1024,
  maxVideoBytes: 120 * 1024 * 1024,
  maxVideoDuration: 90,
  maxMediaCount: 5,
  imageLongEdge: 1920,
  imageQuality: 0.84
});

export const isBackendConfigured = () => Boolean(APP_CONFIG.supabaseUrl && APP_CONFIG.supabasePublishableKey && !APP_CONFIG.supabaseUrl.includes('YOUR_PROJECT'));
