'use strict';

/* ---------- Zustand & Persistenz ---------- */

const LS_KEY = 'cash-unterkonten-prototyp';
const MAX_SUBS = 10;
let S = null;

function save() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(S));
  } catch (e) {
    /* privates Fenster o. Ä. – Demo läuft dann ohne Speichern */
  }
}

function urlSeed() {
  let raw = null;
  try {
    raw = new URLSearchParams(location.search).get('seed');
  } catch (e) {
    /* ignore */
  }
  if (!raw) return null;
  return /^\d{1,9}$/.test(raw) ? +raw : hashStr(raw) % 1000000;
}

function loadState() {
  const wanted = urlSeed();
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch (e) {
    saved = null;
  }
  if (saved && saved.v === STATE_VERSION && (wanted === null || saved.seed === wanted)) {
    S = saved;
    return;
  }
  S = generate(wanted === null ? randomSeed() : wanted);
  if (savedDepotRange()) applyDepotRange(savedDepotRange());
  save();
}

const randomSeed = () => 10000 + Math.floor(Math.random() * 90000);

function reroll(opts) {
  S = generate(randomSeed(), opts);
  if (savedDepotRange()) applyDepotRange(savedDepotRange());
  save();
}

/* ---------- Selektoren ---------- */

const acc = (id) => S.accounts.find((a) => a.id === id);
const subAccounts = () => S.accounts.filter((a) => !a.main);
const cashTotal = () => sum(S.accounts, (a) => a.balance);
const accName = (id) => (acc(id) ? acc(id).name : 'Geschlossenes Konto');
const userName = () => S.user.first + ' ' + S.user.last;

function txFor(view) {
  if (view === 'all') return S.tx.filter((t) => !(t.kind === 'internal' && t.dir === 'in'));
  return S.tx.filter((t) => t.accountId === view);
}

/** Geplante Zahlungen (nächster Termin je Eintrag), aus Sicht eines Kontos oder aller Konten. */
function upcoming(view) {
  const now = Date.now();
  const out = [];
  S.plans.forEach((p) => {
    if (view !== 'all' && p.accountId !== view) return;
    out.push({ key: 'plan:' + p.id, title: INSTR[p.iid].name, iid: p.iid, sub: 'Sparplan', amount: -p.amount, date: nextDayOfMonth(p.day, now), accountId: p.accountId, icon: 'g_chart', planId: p.id });
  });
  S.scheduled.forEach((s) => {
    if (view !== 'all' && s.accountId !== view) return;
    out.push({ key: 'sched:' + s.id, title: s.title, logo: s.logo || null, sub: 'Abo', amount: -s.amount, date: nextDayOfMonth(s.day, now), accountId: s.accountId, icon: 'g_play' });
  });
  subAccounts().forEach((a) => {
    if (!a.rule) return;
    const date = nextDayOfMonth(a.rule.day, now);
    if (view === 'all') out.push({ key: 'rule:' + a.id, title: 'Hauptkonto → ' + a.name, sub: 'Regel', amount: -a.rule.amount, internal: true, date, accountId: 'main', icon: 'g_repeat' });
    else if (view === 'main') out.push({ key: 'rule:' + a.id, title: a.name, sub: 'Regel', amount: -a.rule.amount, date, accountId: 'main', icon: 'g_repeat' });
    else if (view === a.id) out.push({ key: 'rule:' + a.id, title: 'Hauptkonto', sub: 'Regel', amount: a.rule.amount, date, accountId: a.id, icon: 'g_repeat' });
  });
  return out.sort((a, b) => a.date - b.date);
}
function upcomingSoon(view) {
  const limit = startOfDay(Date.now()) + 14 * DAY;
  const list = upcoming(view).filter((u) => u.date <= limit);
  return { list, total: sum(list.filter((u) => !u.internal), (u) => Math.abs(u.amount)) };
}

const isInvestTx = (t) => t.kind === 'savingsplan' || t.kind === 'trade';

function monthStats(mk, view) {
  const list = S.tx.filter((t) => monthKey(t.date) === mk && !t.cancelled && t.kind !== 'internal' && (view === 'all' || t.accountId === view));
  const income = sum(list.filter((t) => t.amount > 0 && !isInvestTx(t)), (t) => t.amount);
  const invest = Math.max(0, -sum(list.filter(isInvestTx), (t) => t.amount));
  const spendList = list.filter((t) => t.amount < 0 && !isInvestTx(t));
  const spend = -sum(spendList, (t) => t.amount);
  const cats = {};
  spendList.forEach((t) => (cats[t.category] = (cats[t.category] || 0) - t.amount));
  const catList = Object.entries(cats).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  return { income, invest, spend, cats: catList };
}

const positionsOf = (pfAcc) => S.positions.filter((p) => INSTR[p.iid].acct === pfAcc);
const pfValue = (pfAcc) => round2(sum(pfAcc ? positionsOf(pfAcc) : S.positions, (p) => p.value));
const position = (iid) => S.positions.find((p) => p.iid === iid);
const posPerf = (p) => (p.invested > 0 ? (p.value / p.invested - 1) * 100 : 0);

/* ---------- Mutationen ---------- */

function pushTx(o) {
  const t = Object.assign({ id: 't' + S.seq++, date: Date.now(), status: '', cancelled: false, fx: null, person: false, sub: '', pair: null, dir: null, other: null, iid: null, logo: null }, o);
  t.amount = round2(t.amount);
  S.tx.unshift(t);
  return t;
}

function moveMoney(fromId, toId, amount, label) {
  const from = acc(fromId);
  const to = acc(toId);
  amount = round2(amount);
  from.balance = round2(from.balance - amount);
  to.balance = round2(to.balance + amount);
  const pair = 'x' + S.seq++;
  const now = Date.now();
  const status = label || 'Umbuchung';
  pushTx({ accountId: toId, date: now, title: from.name, amount, kind: 'internal', category: 'Umbuchung', icon: 'g_swap', status, pair, dir: 'in', other: fromId });
  pushTx({ accountId: fromId, date: now + 1, title: to.name, amount: -amount, kind: 'internal', category: 'Umbuchung', icon: 'g_swap', status, pair, dir: 'out', other: toId });
  save();
}

function sendMoney(fromId, contact, amount) {
  const from = acc(fromId);
  from.balance = round2(from.balance - amount);
  pushTx({ accountId: fromId, title: contact.name, amount: -amount, kind: 'transfer', category: 'Überweisungen', person: true, status: 'Gesendet' });
  save();
}

function depositMoney(toId, amount) {
  const to = acc(toId);
  to.balance = round2(to.balance + amount);
  pushTx({ accountId: toId, title: 'Einzahlung', amount, kind: 'income', category: 'Einnahmen', icon: 'g_down', status: 'Fertig' });
  save();
}

function createAccount(o) {
  const R = makeRand((S.seed * 31 + S.seq * 7919) >>> 0);
  const a = { id: 'a' + S.seq++, name: o.name.trim(), main: false, fixed: false, icon: o.icon, balance: 0, iban: makeIban(R), goal: o.goal || null, rule: null, roundUp: false, createdAt: Date.now() };
  S.accounts.push(a);
  save();
  return a;
}

function closeAccount(id) {
  const a = acc(id);
  if (!a || a.main) return;
  if (a.balance > 0) moveMoney(id, 'main', a.balance, 'Kontoschließung');
  S.tx = S.tx.filter((t) => t.accountId !== id);
  S.accounts = S.accounts.filter((x) => x.id !== id);
  S.plans.forEach((p) => p.accountId === id && (p.accountId = 'main'));
  S.scheduled.forEach((s) => s.accountId === id && (s.accountId = 'main'));
  if (S.card.accountId === id) S.card.accountId = 'main';
  save();
}

function tradeBuy(iid, amount, fromId) {
  const a = acc(fromId);
  a.balance = round2(a.balance - amount);
  let p = position(iid);
  if (!p) {
    p = { iid, value: 0, invested: 0 };
    S.positions.push(p);
  }
  p.value = round2(p.value + amount);
  p.invested = round2(p.invested + amount);
  pushTx({ accountId: fromId, title: INSTR[iid].name, amount: -amount, kind: 'trade', category: 'Investments', icon: 'g_chart', status: 'Kauf', iid });
  save();
}

function tradeSell(iid, amount, toId) {
  const p = position(iid);
  if (!p) return;
  const share = Math.min(1, amount / p.value);
  p.invested = round2(p.invested * (1 - share));
  p.value = round2(p.value - amount);
  if (p.value < 0.01) S.positions = S.positions.filter((x) => x !== p);
  acc(toId).balance = round2(acc(toId).balance + amount);
  pushTx({ accountId: toId, title: INSTR[iid].name, amount, kind: 'trade', category: 'Investments', icon: 'g_chart', status: 'Verkauf', iid });
  save();
}

/** Demo: zufällige Kartenzahlung vom verknüpften Konto, inkl. Aufrunden. */
function simulateCardPayment() {
  const R = makeRand((Date.now() ^ (S.seq * 2654435761)) >>> 0);
  if (S.card.locked) return { error: 'Karte ist gesperrt' };
  const from = acc(S.card.accountId) || acc('main');
  const pool = MERCHANTS.filter((m) => !m[4] && m[2] !== m[3] && m[3] <= 70);
  let m = R.pick(pool);
  let amount = R.money(m[2], m[3]);
  if (amount > from.balance) {
    if (from.balance < 1) return { error: 'Nicht genug Guthaben auf „' + from.name + '“' };
    amount = R.money(Math.min(1, from.balance), Math.min(from.balance, 9));
    m = R.pick(pool.filter((x) => x[2] <= 9));
  }
  from.balance = round2(from.balance - amount);
  pushTx({ accountId: from.id, title: m[0], amount: -amount, kind: 'card', category: m[1], icon: CATEGORIES[m[1]], logo: m[5] || null });
  let rounded = 0;
  const target = S.accounts.find((a) => a.roundUp && a.id !== from.id);
  if (target) {
    rounded = round2(Math.ceil(amount) - amount);
    if (rounded > 0 && rounded <= from.balance) moveMoney(from.id, target.id, rounded, 'Aufrunden');
    else rounded = 0;
  }
  save();
  return { merchant: m[0], amount, from, rounded, target };
}

/* ---------- Depotwert-Bereich (verstecktes Demo-Menü) ----------
 * Legt fest, in welchem Betragsbereich der Wert des Brokerage-Depots liegt. Die Positionen werden passend
 * neu zusammengestellt (mehr Titel bei größeren Depots), der Sparplan wird mitskaliert.
 * Die Wahl wird getrennt gespeichert und gilt auch nach „Neue Zufallsdaten“. */

const LS_DEPOT = 'cash-unterkonten-depot';
const DEPOT_RANGES = [
  [100, 1000],
  [1000, 10000],
  [10000, 50000],
  [50000, 250000],
  [250000, 1000000],
  [1000000, 10000000],
];

function eurShort(v) {
  if (v >= 1e6) return nf01.format(v / 1e6).replace(/,0$/, '') + NBSP + 'Mio.' + NBSP + '€';
  return eur0(v);
}
const rangeLabel = (r) => (r.min === r.max ? eurShort(r.min) : eurShort(r.min) + ' – ' + eurShort(r.max));

function savedDepotRange() {
  try {
    const r = JSON.parse(localStorage.getItem(LS_DEPOT) || 'null');
    return r && r.min > 0 && r.max >= r.min ? r : null;
  } catch (e) {
    return null;
  }
}

/** Nächster „runder“ Sparplanbetrag passend zur Depotgröße. */
function planAmountFor(total) {
  const steps = [25, 50, 75, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000, 2500, 5000];
  const want = clamp(total * 0.008, 25, 5000);
  return steps.reduce((best, s) => (Math.abs(s - want) < Math.abs(best - want) ? s : best), steps[0]);
}

function setPlanAmount(amount) {
  const plan = S.plans[0];
  if (!plan) return;
  plan.amount = amount;
  S.tx.forEach((t) => {
    if (t.kind === 'savingsplan' && t.iid === plan.iid) t.amount = -amount;
  });
}

/** Stellt das Brokerage-Depot auf einen Wert im Bereich r = { min, max, salt } zusammen; ohne r: Standardwerte des Seeds. */
function applyDepotRange(r) {
  const keep = S.positions.filter((p) => INSTR[p.iid].acct !== 'brokerage');
  S.depotRange = r || null;
  if (!r) {
    const fresh = generate(S.seed);
    S.positions = keep.concat(fresh.positions.filter((p) => INSTR[p.iid].acct === 'brokerage'));
    setPlanAmount(fresh.plans[0].amount);
    return;
  }
  const R = makeRand(hashStr(S.seed + '|depot|' + r.min + '|' + r.max + '|' + (r.salt || 0)));
  const lo = Math.max(1, r.min);
  const hi = Math.max(lo, r.max);
  const total = round2(Math.exp(Math.log(lo) + R.raw() * (Math.log(hi) - Math.log(lo))));
  const n = total < 1500 ? R.i(2, 3) : total < 15000 ? R.i(3, 5) : total < 150000 ? R.i(5, 8) : R.i(7, 11);

  const planEtf = S.plans[0] && INSTR[S.plans[0].iid].type === 'etf' ? INSTR[S.plans[0].iid] : null;
  const etfs = R.shuffle(INSTRUMENTS.filter((i) => i.type === 'etf' && (!planEtf || i.id !== planEtf.id)));
  const stocks = R.shuffle(INSTRUMENTS.filter((i) => i.type === 'stock'));
  const picks = [planEtf || etfs.shift()];
  const extraEtfs = n >= 6 ? R.i(1, 2) : n >= 4 ? R.i(0, 1) : 0;
  for (let i = 0; i < extraEtfs; i++) picks.push(etfs[i]);
  while (picks.length < n) picks.push(stocks.shift());

  // Haupt-ETF trägt 35–60 %, der Rest verteilt sich ungleich auf die übrigen Titel
  const mainShare = n === 1 ? 1 : R.f(0.35, 0.6);
  const rest = picks.slice(1).map((ins) => (ins.type === 'etf' ? R.f(0.7, 1.4) : Math.pow(R.f(0.15, 1), 1.5)));
  const restSum = sum(rest) || 1;
  const shares = [mainShare].concat(rest.map((w) => ((1 - mainShare) * w) / restSum));

  let used = 0;
  const positions = picks.map((ins, i) => {
    const value = i === picks.length - 1 ? round2(total - used) : round2(total * shares[i]);
    used = round2(used + value);
    const perf = ins.type === 'etf' ? R.f(-2, 28) : R.f(-25, 60);
    return { iid: ins.id, value, invested: round2(value / (1 + perf / 100)) };
  });
  S.positions = keep.concat(positions);
  setPlanAmount(planAmountFor(total));
}

function setDepotRange(r) {
  try {
    if (r) localStorage.setItem(LS_DEPOT, JSON.stringify(r));
    else localStorage.removeItem(LS_DEPOT);
  } catch (e) {
    /* ignore */
  }
  applyDepotRange(r);
  save();
}
