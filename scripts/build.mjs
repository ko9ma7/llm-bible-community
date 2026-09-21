import fs from 'node:fs';
import path from 'node:path';
import { loadDotEnv, publicConfig, configScript, backendConfigured } from './env.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const dotenv = loadDotEnv(path.join(root, '.env'));
const env = { ...dotenv, ...process.env };
const config = publicConfig(env);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

copyDir(path.join(root, 'src'), path.join(dist, 'src'));
copyDir(path.join(root, 'public'), dist);
let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
index = index.replaceAll('__SITE_URL__', config.siteUrl);
fs.writeFileSync(path.join(dist, 'index.html'), index);
fs.writeFileSync(path.join(dist, 'config.js'), configScript(config));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${config.siteUrl}/</loc></url>
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${config.siteUrl}/sitemap.xml
`);

console.log(`Built static site to ${dist}`);
console.log(`Site URL: ${config.siteUrl}`);
console.log(`Supabase configured: ${backendConfigured(config)}`);
