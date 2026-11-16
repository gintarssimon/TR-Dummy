// Erzeugt src/js/logos.js aus dem npm-Paket "simple-icons" (Lizenz CC0).
// Aufruf: node tools/make-logos.mjs <pfad-zu>/node_modules/simple-icons
// Es werden nur Daten gelesen (SVG-Pfade und Markenfarben), kein Code aus dem Paket ausgeführt.
// Die Marken und Logos selbst gehören den jeweiligen Inhabern.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = process.argv[2];
if (!pkg) throw new Error('Pfad zu node_modules/simple-icons angeben');

const SLUGS = [
  // Aktien
  'nvidia', 'amd', 'apple', 'tesla', 'meta', 'google', 'netflix', 'spotify', 'uber', 'adyen', 'sap', 'siemens', 'goldmansachs', 'airbus',
  'deutschetelekom', 'zalando', 'bmw', 'volkswagen', 'adidas', 'puma', 'lufthansa', 'shell', 'cocacola', 'mcdonalds', 'paypal', 'visa',
  'mastercard', 'intel', 'palantir', 'coinbase', 'airbnb', 'shopify', 'snowflake', 'qualcomm', 'dhl', 'commerzbank', 'deutschebank',
  'taketwointeractivesoftware', 'arm', 'roblox', 'cloudflare', 'sony', 'boeing', 'nike',
  // Crypto
  'bitcoin', 'ethereum', 'solana', 'cardano', 'xrp', 'dogecoin', 'polkadot', 'chainlink',
  // Händler
  'rewe', 'lidl', 'aldisud', 'edeka', 'dm', 'kaufland', 'rossmann', 'ikea', 'mediamarkt', 'zara', 'deutschebahn', 'aral', 'bvg', 'ubereats',
  'justeat', 'starbucks', 'steam', 'youtube', 'playstation', 'vodafone', 'o2', 'bookingdotcom', 'ryanair', 'tesco', 'carrefour', 'sncf', 'klarna',
];

const meta = JSON.parse(readFileSync(join(pkg, 'data', 'simple-icons.json'), 'utf8'));
const hexBySlug = Object.fromEntries(meta.filter((m) => m.slug).map((m) => [m.slug, m.hex]));

const lines = SLUGS.map((slug) => {
  const svg = readFileSync(join(pkg, 'icons', slug + '.svg'), 'utf8');
  const d = /<path d="([^"]+)"/.exec(svg)[1];
  if (!/^[0-9a-zA-Z .,\-]+$/.test(d)) throw new Error('Unerwartete Zeichen im Pfad: ' + slug);
  const hex = hexBySlug[slug];
  if (!/^[0-9A-Fa-f]{6}$/.test(hex || '')) throw new Error('Keine Farbe für ' + slug);
  return `  ${slug}: ['${hex}', '${d}'],`;
});

const out = `'use strict';

// Automatisch erzeugt von tools/make-logos.mjs aus "simple-icons" (CC0). Nicht von Hand bearbeiten.
// Marken und Logos gehören den jeweiligen Inhabern; Verwendung hier nur zur Illustration im privaten Prototyp.
const LOGOS = {
${lines.join('\n')}
};
`;
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'js', 'logos.js');
writeFileSync(target, out);
console.log(`${SLUGS.length} Logos → src/js/logos.js (${(out.length / 1024).toFixed(0)} KB)`);
