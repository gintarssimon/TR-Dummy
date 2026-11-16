// Baut aus src/ eine einzelne, eigenständige index.html (CSS und JS inline).
// Aufruf: node build.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const read = (p) => readFileSync(join(src, p), 'utf8');

let html = read('index.html');
const scripts = [];
html = html.replace(/[ \t]*<script src="([^"]+)"><\/script>\n?/g, (_, p) => {
  scripts.push(read(p).replace(/^'use strict';\n/, ''));
  return '';
});
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/, (_, p) => `<style>\n${read(p)}</style>`);
const js = `(function () {\n'use strict';\n${scripts.join('\n')}\n})();`;
if (js.includes('</script')) throw new Error('JS enthält </script – Inline-Build nicht möglich');
html = html.replace('</body>', () => `<script>\n${js}\n</script>\n</body>`);
// Manifest und Icons liegen neben der gebauten Datei (nur gehostet relevant, lokal werden sie ignoriert).
html = html.replace('</head>', '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n</head>');

writeFileSync(join(root, 'index.html'), html);
console.log(`index.html geschrieben (${(html.length / 1024).toFixed(0)} KB)`);

// dist/: nur das, was ausgeliefert wird (für Cloudflare Pages o. Ä.)
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
writeFileSync(join(dist, 'index.html'), html);
cpSync(join(root, 'manifest.webmanifest'), join(dist, 'manifest.webmanifest'));
cpSync(join(root, 'icons'), join(dist, 'icons'), { recursive: true });
writeFileSync(join(dist, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n');
console.log('dist/ aktualisiert');
