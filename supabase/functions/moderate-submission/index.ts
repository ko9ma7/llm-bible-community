import { withSupabase } from 'npm:@supabase/server';

type ReviewScores = {
  clarity?: number;
  reproducibility?: number;
  resultQuality?: number;
  safety?: number;
  learningValue?: number;
};

type ModerationRequest = {
  submissionId?: string;
  action?: 'publish' | 'archive' | 'reject';
  review?: {
    note?: string;
    scores?: ReviewScores;
  };
};

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    try {
      const userId = String(ctx.userClaims?.sub || '');
      if (!userId) {
        return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
      }

      const admin = ctx.supabaseAdmin;
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== 'admin') {
        return Response.json({ ok: false, error: '관리자 권한이 없습니다.' }, { status: 403 });
      }

      const body = (await req.json()) as ModerationRequest;
      const submissionId = String(body.submissionId || '');
      const action = String(body.action || '');
      const review = body.review || {};
      if (!submissionId || !['publish', 'archive', 'reject'].includes(action)) {
        return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
      }

      const { data: submission, error: submissionError } = await admin
        .from('submissions')
        .select('id, author_id, status, media:submission_media(*)')
        .eq('id', submissionId)
        .single();
      if (submissionError || !submission) {
        return Response.json({ ok: false, error: '제출물을 찾을 수 없습니다.' }, { status: 404 });
      }

      const now = new Date().toISOString();
      const moderationNote = typeof review.note === 'string' ? review.note.slice(0, 2000) : '';
      const scores = sanitizeScores(review.scores);

      if (action === 'publish') {
        if (submission.status === 'rejected') {
          return Response.json({ ok: false, error: '폐기된 제출물은 바로 공개할 수 없습니다.' }, { status: 409 });
        }
        await publishSubmission(admin, submission, { userId, now, moderationNote, scores });
      }

      if (action === 'archive') {
        await archiveSubmission(admin, submission, { userId, now, moderationNote, scores });
      }

      if (action === 'reject') {
        await rejectSubmission(admin, submission, { userId, now, moderationNote, scores });
      }

      const { error: eventError } = await admin.from('moderation_events').insert({
        submission_id: submission.id,
        moderator_id: userId,
        action,
        note: moderationNote || null,
        scores
      });
      if (eventError) throw eventError;

      return Response.json({ ok: true, action, submissionId });
    } catch (error) {
      console.error(error);
      return Response.json(
        { ok: false, error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  })
};

async function publishSubmission(admin: any, submission: any, review: any) {
  const moves: Array<{ id: string; privatePath: string; publicPath: string }> = [];
  const uploadedPublicPaths: string[] = [];
  const updatedRows: Array<{ id: string; privatePath: string }> = [];

  try {
    // Stage every new public object first. The submission remains hidden until all stages succeed.
    for (const media of submission.media || []) {
      if (media.storage_bucket === 'published-media') continue;
      const { data: blob, error: downloadError } = await admin.storage
        .from('submission-inbox')
        .download(media.storage_path);
      if (downloadError || !blob) {
        throw new Error(`미디어 다운로드 실패: ${downloadError?.message || media.storage_path}`);
      }
      await assertMediaFormat(blob, media.mime_type);

      const publicPath = `${submission.id}/${fileName(media.storage_path)}`;
      const { error: uploadError } = await admin.storage
        .from('published-media')
        .upload(publicPath, blob, {
          contentType: media.mime_type,
          cacheControl: '31536000',
          upsert: true
        });
      if (uploadError) throw new Error(`공개 미디어 저장 실패: ${uploadError.message}`);

      uploadedPublicPaths.push(publicPath);
      moves.push({ id: media.id, privatePath: media.storage_path, publicPath });
    }

    for (const move of moves) {
      const { error } = await admin
        .from('submission_media')
        .update({ storage_bucket: 'published-media', storage_path: move.publicPath })
        .eq('id', move.id);
      if (error) throw error;
      updatedRows.push({ id: move.id, privatePath: move.privatePath });
    }

    const { error: submissionUpdateError } = await admin.from('submissions').update({
      status: 'published',
      moderation_note: review.moderationNote || null,
      review_scores: review.scores,
      reviewed_by: review.userId,
      reviewed_at: review.now,
      published_at: review.now
    }).eq('id', submission.id);
    if (submissionUpdateError) throw submissionUpdateError;
  } catch (error) {
    // Best-effort rollback: never intentionally leave a staged public object for an unpublished item.
    for (const row of updatedRows) {
      await admin.from('submission_media')
        .update({ storage_bucket: 'submission-inbox', storage_path: row.privatePath })
        .eq('id', row.id);
    }
    if (uploadedPublicPaths.length) {
      await admin.storage.from('published-media').remove(uploadedPublicPaths);
    }
    throw error;
  }

  // Private duplicates are harmless after publication; cleanup failure must not roll back a successful publish.
  const privatePaths = moves.map((move) => move.privatePath);
  if (privatePaths.length) {
    const { error } = await admin.storage.from('submission-inbox').remove(privatePaths);
    if (error) console.warn('Published successfully, but private duplicate cleanup failed:', error.message);
  }
}

async function archiveSubmission(admin: any, submission: any, review: any) {
  const moves: Array<{ id: string; publicPath: string; privatePath: string }> = [];

  // First ensure every currently public object has a private copy.
  for (const media of submission.media || []) {
    if (media.storage_bucket !== 'published-media') continue;
    const { data: blob, error: downloadError } = await admin.storage
      .from('published-media')
      .download(media.storage_path);
    if (downloadError || !blob) {
      throw new Error(`공개 미디어 회수 실패: ${downloadError?.message || media.storage_path}`);
    }

    const privatePath = `${submission.author_id}/${submission.id}/${fileName(media.storage_path)}`;
    const { error: uploadError } = await admin.storage
      .from('submission-inbox')
      .upload(privatePath, blob, {
        contentType: media.mime_type,
        cacheControl: '3600',
        upsert: true
      });
    if (uploadError) throw new Error(`비공개 미디어 저장 실패: ${uploadError.message}`);
    moves.push({ id: media.id, publicPath: media.storage_path, privatePath });
  }

  // Hide the submission before removing public objects. Retrying archive is safe if cleanup is interrupted.
  const { error: submissionUpdateError } = await admin.from('submissions').update({
    status: 'archived',
    moderation_note: review.moderationNote || null,
    review_scores: review.scores,
    reviewed_by: review.userId,
    reviewed_at: review.now,
    published_at: null
  }).eq('id', submission.id);
  if (submissionUpdateError) throw submissionUpdateError;

  for (const move of moves) {
    const { error: mediaUpdateError } = await admin
      .from('submission_media')
      .update({ storage_bucket: 'submission-inbox', storage_path: move.privatePath })
      .eq('id', move.id);
    if (mediaUpdateError) throw mediaUpdateError;
  }

  // Also remove a possible orphan created by a previous interrupted archive attempt.
  const publicCleanupPaths = new Set<string>();
  for (const media of submission.media || []) {
    publicCleanupPaths.add(
      media.storage_bucket === 'published-media'
        ? media.storage_path
        : `${submission.id}/${fileName(media.storage_path)}`
    );
  }
  if (publicCleanupPaths.size) {
    const { error } = await admin.storage.from('published-media').remove([...publicCleanupPaths]);
    if (error) throw new Error(`공개 미디어 삭제 실패: ${error.message}`);
  }
}

async function rejectSubmission(admin: any, submission: any, review: any) {
  // Hide first; if storage cleanup is interrupted the item is no longer discoverable and the action can be retried.
  const { error: submissionUpdateError } = await admin.from('submissions').update({
    status: 'rejected',
    moderation_note: review.moderationNote || null,
    review_scores: review.scores,
    reviewed_by: review.userId,
    reviewed_at: review.now,
    published_at: null
  }).eq('id', submission.id);
  if (submissionUpdateError) throw submissionUpdateError;

  const inboxPaths = new Set<string>();
  const publicPaths = new Set<string>();
  for (const media of submission.media || []) {
    const name = fileName(media.storage_path);
    inboxPaths.add(
      media.storage_bucket === 'submission-inbox'
        ? media.storage_path
        : `${submission.author_id}/${submission.id}/${name}`
    );
    publicPaths.add(
      media.storage_bucket === 'published-media'
        ? media.storage_path
        : `${submission.id}/${name}`
    );
  }

  if (inboxPaths.size) {
    const { error } = await admin.storage.from('submission-inbox').remove([...inboxPaths]);
    if (error) throw new Error(`비공개 미디어 삭제 실패: ${error.message}`);
  }
  if (publicPaths.size) {
    const { error } = await admin.storage.from('published-media').remove([...publicPaths]);
    if (error) throw new Error(`공개 미디어 삭제 실패: ${error.message}`);
  }

  const { error: mediaDeleteError } = await admin
    .from('submission_media')
    .delete()
    .eq('submission_id', submission.id);
  if (mediaDeleteError) throw mediaDeleteError;
}

async function assertMediaFormat(blob: Blob, mimeType: string) {
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (mimeType === 'image/webp') {
    const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (!riff || !webp) throw new Error('WebP로 검증되지 않은 이미지가 포함되어 있어 공개할 수 없습니다.');
    return;
  }
  if (mimeType === 'video/webm') {
    const ebml = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    if (!ebml) throw new Error('WebM/EBML로 검증되지 않은 영상이 포함되어 있어 공개할 수 없습니다.');
    return;
  }
  throw new Error('허용되지 않은 미디어 MIME 형식입니다.');
}

function fileName(path: string) {
  return path.split('/').filter(Boolean).pop() || 'media';
}

function sanitizeScores(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const key of ['clarity', 'reproducibility', 'resultQuality', 'safety', 'learningValue']) {
    const number = Number(source[key]);
    if (Number.isFinite(number)) out[key] = Math.max(1, Math.min(5, Math.round(number)));
  }
  return Object.keys(out).length ? out : null;
}
