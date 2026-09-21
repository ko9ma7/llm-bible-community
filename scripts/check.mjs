import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'index.html','src/main.js','src/styles.css','src/lib/repository.js','src/lib/media.js',
  'supabase/schema.sql','supabase/functions/moderate-submission/index.ts',
  'public/manifest.webmanifest','public/404.html','.github/workflows/deploy.yml'
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
  /service_role/i,
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

if (failed) process.exit(1);
console.log('Static checks passed.');
