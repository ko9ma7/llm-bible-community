import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'index.html','src/main.js','src/styles.css','src/lib/repository.js','src/lib/media.js','src/lib/data.js',
  'supabase/schema.sql','supabase/research_seed.sql','supabase/functions/moderate-submission/index.ts',
  'research-source/research-corpus.json','scripts/generate-corpus-shards.mjs','scripts/generate-seed-parts.mjs','seed-category.cmd','scripts/seed-category.ps1',
  'public/data/catalog.js','public/data/catalog.json','public/data/MANIFEST.json','public/data/index/prompts.json','public/data/index/skills.json','public/data/index/mcp.json','public/data/index/recipes.json','public/data/index/failures.json','public/data/sources.json',
  'public/research/deep-research-report-2026-09-21.md','public/manifest.webmanifest','public/404.html','.github/workflows/deploy.yml','verify-backend.cmd','setup-permissions.cmd','scripts/setup-permissions.ps1','PERMISSIONS.md','research-source/mcp-starters.json'
];
let failed = false;
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`[missing] ${file}`);
    failed = true;
  }
}

const scanExt = new Set(['.js','.mjs','.ts','.html','.css','.md','.sql','.yml','.yaml','.json','.txt','.ps1','.cmd']);
const secretPatterns = [
  /sb_secret_[A-Za-z0-9_-]{10,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/
];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','dist','.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (scanExt.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      for (const pattern of secretPatterns) {
        if (pattern.test(text) && !full.endsWith('SECURITY.md') && !full.endsWith('ADMIN_SETUP.md') && !full.endsWith('README.md') && !full.endsWith('schema.sql') && !full.endsWith('index.ts') && !full.endsWith('check.mjs')) {
          console.error(`[possible secret/token reference] ${path.relative(root, full)} matched ${pattern}`);
          failed = true;
        }
      }
    }
  }
}
walk(root);

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('meta name="description"') || !index.includes('og:image') || !index.includes('manifest.webmanifest')) {
  console.error('[metadata] index.html is missing required SEO/social metadata.');
  failed = true;
}

const mainJs = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
if (/import\s+['"]\.\/styles\.css['"]/.test(mainJs)) {
  console.error('[browser modules] src/main.js imports CSS directly. GitHub Pages serves native ES modules and cannot execute CSS as JavaScript. Use a <link rel=\"stylesheet\"> in index.html instead.');
  failed = true;
}
if (!index.includes('rel=\"stylesheet\"') || !index.includes('./src/styles.css')) {
  console.error('[styles] index.html must load ./src/styles.css with a stylesheet link.');
  failed = true;
}

// Validate the canonical research corpus and the generated catalog/shards.
const corpusPath = path.join(root, 'research-source/research-corpus.json');
if (!fs.existsSync(corpusPath)) {
  console.error('[corpus] research-source/research-corpus.json is missing.');
  failed = true;
} else {
  try {
    const data = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
    const expected = { prompts: 240, skills: 120, recipes: 50, failures: 30, sources: 41 };
    for (const [key, min] of Object.entries(expected)) {
      if (!Array.isArray(data[key]) || data[key].length < min) {
        console.error(`[corpus] ${key} must contain at least ${min} records.`);
        failed = true;
      }
    }
    if (!Array.isArray(data.curriculum) || data.curriculum.length < 18) { console.error('[corpus] curriculum must contain at least 18 stages.'); failed = true; }
    if (!Array.isArray(data.modes) || data.modes.length < 6) { console.error('[corpus] modes must contain Quick/Precise/Grounded/Deep/Agent/Safe.'); failed = true; }
    if (!Array.isArray(data.eval_metrics) || data.eval_metrics.length < 10) { console.error('[corpus] eval_metrics is incomplete.'); failed = true; }
    if (!Array.isArray(data.freshness_policy) || data.freshness_policy.length < 8) { console.error('[corpus] freshness_policy is incomplete.'); failed = true; }
    for (const item of data.prompts || []) {
      for (const field of ['id','pattern','domain','title','prompt_text','bad_example','better_example','best_example','why_it_works','measurement_status','last_verified']) {
        if (typeof item?.[field] !== 'string' || !item[field].trim()) { console.error(`[corpus] prompt ${item?.id || '?'} missing ${field}`); failed = true; }
      }
    }
  } catch (error) {
    console.error(`[corpus] invalid canonical JSON: ${error.message}`);
    failed = true;
  }
}

const mcpSourcePath = path.join(root, 'research-source/mcp-starters.json');
if (!fs.existsSync(mcpSourcePath)) { console.error('[mcp] starter source missing.'); failed = true; }
else { try { const mcp=JSON.parse(fs.readFileSync(mcpSourcePath,'utf8')); if(!Array.isArray(mcp)||mcp.length<72){console.error('[mcp] expected at least 72 starter records.');failed=true;} } catch(error){console.error(`[mcp] invalid starter JSON: ${error.message}`);failed=true;} }

const catalogPath = path.join(root, 'public/data/catalog.json');
if (fs.existsSync(catalogPath)) {
  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const expected = { prompts: 240, skills: 120, mcp: 72, recipes: 50, failures: 30, sources: 41 };
    for (const [name, count] of Object.entries(expected)) {
      if (Number(catalog.collections?.[name]?.total || 0) !== count) {
        console.error(`[catalog] ${name} expected ${count}, got ${catalog.collections?.[name]?.total}`); failed = true;
      }
    }
    for (const name of ['prompts','skills','mcp','recipes','failures']) {
      for (const category of catalog.collections?.[name]?.categories || []) {
        const file = path.join(root, 'public', category.file || '');
        if (!fs.existsSync(file)) { console.error(`[shard] missing ${category.file}`); failed = true; continue; }
        const items = JSON.parse(fs.readFileSync(file,'utf8'));
        if (!Array.isArray(items) || items.length !== Number(category.count)) { console.error(`[shard] ${category.file} count mismatch.`); failed = true; }
        if (fs.statSync(file).size > 160 * 1024) { console.error(`[shard] ${category.file} exceeds 160 KB; split it further.`); failed = true; }
      }
    }
  } catch (error) { console.error(`[catalog] invalid generated catalog/shards: ${error.message}`); failed = true; }
}


// Validate small, category-sized SQL mirror parts.
const seedManifestPath = path.join(root, 'supabase/seed-parts/MANIFEST.json');
if (!fs.existsSync(seedManifestPath)) {
  console.error('[seed-parts] MANIFEST.json is missing.'); failed = true;
} else {
  try {
    const seedManifest = JSON.parse(fs.readFileSync(seedManifestPath, 'utf8'));
    if (Number(seedManifest.total_records) !== 553) { console.error(`[seed-parts] expected 553 records including sources + MCP starters, got ${seedManifest.total_records}`); failed = true; }
    for (const part of seedManifest.parts || []) {
      const file = path.join(root, 'supabase/seed-parts', part.file);
      if (!fs.existsSync(file)) { console.error(`[seed-parts] missing ${part.file}`); failed = true; continue; }
      if (fs.statSync(file).size > 96 * 1024) { console.error(`[seed-parts] ${part.file} exceeds 96 KB; split it further.`); failed = true; }
    }
  } catch (error) { console.error(`[seed-parts] invalid manifest: ${error.message}`); failed = true; }
}

if (fs.existsSync(path.join(root,'public/data/research-corpus.js')) || fs.existsSync(path.join(root,'public/data/research-corpus.json'))) {
  console.error('[lazy-load] public monolithic research-corpus files must not be deployed. Keep the canonical source under research-source/.');
  failed = true;
}
if (index.includes('research-corpus.js')) { console.error('[lazy-load] index.html still loads the monolithic corpus.'); failed = true; }
if (!index.includes('data/catalog.js')) { console.error('[lazy-load] index.html must load the small catalog first.'); failed = true; }

// The browser must use only a publishable/anon key. Secret-looking values are forbidden.
const publicDefaults = fs.readFileSync(path.join(root, 'scripts/public-defaults.mjs'), 'utf8');
if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(publicDefaults) || /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]+/.test(publicDefaults)) {
  console.error('[config] server-side Supabase credentials must never be in browser/public defaults.');
  failed = true;
}

if (failed) process.exit(1);
console.log('Static checks passed.');
