import { APP_CONFIG } from '../config.js';
import { formatBytes } from './utils.js';

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, image: img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 파일을 읽지 못했습니다.')); };
    img.src = url;
  });
}

export async function convertImageToWebp(file) {
  if (file.size > APP_CONFIG.maxImageBytes) throw new Error(`이미지는 ${formatBytes(APP_CONFIG.maxImageBytes)} 이하여야 합니다.`);
  const { width, height, image, url } = await readImageDimensions(file);
  const scale = Math.min(1, APP_CONFIG.imageLongEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d', { alpha: true });
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  URL.revokeObjectURL(url);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', APP_CONFIG.imageQuality));
  if (!blob) throw new Error('이 브라우저에서 WebP 변환에 실패했습니다.');
  return { blob, extension:'webp', mimeType:'image/webp', kind:'image', width:targetWidth, height:targetHeight, durationSeconds:null };
}

function loadVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.onloadedmetadata = () => resolve({ video, url, duration:video.duration, width:video.videoWidth, height:video.videoHeight });
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('영상 파일을 읽지 못했습니다.')); };
    video.src = url;
  });
}

function preferredWebmMime() {
  if (!window.MediaRecorder) return null;
  const candidates = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || null;
}

export async function convertVideoToWebm(file, onProgress) {
  if (file.size > APP_CONFIG.maxVideoBytes) throw new Error(`영상은 원본 기준 ${formatBytes(APP_CONFIG.maxVideoBytes)} 이하여야 합니다.`);
  const meta = await loadVideo(file);
  const { video, url } = meta;
  try {
    if (!Number.isFinite(meta.duration) || meta.duration <= 0 || meta.duration > APP_CONFIG.maxVideoDuration) throw new Error(`영상은 ${APP_CONFIG.maxVideoDuration}초 이하여야 합니다.`);
    if (file.type === 'video/webm') {
      return { blob:file, extension:'webm', mimeType:'video/webm', kind:'video', width:meta.width, height:meta.height, durationSeconds:meta.duration };
    }

    const mimeType = preferredWebmMime();
    if (!mimeType) throw new Error('현재 브라우저가 WebM 녹화 변환을 지원하지 않습니다. Chrome·Edge·Firefox 최신 버전에서 다시 시도해 주세요.');

    const scale = Math.min(1, 1280 / Math.max(meta.width, meta.height));
    const width = Math.max(2, Math.round(meta.width * scale / 2) * 2);
    const height = Math.max(2, Math.round(meta.height * scale / 2) * 2);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha:false });
    const canvasStream = canvas.captureStream(30);

    // captureStream is used only for decoded audio tracks; video comes from the scaled canvas.
    let sourceStream = null;
    if (typeof video.captureStream === 'function') sourceStream = video.captureStream();
    else if (typeof video.mozCaptureStream === 'function') sourceStream = video.mozCaptureStream();
    const tracks = [...canvasStream.getVideoTracks(), ...(sourceStream?.getAudioTracks() || [])];
    const outputStream = new MediaStream(tracks);
    const recorder = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 1_600_000, audioBitsPerSecond: 96_000 });
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(recorder.error || new Error('WebM 변환 중 오류가 발생했습니다.'));
    });

    let cancelled = false;
    const draw = () => {
      if (cancelled || video.ended || video.paused) return;
      ctx.drawImage(video, 0, 0, width, height);
      onProgress?.(Math.max(0, Math.min(1, video.currentTime / meta.duration)));
      if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(draw);
      else requestAnimationFrame(draw);
    };

    video.currentTime = 0;
    video.muted = true;
    recorder.start(1000);
    await video.play();
    draw();
    await new Promise((resolve, reject) => {
      video.onended = resolve;
      video.onerror = () => reject(new Error('영상 재생 중 오류가 발생했습니다.'));
    });
    cancelled = true;
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    outputStream.getTracks().forEach((track) => track.stop());
    onProgress?.(1);
    const blob = new Blob(chunks, { type:'video/webm' });
    if (!blob.size) throw new Error('WebM 결과 파일이 비어 있습니다.');
    return { blob, extension:'webm', mimeType:'video/webm', kind:'video', width, height, durationSeconds:meta.duration };
  } finally {
    video.pause();
    URL.revokeObjectURL(url);
  }
}

export async function normalizeMedia(file, onProgress) {
  if (file.type.startsWith('image/')) return convertImageToWebp(file);
  if (file.type.startsWith('video/')) return convertVideoToWebm(file, onProgress);
  throw new Error('이미지 또는 영상 파일만 업로드할 수 있습니다.');
}
