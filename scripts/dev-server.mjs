import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { loadDotEnv, publicConfig, configScript } from './env.mjs';

const root = process.cwd();
const targetArg = process.argv[2];
const servingDist = targetArg === 'dist';
const baseDir = servingDist ? path.join(root, 'dist') : root;
const port = Number(process.argv[3] || (servingDist ? 4173 : 5173));
const dotenv = loadDotEnv(path.join(root, '.env'));
const config = publicConfig({ ...dotenv, ...process.env, VITE_SITE_URL: process.env.VITE_SITE_URL || dotenv.VITE_SITE_URL || `http://localhost:${port}` });

const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webm':'video/webm','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json' };

http.createServer((req,res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/config.js' && !servingDist) {
    res.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});
    return res.end(configScript(config));
  }
  if (pathname === '/') pathname = '/index.html';
  const full = path.normalize(path.join(baseDir, pathname));
  if (!full.startsWith(baseDir)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(full, (err, stat) => {
    if (!err && stat.isFile()) {
      res.writeHead(200, {'Content-Type': mime[path.extname(full)] || 'application/octet-stream'});
      return fs.createReadStream(full).pipe(res);
    }
    const fallback = path.join(baseDir, 'index.html');
    if (fs.existsSync(fallback)) { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); return fs.createReadStream(fallback).pipe(res); }
    res.writeHead(404); res.end('Not found');
  });
}).listen(port, '0.0.0.0', () => console.log(`LLM Bible: http://localhost:${port}`));
