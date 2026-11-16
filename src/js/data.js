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

/** Händler: [Name, Kategorie, min €, max €, Fremdwährung, Logo] */
const MERCHANTS = [
  ['REWE', 'Einkäufe', 6, 64, null, 'rewe'], ['Lidl', 'Einkäufe', 5, 48, null, 'lidl'], ['ALDI SÜD', 'Einkäufe', 5, 52, null, 'aldisud'],
  ['EDEKA', 'Einkäufe', 7, 58, null, 'edeka'], ['dm-drogerie markt', 'Einkäufe', 4, 32, null, 'dm'], ['Kaufland', 'Einkäufe', 8, 61, null, 'kaufland'],
  ['Rossmann', 'Einkäufe', 3, 27, null, 'rossmann'], ['IKEA', 'Einkäufe', 12, 140, null, 'ikea'], ['Zalando', 'Einkäufe', 19, 120, null, 'zalando'],
  ['MediaMarkt', 'Einkäufe', 9, 180, null, 'mediamarkt'], ['ZARA', 'Einkäufe', 15, 90, null, 'zara'], ['Bäckerei Sonnenschein', 'Einkäufe', 2, 9],
  ['Deutsche Bahn', 'Transport', 9, 89, null, 'deutschebahn'], ['Uber', 'Transport', 7, 28, null, 'uber'], ['BVG', 'Transport', 3.5, 9.9, null, 'bvg'],
  ['Aral', 'Transport', 20, 78, null, 'aral'], ['Shell', 'Transport', 18, 74, null, 'shell'], ['Deutschlandticket', 'Transport', 58, 58, null, 'deutschebahn'],
  ['McDonald’s', 'Bars & Restaurants', 5, 19, null, 'mcdonalds'], ['Starbucks', 'Bars & Restaurants', 4, 13, null, 'starbucks'],
  ['Uber Eats', 'Bars & Restaurants', 12, 36, null, 'ubereats'], ['Lieferando', 'Bars & Restaurants', 13, 38, null, 'justeat'],
  ['Trattoria Da Luca', 'Bars & Restaurants', 14, 52], ['Café Morgenrot', 'Bars & Restaurants', 3, 14], ['Bar Zur Eule', 'Bars & Restaurants', 6, 31],
  ['Spotify', 'Unterhaltung', 10.99, 10.99, null, 'spotify'], ['Netflix', 'Unterhaltung', 13.99, 13.99, null, 'netflix'], ['YouTube Premium', 'Unterhaltung', 12.99, 12.99, null, 'youtube'],
  ['Steam', 'Unterhaltung', 5, 60, null, 'steam'], ['PlayStation Store', 'Unterhaltung', 8, 70, null, 'playstation'], ['Filmpalast Kino', 'Unterhaltung', 9, 26],
  ['Stadt-Apotheke', 'Gesundheit', 4, 29], ['Zahnarztpraxis am Park', 'Gesundheit', 20, 90], ['Fitnessstudio Nordpark', 'Gesundheit', 24.9, 39.9],
  ['Vodafone', 'Wohnen und Versorgung', 15, 40, null, 'vodafone'], ['o2', 'Wohnen und Versorgung', 10, 30, null, 'o2'],
  ['Booking.com', 'Reisen', 45, 190, null, 'bookingdotcom'], ['Airbnb', 'Reisen', 60, 240, null, 'airbnb'], ['Ryanair', 'Reisen', 19, 120, null, 'ryanair'],
  ['Lufthansa', 'Reisen', 89, 320, null, 'lufthansa'], ['SNCF', 'Reisen', 15, 95, null, 'sncf'], ['Carrefour', 'Reisen', 6, 40, null, 'carrefour'],
  ['Tesco', 'Reisen', 4, 30, 'GBP', 'tesco'], ['Hostel Praha', 'Reisen', 480, 2400, 'CZK'], ['Kraków Bistro', 'Reisen', 30, 160, 'PLN'], ['Bergbahn Zermatt', 'Reisen', 12, 70, 'CHF'],
];
const FX_RATE = { CZK: 0.0411, PLN: 0.234, CHF: 1.06, GBP: 1.17 };

const UTILITY = ['Stadtwerke Energie und Wasser', 'Nordstrom Energie', 'Grünwerk Strom & Gas', 'Elbe Energie und Wasser'];

/** Vorlagen für Unterkonten */
const SUB_PRESETS = [
  { name: 'Urlaub', icon: 'plane', goal: [800, 2500] },
  { name: 'Notgroschen', icon: 'shield', goal: [1500, 5000] },
  { name: 'Miete & Fixkosten', icon: 'home', goal: null, fixed: true },
  { name: 'Neues Fahrrad', icon: 'bike', goal: [600, 1800] },
  { name: 'Steuern', icon: 'receipt', goal: null },
  { name: 'Geschenke', icon: 'gift', goal: [150, 500] },
  { name: 'Führerschein', icon: 'car', goal: [1800, 3200] },
  { name: 'Umzug', icon: 'box', goal: [700, 2000] },
];
const ACC_COLORS = ['#2f7bff', '#8a55ff', '#05d05a', '#ff9f0a', '#ff4f6d', '#30c8d6', '#ffd60a', '#d16bff', '#64d2ff', '#c4a77d'];

/** Depot-Konten im Portfolio */
const PF_ACCOUNTS = [
  { id: 'brokerage', name: 'Brokerage' },
  { id: 'pm', name: 'Private Markets', promoTitle: 'Investment in Private Markets', promoText: 'Investiere schon ab 1 € in Private Markets.', art: 'art-pm' },
  { id: 'bonds', name: 'Zinsprodukte', promoTitle: 'Investiere in Zinsprodukte', promoText: 'Erhalte 1–3 % mehr Zinsen als auf deinem Tagesgeldkonto.', art: 'art-bonds' },
  { id: 'crypto', name: 'Crypto Wallet', promoTitle: 'Investiere in Crypto', promoText: 'Investiere ab 1 € oder stake deine Assets, und erhalte wöchentliche Rewards.', art: 'art-crypto' },
];

/** Wertpapiere: id, Name, Typ, Depot, Logo (oder Kürzel für die Text-Kachel), Basispreis. Kurse sind erfunden. */
const INSTRUMENTS = [
  ['msciw', 'MSCI World USD (Dist)', 'etf', 'MSCI', 98.4],
  ['sp500', 'Core S&P 500 USD (Acc)', 'etf', 'S&P', 612.3],
  ['ftseaw', 'FTSE All-World USD (Acc)', 'etf', 'FTSE', 141.9],
  ['dax', 'Core DAX EUR (Acc)', 'etf', 'DAX', 198.6],
  ['em', 'MSCI Emerging Markets (Acc)', 'etf', 'EM', 38.2],
  ['ndx', 'NASDAQ 100 USD (Acc)', 'etf', 'NDX', 1184.5],
  ['stx', 'STOXX Europe 600 EUR (Dist)', 'etf', 'SXXP', 57.8],
  ['nvda', 'NVIDIA', 'stock', 'nvidia', 168.2],
  ['amd', 'AMD', 'stock', 'amd', 204.7],
  ['aapl', 'Apple', 'stock', 'apple', 228.4],
  ['tsla', 'Tesla', 'stock', 'tesla', 312.6],
  ['meta', 'Meta Platforms', 'stock', 'meta', 611.3],
  ['googl', 'Alphabet (A)', 'stock', 'google', 244.9],
  ['nflx', 'Netflix', 'stock', 'netflix', 96.2],
  ['spot', 'Spotify', 'stock', 'spotify', 561.8],
  ['uber', 'Uber', 'stock', 'uber', 81.4],
  ['adyen', 'Adyen', 'stock', 'adyen', 1422.6],
  ['sap', 'SAP', 'stock', 'sap', 231.8],
  ['sie', 'Siemens', 'stock', 'siemens', 238.4],
  ['gs', 'Goldman Sachs', 'stock', 'goldmansachs', 702.9],
  ['air', 'Airbus', 'stock', 'airbus', 204.3],
  ['dte', 'Deutsche Telekom', 'stock', 'deutschetelekom', 30.7],
  ['zal', 'Zalando', 'stock', 'zalando', 27.9],
  ['bmw', 'BMW', 'stock', 'bmw', 86.2],
  ['vow', 'Volkswagen (Vz.)', 'stock', 'volkswagen', 98.1],
  ['ads', 'adidas', 'stock', 'adidas', 178.3],
  ['pum', 'PUMA', 'stock', 'puma', 21.4],
  ['lha', 'Lufthansa', 'stock', 'lufthansa', 7.62],
  ['shel', 'Shell', 'stock', 'shell', 32.3],
  ['ko', 'Coca-Cola', 'stock', 'cocacola', 61.2],
  ['mcd', 'McDonald’s', 'stock', 'mcdonalds', 262.4],
  ['pypl', 'PayPal', 'stock', 'paypal', 58.3],
  ['v', 'Visa', 'stock', 'visa', 296.1],
  ['ma', 'Mastercard', 'stock', 'mastercard', 488.2],
  ['intc', 'Intel', 'stock', 'intel', 33.1],
  ['pltr', 'Palantir', 'stock', 'palantir', 158.4],
  ['coin', 'Coinbase', 'stock', 'coinbase', 268.3],
  ['abnb', 'Airbnb', 'stock', 'airbnb', 104.6],
  ['shop', 'Shopify', 'stock', 'shopify', 138.2],
  ['snow', 'Snowflake', 'stock', 'snowflake', 212.5],
  ['qcom', 'Qualcomm', 'stock', 'qualcomm', 148.3],
  ['dhl', 'DHL Group', 'stock', 'dhl', 44.1],
  ['cbk', 'Commerzbank', 'stock', 'commerzbank', 33.4],
  ['dbk', 'Deutsche Bank', 'stock', 'deutschebank', 31.2],
  ['ttwo', 'Take-Two Interactive', 'stock', 'taketwointeractivesoftware', 214.6],
  ['arm', 'Arm Holdings', 'stock', 'arm', 128.3],
  ['rblx', 'Roblox', 'stock', 'roblox', 92.4],
  ['net', 'Cloudflare', 'stock', 'cloudflare', 186.2],
  ['sony', 'Sony', 'stock', 'sony', 24.3],
  ['ba', 'Boeing', 'stock', 'boeing', 178.1],
  ['nke', 'Nike', 'stock', 'nike', 58.2],
  ['btc', 'Bitcoin', 'crypto', 'bitcoin', 91250],
  ['eth', 'Ethereum', 'crypto', 'ethereum', 3120],
  ['sol', 'Solana', 'crypto', 'solana', 164.3],
  ['xrp', 'XRP', 'crypto', 'xrp', 2.14],
  ['ada', 'Cardano', 'crypto', 'cardano', 0.62],
  ['doge', 'Dogecoin', 'crypto', 'dogecoin', 0.19],
  ['dot', 'Polkadot', 'crypto', 'polkadot', 3.4],
  ['link', 'Chainlink', 'crypto', 'chainlink', 17.8],
  ['pe1', 'Private Equity Global (ELTIF)', 'pm', 'PE', 104.2],
  ['inf1', 'Infrastruktur Europa (ELTIF)', 'pm', 'IN', 101.7],
  ['pd1', 'Private Debt Select', 'pm', 'PD', 100.9],
  ['bund33', 'Bundesanleihe 2,30 % 2033', 'bond', 'DE', 99.2],
  ['bund35', 'Bundesanleihe 2,60 % 2035', 'bond', 'DE', 100.4],
  ['corp29', 'Unternehmensanleihe 4,10 % 2029', 'bond', 'UA', 101.6],
  ['fr31', 'Staatsanleihe Frankreich 2,9 % 2031', 'bond', 'FR', 98.7],
].map(([id, name, type, mark, base]) => {
  const acct = { etf: 'brokerage', stock: 'brokerage', crypto: 'crypto', pm: 'pm', bond: 'bonds' }[type];
  const hasLogo = type === 'stock' || type === 'crypto';
  return { id, name, type, acct, logo: hasLogo ? mark : null, tag: hasLogo ? name[0] : mark, base };
});

const INSTR = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i]));
const TYPE_LABEL = { etf: 'ETFs und Themen', stock: 'Aktien', crypto: 'Crypto', pm: 'Private Markets', bond: 'Zinsprodukte' };
const TYPE_COLOR = { etf: '#0a5cff', stock: '#0a2f8f', crypto: '#f7931a', pm: '#c9b48a', bond: '#7b3fe4' };
const TILE_COLOR = { etf: ['#fff', '#000'], pm: ['#c9b48a', '#000'], bond: ['#dcdce0', '#000'] };
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
  const nStocks = R.i(2, 4);
  for (let i = 0; i < nStocks; i++) mkPos(stocks[i], R.f(10, 900), R.f(-18, 46));
  const watchlist = R.sample(INSTRUMENTS.filter((i) => i.acct === 'brokerage' || i.type === 'crypto'), R.i(6, 12)).map((i) => i.id);
  const recent = R.sample(stocks.slice(4), 5).map((i) => i.id);
  const ipos = R.sample(POOL.ipo, 3);
  const pfMaxDays = R.i(420, 1150);

  /* Cash-Konten */
  const interestRate = R.pick([2, 2.25, 2.5]);
  const accounts = [{ id: 'main', name: 'Hauptkonto', main: true, icon: 'euro', color: '#ffffff', balance: R.money(140, 2600), iban: makeIban(R), goal: null, rule: null, roundUp: false, createdAt: now - 900 * DAY }];
  if (!opts.noSubs) {
    const presets = R.sample(SUB_PRESETS, 3);
    presets.forEach((p, i) => {
      const goal = p.goal ? Math.round(R.f(p.goal[0], p.goal[1]) / 50) * 50 : null;
      const balance = goal ? R.money(goal * 0.12, goal * 0.85) : R.money(120, 1400);
      accounts.push({
        id: nid('a'), name: p.name, main: false, fixed: !!p.fixed, icon: p.icon, color: ACC_COLORS[i],
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
  const scheduled = [{ id: nid('s'), title: subAbo[0], logo: subAbo[5] || null, amount: subAbo[2], day: new Date(now + R.i(3, 12) * DAY).getDate(), accountId: 'main', category: 'Unterhaltung' }];
  const utility = R.pick(UTILITY);
  const employer = R.pick(POOL.employer);
  const salary = R.money(520, 2400);
  const salaryDay = R.i(1, 4);
  const rent = R.money(380, 890);

  /* Transaktionen */
  const tx = [];
  const add = (o) => {
    const t = Object.assign({ id: nid('t'), status: '', cancelled: false, fx: null, person: false, sub: '', pair: null, dir: null, other: null, iid: null, logo: null }, o);
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
    if (dom === scheduled[0].day && d > 0) add({ accountId: 'main', date: at(d), title: scheduled[0].title, logo: scheduled[0].logo, amount: -scheduled[0].amount, kind: 'card', category: 'Unterhaltung', icon: 'g_play' });

    const n = R.chance(0.52) ? (R.chance(0.3) ? 2 : 1) : 0;
    for (let k = 0; k < n; k++) {
      const m = R.pick(cardMerchants);
      const t = { accountId: 'main', date: at(d), title: m[0], kind: 'card', category: m[1], icon: CATEGORIES[m[1]], logo: m[5] || null };
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
    if (R.chance(0.02)) add({ accountId: 'main', date: at(d), title: 'PayPal', logo: 'paypal', amount: R.money(5, 60), kind: 'income', category: 'Einnahmen', icon: 'g_down', status: 'Fertig' });
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

const STATE_VERSION = 4;
