import fs from 'node:fs';

export function loadDotEnv(path = '.env') {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const raw of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

export function publicConfig(env = {}) {
  return {
    supabaseUrl: env.VITE_SUPABASE_URL || '',
    supabasePublishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    siteUrl: (env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
    repoName: env.VITE_REPO_NAME || 'llm-bible-community'
  };
}

export function configScript(config) {
  return `window.__LLM_BIBLE_CONFIG__ = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
}

export function backendConfigured(config = {}) {
  const url = String(config.supabaseUrl || '').trim();
  const key = String(config.supabasePublishableKey || '').trim();
  if (!url || !key) return false;
  if (/YOUR_PROJECT|REPLACE_ME|example\.com/i.test(url)) return false;
  if (/REPLACE_ME|YOUR_|sb_publishable_REPLACE_ME/i.test(key)) return false;
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
}
