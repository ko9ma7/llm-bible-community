import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = path.join(root, 'supabase', 'research_seed.sql');
const catalogPath = path.join(root, 'public', 'data', 'catalog.json');
const outDir = path.join(root, 'supabase', 'seed-parts');

if (!fs.existsSync(sqlPath) || !fs.existsSync(catalogPath)) {
  console.error('Missing research_seed.sql or catalog.json.');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sql = fs.readFileSync(sqlPath, 'utf8').replace(/\r\n/g, '\n');
const mcpPath = path.join(root, 'research-source', 'mcp-starters.json');
const mcpRecords = fs.existsSync(mcpPath) ? JSON.parse(fs.readFileSync(mcpPath, 'utf8')) : [];
const q = (value) => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const qArray = (values=[]) => `array[${values.map(q).join(',')}]::text[]`;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Split on the next INSERT marker instead of semicolons, because prompt text may contain punctuation/newlines.
const starts = [...sql.matchAll(/^insert into public\./gm)].map(m => m.index);
const statements = [];
for (let i = 0; i < starts.length; i++) {
  const start = starts[i];
  const end = i + 1 < starts.length ? starts[i + 1] : sql.lastIndexOf('\ncommit;');
  const stmt = sql.slice(start, end).trim();
  if (stmt) statements.push(stmt);
}

const idToPart = new Map();
function registerCollection(key, prefix) {
  const col = catalog.collections[key];
  for (const cat of col.categories) {
    const dataPath = path.join(root, 'public', cat.file);
    const records = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const partName = `${prefix}-${cat.id}.sql`;
    for (const record of records) idToPart.set(`${key}:${record.id}`, partName);
  }
}
registerCollection('prompts', '10-prompt');
registerCollection('skills', '30-skill');
registerCollection('recipes', '50-recipe');
registerCollection('failures', '70-failure');

const groups = new Map();
function add(file, stmt) {
  if (!groups.has(file)) groups.set(file, []);
  groups.get(file).push(stmt);
}

for (const stmt of statements) {
  const table = stmt.match(/^insert into public\.([a-z_]+)/)?.[1];
  const id = stmt.match(/values\s*\(\s*'([^']+)'/i)?.[1];
  if (!table || !id) continue;
  if (table === 'sources') { add('00-sources.sql', stmt); continue; }
  const key = table === 'prompt_examples' ? 'prompts' : table === 'skills' ? 'skills' : table === 'agent_recipes' ? 'recipes' : table === 'failure_patterns' ? 'failures' : null;
  if (!key) continue;
  const part = idToPart.get(`${key}:${id}`);
  if (!part) throw new Error(`No seed part mapping for ${key}:${id}`);
  add(part, stmt);
}

for (const record of mcpRecords) {
  const file = `40-mcp-${record.category}.sql`;
  const stmt = `insert into public.mcp_patterns(id,slug,category,title,summary,when_to_use,avoid_when,starter_template,checklist,evidence_level,source_refs,last_verified,metadata) values (${q(record.id)},${q(record.slug)},${q(record.category)},${q(record.title)},${q(record.summary)},${q(record.when_to_use)},${q(record.avoid_when)},${q(record.starter_template)},${q(JSON.stringify(record.checklist||[]))}::jsonb,${q(record.evidence_level)},${qArray(record.source_refs||[])},${q(record.last_verified)}::date,${q(JSON.stringify({status:record.status||'starter'}))}::jsonb) on conflict(id) do update set slug=excluded.slug,category=excluded.category,title=excluded.title,summary=excluded.summary,when_to_use=excluded.when_to_use,avoid_when=excluded.avoid_when,starter_template=excluded.starter_template,checklist=excluded.checklist,evidence_level=excluded.evidence_level,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;`;
  add(file, stmt);
}

const entries = [];
for (const [file, stmts] of [...groups.entries()].sort(([a],[b]) => a.localeCompare(b))) {
  const collection = file.startsWith('00-') ? 'sources' : file.startsWith('10-') ? 'prompts' : file.startsWith('30-') ? 'skills' : file.startsWith('40-') ? 'mcp' : file.startsWith('50-') ? 'recipes' : 'failures';
  const content = [
    `-- LLM Bible v2.1.1 category seed: ${file}`,
    '-- Safe to re-run: ON CONFLICT DO UPDATE.',
    'begin;',
    ...stmts,
    'commit;',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(outDir, file), content, 'utf8');
  entries.push({ file, collection, count: stmts.length, bytes: Buffer.byteLength(content) });
}

const manifest = {
  version: '2.3.0',
  generated_at: new Date().toISOString(),
  note: 'Apply 00-sources.sql first. Other category seeds can be applied independently and re-run safely.',
  total_records: entries.reduce((n, x) => n + x.count, 0),
  parts: entries
};
fs.writeFileSync(path.join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`SQL seed parts generated: ${entries.length} files, ${manifest.total_records} records.`);
