'use strict';

/* ---------- UI-Zustand (nicht persistiert) ---------- */

const ui = {
  tab: 'portfolio',
  pfAcc: 'brokerage',
  pfOverview: false,
  cashAcc: 'all',
  tf: 'max',
  sort: 'buy',
  sheets: [],
};

/* ---------- Bausteine ---------- */

function insIcon(ins, cls) {
  const fs = [0, 12, 9.5, 7.5, 6.2][Math.min(4, ins.tag.length)];
  return `<span class="ins-ic ${cls || ''}" style="background:${ins.bg};color:${ins.fg}"><i style="font-size:${fs}px">${esc(ins.tag)}</i></span>`;
}

function accAvatar(a, cls) {
  const inner = a.main ? '<i class="av-eur">€</i>' : `<i class="av-emoji">${a.emoji}</i>`;
  return `<span class="acc-av ${cls || ''}" style="--c:${a.color}">${inner}</span>`;
}

function txIcon(t) {
  if (t.icon === 'pct') return '<span class="tx-ic pct">%</span>';
  if (t.person) return `<span class="tx-av">${esc(t.title.replace(/^Hausverwaltung /, '')[0] || '?')}</span>`;
  return `<span class="tx-ic">${ICON[t.icon] || ICON.g_doc}</span>`;
}

function txTitle(t, view) {
  if (t.kind !== 'internal') return t.title;
  const other = acc(t.other) ? acc(t.other).name : t.title;
  if (view === 'all') return accName(t.accountId) + ' → ' + other;
  return other;
}

function txAmountHTML(t, view) {
  const neutral = t.kind === 'internal' && view === 'all';
  const txt = (t.amount > 0 && !neutral ? '+' : '') + eurAbs(t.amount);
  return `<b class="${t.cancelled ? 'strike' : ''}">${txt}</b>`;
}

function txRow(t, view) {
  const sub = [dayShort(t.date)];
  if (t.status) sub.push(t.status);
  else if (t.sub) sub.push(t.sub);
  if (view === 'all' && t.kind !== 'internal' && t.accountId !== 'main') sub.push(accName(t.accountId));
  return `<button class="row" data-a="txDetail" data-id="${t.id}" data-view="${view}">
    <span class="row-ic">${txIcon(t)}</span>
    <span class="row-main"><b>${esc(txTitle(t, view))}</b><small>${esc(sub.join(' · '))}</small></span>
    <span class="row-end">${txAmountHTML(t, view)}${t.fx ? `<small>${nf2.format(t.fx.amount)}${NBSP}${t.fx.cur}</small>` : ''}</span>
  </button>`;
}

function upcomingSummaryRow(view) {
  const soon = upcomingSoon(view);
  if (!soon.list.length) return '';
  return `<button class="row" data-a="sheet" data-sheet="planned" data-view="${view}">
    <span class="row-ic"><span class="tx-ic ghost">${ICON.g_minus}<em>${soon.list.length}</em></span></span>
    <span class="row-main"><b>Demnächst</b><small>Nächste 14 Tage</small></span>
    <span class="row-end"><b class="muted">${eur(soon.total)}</b></span>
  </button>`;
}

function accountRow(a, total, action) {
  const share = total > 0 ? a.balance / total : 0;
  return `<button class="row" data-a="${action || 'cashAcc'}" data-id="${a.id}">
    <span class="row-ic">${accAvatar(a)}</span>
    <span class="row-main"><b>${esc(a.name)}</b><small>${eur(a.balance)}${a.goal ? ' · Ziel ' + eur0(a.goal) : ''}</small></span>
    <span class="row-end split"><b>${pct0(share * 100)}</b>${ringSVG(share, a.main ? '#ffffff' : a.color)}</span>
  </button>`;
}

function goalBar(a) {
  if (!a.goal) return '';
  const p = clamp(a.balance / a.goal, 0, 1);
  return `<div class="goal"><div class="goal-track"><i style="width:${(p * 100).toFixed(1)}%;background:${a.color}"></i></div>
    <div class="goal-meta"><span>${pct0(Math.floor(p * 100))} von ${eur0(a.goal)}</span><span>${p >= 1 ? 'Ziel erreicht 🎉' : 'Noch ' + eur(a.goal - a.balance)}</span></div></div>`;
}

const tfHTML = (cur, action) => `<div class="tf">${TF_LIST.map(([k, l]) => `<button class="${k === cur ? 'on' : ''}" data-a="${action}" data-tf="${k}">${l}</button>`).join('')}</div>`;

function headerHTML() {
  const on = (t) => (ui.tab === t ? 'on' : '');
  return `<header class="top">
    <nav class="tabs">
      <button class="tab ${on('portfolio')}" data-a="tab" data-tab="portfolio">Portfolio</button>
      <button class="tab ${on('cash')}" data-a="tab" data-tab="cash">Cash</button>
    </nav>
    <button class="avatar ${on('profile')}" data-a="tab" data-tab="profile" aria-label="Profil">${esc(S.user.first[0])}</button>
  </header>`;
}

const bottomBarHTML = () => `<div class="bottombar">
    <button class="pill" data-a="sheet" data-sheet="search"><span>Suche</span>${ICON.search}</button>
    <button class="pill" data-a="transferMenu"><span>Überweisung</span>${ICON.updown}</button>
  </div>`;

/* ---------- Portfolio ---------- */

function pfCardsHTML() {
  const planSum = sum(S.plans, (p) => p.amount);
  return `<div class="cards" data-scroll="pfcards">
    <button class="card" data-a="sheet" data-sheet="watchlist"><span class="card-l">Watchlist</span><span class="card-v">${S.watchlist.length}</span></button>
    <button class="card" data-a="sheet" data-sheet="plans"><span class="card-l">Sparpläne</span><span class="card-v">${planSum ? eurCompact(planSum) : '<i class="card-plus">' + ICON.plus + '</i>'}</span></button>
    <button class="card" data-a="sheet" data-sheet="orders"><span class="card-l">Order</span><i class="card-plus">${ICON.plus}</i></button>
    <button class="card" data-a="sheet" data-sheet="analytics"><span class="card-l">Analytics</span><i class="card-pie"></i></button>
  </div>`;
}

function positionRow(p) {
  const ins = INSTR[p.iid];
  const pct = ui.sort === 'buy' ? posPerf(p) : S.market[p.iid].day;
  return `<button class="row" data-a="instrument" data-iid="${ins.id}">
    <span class="row-ic">${insIcon(ins)}</span>
    <span class="row-main"><b>${esc(ins.name)}</b><small>${eur(p.value)}</small></span>
    <span class="row-end">${chgHTML(pct)}</span>
  </button>`;
}

function viewPortfolio() {
  if (ui.pfOverview) return viewPortfolioOverview();
  const A = PF_ACCOUNTS.find((a) => a.id === ui.pfAcc) || PF_ACCOUNTS[0];
  const pos = positionsOf(A.id).slice().sort((a, b) => b.value - a.value);
  const total = sum(pos, (p) => p.value);
  const label = `<button class="hero-label" data-a="pfOverview"><span>${A.name}</span><span class="hero-chev">${ICON.chevDown}</span></button>`;

  if (!pos.length && A.promoTitle) {
    return `<div class="hero">${label}<div class="hero-line"><span class="hero-amount">${eur(0)}</span></div></div>
      <button class="promo ${A.art}" data-a="sheet" data-sheet="search" data-cat="${A.id}">
        <span class="promo-art"></span>
        <span class="promo-txt"><b>${A.promoTitle} ${ICON.chevRight}</b><span>${A.promoText}</span></span>
      </button>
      ${pfCardsHTML()}`;
  }

  const series = pfSeries(A.id, ui.tf);
  return `<div data-chart-root>
      <div class="hero">${label}
        <div class="hero-line"><span class="hero-amount" data-chart-amount>${eur(total)}</span><span class="hero-delta" data-chart-delta>${deltaHTML(series.pct)}</span><span class="hero-date" data-chart-date></span></div>
      </div>
      ${tfHTML(ui.tf, 'tf')}
      ${chartHTML(series, 'pf')}
    </div>
    ${pfCardsHTML()}
    <div class="sec"><h2>Investments</h2><button class="sec-btn" data-a="sort">${ui.sort === 'buy' ? 'Seit Kauf' : 'Tagestrend'}${ICON.chevSmall}</button></div>
    ${pos.length ? pos.map(positionRow).join('') : '<p class="empty">Noch keine Investments. Über die Suche findest du Aktien und ETFs.</p>'}
    <p class="legal">Die angegebenen Kurse und die Renditeberechnung beziehen sich auf den unmittelbar vorhergehenden Geldkurs der <b>Handelspartner</b>. Die Wertentwicklung in der Vergangenheit lässt keinen Rückschluss auf zukünftige Ergebnisse zu.</p>`;
}

function viewPortfolioOverview() {
  const total = pfValue();
  return `<div class="hero">
      <button class="hero-label" data-a="pfOverview"><span>Portfolio</span><span class="hero-chev flip">${ICON.chevDown}</span></button>
      <div class="hero-line"><span class="hero-amount">${eur(total)}</span></div>
    </div>
    ${pfCardsHTML()}
    <div class="sec"><h2>Rente</h2></div>
    <button class="row" data-a="toast" data-msg="Altersvorsorgedepot: in der Demo nicht verfügbar">
      <span class="row-main"><b class="gold">Altersvorsorgedepot</b><small class="gold-dim">${S.waitlist ? 'Staatliche Förderung. Du stehst auf der Warteliste.' : 'Staatliche Förderung sichern.'}</small></span>
      <span class="row-end"><i class="gold-badge">${ICON.check}</i></span>
    </button>
    <div class="sec"><h2>Investments</h2><span class="sec-btn">Split${ICON.chevSmall}</span></div>
    ${PF_ACCOUNTS.map((a) => {
      const v = pfValue(a.id);
      const share = total > 0 ? v / total : 0;
      return `<button class="row" data-a="pfAcc" data-id="${a.id}">
        <span class="row-main"><b>${a.name}</b><small>${eur(v)}</small></span>
        <span class="row-end split"><b>${pct0(share * 100)}</b>${ringSVG(share, '#ffffff')}</span>
      </button>`;
    }).join('')}`;
}

/* ---------- Cash ---------- */

function cashCardsMain() {
  const linked = acc(S.card.accountId) || acc('main');
  return `<div class="cards tall" data-scroll="cashcards">
    <button class="card" data-a="sheet" data-sheet="card"><span class="card-l">Karte</span><i class="mini-card"></i><span class="card-foot">${esc(linked.name)}</span></button>
    <button class="card" data-a="sheet" data-sheet="interest"><span class="card-l">Zinsen</span><span class="card-v">${eurCompact(S.interest.total)}</span></button>
    <button class="card" data-a="sheet" data-sheet="stats" data-view="${ui.cashAcc}"><span class="card-l">Analytics</span><i class="card-dots"><b></b><b></b><b></b></i></button>
  </div>`;
}

function cashCardsSub(a) {
  const linked = S.card.accountId === a.id;
  return `<div class="cards tall" data-scroll="subcards">
    <button class="card" data-a="editGoal" data-id="${a.id}"><span class="card-l">Sparziel</span>${a.goal ? `<span class="card-v">${eur0(a.goal)}</span><span class="card-foot">${pct0(Math.floor(clamp(a.balance / a.goal, 0, 1) * 100))} erreicht</span>` : `<i class="card-plus">${ICON.plus}</i>`}</button>
    <button class="card" data-a="editRule" data-id="${a.id}"><span class="card-l">Regel</span>${a.rule ? `<span class="card-v">${eurCompact(a.rule.amount)}</span><span class="card-foot">Monatlich · ${a.rule.day}.</span>` : `<i class="card-plus">${ICON.plus}</i>`}</button>
    <button class="card" data-a="sheet" data-sheet="card"><span class="card-l">Karte</span><i class="mini-card ${linked ? '' : 'off'}"></i><span class="card-foot">${linked ? 'Verknüpft' : 'Nicht verknüpft'}</span></button>
    <button class="card" data-a="accountDetails" data-id="${a.id}"><span class="card-l">Details</span><span class="card-v">IBAN</span><span class="card-foot">${ibanTail(a.iban)}</span></button>
  </div>`;
}

function txPreview(view, n) {
  const list = txFor(view).slice(0, n);
  const head = `<div class="sec"><button class="sec-link" data-a="sheet" data-sheet="transactions" data-view="${view}"><h2>Transaktionen</h2>${ICON.chevRight}</button></div>`;
  const up = upcomingSummaryRow(view);
  if (!list.length && !up) return head + '<p class="empty">Noch keine Transaktionen.</p>';
  return head + up + list.map((t) => txRow(t, view)).join('');
}

function viewCash() {
  if (ui.cashAcc !== 'all' && !acc(ui.cashAcc)) ui.cashAcc = 'all';
  return ui.cashAcc === 'all' ? viewCashOverview() : viewCashAccount(acc(ui.cashAcc));
}

function viewCashOverview() {
  const total = cashTotal();
  const subs = subAccounts();
  const konten = subs.length
    ? `<div class="sec"><h2>Konten</h2>${subs.length < MAX_SUBS ? `<button class="sec-btn" data-a="newAccount">Neu${ICON.plus}</button>` : ''}</div>
       ${S.accounts.map((a) => accountRow(a, total)).join('')}`
    : `<div class="sec"><h2>Konten</h2></div>
       ${accountRow(acc('main'), total)}
       <button class="intro" data-a="newAccount">
         <span class="intro-tag">Neu</span>
         <b>Unterkonten</b>
         <span>Teile dein Cash in bis zu ${MAX_SUBS} Unterkonten auf – jedes mit eigener IBAN, Sparziel und Regeln. Die Zinsen laufen überall weiter.</span>
         <i class="intro-cta">Unterkonto eröffnen ${ICON.chevRight}</i>
       </button>`;
  return `<div class="hero">
      <div class="hero-label"><span>Verfügbar</span></div>
      <div class="hero-line"><span class="hero-amount">${eur(total)}</span>${subs.length ? `<span class="hero-note">${S.accounts.length} Konten</span>` : ''}</div>
    </div>
    ${cashCardsMain()}
    ${konten}
    ${txPreview('all', 4)}
    <p class="legal">Erfahre mehr darüber, wie dein <b>verfügbares Cash</b> verteilt wird. Alle Konten werden mit ${nf2.format(S.interest.rate).replace(/,?0+$/, '')}${NBSP}% p.a. verzinst.</p>`;
}

function viewCashAccount(a) {
  const label = `<button class="hero-label" data-a="cashAcc" data-id="all"><span>${esc(a.name)}</span><span class="hero-chev">${ICON.chevDown}</span></button>`;
  const empty = !a.main && !txFor(a.id).length;
  return `<div class="hero">${label}
      <div class="hero-line"><span class="hero-amount">${eur(a.balance)}</span>${a.main ? '<span class="hero-note">Verfügbar</span>' : `<span class="hero-emoji">${a.emoji}</span>`}</div>
      ${goalBar(a)}
    </div>
    ${a.main ? cashCardsMain() : cashCardsSub(a)}
    ${empty
      ? `<div class="sec"><h2>Transaktionen</h2></div>
         <div class="empty-box"><b>Noch leer</b><span>Buche Geld von einem anderen Konto um oder überweise direkt auf die IBAN dieses Unterkontos.</span>
         <button class="chip on" data-a="moveTo" data-id="${a.id}">Geld umbuchen</button></div>`
      : txPreview(a.id, 5)}
    <p class="legal">${a.main ? 'Dein Hauptkonto. Unterkonten findest du über den Pfeil oben rechts.' : `Unterkonto mit eigener IBAN <b>${ibanPretty(a.iban)}</b>.`}</p>`;
}

/* ---------- Profil ---------- */

function serviceRow(icon, title, sub, action, extra, cls) {
  return `<button class="row ${cls || ''}" data-a="${action}" ${extra || ''}>
    <span class="row-ic"><span class="tx-ic ${cls === 'blue' ? 'blue' : ''}">${ICON[icon]}</span></span>
    <span class="row-main"><b>${title}</b><small>${sub}</small></span>
  </button>`;
}

function viewProfile() {
  const na = 'data-msg="In der Demo nicht verfügbar"';
  return `<div class="hero">
      <div class="hero-label"><span>Persönlich</span></div>
      <div class="hero-line"><span class="hero-amount">${esc(userName())}</span></div>
    </div>
    <div class="cards tall" data-scroll="profcards">
      <button class="card" data-a="sheet" data-sheet="konto"><span class="card-l">Konto</span><i class="card-acct"><b>${esc(S.user.first[0])}</b><em>${ICON.plus}</em></i></button>
      <button class="card" data-a="toast" data-msg="Postbox: keine neuen Dokumente"><span class="card-l">Postbox</span><i class="card-mail">${ICON.mail}</i></button>
      <button class="card" data-a="toast" ${na}><span class="card-l">Einladen</span><span class="card-v">Erhalte 20${NBSP}€</span></button>
    </div>
    <div class="sec"><h2>Services</h2></div>
    ${serviceRow('g_phone', 'Kundenservice', 'Erreiche uns rund um die Uhr', 'toast', na, 'blue')}
    ${serviceRow('g_doc', 'Steuern', 'Steuer ID, Freistellungsauftrag, Verrechnung', 'toast', na)}
    ${serviceRow('g_doc', 'Kontoauszüge', 'Cash, Portfolio, Steuern und mehr', 'sheet', 'data-sheet="konto"')}
    ${serviceRow('g_gear', 'Einstellungen', 'Konto, Sicherheit und mehr', 'toast', na)}
    <div class="sec"><h2>Demo</h2><span class="sec-btn">Seed ${S.seed}</span></div>
    ${serviceRow('g_dice', 'Neue Zufallsdaten', 'Namen, Beträge und Depot neu würfeln', 'reroll')}
    ${serviceRow('g_reset', 'Ohne Unterkonten starten', 'Zeigt den Einstieg ins neue Feature', 'rerollEmpty')}
    ${serviceRow('g_card', 'Kartenzahlung simulieren', 'Bucht vom verknüpften Konto ab', 'simulatePay')}
    <p class="legal">Prototyp zur Präsentation des Konzepts „Unterkonten“. Alle Namen, Beträge und Kurse sind zufällig erzeugt – kein echtes Konto, keine echten Daten.</p>`;
}

function viewMain() {
  if (ui.tab === 'cash') return viewCash();
  if (ui.tab === 'profile') return viewProfile();
  return viewPortfolio();
}
