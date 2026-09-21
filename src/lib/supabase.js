import { APP_CONFIG, isBackendConfigured } from '../config.js';

let client = null;

export function getSupabase() {
  if (!isBackendConfigured()) return null;
  if (client) return client;
  const createClient = window.supabase?.createClient;
  if (typeof createClient !== 'function') return null;
  client = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'llm-bible-auth'
    }
  });
  return client;
}
