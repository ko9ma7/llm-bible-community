const catalog = window.LLM_BIBLE_CATALOG || {
  meta: {}, modes: [], curriculum: [], patterns: [], comparisons: { tool_types: [], decision: [] },
  models: [], eval_metrics: [], freshness_policy: [], source_tiers: [], collections: {}
};

const jsonCache = new Map();
const recordCache = new Map();

function urlFor(relativePath) {
  return new URL(relativePath, document.baseURI).href;
}

export async function loadJson(relativePath) {
  if (!relativePath) throw new Error('데이터 파일 경로가 없습니다.');
  if (jsonCache.has(relativePath)) return jsonCache.get(relativePath);
  const promise = fetch(urlFor(relativePath), { cache: 'default' }).then(async (response) => {
    if (!response.ok) throw new Error(`데이터 로드 실패 (${response.status}) · ${relativePath}`);
    return response.json();
  });
  jsonCache.set(relativePath, promise);
  try { return await promise; }
  catch (error) { jsonCache.delete(relativePath); throw error; }
}

export function getCatalog() { return catalog; }
export function getCollection(name) { return catalog.collections?.[name] || { total: 0, categories: [] }; }
export function getCategory(name, id) { return getCollection(name).categories?.find((x) => x.id === id) || null; }

export async function loadCategory(name, id) {
  const category = getCategory(name, id);
  if (!category) throw new Error(`알 수 없는 카테고리: ${name}/${id}`);
  const items = await loadJson(category.file);
  for (const item of items) recordCache.set(`${name}:${item.id}`, item);
  return items;
}

export async function loadCollectionIndex(name) {
  const collection = getCollection(name);
  return collection.index ? loadJson(collection.index) : [];
}

export async function loadSources() {
  const file = getCollection('sources').file || 'data/sources.json';
  const sources = await loadJson(file);
  return sources;
}

export async function resolveRecord(type, id, hintShard = '') {
  const name = ({ prompt: 'prompts', skill: 'skills', recipe: 'recipes', failure: 'failures' })[type];
  if (!name) return null;
  const cached = recordCache.get(`${name}:${id}`);
  if (cached) return cached;

  if (hintShard) {
    const items = await loadJson(hintShard);
    for (const item of items) recordCache.set(`${name}:${item.id}`, item);
    const found = recordCache.get(`${name}:${id}`);
    if (found) return found;
  }

  const index = await loadCollectionIndex(name);
  const meta = index.find((x) => x.id === id);
  if (!meta?.shard) return null;
  const items = await loadJson(meta.shard);
  for (const item of items) recordCache.set(`${name}:${item.id}`, item);
  return recordCache.get(`${name}:${id}`) || null;
}

export function dataStats() {
  return {
    jsonCacheEntries: jsonCache.size,
    recordCacheEntries: recordCache.size
  };
}
