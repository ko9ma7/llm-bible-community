import { getSupabase } from './supabase.js';
import { APP_CONFIG, isBackendConfigured } from '../config.js';
import { randomId, slugify } from './utils.js';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new Error(isBackendConfigured() ? 'Supabase SDK를 불러오지 못했습니다. 네트워크/CDN 상태를 확인해 주세요.' : 'Supabase가 아직 설정되지 않았습니다. README의 Backend Setup을 완료해 주세요.');
  return client;
}

function isMissingSchemaError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return code === '42P01' || code === 'PGRST205' || /relation .* does not exist|Could not find the table|schema cache/i.test(message);
}

function fallbackProfile(user) {
  const emailName = String(user?.email || '').split('@')[0];
  const metaName = String(user?.user_metadata?.display_name || '').trim();
  return {
    id: user?.id || '',
    display_name: metaName || emailName || '회원',
    role: 'user',
    created_at: user?.created_at || null,
    _fallback: true
  };
}

export async function getBackendDiagnostics() {
  if (!isBackendConfigured()) return { configured: false, authReachable: false, schemaReady: false, detail: 'browser config missing' };
  const supabase = getSupabase();
  if (!supabase) return { configured: true, authReachable: false, schemaReady: false, detail: 'Supabase SDK unavailable' };
  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) return { configured: true, authReachable: false, schemaReady: false, detail: authError.message };
    const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) {
      if (isMissingSchemaError(error)) return { configured: true, authReachable: true, schemaReady: false, detail: 'LLM Bible schema not installed' };
      return { configured: true, authReachable: true, schemaReady: false, detail: error.message };
    }
    return { configured: true, authReachable: true, schemaReady: true, detail: 'ready' };
  } catch (error) {
    return { configured: true, authReachable: false, schemaReady: false, detail: error.message };
  }
}

export async function getSessionState() {
  const supabase = getSupabase();
  if (!supabase) return { user: null, profile: null };
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) return { user: null, profile: null };
  const user = session.user;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    if (isMissingSchemaError(profileError)) return { user, profile: fallbackProfile(user) };
    throw profileError;
  }
  if (profile) return { user, profile };

  // Existing Auth users created before the LLM Bible trigger can bootstrap their own normal profile.
  const candidate = fallbackProfile(user);
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: user.id, display_name: candidate.display_name.slice(0, 40), role: 'user' })
    .select('id, display_name, role, created_at')
    .maybeSingle();
  if (insertError) return { user, profile: candidate };
  return { user, profile: inserted || candidate };
}

export function onAuthChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return { unsubscribe() {} };
  const { data } = supabase.auth.onAuthStateChange(() => callback());
  return data.subscription;
}

export async function signUp({ email, password, displayName }) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${APP_CONFIG.siteUrl}/#/account`
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = requireClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function listPublishedSubmissions({ query = '', category = 'all', limit = 48 } = {}) {
  if (!isBackendConfigured()) return [];
  const supabase = requireClient();
  let request = supabase
    .from('submissions')
    .select(`id, slug, title, category, summary, prompt_text, result_text, model_name, model_version, source_notes, published_at, created_at,
      author_display_name,
      media:submission_media(id, kind, storage_bucket, storage_path, mime_type, width, height, duration_seconds, alt_text, sort_order)`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (category !== 'all') request = request.eq('category', category);
  if (query.trim()) {
    const safe = query.trim().replace(/[^\p{L}\p{N}\s._-]/gu, ' ');
    request = request.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%,prompt_text.ilike.%${safe}%`);
  }
  const { data, error } = await request;
  if (error) throw error;
  return (data || []).map(withPublicMediaUrl);
}

export async function getPublishedSubmission(slugOrId) {
  if (!isBackendConfigured()) return null;
  const supabase = requireClient();
  let request = supabase
    .from('submissions')
    .select(`*, media:submission_media(*)`)
    .eq('status', 'published');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
  request = isUuid ? request.eq('id', slugOrId) : request.eq('slug', slugOrId);
  const { data, error } = await request.maybeSingle();
  if (error) throw error;
  return data ? withPublicMediaUrl(data) : null;
}

function withPublicMediaUrl(item) {
  const supabase = getSupabase();
  return {
    ...item,
    media: [...(item.media || [])]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((media) => ({
        ...media,
        publicUrl: media.storage_bucket === 'published-media'
          ? supabase.storage.from('published-media').getPublicUrl(media.storage_path).data.publicUrl
          : null
      }))
  };
}

export async function listMySubmissions(userId) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('submissions')
    .select('id, title, category, status, created_at, reviewed_at, moderation_note, published_at, slug')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSubmission(payload, normalizedMedia = [], onUploadProgress) {
  const supabase = requireClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('로그인이 필요합니다.');

  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({
      author_id: user.id,
      title: payload.title.trim(),
      category: payload.category,
      summary: payload.summary.trim(),
      prompt_text: payload.promptText.trim(),
      result_text: payload.resultText.trim(),
      model_name: payload.modelName.trim(),
      model_version: payload.modelVersion.trim() || null,
      source_notes: payload.sourceNotes.trim() || null,
      status: 'pending',
      slug: `${slugify(payload.title)}-${randomId().slice(0, 8)}`
    })
    .select('id')
    .single();
  if (insertError) throw insertError;

  const uploadedPaths = [];
  try {
    const mediaRows = [];
    for (let i = 0; i < normalizedMedia.length; i += 1) {
      const media = normalizedMedia[i];
      const path = `${user.id}/${submission.id}/${String(i + 1).padStart(2, '0')}-${randomId()}.${media.extension}`;
      onUploadProgress?.({ index: i, total: normalizedMedia.length, phase: 'uploading' });
      const { error: uploadError } = await supabase.storage
        .from('submission-inbox')
        .upload(path, media.blob, { contentType: media.mimeType, upsert: false, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      mediaRows.push({
        submission_id: submission.id,
        author_id: user.id,
        kind: media.kind,
        storage_bucket: 'submission-inbox',
        storage_path: path,
        mime_type: media.mimeType,
        bytes: media.blob.size,
        width: media.width,
        height: media.height,
        duration_seconds: media.durationSeconds,
        alt_text: media.altText || null,
        sort_order: i
      });
    }
    if (mediaRows.length) {
      const { error: mediaError } = await supabase.from('submission_media').insert(mediaRows);
      if (mediaError) throw mediaError;
    }
    return submission.id;
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from('submission-inbox').remove(uploadedPaths).catch(() => {});
    await supabase.from('submissions').delete().eq('id', submission.id).catch(() => {});
    throw error;
  }
}

export async function listModerationQueue(status = 'pending') {
  const supabase = requireClient();
  let request = supabase
    .from('submissions')
    .select(`*, media:submission_media(*)`)
    .order('created_at', { ascending: true })
    .limit(100);
  if (status !== 'all') request = request.eq('status', status);
  const { data, error } = await request;
  if (error) throw error;
  const items = data || [];
  for (const item of items) {
    for (const media of item.media || []) {
      if (media.storage_bucket === 'submission-inbox') {
        const { data: signed, error: signedError } = await supabase.storage
          .from('submission-inbox')
          .createSignedUrl(media.storage_path, 900);
        media.previewUrl = signedError ? null : signed.signedUrl;
      } else if (media.storage_bucket === 'published-media') {
        media.previewUrl = supabase.storage.from('published-media').getPublicUrl(media.storage_path).data.publicUrl;
      }
    }
  }
  return items;
}

export async function moderateSubmission(submissionId, action, review) {
  const supabase = requireClient();
  const { data, error } = await supabase.functions.invoke('moderate-submission', {
    body: { submissionId, action, review }
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || '관리자 처리에 실패했습니다.');
  return data;
}

export { isBackendConfigured, APP_CONFIG };
