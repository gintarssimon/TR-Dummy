'use strict';

/* ---------- Zufall (seeded) ---------- */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRand(seed) {
  const r = mulberry32(seed);
  const R = {
    raw: r,
    f: (min, max) => min + r() * (max - min),
    i: (min, max) => Math.floor(min + r() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    sample: (arr, n) => R.shuffle(arr).slice(0, n),
    money: (min, max) => Math.round(R.f(min, max) * 100) / 100,
    normal: () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = r();
      while (v === 0) v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
  return R;
}

/* ---------- Formatierung ---------- */

const NBSP = ' ';
const nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf01 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

const round2 = (v) => Math.round(v * 100) / 100;
const eur = (v) => nf2.format(Math.abs(v) < 0.005 ? 0 : v) + NBSP + '€';
const eurAbs = (v) => eur(Math.abs(v));
const eurCompact = (v) => nf01.format(v) + NBSP + '€';
const eur0 = (v) => nf0.format(v) + NBSP + '€';
const pct2 = (v) => nf2.format(Math.abs(v)) + NBSP + '%';
const pct0 = (v) => nf0.format(v) + NBSP + '%';
const sum = (arr, fn) => arr.reduce((s, x) => s + (fn ? fn(x) : x), 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

/* ---------- Datum ---------- */

const DAY = 864e5;
const MON_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
const MON_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return +d;
}
const dayShort = (ts) => {
  const d = new Date(ts);
  return d.getDate() + '. ' + MON_SHORT[d.getMonth()];
};
const dayLong = (ts) => {
  const d = new Date(ts);
  return d.getDate() + '. ' + MON_LONG[d.getMonth()] + ' ' + d.getFullYear();
};
const timeShort = (ts) => {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
const monthKey = (ts) => {
  const d = new Date(ts);
  return d.getFullYear() * 12 + d.getMonth();
};
function monthGroupLabel(ts, now) {
  const diff = monthKey(now) - monthKey(ts);
  if (diff === 0) return 'Dieser Monat';
  if (diff === 1) return 'Letzter Monat';
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return MON_LONG[d.getMonth()] + (sameYear ? '' : ' ' + d.getFullYear());
}
/** Nächster Termin für einen Tag-im-Monat (frühestens morgen). */
function nextDayOfMonth(day, now) {
  const today = new Date(startOfDay(now));
  let d = new Date(today.getFullYear(), today.getMonth(), Math.min(day, 28));
  if (+d <= +today) d = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(day, 28));
  return +d;
}
function inDaysLabel(ts, now) {
  const n = Math.round((startOfDay(ts) - startOfDay(now)) / DAY);
  if (n <= 0) return 'Heute';
  if (n === 1) return 'Morgen';
  return 'In ' + n + ' Tagen';
}

/* ---------- IBAN ---------- */

function makeIban(R) {
  const bban = '100' + String(R.i(10000, 99999)) + String(R.i(1000000000, 9999999999));
  const check = 98n - (BigInt(bban + '131400') % 97n);
  return 'DE' + String(check).padStart(2, '0') + bban;
}
const ibanPretty = (iban) => iban.replace(/(.{4})/g, '$1 ').trim();
const ibanTail = (iban) => '··· ' + iban.slice(-4);

/* ---------- Icons ---------- */

const svg = (body, vb, attrs) =>
  `<svg viewBox="0 0 ${vb || '24 24'}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs || ''}>${body}</svg>`;

const ICON = {
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  updown: svg('<path d="M7 9.5l5-5 5 5M7 14.5l5 5 5-5"/>', '24 24', 'stroke-width="2.8"'),
  chevDown: svg('<path d="M4 8.5c5 4.6 11 4.6 16 0"/>', '24 24', 'stroke-width="3.4"'),
  chevSmall: svg('<path d="M6 9l6 6 6-6"/>', '24 24', 'stroke-width="2.8"'),
  chevRight: svg('<path d="M9 5l7 7-7 7"/>', '24 24', 'stroke-width="3"'),
  chevLeft: svg('<path d="M15 5l-7 7 7 7"/>', '24 24', 'stroke-width="3"'),
  plus: svg('<path d="M12 5v14M5 12h14"/>', '24 24', 'stroke-width="2.6"'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', '24 24', 'stroke-width="2.8"'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>', '24 24', 'stroke-width="2.6"'),
  filter: svg('<path d="M4 7h16M7 12h10M10 17h4"/>', '24 24', 'stroke-width="2.6"'),
  dots: svg('<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>'),
  back: svg('<path d="M7 5l10 7-10 7"/>', '24 24', 'stroke-width="2.6" transform="scale(-1,1)" style="transform-origin:center"'),
  del: svg('<path d="M21 6H9l-6 6 6 6h12zM17 9.5l-5 5M12 9.5l5 5"/>', '24 24', 'stroke-width="2"'),
  star: svg('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z"/>'),
  starFill: svg('<path fill="currentColor" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z"/>'),
  copy: svg('<rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M5 15V7a2 2 0 012-2h8"/>'),
  mail: svg('<rect x="4" y="6" width="16" height="12" rx="2.5"/><path d="M4.5 8l7.5 5.5L19.5 8"/>'),
  // Glyphen für Transaktions-Kreise (16er Raster)
  g_bag: svg('<path d="M3.5 6h9l-.8 7.5H4.3zM6 6V5a2 2 0 014 0v1"/>', '16 16', 'stroke-width="1.7"'),
  g_car: svg('<path d="M2.5 10.5V8.6l1.3-3.3a1.5 1.5 0 011.4-1h5.6a1.5 1.5 0 011.4 1l1.3 3.3v1.9zM4.3 12.6v-2M11.7 12.6v-2"/>', '16 16', 'stroke-width="1.7"'),
  g_fork: svg('<path d="M4.5 2.5v4a1.6 1.6 0 003.2 0v-4M6.1 8.2v5.3M11.5 2.5c-1.3 1-1.6 2.8-1.6 4.8h1.6v6.2"/>', '16 16', 'stroke-width="1.7"'),
  g_play: svg('<path fill="currentColor" d="M5.8 4.2l6 3.8-6 3.8z"/>', '16 16', 'stroke-width="1.4"'),
  g_health: svg('<path d="M8 3.6v8.8M3.6 8h8.8"/>', '16 16', 'stroke-width="2.4"'),
  g_bolt: svg('<path fill="currentColor" d="M9.2 2L4 9h3.4L6.8 14 12 7H8.6z"/>', '16 16', 'stroke-width="1"'),
  g_plane: svg('<path fill="currentColor" d="M14 2L2 7.2l4.6 1.9L8.8 14z"/>', '16 16', 'stroke-width="1"'),
  g_swap: svg('<path d="M3 5.8h9.5L10 3.3M13 10.2H3.5L6 12.7"/>', '16 16', 'stroke-width="1.8"'),
  g_chart: svg('<path d="M2.8 11.5l3.4-4 2.6 2.4L13.2 5"/>', '16 16', 'stroke-width="2"'),
  g_down: svg('<path d="M8 3v9.5M4.2 8.8L8 12.6l3.8-3.8"/>', '16 16', 'stroke-width="2"'),
  g_up: svg('<path d="M8 13V3.5M4.2 7.2L8 3.4l3.8 3.8"/>', '16 16', 'stroke-width="2"'),
  g_doc: svg('<rect x="3.6" y="3.6" width="8.8" height="8.8" rx="2.4"/><path d="M6.2 7h3.6M6.2 9.2h2.2"/>', '16 16', 'stroke-width="1.6"'),
  g_minus: svg('<circle cx="8" cy="8" r="5.6"/><path d="M5.6 8h4.8"/>', '16 16', 'stroke-width="1.7"'),
  g_phone: svg('<path fill="currentColor" d="M5.2 2.8l1.9-.5 1.2 2.9-1.4 1c.7 1.4 1.6 2.3 3 3l1-1.4 2.9 1.2-.5 1.9c-.2.8-.9 1.2-1.7 1.1C7.300 11.400 4.600 8.700 4.100 4.500c-.1-.8.3-1.500 1.100-1.700z"/>', '16 16', 'stroke-width="0"'),
  g_gear: svg('<circle cx="8" cy="8" r="2.1"/><circle cx="8" cy="8" r="5.2" stroke-dasharray="2.6 1.5"/>', '16 16', 'stroke-width="1.8"'),
  g_bank: svg('<path d="M3 6.6L8 3.6l5 3M4.4 7.6v4M8 7.6v4M11.600 7.600v4M3 12.600h10"/>', '16 16', 'stroke-width="1.6"'),
  g_coin: svg('<circle cx="8" cy="8" r="5.4"/><path d="M9.800 6.300c-.4-.600-1-.900-1.700-.900-1.200 0-2.100 1.100-2.100 2.600s.9 2.600 2.100 2.600c.7 0 1.300-.300 1.700-.900"/>', '16 16', 'stroke-width="1.6"'),
  g_ring: svg('<rect x="3.400" y="3.400" width="9.200" height="9.200" rx="2.600"/><circle cx="8" cy="8" r="1.700"/>', '16 16', 'stroke-width="1.6"'),
  g_pulse: svg('<path d="M3.200 9.800l2.600-2.900 2.200 2 4.800-4.300"/>', '16 16', 'stroke-width="2"'),
  g_dice: svg('<rect x="3.200" y="3.200" width="9.600" height="9.600" rx="2.400"/><circle cx="6" cy="6" r=".7" fill="currentColor"/><circle cx="10" cy="10" r=".7" fill="currentColor"/><circle cx="8" cy="8" r=".7" fill="currentColor"/>', '16 16', 'stroke-width="1.500"'),
  g_reset: svg('<path d="M3.500 8a4.500 4.500 0 108.300-2.400M11.800 2.800v2.900H8.900" transform="scale(-1,1) translate(-16,0)"/>', '16 16', 'stroke-width="1.700"'),
  g_card: svg('<rect x="2.600" y="4.200" width="10.800" height="7.600" rx="1.800"/><path d="M2.800 6.900h10.400"/>', '16 16', 'stroke-width="1.600"'),
  g_user: svg('<circle cx="8" cy="6" r="2.300"/><path d="M3.600 13c.5-2.200 2.200-3.400 4.400-3.400s3.900 1.200 4.400 3.400"/>', '16 16', 'stroke-width="1.700"'),
  g_plus: svg('<path d="M8 3.800v8.400M3.800 8h8.400"/>', '16 16', 'stroke-width="2"'),
  g_target: svg('<circle cx="8" cy="8" r="5.200"/><circle cx="8" cy="8" r="1.800" fill="currentColor"/>', '16 16', 'stroke-width="1.700"'),
  g_repeat: svg('<path d="M3.400 7.400a4.600 4.600 0 018.200-2.200M12.600 8.600a4.600 4.600 0 01-8.200 2.200M11.800 2.600v2.800H9M4.200 13.400v-2.800H7"/>', '16 16', 'stroke-width="1.600"'),
  g_trash: svg('<path d="M3.600 4.800h8.800M6.400 4.800V3.400h3.200v1.400M4.800 4.800l.5 7.800h5.400l.5-7.800"/>', '16 16', 'stroke-width="1.600"'),
  g_pen: svg('<path d="M3.400 12.600l.5-2.600 6.400-6.400 2.100 2.100L6 12.100z"/>', '16 16', 'stroke-width="1.600"'),
};
