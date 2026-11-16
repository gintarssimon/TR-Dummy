// Erzeugt aus einem Ordner (Standard: dist/) einen eigenständigen Cloudflare-Pages-Worker (_worker.js),
// der alle Dateien eingebettet ausliefert. Aufruf: node tools/make-pages-worker.mjs [ordner] > _worker.js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dir = process.argv[2] || 'dist';
const TYPES = { html: 'text/html; charset=utf-8', png: 'image/png', webmanifest: 'application/manifest+json', json: 'application/json', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', svg: 'image/svg+xml' };

const files = {};
const walk = (d) => {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (!name.startsWith('_')) {
      const ext = name.split('.').pop();
      files['/' + relative(dir, p).split(sep).join('/')] = [TYPES[ext] || 'application/octet-stream', readFileSync(p).toString('base64')];
    }
  }
};
walk(dir);

process.stdout.write(`const FILES = ${JSON.stringify(files)};
const HEADERS = { 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const cache = {};
function bytes(path) {
  if (!cache[path]) {
    const bin = atob(FILES[path][1]);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    cache[path] = out;
  }
  return cache[path];
}
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!FILES[path]) return new Response('Nicht gefunden', { status: 404, headers: HEADERS });
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Methode nicht erlaubt', { status: 405, headers: HEADERS });
    const headers = Object.assign({ 'content-type': FILES[path][0], 'cache-control': path === '/index.html' ? 'no-cache' : 'public, max-age=86400' }, HEADERS);
    return new Response(request.method === 'HEAD' ? null : bytes(path), { headers });
  },
};
`);
