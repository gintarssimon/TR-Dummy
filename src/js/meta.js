'use strict';

/* ---------- Stammdaten für die Wertpapier-Ansicht ----------
 * d: Kurzbeschreibung, cap: grobe Größenordnung des Unternehmenswerts in Mrd. € (wird zufällig variiert),
 * nodiv: zahlt keine Dividende. Alle Kennzahlen in der App sind erfunden. */

const INS_META = {
  nvda: { cap: 3900, d: 'NVIDIA Corporation entwickelt Grafikprozessoren und Chipsysteme für Rechenzentren, künstliche Intelligenz, Gaming und autonomes Fahren.' },
  amd: { cap: 310, nodiv: 1, d: 'Advanced Micro Devices, Inc. entwickelt Prozessoren und Grafikchips für PCs, Rechenzentren und Spielkonsolen.' },
  aapl: { cap: 3300, d: 'Apple Inc. entwickelt und vertreibt iPhone, Mac, iPad und Wearables sowie Software und Dienste wie den App Store und iCloud.' },
  tsla: { cap: 1000, nodiv: 1, d: 'Tesla, Inc. entwickelt und produziert Elektrofahrzeuge, Batteriespeicher und Solarsysteme.' },
  meta: { cap: 1500, d: 'Meta Platforms, Inc. betreibt die sozialen Netzwerke Facebook, Instagram und WhatsApp und entwickelt Hardware für virtuelle Realität.' },
  googl: { cap: 2300, d: 'Alphabet Inc. ist die Muttergesellschaft von Google und bündelt Suche, YouTube, Android, Cloud-Dienste und weitere Technologiegeschäfte.' },
  nflx: { cap: 400, nodiv: 1, d: 'Netflix, Inc. betreibt einen weltweiten Streamingdienst für Serien, Filme und Spiele.' },
  spot: { cap: 110, nodiv: 1, d: 'Spotify Technology S.A. betreibt einen Audio-Streamingdienst für Musik, Podcasts und Hörbücher.' },
  uber: { cap: 160, nodiv: 1, d: 'Uber Technologies, Inc. betreibt eine Plattform für Fahrdienste, Essenslieferungen und Frachtvermittlung.' },
  adyen: { cap: 44, nodiv: 1, d: 'Adyen N.V. ist ein niederländischer Zahlungsdienstleister, der Händlern Zahlungsabwicklung online, mobil und an der Kasse anbietet.' },
  sap: { cap: 270, d: 'SAP SE ist ein deutscher Softwarekonzern und entwickelt Unternehmenssoftware für Finanzen, Logistik und Personal.' },
  sie: { cap: 185, d: 'Siemens AG ist ein Technologiekonzern mit Schwerpunkten in Industrieautomatisierung, Gebäudetechnik und Mobilität.' },
  gs: { cap: 239, d: 'Die Goldman Sachs Group, Inc. ist ein globales Finanzinstitut, das eine Reihe von Finanzdienstleistungen für Unternehmen, Finanzinstitute, Regierungen und Privatpersonen anbietet.' },
  air: { cap: 150, d: 'Airbus SE entwickelt und baut Verkehrsflugzeuge, Hubschrauber sowie Systeme für Raumfahrt und Verteidigung.' },
  dte: { cap: 150, d: 'Die Deutsche Telekom AG ist ein Telekommunikationskonzern mit Mobilfunk-, Festnetz- und IT-Diensten in Europa und den USA.' },
  zal: { cap: 7, nodiv: 1, d: 'Zalando SE betreibt eine Online-Plattform für Mode und Lifestyle in Europa.' },
  bmw: { cap: 52, d: 'Die Bayerische Motoren Werke AG entwickelt und produziert Automobile und Motorräder der Marken BMW, MINI und Rolls-Royce.' },
  vow: { cap: 50, d: 'Die Volkswagen AG ist ein Automobilkonzern mit Marken wie Volkswagen, Audi, Škoda, Seat und Porsche.' },
  ads: { cap: 32, d: 'Die adidas AG entwirft und vertreibt Sportschuhe, Bekleidung und Zubehör.' },
  pum: { cap: 3, d: 'PUMA SE entwirft und vertreibt Sportschuhe, Bekleidung und Accessoires.' },
  lha: { cap: 9, d: 'Die Deutsche Lufthansa AG ist ein Luftfahrtkonzern mit Passagierflug, Fracht und Wartung.' },
  shel: { cap: 190, d: 'Shell plc ist ein Energiekonzern, der Öl und Gas fördert, verarbeitet und vertreibt und in erneuerbare Energien investiert.' },
  ko: { cap: 260, d: 'The Coca-Cola Company stellt alkoholfreie Getränke her und vertreibt sie weltweit unter zahlreichen Marken.' },
  mcd: { cap: 190, d: 'McDonald’s Corporation betreibt und lizenziert eine weltweite Kette von Schnellrestaurants.' },
  pypl: { cap: 56, d: 'PayPal Holdings, Inc. betreibt eine Plattform für digitale Zahlungen zwischen Händlern und Privatpersonen.' },
  v: { cap: 580, d: 'Visa Inc. betreibt ein weltweites Zahlungsnetzwerk für Karten- und digitale Zahlungen.' },
  ma: { cap: 440, d: 'Mastercard Incorporated betreibt ein weltweites Zahlungsnetzwerk und bietet Dienste rund um Kartenzahlungen an.' },
  intc: { cap: 145, nodiv: 1, d: 'Intel Corporation entwickelt und fertigt Prozessoren und Halbleiter für PCs, Rechenzentren und Netzwerke.' },
  pltr: { cap: 370, nodiv: 1, d: 'Palantir Technologies Inc. entwickelt Software zur Analyse großer Datenmengen für Behörden und Unternehmen.' },
  coin: { cap: 68, nodiv: 1, d: 'Coinbase Global, Inc. betreibt eine Handelsplattform für Kryptowährungen.' },
  abnb: { cap: 65, nodiv: 1, d: 'Airbnb, Inc. betreibt einen Online-Marktplatz für Unterkünfte und Erlebnisse.' },
  shop: { cap: 180, nodiv: 1, d: 'Shopify Inc. bietet eine Plattform, mit der Händler Online-Shops aufbauen und betreiben.' },
  snow: { cap: 70, nodiv: 1, d: 'Snowflake Inc. bietet eine cloudbasierte Plattform zum Speichern und Auswerten von Daten.' },
  qcom: { cap: 165, d: 'Qualcomm Incorporated entwickelt Chips und Funktechnologien für Smartphones, Fahrzeuge und vernetzte Geräte.' },
  dhl: { cap: 50, d: 'DHL Group ist ein Logistikkonzern mit Paket-, Express-, Fracht- und Briefgeschäft.' },
  cbk: { cap: 38, d: 'Die Commerzbank AG ist eine deutsche Geschäftsbank für Privat- und Firmenkunden.' },
  dbk: { cap: 60, d: 'Die Deutsche Bank AG ist eine international tätige Universalbank mit Unternehmens-, Investment- und Privatkundengeschäft.' },
  ttwo: { cap: 38, nodiv: 1, d: 'Take-Two Interactive Software, Inc. entwickelt und vertreibt Videospiele, unter anderem über die Labels Rockstar Games und 2K.' },
  arm: { cap: 135, nodiv: 1, d: 'Arm Holdings plc entwirft Prozessorarchitekturen und lizenziert sie an Chiphersteller.' },
  rblx: { cap: 60, nodiv: 1, d: 'Roblox Corporation betreibt eine Online-Plattform, auf der Nutzer Spiele erstellen und spielen.' },
  net: { cap: 65, nodiv: 1, d: 'Cloudflare, Inc. betreibt ein globales Netzwerk für Sicherheit, Performance und Zuverlässigkeit von Websites und Anwendungen.' },
  sony: { cap: 150, d: 'Sony Group Corporation ist ein japanischer Konzern für Unterhaltungselektronik, Spiele, Musik, Film und Bildsensoren.' },
  ba: { cap: 135, nodiv: 1, d: 'The Boeing Company entwickelt und baut Verkehrsflugzeuge sowie Systeme für Verteidigung und Raumfahrt.' },
  nke: { cap: 86, d: 'NIKE, Inc. entwirft und vertreibt Sportschuhe, Bekleidung und Ausrüstung.' },

  btc: { cap: 1800, d: 'Bitcoin ist die erste und nach Marktkapitalisierung größte Kryptowährung. Transaktionen werden dezentral in einer Blockchain festgehalten.' },
  eth: { cap: 380, d: 'Ethereum ist eine Blockchain-Plattform für Smart Contracts und dezentrale Anwendungen; Ether ist ihre Währung.' },
  sol: { cap: 90, d: 'Solana ist eine Blockchain-Plattform für dezentrale Anwendungen mit hohem Transaktionsdurchsatz.' },
  xrp: { cap: 125, d: 'XRP ist die Währung des XRP Ledger, eines Netzwerks für schnelle grenzüberschreitende Zahlungen.' },
  ada: { cap: 22, d: 'Cardano ist eine Blockchain-Plattform mit Proof-of-Stake-Verfahren; ADA ist ihre Währung.' },
  doge: { cap: 28, d: 'Dogecoin ist eine Kryptowährung, die 2013 als Parodie auf Bitcoin entstand.' },
  dot: { cap: 5, d: 'Polkadot verbindet mehrere spezialisierte Blockchains zu einem gemeinsamen Netzwerk.' },
  link: { cap: 12, d: 'Chainlink ist ein Netzwerk, das Smart Contracts mit Daten außerhalb der Blockchain versorgt.' },

  msciw: { cap: 7.4, ter: 0.5, d: 'Der ETF bildet den MSCI World Index ab, der Aktien großer und mittelgroßer Unternehmen aus Industrieländern enthält. Erträge werden ausgeschüttet.' },
  sp500: { cap: 110, ter: 0.07, d: 'Der ETF bildet den S&P 500 ab, der die 500 größten börsennotierten US-Unternehmen umfasst. Erträge werden thesauriert.' },
  ftseaw: { cap: 22, ter: 0.22, d: 'Der ETF bildet den FTSE All-World Index ab und investiert in Aktien aus Industrie- und Schwellenländern. Erträge werden thesauriert.' },
  dax: { cap: 9.8, ter: 0.16, d: 'Der ETF bildet den DAX ab, der die 40 größten börsennotierten Unternehmen Deutschlands umfasst.' },
  em: { cap: 24, ter: 0.18, d: 'Der ETF bildet den MSCI Emerging Markets Index ab und investiert in Aktien aus Schwellenländern.' },
  ndx: { cap: 17, ter: 0.3, d: 'Der ETF bildet den NASDAQ-100 ab, der die 100 größten Nicht-Finanzunternehmen der US-Börse Nasdaq umfasst.' },
  stx: { cap: 8.6, ter: 0.2, d: 'Der ETF bildet den STOXX Europe 600 ab, der 600 Unternehmen aus 17 europäischen Ländern umfasst. Erträge werden ausgeschüttet.' },

  pe1: { cap: 1.2, d: 'Semi-liquider Fonds (ELTIF), der in nicht börsennotierte Unternehmen weltweit investiert. Anteile können nur zu festen Terminen zurückgegeben werden.' },
  inf1: { cap: 0.8, d: 'Semi-liquider Fonds (ELTIF), der in europäische Infrastruktur wie Energie-, Verkehrs- und Datennetze investiert.' },
  pd1: { cap: 0.6, d: 'Fonds, der Kredite an nicht börsennotierte Unternehmen vergibt und daraus laufende Zinserträge erzielt.' },
  bund33: { cap: 26, d: 'Anleihe der Bundesrepublik Deutschland mit fester jährlicher Verzinsung und Rückzahlung zum Nennwert bei Fälligkeit.' },
  bund35: { cap: 31, d: 'Anleihe der Bundesrepublik Deutschland mit fester jährlicher Verzinsung und Rückzahlung zum Nennwert bei Fälligkeit.' },
  corp29: { cap: 0.75, d: 'Unternehmensanleihe mit fester jährlicher Verzinsung. Die Rückzahlung hängt von der Zahlungsfähigkeit des Emittenten ab.' },
  fr31: { cap: 38, d: 'Anleihe der Französischen Republik mit fester jährlicher Verzinsung und Rückzahlung zum Nennwert bei Fälligkeit.' },
};

const NEWS_TEMPLATES = [
  '{n}: Die wichtigsten Kennzahlen im Überblick',
  'Marktbericht: So lief der Handelstag für {n}',
  'Wochenausblick: Diese Termine stehen bei {n} an',
  'Analystenstimmen zu {n} im Überblick',
  '{n} im Fokus: Was Anleger jetzt wissen sollten',
  'Branchencheck: {n} im Vergleich zur Konkurrenz',
];

/** Kennzahlen, Nachrichten und Termine zu einem Wertpapier – deterministisch aus dem Seed, frei erfunden. */
function insFacts(iid) {
  const ins = INSTR[iid];
  const meta = INS_META[iid] || { cap: 10, d: '' };
  const m = S.market[iid];
  const R = makeRand(hashStr(S.seed + '|facts|' + iid));
  const now = Date.now();
  const capV = meta.cap * R.f(0.92, 1.08);
  const capLabel = capV >= 1000 ? nf2.format(capV / 1000) + ' Bio. €' : nf01.format(capV) + ' Mrd. €';
  const prev = m.price / (1 + m.day / 100);
  const spread = m.price * R.f(0.0002, 0.0009);
  const cols = [];
  const price4 = [['Eröffnung', eur(prev * (1 + R.normal() * 0.003))], ['Vortag', eur(prev)], ['Geld', eur(m.price - spread)], ['Brief', eur(m.price + spread)]];
  const range = [['Tageshoch', eur(m.price * R.f(1.002, 1.018))], ['Tagestief', eur(m.price * R.f(0.981, 0.998))], ['52-Wochen-Hoch', eur(m.price * R.f(1.05, 1.42))], ['52-Wochen-Tief', eur(m.price * R.f(0.52, 0.93))]];
  let div = null;
  if (ins.type === 'stock') {
    const pe = R.f(9, 46);
    const yld = meta.nodiv ? 0 : R.f(0.4, 3.9);
    cols.push([['Unternehmenswert', capLabel], ['Kurs-Gewinn-Verhältnis', nf2.format(pe) + '×'], ['Gewinn je Aktie', eur(m.price / pe)], ['Dividendenrendite', yld ? pct2(yld) : '–']]);
    if (yld) div = round2((m.price * yld) / 100 / R.pick([1, 2, 4]));
  } else if (ins.type === 'etf') {
    cols.push([['Fondsvolumen', capLabel], ['Laufende Kosten (TER)', pct2(meta.ter || 0.2)], ['Ertragsverwendung', /Dist/.test(ins.name) ? 'Ausschüttend' : 'Thesaurierend'], ['Replikation', 'Physisch']]);
    if (/Dist/.test(ins.name)) div = round2(m.price * R.f(0.002, 0.006));
  } else if (ins.type === 'crypto') {
    const supply = (capV * 1e9) / m.price;
    const supplyLabel = supply >= 1e9 ? nf01.format(supply / 1e9) + ' Mrd.' : nf01.format(supply / 1e6) + ' Mio.';
    cols.push([['Marktkapitalisierung', capLabel], ['Volumen (24 h)', nf01.format(capV * R.f(0.01, 0.06)) + ' Mrd. €'], ['Im Umlauf', supplyLabel], ['Handel', 'Rund um die Uhr']]);
  } else {
    cols.push([['Volumen', capLabel], ['Mindestanlage', '1 €'], ['Handelbarkeit', ins.type === 'pm' ? 'Monatlich' : 'Börsentäglich'], ['Risikoklasse', ins.type === 'pm' ? '6 von 7' : '2 von 7']]);
  }
  cols.push(price4, range);
  const news = R.sample(NEWS_TEMPLATES, 3).map((t, i) => ({ title: t.replace('{n}', ins.name.replace(/ \(.*\)$/, '')), ago: [R.i(4, 55) + ' Minuten', R.i(2, 9) + ' Stunden', R.i(1, 3) + (i ? ' Tagen' : ' Tag')][i] }));
  news[2].ago = R.i(2, 4) + ' Tagen';
  const events = [];
  if (div) events.push({ date: now + R.i(6, 80) * DAY, title: 'Dividende', sub: eur(div) + ' je Anteil' });
  if (ins.type === 'stock') events.push({ date: now + R.i(9, 85) * DAY, title: 'Quartalszahlen', sub: 'Veröffentlichung der Geschäftszahlen' });
  events.sort((a, b) => a.date - b.date);
  const peers = R.sample(INSTRUMENTS.filter((x) => x.type === (ins.type === 'crypto' ? 'crypto' : 'stock') && x.id !== iid), 5).map((x) => x.id);
  return { desc: meta.d, cols, long: ins.type === 'stock' ? R.i(52, 94) : null, news, events, peers };
}

/**
 * Handelszeiten des Demo-Handelsplatzes: Mo–Fr 7:30–23:00 Uhr. Crypto ist immer handelbar.
 * frac: wie weit der Tageschart nach rechts reicht (läuft über den Handelstag weiter, endet nach Handelsschluss kurz vor dem Rand).
 */
function marketState(ins, ts) {
  if (ins.type === 'crypto') return { open: true, frac: 1 };
  const d = new Date(ts || Date.now());
  const mins = d.getHours() * 60 + d.getMinutes();
  const open = d.getDay() >= 1 && d.getDay() <= 5 && mins >= 450 && mins < 1380;
  return { open, frac: open ? 0.5 + 0.38 * clamp((mins - 450) / 930, 0, 1) : 0.88 };
}
