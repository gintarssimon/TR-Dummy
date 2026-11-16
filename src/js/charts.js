'use strict';

/* ---------- Kursverläufe (deterministisch aus dem Seed) ---------- */

const TF_LIST = [['d', '1T'], ['w', '1W'], ['m', '1M'], ['y', '1J'], ['max', 'Max']];
// Alle Zeiträume haben gleich viele Punkte, damit der Chart beim Wechsel weich von Kurve zu Kurve morphen kann.
const CH_N = 120;
const TF_CFG = {
  d: { n: CH_N, span: 0.42, floor: 0.004, pct: 0.9 },
  w: { n: CH_N, span: 7, floor: 0.012, pct: 2.2 },
  m: { n: CH_N, span: 30, floor: 0.03, pct: 4.5 },
  y: { n: CH_N, span: 365, floor: 0.07, pct: 12 },
  max: { n: CH_N, span: 800, floor: 0.1, pct: 30 },
};

/**
 * Erzeugt eine Kurve, die exakt beim aktuellen Wert endet.
 * opts.pct: feste Rendite für den Zeitraum, opts.span: Tage, opts.flatHead: flacher Anfang (wie ein frisch bespartes Depot)
 */
function genSeries(key, tf, endValue, opts) {
  opts = opts || {};
  const cfg = TF_CFG[tf];
  const R = makeRand(hashStr(S.seed + '|' + key + '|' + tf));
  const n = cfg.n;
  let pct = opts.pct;
  if (pct === undefined || pct === null) pct = tf === 'y' ? 6 + R.normal() * cfg.pct : R.normal() * cfg.pct;
  pct = Math.max(pct, -80);
  const end = endValue > 0 ? endValue : 100;
  const start = end / (1 + pct / 100);
  const walk = [0];
  for (let i = 1; i < n; i++) walk.push(walk[i - 1] + R.normal());
  const lastW = walk[n - 1];
  const bridge = walk.map((v, i) => v - (lastW * i) / (n - 1));
  const maxAbs = Math.max.apply(null, bridge.map(Math.abs)) || 1;
  const amp = R.f(0.3, 0.62) * Math.max(Math.abs(end - start), end * cfg.floor);
  const k = R.f(0.75, 2.1);
  const head = opts.flatHead ? R.f(0.14, 0.3) : 0;
  const values = bridge.map((b, i) => {
    const t = i / (n - 1);
    if (t < head) return start + amp * 0.03 * Math.sin(i * 1.7);
    const u = (t - head) / (1 - head);
    const fade = Math.min(1, u * 6);
    return Math.max(end * 0.02, start + (end - start) * Math.pow(u, k) + ((amp * b) / maxAbs) * fade);
  });
  values[n - 1] = end;
  const now = Date.now();
  const span = (opts.span || cfg.span) * DAY;
  const dates = values.map((_, i) => now - span + (span * i) / (n - 1));
  return { values, dates, base: start, pct, tf, real: endValue > 0, xf: opts.xf || 1 };
}

function pfSeries(pfAcc, tf) {
  const pos = positionsOf(pfAcc);
  const total = sum(pos, (p) => p.value);
  const invested = sum(pos, (p) => p.invested);
  let pct = null;
  if (tf === 'max') pct = invested > 0 ? (total / invested - 1) * 100 : 0;
  if (tf === 'd') pct = total > 0 ? sum(pos, (p) => p.value * S.market[p.iid].day) / total : 0;
  return genSeries('pf-' + pfAcc, tf, total, { pct, span: tf === 'max' ? S.pfMaxDays : null, flatHead: tf === 'max' });
}

function insSeries(iid, tf) {
  const m = S.market[iid];
  return genSeries('ins-' + iid, tf, m.price, { pct: tf === 'd' ? m.day : null, xf: tf === 'd' ? marketState(INSTR[iid]).frac : 1 });
}

/* ---------- SVG-Chart ---------- */

const CHARTS = {};
const CH_W = 390;
const CH_H = 230;

function buildLine(ys, xf) {
  let d = '';
  const n = ys.length;
  const w = CH_W * (xf || 1);
  for (let i = 0; i < n; i++) d += (i ? 'L' : 'M') + ((i / (n - 1)) * w).toFixed(1) + ' ' + ys[i].toFixed(1);
  return d;
}

function chartHTML(series, cid) {
  const v = series.values;
  const lo = Math.min(series.base, Math.min.apply(null, v));
  const hi = Math.max(series.base, Math.max.apply(null, v));
  const padT = 14;
  const padB = 14;
  const y = (val) => padT + (1 - (val - lo) / (hi - lo || 1)) * (CH_H - padT - padB);
  const ys = v.map(y);
  const by = y(series.base);
  const xf = series.xf || 1;
  CHARTS[cid] = { series, ys, by, xf, sig: series.tf + '|' + v[v.length - 1].toFixed(2) + '|' + series.base.toFixed(2) + '|' + xf.toFixed(3) };
  return `<div class="chart" data-cid="${cid}">
    <svg viewBox="0 0 ${CH_W} ${CH_H}" preserveAspectRatio="none">
      <path class="ch-base" d="M0 ${by.toFixed(1)}H${CH_W}" vector-effect="non-scaling-stroke"/>
      <path class="ch-line" d="${buildLine(ys, xf)}" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="ch-cursor" hidden><i></i></div>
  </div>`;
}

/** Nach jedem Rendern aufrufen: lässt geänderte Charts weich von der alten zur neuen Kurve laufen. */
function syncCharts(root) {
  root.querySelectorAll('.chart[data-cid]').forEach((el) => {
    const c = CHARTS[el.dataset.cid];
    if (!c) return;
    const drawn = el._drawn;
    if (!drawn || drawn.ys.length !== c.ys.length) {
      el._drawn = { ys: c.ys.slice(), by: c.by, xf: c.xf };
      el._sig = c.sig;
      return;
    }
    if (el._sig === c.sig) return;
    el._sig = c.sig;
    const from = { ys: drawn.ys.slice(), by: drawn.by, xf: drawn.xf || 1 };
    const to = { ys: c.ys, by: c.by, xf: c.xf };
    const line = el.querySelector('.ch-line');
    const base = el.querySelector('.ch-base');
    const token = (el._tw = {});
    const t0 = performance.now();
    const frame = (now) => {
      if (el._tw !== token || !el.isConnected) return;
      const t = clamp((now - t0) / 620, 0, 1);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const ys = from.ys.map((y0, i) => y0 + (to.ys[i] - y0) * e);
      const by = from.by + (to.by - from.by) * e;
      const xf = from.xf + (to.xf - from.xf) * e;
      line.setAttribute('d', buildLine(ys, xf));
      base.setAttribute('d', 'M0 ' + by.toFixed(1) + 'H' + CH_W);
      el._drawn = { ys, by, xf };
      if (t < 1) requestAnimationFrame(frame);
    };
    frame(t0);
  });
}

function chartLabelDate(ts, tf) {
  if (tf === 'd') return timeShort(ts);
  if (tf === 'w') return dayShort(ts) + ', ' + timeShort(ts);
  const d = new Date(ts);
  return dayShort(ts) + (tf === 'max' || tf === 'y' ? ' ' + d.getFullYear() : '');
}

const tri = (up) => `<i class="tri ${up ? 'up' : 'down'}"></i>`;
const deltaHTML = (pct) => tri(pct >= 0) + pct2(pct);
const chgHTML = (pct) => `<span class="chg ${pct >= 0 ? 'up' : 'down'}">${deltaHTML(pct)}</span>`;

/** Scrubbing: Finger/Maus auf dem Chart zeigt Wert, Rendite und Datum des Punkts. */
function bindCharts(root) {
  let active = null;
  const update = (el, clientX) => {
    const c = CHARTS[el.dataset.cid];
    if (!c) return;
    const rect = el.getBoundingClientRect();
    const t = clamp((clientX - rect.left) / rect.width / c.xf, 0, 1);
    const i = Math.round(t * (c.series.values.length - 1));
    const val = c.series.values[i];
    const scope = el.closest('[data-chart-root]');
    const cur = el.querySelector('.ch-cursor');
    cur.hidden = false;
    cur.style.left = (i / (c.series.values.length - 1)) * c.xf * 100 + '%';
    cur.firstElementChild.style.top = (c.ys[i] / CH_H) * 100 + '%';
    if (!scope) return;
    const amount = scope.querySelector('[data-chart-amount]');
    const delta = scope.querySelector('[data-chart-delta]');
    const date = scope.querySelector('[data-chart-date]');
    if (amount) amount.textContent = eur(c.series.real ? val : 0);
    if (delta) delta.innerHTML = deltaHTML((val / c.series.base - 1) * 100);
    if (date) date.textContent = chartLabelDate(c.series.dates[i], c.series.tf);
  };
  const reset = (el) => {
    const c = CHARTS[el.dataset.cid];
    const scope = el.closest('[data-chart-root]');
    el.querySelector('.ch-cursor').hidden = true;
    if (!c || !scope) return;
    const v = c.series.values;
    const amount = scope.querySelector('[data-chart-amount]');
    const delta = scope.querySelector('[data-chart-delta]');
    const date = scope.querySelector('[data-chart-date]');
    if (amount) amount.textContent = eur(c.series.real ? v[v.length - 1] : 0);
    if (delta) delta.innerHTML = deltaHTML(c.series.pct);
    if (date) date.textContent = '';
  };
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.chart');
    if (!el) return;
    active = el;
    update(el, e.clientX);
  });
  root.addEventListener('pointermove', (e) => {
    const el = e.target.closest('.chart');
    if (active) update(active, e.clientX);
    else if (el && e.pointerType === 'mouse') update(el, e.clientX);
  });
  const end = () => {
    if (active) reset(active);
    active = null;
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('pointerout', (e) => {
    const el = e.target.closest('.chart');
    if (el && !active && e.pointerType === 'mouse' && !el.contains(e.relatedTarget)) reset(el);
  });
}

/* ---------- Ring & Donut ---------- */

function ringSVG(share, color) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const s = clamp(share, 0, 1);
  const cap = s > 0.03 && s < 0.97 ? 'round' : 'butt';
  return `<svg class="ring" viewBox="0 0 20 20"><circle cx="10" cy="10" r="${r}" fill="none" stroke="#2a2a2e" stroke-width="3.2"/><circle class="ring-arc" cx="10" cy="10" r="${r}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="${cap}" style="stroke-dasharray:${(c * s).toFixed(2)} ${c.toFixed(2)};opacity:${s > 0.004 ? 1 : 0}" transform="rotate(-90 10 10)"/></svg>`;
}

function donutSVG(parts) {
  const total = sum(parts, (p) => p.value) || 1;
  const r = 36;
  const c = 2 * Math.PI * r;
  const gap = parts.length > 1 ? 2.2 : 0;
  let off = 0;
  const segs = parts
    .map((p) => {
      const len = (p.value / total) * c;
      const seg = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${p.color}" stroke-width="30" stroke-dasharray="${Math.max(0.5, len - gap).toFixed(2)} ${c.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
      off += len;
      return seg;
    })
    .join('');
  return `<svg class="donut" viewBox="0 0 120 120">${segs}</svg>`;
}
