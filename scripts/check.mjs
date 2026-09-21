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

const mainJs = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
if (/import\s+['"]\.\/styles\.css['"]/.test(mainJs)) {
  console.error('[browser modules] src/main.js imports CSS directly. GitHub Pages serves native ES modules and cannot execute CSS as JavaScript. Use a <link rel=\"stylesheet\"> in index.html instead.');
  failed = true;
}
if (!index.includes('rel=\"stylesheet\"') || !index.includes('./src/styles.css')) {
  console.error('[styles] index.html must load ./src/styles.css with a stylesheet link.');
  failed = true;
}

// Validate the browser data contract. This catches mismatches such as `entries` vs `knowledge` before deployment.
const knowledgePath = path.join(root, 'public/data/knowledge.js');
if (!fs.existsSync(knowledgePath)) {
  console.error('[knowledge] public/data/knowledge.js is missing.');
  failed = true;
} else {
  const source = fs.readFileSync(knowledgePath, 'utf8');
  const match = source.match(/window\.LLM_BIBLE_DATA\s*=\s*({[\s\S]*});?\s*$/);
  if (!match) {
    console.error('[knowledge] Could not parse window.LLM_BIBLE_DATA assignment.');
    failed = true;
  } else {
    try {
      const data = Function(`"use strict"; return (${match[1]});`)();
      if (!Array.isArray(data.roadmap)) {
        console.error('[knowledge] roadmap must be an array.');
        failed = true;
      }
      const items = Array.isArray(data.knowledge) ? data.knowledge : Array.isArray(data.entries) ? data.entries : null;
      if (!items) {
        console.error('[knowledge] expected a knowledge (or legacy entries) array.');
        failed = true;
      } else if (!items.length) {
        console.error('[knowledge] knowledge corpus is empty.');
        failed = true;
      } else {
        const requiredFields = ['id','category','title','summary'];
        items.forEach((item, index) => {
          for (const field of requiredFields) {
            if (typeof item?.[field] !== 'string' || !item[field].trim()) {
              console.error(`[knowledge] item ${index + 1} is missing required string field: ${field}`);
              failed = true;
            }
          }
        });
      }
    } catch (error) {
      console.error(`[knowledge] invalid data file: ${error.message}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Static checks passed.');
