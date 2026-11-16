'use strict';

/* ---------- Pools für Zufallsdaten ---------- */

const POOL = {
  first: ['Lena', 'Jonas', 'Mia', 'Felix', 'Hannah', 'Paul', 'Emma', 'Noah', 'Clara', 'Ben', 'Sophie', 'Elias', 'Marie', 'Leon', 'Anna', 'Moritz', 'Laura', 'Tim', 'Johanna', 'David', 'Nele', 'Jakob', 'Greta', 'Finn', 'Ida', 'Anton', 'Lea', 'Max', 'Charlotte', 'Luis', 'Frieda', 'Oskar', 'Paula', 'Theo', 'Ella', 'Henry', 'Maja', 'Emil', 'Zoe', 'Karl'],
  last: ['Bergmann', 'Hoffmann', 'Lindner', 'Brandt', 'Kaiser', 'Vogel', 'Schuster', 'Winter', 'Sommer', 'Kühn', 'Albrecht', 'Engel', 'Seidel', 'Haas', 'Graf', 'Lorenz', 'Busch', 'Arnold', 'Voigt', 'Sauer', 'Ebert', 'Thiele', 'Krämer', 'Pohl', 'Böhm', 'Franke', 'Beck', 'Roth', 'Ziegler', 'Neumann', 'Keller', 'Jung', 'Hartmann', 'Peters', 'Lang', 'Baumann', 'Wolff', 'Stein', 'Marx', 'Falk'],
  employer: ['Nordwind Logistik GmbH', 'Kranich Software AG', 'Studio Elbufer GmbH', 'Hansewerk Technik', 'Lichtblick Medien GmbH', 'Werkstudent Uni-Klinikum', 'Café Morgenrot (Lohn)', 'Alpenquell Vertrieb GmbH', 'Blaupause Architekten', 'Fjord Analytics GmbH'],
  ipo: ['Kranich Robotics', 'Nordlicht Energie', 'Helix Biolabs', 'Lumen Quantum', 'Fjord Mobility', 'Aurora Compute', 'Tidewater Solar', 'Brightfield AI'],
};

const CATEGORIES = {
  'Einkäufe': 'g_bag',
  'Transport': 'g_car',
  'Bars & Restaurants': 'g_fork',
  'Unterhaltung': 'g_play',
  'Gesundheit': 'g_health',
  'Wohnen und Versorgung': 'g_doc',
  'Reisen': 'g_plane',
  'Überweisungen': 'g_swap',
};

/** Händler: [Name, Kategorie, min €, max €, Fremdwährung?] */
const MERCHANTS = [
  ['REWE', 'Einkäufe', 6, 64], ['Lidl', 'Einkäufe', 5, 48], ['dm-drogerie markt', 'Einkäufe', 4, 32], ['Edeka', 'Einkäufe', 7, 58],
  ['Bäckerei Sonnenschein', 'Einkäufe', 2, 9], ['Zalando', 'Einkäufe', 19, 120], ['Thalia', 'Einkäufe', 9, 34], ['Decathlon', 'Einkäufe', 12, 80],
  ['Deutsche Bahn', 'Transport', 9, 89], ['FREE NOW', 'Transport', 7, 28], ['Bolt', 'Transport', 4, 19], ['Nextbike', 'Transport', 1, 6],
  ['Aral Tankstelle', 'Transport', 20, 78], ['Deutschlandticket', 'Transport', 58, 58],
  ['Trattoria Da Luca', 'Bars & Restaurants', 14, 52], ['Café Morgenrot', 'Bars & Restaurants', 3, 14], ['Burgerwerk', 'Bars & Restaurants', 9, 24],
  ['Sushi Yama', 'Bars & Restaurants', 12, 38], ['Bar Zur Eule', 'Bars & Restaurants', 6, 31], ['Pho Saigon', 'Bars & Restaurants', 9, 22],
  ['Spotify', 'Unterhaltung', 10.99, 10.99], ['Netflix', 'Unterhaltung', 13.99, 13.99], ['Filmpalast Kino', 'Unterhaltung', 9, 26], ['Steam', 'Unterhaltung', 5, 60],
  ['Stadt-Apotheke', 'Gesundheit', 4, 29], ['Urban Sports Club', 'Gesundheit', 33, 69], ['Zahnarztpraxis am Park', 'Gesundheit', 20, 90],
  ['Mobilfunk Flex', 'Wohnen und Versorgung', 10, 20], ['Rundfunkbeitrag', 'Wohnen und Versorgung', 18.36, 18.36],
  ['Hostel Praha', 'Reisen', 480, 2400, 'CZK'], ['Booking Unterkunft', 'Reisen', 45, 190], ['Kraków Bistro', 'Reisen', 30, 160, 'PLN'],
  ['SBB Ticket', 'Reisen', 12, 70, 'CHF'], ['London Tube', 'Reisen', 3, 12, 'GBP'], ['eVignette', 'Reisen', 200, 420, 'CZK'],
];
const FX_RATE = { CZK: 0.0411, PLN: 0.234, CHF: 1.06, GBP: 1.17 };

const UTILITY = ['Stadtwerke Energie und Wasser', 'Nordstrom Energie', 'Grünwerk Strom & Gas', 'Elbe Energie und Wasser'];

/** Vorlagen für Unterkonten */
const SUB_PRESETS = [
  { name: 'Urlaub', emoji: '✈️', goal: [800, 2500] },
  { name: 'Notgroschen', emoji: '🛟', goal: [1500, 5000] },
  { name: 'Miete & Fixkosten', emoji: '🏠', goal: null, fixed: true },
  { name: 'Neues Fahrrad', emoji: '🚲', goal: [600, 1800] },
  { name: 'Steuern', emoji: '🧾', goal: null },
  { name: 'Geschenke', emoji: '🎁', goal: [150, 500] },
  { name: 'Führerschein', emoji: '🚗', goal: [1800, 3200] },
  { name: 'Umzug', emoji: '📦', goal: [700, 2000] },
];
const EMOJIS = ['✈️', '🛟', '🏠', '🚲', '🎁', '🚗', '📦', '🧾', '💍', '🎓', '🐶', '🎸', '💻', '🏖️', '🛋️', '🎮', '👶', '⛷️', '📱', '🌱'];
const ACC_COLORS = ['#0a5cff', '#7b3fe4', '#05d05a', '#ff9f0a', '#ff375f', '#30c8d6', '#ffd60a', '#bf5af2', '#64d2ff', '#ac8e68'];

/** Depot-Konten im Portfolio */
const PF_ACCOUNTS = [
  { id: 'brokerage', name: 'Brokerage' },
  { id: 'pm', name: 'Private Markets', promoTitle: 'Investment in Private Markets', promoText: 'Investiere schon ab 1 € in Private Markets.', art: 'art-pm' },
  { id: 'bonds', name: 'Zinsprodukte', promoTitle: 'Investiere in Zinsprodukte', promoText: 'Erhalte 1–3 % mehr Zinsen als auf deinem Tagesgeldkonto.', art: 'art-bonds' },
  { id: 'crypto', name: 'Crypto Wallet', promoTitle: 'Investiere in Crypto', promoText: 'Investiere ab 1 € oder stake deine Assets, und erhalte wöchentliche Rewards.', art: 'art-crypto' },
];

/** Wertpapiere: id, Name, Typ, Depot, Kürzel fürs Icon, Farben, Basispreis */
const INSTRUMENTS = [
  ['msciw', 'MSCI World USD (Dist)', 'etf', 'brokerage', 'MSCI', '#fff', '#000', 98.4],
  ['sp500', 'Core S&P 500 USD (Acc)', 'etf', 'brokerage', 'S&P', '#fff', '#000', 612.3],
  ['ftseaw', 'FTSE All-World USD (Acc)', 'etf', 'brokerage', 'FTSE', '#fff', '#000', 141.9],
  ['dax', 'Core DAX EUR (Acc)', 'etf', 'brokerage', 'DAX', '#fff', '#000', 198.6],
  ['em', 'MSCI Emerging Markets (Acc)', 'etf', 'brokerage', 'EM', '#fff', '#000', 38.2],
  ['ndx', 'NASDAQ 100 USD (Acc)', 'etf', 'brokerage', 'NDX', '#fff', '#000', 1184.5],
  ['stx', 'STOXX Europe 600 EUR (Dist)', 'etf', 'brokerage', 'SXXP', '#fff', '#000', 57.8],
  ['nvda', 'NVIDIA', 'stock', 'brokerage', 'N', '#76b900', '#000', 168.2],
  ['amd', 'AMD', 'stock', 'brokerage', 'A', '#f2f2f2', '#000', 204.7],
  ['mu', 'Micron Technology', 'stock', 'brokerage', 'M', '#0a6fd6', '#fff', 187.3],
  ['uber', 'Uber', 'stock', 'brokerage', 'U', '#111', '#fff', 81.4],
  ['meli', 'MercadoLibre', 'stock', 'brokerage', 'ML', '#ffe600', '#1a2a6c', 1934.0],
  ['adyen', 'Adyen', 'stock', 'brokerage', 'a', '#0abf53', '#fff', 1422.6],
  ['sap', 'SAP', 'stock', 'brokerage', 'SAP', '#0a7bd6', '#fff', 231.8],
  ['sie', 'Siemens', 'stock', 'brokerage', 'S', '#00a7a0', '#fff', 238.4],
  ['alv', 'Allianz', 'stock', 'brokerage', 'A', '#0b3d91', '#fff', 362.1],
  ['gs', 'Goldman Sachs', 'stock', 'brokerage', 'GS', '#7fa4d6', '#fff', 702.9],
  ['asml', 'ASML', 'stock', 'brokerage', 'AS', '#1d2a8a', '#fff', 884.2],
  ['air', 'Airbus', 'stock', 'brokerage', 'AIR', '#0c2f66', '#fff', 204.3],
  ['dte', 'Deutsche Telekom', 'stock', 'brokerage', 'T', '#e20074', '#fff', 30.7],
  ['rhm', 'Rheinmetall', 'stock', 'brokerage', 'R', '#00387b', '#fff', 1688.0],
  ['ttwo', 'Take-Two Interactive', 'stock', 'brokerage', 'T2', '#f2f2f2', '#000', 214.6],
  ['nbis', 'Nebius Group (A)', 'stock', 'brokerage', 'N', '#f2f2f2', '#000', 96.3],
  ['mod', 'Modine Manufacturing', 'stock', 'brokerage', 'M', '#c8102e', '#fff', 148.9],
  ['ohb', 'OHB', 'stock', 'brokerage', 'OHB', '#0e3a5f', '#fff', 112.4],
  ['zal', 'Zalando', 'stock', 'brokerage', 'Z', '#ff6900', '#fff', 27.9],
  ['btc', 'Bitcoin', 'crypto', 'crypto', '₿', '#f7931a', '#fff', 91250],
  ['eth', 'Ethereum', 'crypto', 'crypto', 'Ξ', '#627eea', '#fff', 3120],
  ['sol', 'Solana', 'crypto', 'crypto', 'S', '#14b88f', '#fff', 164.3],
  ['ada', 'Cardano', 'crypto', 'crypto', 'A', '#0033ad', '#fff', 0.62],
  ['pe1', 'Private Equity Global (ELTIF)', 'pm', 'pm', 'PE', '#c9b48a', '#000', 104.2],
  ['inf1', 'Infrastruktur Europa (ELTIF)', 'pm', 'pm', 'IN', '#9db3a0', '#000', 101.7],
  ['pd1', 'Private Debt Select', 'pm', 'pm', 'PD', '#b9a6c9', '#000', 100.9],
  ['bund33', 'Bundesanleihe 2,30 % 2033', 'bond', 'bonds', 'DE', '#ddd', '#000', 99.2],
  ['bund35', 'Bundesanleihe 2,60 % 2035', 'bond', 'bonds', 'DE', '#ddd', '#000', 100.4],
  ['corp29', 'Unternehmensanleihe 4,10 % 2029', 'bond', 'bonds', 'UA', '#ddd', '#000', 101.6],
  ['fr31', 'Staatsanleihe Frankreich 2,9 % 2031', 'bond', 'bonds', 'FR', '#ddd', '#000', 98.7],
].map(([id, name, type, acct, tag, bg, fg, base]) => ({ id, name, type, acct, tag, bg, fg, base }));

const INSTR = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i]));
const TYPE_LABEL = { etf: 'ETFs und Themen', stock: 'Aktien', crypto: 'Crypto', pm: 'Private Markets', bond: 'Zinsprodukte' };
const TYPE_COLOR = { etf: '#0a5cff', stock: '#0a2f8f', crypto: '#f7931a', pm: '#c9b48a', bond: '#7b3fe4' };
const VOLA = { etf: 0.8, stock: 2.4, crypto: 3.6, pm: 0.15, bond: 0.25 };

/* ---------- Generator ---------- */

function generate(seed, opts) {
  opts = opts || {};
  const R = makeRand(seed);
  const now = Date.now();
  let seq = 1;
  const nid = (p) => p + seq++;

  /* Person & Kontakte */
  const last = R.pick(POOL.last);
  const firsts = R.shuffle(POOL.first);
  const user = { first: firsts[0], last };
  const contacts = [];
  for (let i = 1; i <= 2; i++) contacts.push({ id: nid('c'), name: firsts[i] + ' ' + last });
  const lasts = R.shuffle(POOL.last.filter((l) => l !== last));
  for (let i = 3; i <= 7; i++) contacts.push({ id: nid('c'), name: firsts[i] + ' ' + lasts[i] });
  contacts.forEach((c) => (c.iban = makeIban(R)));
  const landlord = { id: nid('c'), name: 'Hausverwaltung ' + lasts[9], iban: makeIban(R) };

  /* Markt */
  const market = {};
  INSTRUMENTS.forEach((ins) => {
    const price = ins.base * R.f(0.86, 1.18);
    market[ins.id] = { price: round2(price), day: round2(R.normal() * VOLA[ins.type]) };
  });
  // ein paar auffällige „Top movers“
  const movers = R.sample(INSTRUMENTS.filter((i) => i.type === 'stock'), 4).map((i) => i.id);
  movers.forEach((id, k) => (market[id].day = round2((k % 2 ? -1 : 1) * R.f(7, 26))));

  /* Depot */
  const etfs = R.shuffle(INSTRUMENTS.filter((i) => i.type === 'etf'));
  const stocks = R.shuffle(INSTRUMENTS.filter((i) => i.type === 'stock'));
  const positions = [];
  const mkPos = (ins, value, perf) => positions.push({ iid: ins.id, value: round2(value), invested: round2(value / (1 + perf / 100)) });
  mkPos(etfs[0], R.f(150, 4200), R.f(1, 24));
  if (R.chance(0.45)) mkPos(etfs[1], R.f(80, 1500), R.f(-3, 15));
  const nStocks = R.i(1, 3);
  for (let i = 0; i < nStocks; i++) mkPos(stocks[i], R.f(10, 900), R.f(-18, 46));
  const watchlist = R.sample(INSTRUMENTS.filter((i) => i.acct === 'brokerage' || i.type === 'crypto'), R.i(6, 12)).map((i) => i.id);
  const recent = R.sample(stocks.slice(3), 5).map((i) => i.id);
  const ipos = R.sample(POOL.ipo, 3);
  const pfMaxDays = R.i(420, 1150);

  /* Cash-Konten */
  const interestRate = R.pick([2, 2.25, 2.5]);
  const accounts = [{ id: 'main', name: 'Hauptkonto', main: true, emoji: '', color: '#ffffff', balance: R.money(140, 2600), iban: makeIban(R), goal: null, rule: null, roundUp: false, createdAt: now - 900 * DAY }];
  if (!opts.noSubs) {
    const presets = R.sample(SUB_PRESETS, 3);
    presets.forEach((p, i) => {
      const goal = p.goal ? Math.round(R.f(p.goal[0], p.goal[1]) / 50) * 50 : null;
      const balance = goal ? R.money(goal * 0.12, goal * 0.85) : R.money(120, 1400);
      accounts.push({
        id: nid('a'), name: p.name, main: false, fixed: !!p.fixed, emoji: p.emoji, color: ACC_COLORS[i],
        balance, iban: makeIban(R), goal,
        rule: { amount: R.pick([25, 50, 75, 100, 150]), day: 1 },
        roundUp: i === 0 && R.chance(0.6), createdAt: now - R.i(60, 300) * DAY,
      });
    });
  }
  const subs = accounts.filter((a) => !a.main);
  const fixedAcc = subs.find((a) => a.fixed);

  /* Sparplan & Abos */
  const planDay = new Date(now + DAY).getDate() <= 28 && R.chance(0.5) ? new Date(now + DAY).getDate() : R.i(2, 27);
  const plans = [{ id: nid('p'), iid: etfs[0].id, amount: R.pick([25, 50, 100, 150]), day: planDay, accountId: 'main' }];
  const subAbo = R.pick(MERCHANTS.filter((m) => m[1] === 'Unterhaltung' && m[2] === m[3]));
  const scheduled = [{ id: nid('s'), title: subAbo[0], amount: subAbo[2], day: new Date(now + R.i(3, 12) * DAY).getDate(), accountId: 'main', category: 'Unterhaltung' }];
  const utility = R.pick(UTILITY);
  const employer = R.pick(POOL.employer);
  const salary = R.money(520, 2400);
  const salaryDay = R.i(1, 4);
  const rent = R.money(380, 890);

  /* Transaktionen */
  const tx = [];
  const add = (o) => {
    const t = Object.assign({ id: nid('t'), status: '', cancelled: false, fx: null, person: false, sub: '', pair: null, dir: null, other: null, iid: null }, o);
    t.amount = round2(t.amount);
    tx.push(t);
    return t;
  };
  const internal = (fromId, toId, amount, date) => {
    const pair = nid('x');
    const from = accounts.find((a) => a.id === fromId);
    const to = accounts.find((a) => a.id === toId);
    add({ accountId: fromId, date, title: to.name, amount: -amount, kind: 'internal', category: 'Umbuchung', icon: 'g_swap', status: 'Umbuchung', pair, dir: 'out', other: toId });
    add({ accountId: toId, date: date + 1, title: from.name, amount, kind: 'internal', category: 'Umbuchung', icon: 'g_swap', status: 'Umbuchung', pair, dir: 'in', other: fromId });
  };

  const today0 = startOfDay(now);
  const at = (d) => {
    const ts = today0 - d * DAY + R.i(7, 21) * 36e5 + R.i(0, 59) * 6e4;
    return d === 0 ? Math.min(ts, now - R.i(4, 90) * 6e4) : ts;
  };
  const cardMerchants = MERCHANTS.filter((m) => !(m[2] === m[3] && m[1] !== 'Transport'));
  for (let d = 0; d < 170; d++) {
    const date = new Date(today0 - d * DAY);
    const dom = date.getDate();
    if (dom === 1) {
      add({ accountId: 'main', date: at(d), title: 'Zinsen', amount: R.money(0.3, 2.6), kind: 'interest', category: 'Zinsen', icon: 'pct' });
      subs.forEach((a) => {
        if (a.rule && +date > a.createdAt) internal('main', a.id, a.rule.amount, at(d));
      });
    }
    if (dom === 2) add({ accountId: fixedAcc ? fixedAcc.id : 'main', date: at(d), title: utility, amount: -R.money(18, 64), kind: 'card', category: 'Wohnen und Versorgung', icon: 'g_doc' });
    if (dom === 3 && fixedAcc && +date > fixedAcc.createdAt) {
      internal('main', fixedAcc.id, rent, at(d) - 36e5);
      add({ accountId: fixedAcc.id, date: at(d), title: landlord.name, amount: -rent, kind: 'transfer', category: 'Wohnen und Versorgung', person: true, status: 'Gesendet', sub: 'Miete' });
    }
    if (dom === salaryDay) add({ accountId: 'main', date: at(d), title: employer, amount: salary + R.money(-20, 20), kind: 'income', category: 'Einnahmen', icon: 'g_down', status: 'Fertig' });
    if (dom === plans[0].day && d > 0) add({ accountId: 'main', date: at(d), title: INSTR[plans[0].iid].name, amount: -plans[0].amount, kind: 'savingsplan', category: 'Investments', icon: 'g_chart', status: 'Sparplan', iid: plans[0].iid });
    if (dom === scheduled[0].day && d > 0) add({ accountId: 'main', date: at(d), title: scheduled[0].title, amount: -scheduled[0].amount, kind: 'card', category: 'Unterhaltung', icon: 'g_play' });

    const n = R.chance(0.52) ? (R.chance(0.3) ? 2 : 1) : 0;
    for (let k = 0; k < n; k++) {
      const m = R.pick(cardMerchants);
      const t = { accountId: 'main', date: at(d), title: m[0], kind: 'card', category: m[1], icon: CATEGORIES[m[1]] };
      if (m[4]) {
        const foreign = Math.round(R.f(m[2], m[3]));
        t.fx = { amount: foreign, cur: m[4] };
        t.amount = -round2(foreign * FX_RATE[m[4]]);
      } else t.amount = -R.money(m[2], m[3]);
      if (R.chance(0.04)) Object.assign(t, { cancelled: true, status: R.pick(['Abgebrochen', 'Abgelaufen']) });
      add(t);
    }
    if (R.chance(0.075)) {
      const c = R.pick(contacts);
      add({ accountId: 'main', date: at(d), title: c.name, amount: -R.money(8, 240), kind: 'transfer', category: 'Überweisungen', person: true, status: 'Gesendet' });
    }
    if (R.chance(0.05)) {
      const c = R.pick(contacts);
      add({ accountId: 'main', date: at(d), title: c.name, amount: R.money(8, 260), kind: 'income', category: 'Einnahmen', person: true, status: 'Fertig' });
    }
    if (R.chance(0.02)) add({ accountId: 'main', date: at(d), title: 'Online-Zahldienst', amount: R.money(5, 60), kind: 'income', category: 'Einnahmen', person: true, status: 'Fertig' });
  }
  // ein, zwei Einzelkäufe, damit „Investments“ auch im laufenden Monat gefüllt ist
  const domNow = new Date(now).getDate();
  [R.i(1, Math.max(1, Math.min(domNow - 1, 12))), R.i(20, 75)].forEach((d, k) => {
    const p = positions[Math.min(positions.length - 1, 1 + k)];
    add({ accountId: 'main', date: at(d), title: INSTR[p.iid].name, amount: -R.pick([10, 15, 25, 50]), kind: 'trade', category: 'Investments', icon: 'g_chart', status: 'Kauf', iid: p.iid });
  });
  // gelegentliche Entnahmen aus Sparzielen
  subs.filter((a) => !a.fixed).forEach((a) => {
    if (R.chance(0.6)) internal(a.id, 'main', R.pick([20, 40, 60, 100]), at(R.i(8, 60)));
  });
  tx.sort((a, b) => b.date - a.date);

  const interestTotal = round2(sum(tx.filter((t) => t.kind === 'interest'), (t) => t.amount) + R.f(4, 380));

  return {
    v: STATE_VERSION, seed, createdAt: now, seq,
    user, contacts, market, positions, watchlist, recent, ipos, pfMaxDays,
    accounts, plans, scheduled, tx,
    card: { accountId: 'main', last4: String(R.i(1000, 9999)) },
    interest: { rate: interestRate, total: interestTotal, accrued: R.money(0.1, 1.4) },
    waitlist: R.chance(0.7),
  };
}

const STATE_VERSION = 3;
