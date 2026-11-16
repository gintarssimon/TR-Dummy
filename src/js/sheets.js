'use strict';

/* ---------- Sheets (von unten einfahrende Ebenen) ---------- */

const SHEETS = {};

const shTitle = (t, sub) => `<h1 class="sh-title">${t}</h1>${sub ? `<p class="sh-sub">${sub}</p>` : ''}`;
const secHTML = (t, right) => `<div class="sec"><h2>${t}</h2>${right || ''}</div>`;
const kv = (k, v, extra) => `<div class="kv"><span>${k}</span><b>${v}</b>${extra || ''}</div>`;
const rateLabel = () => nf2.format(S.interest.rate).replace(/,?0+$/, '') + NBSP + '%';

function navRow(icon, title, sub, action, extra, end) {
  return `<button class="row" data-a="${action}" ${extra || ''}>
    <span class="row-ic nav"><span class="tx-ic">${ICON[icon]}</span></span>
    <span class="row-main"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>
    ${end ? `<span class="row-end">${end}</span>` : ''}
  </button>`;
}

function accPickRow(a, selected, action, extra) {
  return `<button class="row" data-key="pick-${a.id}" data-a="${action}" data-id="${a.id}" ${extra || ''}>
    <span class="row-ic tx">${accAvatar(a)}</span>
    <span class="row-main"><b>${esc(a.name)}</b><small>${num(a.balance)}</small></span>
    <span class="row-end"><i class="radio ${selected ? 'on' : ''}">${selected ? ICON.check : ''}</i></span>
  </button>`;
}

function accountChips(view, action) {
  if (!subAccounts().length) return '';
  const chip = (id, label) => `<button class="chip ${view === id ? 'on' : ''}" data-a="${action}" data-view="${id}">${label}</button>`;
  return `<div class="chips" data-scroll="chips-${action}">${chip('all', 'Alle Konten')}${S.accounts.map((a) => chip(a.id, esc(a.name))).join('')}</div>`;
}

function txGroupsHTML(list, view) {
  const now = Date.now();
  let out = '';
  let cur = null;
  list.forEach((t) => {
    const label = monthGroupLabel(t.date, now);
    if (label !== cur) {
      out += secHTML(label);
      cur = label;
    }
    out += txRow(t, view);
  });
  return out;
}

/* ---------- Betragseingabe ---------- */

const parseAmt = (s) => (s ? parseFloat(s.replace(',', '.')) || 0 : 0);
const toAmtString = (v) => String(round2(v)).replace('.', ',');
function amtShow(s) {
  if (!s) return '0';
  const parts = s.split(',');
  return nf0.format(+parts[0]) + (parts.length > 1 ? ',' + parts[1] : '');
}
function amtPress(s, k) {
  if (k === 'del') return s.slice(0, -1);
  if (k === ',') return s.includes(',') ? s : s === '' ? '0,' : s + ',';
  if (s === '0') return k;
  const parts = s.split(',');
  if (parts.length > 1) return parts[1].length >= 2 ? s : s + k;
  return parts[0].length >= 6 ? s : s + k;
}
const keypadHTML = () =>
  `<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((k) => `<button data-a="amtKey" data-k="${k}">${k === 'del' ? ICON.del : k}</button>`).join('')}</div>`;

/** Zeile „Von/Nach/Zahlen mit“ mit Konto und Saldo */
const accPick = (label, id, onPick, exclude) => {
  const a = acc(id);
  return {
    label,
    icon: accAvatar(a),
    name: esc(a.name),
    right: num(a.balance),
    pick: onPick ? () => openSheet('pickAccount', { title: label, current: id, exclude, onPick }) : null,
  };
};

SHEETS.amount = {
  viewKey: (p) => (p.done ? 'done' : 'edit'),
  html(p) {
    if (p.done) return `<div class="done"><i>${ICON.check}</i><b>${esc(p.done)}</b></div>`;
    const v = parseAmt(p.amt);
    const err = v > 0 && p.validate ? p.validate(v) : '';
    const rows = p.rows ? p.rows() : [];
    const quick = p.quick ? p.quick() : [];
    return `${shTitle(esc(p.title), p.sub ? esc(p.sub) : '')}
      <div class="pickers">${rows
        .map(
          (r, i) => `<button class="picker" data-a="amtRow" data-i="${i}" ${r.pick ? '' : 'disabled'}>${r.icon}<span class="pk-main"><small>${r.label}</small><b>${r.name}</b></span><span class="pk-right">${r.right || ''}</span>${r.pick ? `<span class="pk-chev">${ICON.chevSmall}</span>` : ''}</button>`
        )
        .join('')}${p.swap && rows.length === 2 ? `<button class="swap" data-a="amtSwap" aria-label="Konten tauschen">${ICON.updown}</button>` : ''}</div>
      <div class="amt ${p.amt ? '' : 'zero'} ${err ? 'bad' : ''}"><span>${amtShow(p.amt)}</span><i>€</i></div>
      <p class="amt-hint ${err ? 'bad' : ''}">${err ? esc(err) : p.hint ? esc(p.hint()) : ''}</p>
      <div class="chips center">${quick.map((q) => `<button class="chip" data-a="amtQuick" data-v="${q.value}">${q.label}</button>`).join('')}</div>`;
  },
  bottom(p) {
    if (p.done) return '';
    const v = parseAmt(p.amt);
    const ok = (v > 0 || (p.allowZero && p.amt !== '')) && !(v > 0 && p.validate && p.validate(v));
    return `${keypadHTML()}<button class="cta" data-a="amtConfirm" ${ok ? '' : 'disabled'}>${p.cta}</button>`;
  },
};

SHEETS.pickAccount = {
  html(p) {
    const list = S.accounts.filter((a) => a.id !== p.exclude);
    return shTitle(esc(p.title)) + '<div class="gap"></div>' + list.map((a) => accPickRow(a, a.id === p.current, 'pickAccount')).join('');
  },
};

SHEETS.pickContact = {
  html() {
    return (
      shTitle('Überweisen', 'An wen möchtest du senden?') +
      secHTML('Kontakte') +
      S.contacts
        .map(
          (c) => `<button class="row" data-a="pickContact" data-id="${c.id}">
            <span class="row-ic"><span class="tx-av">${esc(c.name[0])}</span></span>
            <span class="row-main"><b>${esc(c.name)}</b><small>${ibanPretty(c.iban).slice(0, 9)} ··· ${c.iban.slice(-4)}</small></span>
          </button>`
        )
        .join('')
    );
  },
};

SHEETS.confirm = {
  html(p) {
    return shTitle(esc(p.title)) + `<p class="para">${p.text}</p>`;
  },
  bottom(p) {
    return `<button class="cta ${p.danger ? 'danger' : ''}" data-a="confirmYes">${p.cta}</button><button class="cta ghost" data-a="close">Abbrechen</button>`;
  },
};

/* ---------- Überweisung / Umbuchen ---------- */

SHEETS.transferMenu = {
  html() {
    const subs = subAccounts().length;
    return (
      shTitle('Überweisung', 'Was möchtest du tun?') +
      '<div class="gap"></div>' +
      navRow('g_swap', 'Umbuchen <i class="badge">Neu</i>', subs ? 'Zwischen deinen Konten verschieben' : 'Eröffne zuerst ein Unterkonto', 'flowMove') +
      navRow('g_up', 'Überweisen', 'Geld an eine IBAN senden', 'flowSend') +
      navRow('g_down', 'Einzahlen', 'Geld auf eines deiner Konten einzahlen', 'flowDeposit')
    );
  },
};

const currentCashAcc = () => (ui.tab === 'cash' && ui.cashAcc !== 'all' && acc(ui.cashAcc) ? ui.cashAcc : 'main');

function openMove(fromId, toId) {
  const subs = subAccounts();
  if (!subs.length) return;
  const st = { from: fromId || 'main', to: toId || null };
  if (!st.to || st.to === st.from) st.to = st.from === 'main' ? subs[0].id : 'main';
  const fix = (changed) => {
    if (st.from !== st.to) return;
    const other = S.accounts.find((a) => a.id !== st[changed]);
    st[changed === 'from' ? 'to' : 'from'] = other.id;
  };
  openSheet('amount', {
    title: 'Umbuchen',
    sub: 'Zwischen deinen Konten – sofort und kostenlos',
    amt: '',
    cta: 'Umbuchen',
    swap: () => {
      const f = st.from;
      st.from = st.to;
      st.to = f;
    },
    rows: () => [
      accPick('Von', st.from, (id) => {
        st.from = id;
        fix('from');
      }),
      accPick('Nach', st.to, (id) => {
        st.to = id;
        fix('to');
      }),
    ],
    validate: (v) => (v > acc(st.from).balance + 1e-9 ? 'Nicht genug Guthaben auf „' + acc(st.from).name + '“' : ''),
    quick: () => [{ label: 'Alles', value: acc(st.from).balance }, { label: '10 €', value: 10 }, { label: '50 €', value: 50 }, { label: '100 €', value: 100 }],
    onConfirm: (v) => {
      moveMoney(st.from, st.to, v);
      return eur(v) + ' nach „' + acc(st.to).name + '“ umgebucht';
    },
  });
}

function openSend(contact) {
  const st = { from: currentCashAcc() };
  openSheet('amount', {
    title: 'Überweisen',
    sub: 'An ' + contact.name,
    amt: '',
    cta: 'Senden',
    rows: () => [
      accPick('Von', st.from, (id) => (st.from = id)),
      { label: 'An', icon: `<span class="tx-av">${esc(contact.name[0])}</span>`, name: esc(contact.name), right: ibanTail(contact.iban), pick: null },
    ],
    validate: (v) => (v > acc(st.from).balance + 1e-9 ? 'Nicht genug Guthaben auf „' + acc(st.from).name + '“' : ''),
    quick: () => [{ label: '10 €', value: 10 }, { label: '25 €', value: 25 }, { label: '50 €', value: 50 }],
    onConfirm: (v) => {
      sendMoney(st.from, contact, v);
      return eur(v) + ' an ' + contact.name + ' gesendet';
    },
  });
}

function openDeposit() {
  const st = { to: currentCashAcc() };
  openSheet('amount', {
    title: 'Einzahlen',
    sub: 'Per Überweisung von deinem Referenzkonto',
    amt: '',
    cta: 'Einzahlen',
    rows: () => [accPick('Auf', st.to, (id) => (st.to = id))],
    quick: () => [{ label: '50 €', value: 50 }, { label: '100 €', value: 100 }, { label: '500 €', value: 500 }],
    onConfirm: (v) => {
      depositMoney(st.to, v);
      return eur(v) + ' auf „' + acc(st.to).name + '“ eingezahlt';
    },
  });
}

/* ---------- Unterkonten ---------- */

SHEETS.newAccount = {
  html(p) {
    const edit = !!p.editId;
    const taken = S.accounts.map((a) => a.name);
    const sugg = SUB_PRESETS.filter((s) => !taken.includes(s.name)).slice(0, 6);
    return `${shTitle(edit ? 'Unterkonto bearbeiten' : 'Neues Unterkonto', edit ? '' : 'Eigene IBAN, eigenes Sparziel – verzinst wie dein Hauptkonto')}
      <div class="na-preview"><span class="tx-ic acc big" data-key="pv-${p.icon}">${accIconSVG(p.icon)}</span></div>
      <label class="field"><span>Name</span><input data-f="name" maxlength="22" placeholder="z. B. Urlaub" autocomplete="off" autocapitalize="sentences" enterkeyhint="done"></label>
      ${edit || !sugg.length ? '' : `<div class="chips wrap">${sugg.map((s) => `<button class="chip" data-a="naSuggest" data-name="${esc(s.name)}" data-icon="${s.icon}">${esc(s.name)}</button>`).join('')}</div>`}
      ${secHTML('Symbol')}
      <div class="icon-grid">${ACC_ICON_KEYS.map((k) => `<button class="${k === p.icon ? 'on' : ''}" data-a="naIcon" data-icon="${k}" aria-label="${k}">${accIconSVG(k)}</button>`).join('')}</div>`;
  },
  bottom(p) {
    const name = (p.name || '').trim();
    const dup = S.accounts.some((a) => a.id !== p.editId && a.name.toLowerCase() === name.toLowerCase());
    return `${dup ? '<p class="amt-hint bad">Diesen Namen gibt es schon.</p>' : ''}<button class="cta" data-a="naSave" ${name && !dup ? '' : 'disabled'}>${p.editId ? 'Speichern' : 'Unterkonto eröffnen'}</button>`;
  },
};

function toggleRow(title, sub, on, action, extra) {
  return `<button class="row" data-a="${action}" ${extra || ''}>
    <span class="row-main"><b>${title}</b><small>${sub}</small></span>
    <span class="row-end"><i class="toggle ${on ? 'on' : ''}"></i></span>
  </button>`;
}

SHEETS.accountDetails = {
  html(p) {
    const a = acc(p.id);
    if (!a) return '';
    const idAttr = `data-id="${a.id}"`;
    const settings = a.main
      ? ''
      : `${secHTML('Einstellungen')}
        ${navRow('g_pen', 'Name & Symbol', esc(a.name), 'editAccount', idAttr)}
        ${navRow('g_target', 'Sparziel', a.goal ? eur0(a.goal) : 'Kein Ziel festgelegt', 'editGoal', idAttr)}
        ${navRow('g_repeat', 'Monatliche Regel', a.rule ? eurCompact(a.rule.amount) + ' vom Hauptkonto, am ' + a.rule.day + '. des Monats' : 'Keine Regel', 'editRule', idAttr)}
        ${secHTML('Karte')}
        ${toggleRow('Mit Karte bezahlen', 'Kartenzahlungen von diesem Unterkonto abbuchen', S.card.accountId === a.id, 'toggleCardLink', idAttr)}
        ${toggleRow('Aufrunden', 'Kartenzahlungen auf den nächsten Euro aufrunden und die Differenz hier sparen', a.roundUp, 'toggleRoundUp', idAttr)}
        <div class="gap"></div>
        <button class="row danger" data-a="closeAccount" ${idAttr}><span class="row-ic"><span class="tx-ic red">${ICON.g_trash}</span></span><span class="row-main"><b>Unterkonto schließen</b><small>Guthaben geht zurück aufs Hauptkonto</small></span></button>`;
    return `<div class="det-head">${accAvatar(a, 'big')}<div><h1 class="sh-title">${esc(a.name)}</h1><p class="sh-sub">${eur(a.balance)}</p></div></div>
      ${goalBar(a)}
      <div class="gap"></div>
      <div class="kv"><span>IBAN</span><b class="mono">${ibanPretty(a.iban)}</b></div>
      ${kv('Kontoinhaber', esc(userName()))}
      ${kv('Zinsen p.a.', rateLabel())}
      ${kv('Eröffnet', a.main ? 'Hauptkonto' : dayLong(a.createdAt))}
      <div class="btn-line"><button class="chip" data-a="copyIban" ${idAttr}>${ICON.copy} IBAN kopieren</button>${a.main ? '' : `<button class="chip" data-a="moveTo" ${idAttr}>${ICON.g_swap} Umbuchen</button>`}</div>
      ${settings}`;
  },
};

function openGoal(id) {
  const a = acc(id);
  openSheet('amount', {
    title: 'Sparziel',
    sub: 'Wie viel möchtest du in „' + a.name + '“ ansparen?',
    amt: a.goal ? toAmtString(a.goal) : '',
    cta: 'Sparziel speichern',
    allowZero: true,
    hint: () => (a.goal ? '0 € entfernt das Sparziel' : 'Du siehst deinen Fortschritt direkt im Unterkonto'),
    quick: () => [{ label: '500 €', value: 500 }, { label: '1.000 €', value: 1000 }, { label: '2.500 €', value: 2500 }],
    onConfirm: (v) => {
      a.goal = v > 0 ? round2(v) : null;
      save();
      return v > 0 ? 'Sparziel ' + eur0(v) + ' gespeichert' : 'Sparziel entfernt';
    },
  });
}

function openRule(id) {
  const a = acc(id);
  openSheet('amount', {
    title: 'Monatliche Regel',
    sub: 'Am 1. jedes Monats vom Hauptkonto nach „' + a.name + '“',
    amt: a.rule ? toAmtString(a.rule.amount) : '',
    cta: 'Regel speichern',
    allowZero: true,
    hint: () => (a.rule ? '0 € schaltet die Regel aus' : 'Automatisch sparen – jederzeit änderbar'),
    quick: () => [{ label: '25 €', value: 25 }, { label: '50 €', value: 50 }, { label: '100 €', value: 100 }],
    onConfirm: (v) => {
      a.rule = v > 0 ? { amount: round2(v), day: 1 } : null;
      save();
      return v > 0 ? eurCompact(v) + ' monatlich nach „' + a.name + '“' : 'Regel ausgeschaltet';
    },
  });
}

/* ---------- Karte, Zinsen ---------- */

const roundUpTarget = () => S.accounts.find((a) => a.roundUp) || null;

SHEETS.card = {
  html(p) {
    const c = S.card;
    const linked = acc(c.accountId) || acc('main');
    const subs = subAccounts().length;
    const ru = roundUpTarget();
    const face = p.details
      ? `<span class="pl-num">····${NBSP} ····${NBSP} ····${NBSP} ${c.last4}</span>
         <span class="pl-meta"><i>Karteninhaber</i>${esc(userName())}</span>
         <span class="pl-meta r"><i>Gültig bis</i>${c.exp}</span>
         <b class="pl-link">Details verbergen ${ICON.chevRight}</b>`
      : `${trLogoHTML('on-card')}<i class="pl-chip"></i><b class="pl-link">Details anzeigen ${ICON.chevRight}</b>`;
    return `${shTitle('Karte', 'Classic')}
      <button class="plastic ${c.locked ? 'locked' : ''} ${p.details ? 'details' : ''}" data-a="cardDetails">${face}${c.locked ? `<em class="pl-lock">${ICON.g_lock}Gesperrt</em>` : ''}</button>
      ${secHTML('Einstellungen')}
      ${navRow('g_snow', c.locked ? 'Entsperren' : 'Sperren', c.locked ? 'Karte ist gesperrt' : 'Alle Kartenaktivitäten sperren', 'cardLock')}
      ${navRow('g_coins', 'Zahle mit', esc(linked.name) + (subs ? ' · Konto wählen' : ' · Cash'), 'cardPayWith')}
      ${navRow('g_pin', 'Karten PIN', 'Deine 4-stellige PIN ansehen', 'sheet', 'data-sheet="pin"')}
      ${navRow('g_limit', 'Limits', 'Kontrolliere deine Ausgaben und Abhebungen', 'toast', 'data-msg="Limits: in der Demo nicht verfügbar"')}
      ${navRow('g_nut', 'Verwalten', 'Sicherheit, Einstellungen und Ersatz', 'toast', 'data-msg="Verwalten: in der Demo nicht verfügbar"')}
      ${secHTML('Vorteile')}
      ${navRow('g_up', 'Round up', subs ? (ru ? 'Wechselgeld sparen in „' + esc(ru.name) + '“' : 'Aus · Wechselgeld in ein Unterkonto sparen') : 'Wechselgeld automatisch investieren', subs ? 'cardRoundUp' : 'toast', subs ? '' : 'data-msg="Eröffne ein Unterkonto, um Wechselgeld dorthin zu sparen"')}
      ${navRow('g_percent', 'Saveback', '1 % deiner Kartenzahlungen in den Sparplan', 'toast', 'data-msg="Saveback: in der Demo nicht verfügbar"')}
      ${secHTML('Demo')}
      ${navRow('g_card', 'Kartenzahlung simulieren', 'Bucht vom gewählten Konto ab', 'simulatePay')}`;
  },
};

SHEETS.pin = {
  html() {
    return `${shTitle('Karten PIN', 'Nur du kannst deine PIN sehen')}
      <div class="pin">${S.card.pin.split('').map((d) => `<b>${d}</b>`).join('')}</div>
      <p class="legal">Zufällig erzeugte PIN für die Demo.</p>`;
  },
};

SHEETS.roundUp = {
  html() {
    const cur = roundUpTarget();
    const radio = (on) => `<span class="row-end"><i class="radio ${on ? 'on' : ''}">${on ? ICON.check : ''}</i></span>`;
    return `${shTitle('Round up', 'Jede Kartenzahlung wird auf den nächsten vollen Euro aufgerundet – die Differenz landet im gewählten Unterkonto.')}
      <div class="gap"></div>
      <button class="row" data-key="ru-off" data-a="setRoundUp" data-id=""><span class="row-ic tx"><span class="tx-ic">${ICON.g_minus}</span></span><span class="row-main"><b>Aus</b><small>Kein Aufrunden</small></span>${radio(!cur)}</button>
      ${subAccounts().map((a) => `<button class="row" data-key="ru-${a.id}" data-a="setRoundUp" data-id="${a.id}"><span class="row-ic tx">${accAvatar(a)}</span><span class="row-main"><b>${esc(a.name)}</b><small>${num(a.balance)}</small></span>${radio(cur && cur.id === a.id)}</button>`).join('')}`;
  },
};

SHEETS.interest = {
  html() {
    const now = Date.now();
    const next = nextDayOfMonth(1, now);
    const days = Math.round((next - startOfDay(now)) / DAY);
    const paid = S.tx.filter((t) => t.kind === 'interest').slice(0, 3);
    const subs = subAccounts().length;
    return `${shTitle('Zinsen', 'Nächste Auszahlung am ' + dayShort(next))}
      <div class="gap"></div>
      <div class="kv"><span>Status</span><b class="green">Aktiv</b></div>
      ${kv('Zinsen p.a.', rateLabel())}
      ${kv('Durchschnittssaldo', eur(cashTotal() * 0.94))}
      ${kv('Gesamtertrag', eur(S.interest.total))}
      ${subs ? kv('Verzinste Konten', 'Alle ' + S.accounts.length) : ''}
      <div class="sec"><button class="sec-link" data-a="sheet" data-sheet="transactions" data-view="all" data-q="Zinsen"><h2>Transaktionen</h2>${ICON.chevRight}</button></div>
      <div class="row"><span class="row-ic"><span class="tx-ic pct">%</span></span><span class="row-main"><b>Zinsen</b><small>In ${days} Tagen - Auflaufend</small></span><span class="row-end"><b class="muted">+${eur(S.interest.accrued)}</b></span></div>
      ${paid.map((t) => txRow(t, 'main')).join('')}
      <p class="legal">Kontaktiere uns, wenn du <b>Hilfe benötigst</b></p>`;
  },
  bottom() {
    return `<div class="fab-line"><button class="fab purple" data-a="toast" data-msg="In der Demo nicht verfügbar"><span>Verwalten</span>${ICON.dots}</button></div>`;
  },
};

/* ---------- Transaktionen ---------- */

SHEETS.transactions = {
  html(p) {
    const view = p.view && (p.view === 'all' || acc(p.view)) ? p.view : 'all';
    const q = (p.q || '').trim().toLowerCase();
    let list = txFor(view);
    if (q) list = list.filter((t) => (txTitle(t, view) + ' ' + t.category + ' ' + t.status).toLowerCase().includes(q));
    const soon = q ? null : upcomingSoon(view);
    return `${shTitle('Transaktionen')}
      ${accountChips(view, 'txView')}
      ${soon && soon.list.length
        ? `<div class="sec"><button class="sec-link" data-a="sheet" data-sheet="planned" data-view="${view}"><h2>Geplant</h2>${ICON.chevRight}</button></div>
           <button class="row" data-a="sheet" data-sheet="planned" data-view="${view}">
             <span class="row-ic"><span class="tx-ic ghost">${ICON.g_minus}<em>${soon.list.length}</em></span></span>
             <span class="row-main"><b>${soon.list.length} ${soon.list.length === 1 ? 'Zahlung' : 'Zahlungen'}</b><small>Nächste 14 Tage</small></span>
             <span class="row-end"><b class="muted">${eur(soon.total)}</b></span>
           </button>`
        : ''}
      ${list.length ? txGroupsHTML(list, view) : '<p class="empty">Keine Transaktionen gefunden.</p>'}`;
  },
  bottom() {
    return `<div class="searchbar"><label class="sfield">${ICON.search}<input data-f="q" placeholder="Transaktionen suchen" autocomplete="off" enterkeyhint="search"></label><button class="sq" data-a="toast" data-msg="Filter: in der Demo nicht verfügbar">${ICON.filter}</button></div>`;
  },
};

SHEETS.planned = {
  html(p) {
    const view = p.view && (p.view === 'all' || acc(p.view)) ? p.view : 'all';
    const now = Date.now();
    const list = upcoming(view);
    return (
      shTitle('Geplant', view === 'all' ? 'Alle Konten' : esc(accName(view))) +
      '<div class="gap"></div>' +
      (list.length
        ? list
            .map(
              (u) => `<div class="row">
                <span class="row-ic tx">${u.logo && LOGOS[u.logo] ? brandIcon(u.logo) : u.iid ? insIcon(INSTR[u.iid]) : `<span class="tx-ic">${ICON[u.icon]}</span>`}</span>
                <span class="row-main"><b>${esc(u.title)}</b><small>${inDaysLabel(u.date, now)} · ${dayShort(u.date)} · ${u.sub}</small></span>
                <span class="row-end"><b class="muted">${u.amount > 0 ? '+' : ''}${eurAbs(u.amount)}</b></span>
              </div>`
            )
            .join('')
        : '<p class="empty">Keine geplanten Zahlungen.</p>')
    );
  },
};

SHEETS.txDetail = {
  html(p) {
    const t = S.tx.find((x) => x.id === p.id);
    if (!t) return '';
    const view = p.view || t.accountId;
    const kind = { card: 'Kartenzahlung', transfer: 'Überweisung', income: 'Geldeingang', interest: 'Zinszahlung', savingsplan: 'Sparplan', trade: 'Wertpapierorder', internal: 'Umbuchung' }[t.kind];
    return `<div class="txd-head">${txIcon(t)}</div>
      <h1 class="sh-title">${esc(txTitle(t, view))}</h1>
      <p class="sh-sub">${dayLong(t.date)} · ${timeShort(t.date)}</p>
      <div class="txd-amt ${t.cancelled ? 'strike' : ''}">${t.amount > 0 && !(t.kind === 'internal' && view === 'all') ? '+' : ''}${eurAbs(t.amount)}</div>
      ${kv('Status', t.cancelled ? t.status : t.status === 'Gesendet' ? 'Gesendet' : 'Abgeschlossen')}
      ${kv('Art', kind)}
      ${t.kind === 'internal' ? kv('Von', esc(t.dir === 'out' ? accName(t.accountId) : acc(t.other) ? accName(t.other) : t.title)) + kv('Nach', esc(t.dir === 'out' ? (acc(t.other) ? accName(t.other) : t.title) : accName(t.accountId))) : kv('Konto', esc(accName(t.accountId)))}
      ${t.kind === 'internal' ? '' : kv('Kategorie', esc(t.category))}
      ${t.fx ? kv('Originalbetrag', nf2.format(t.fx.amount) + NBSP + t.fx.cur) : ''}
      ${t.iid ? `<div class="btn-line"><button class="chip" data-a="instrument" data-iid="${t.iid}">${ICON.g_chart} Wertpapier ansehen</button></div>` : ''}
      <p class="legal">Kontaktiere uns, wenn du <b>Hilfe benötigst</b></p>`;
  },
};

/* ---------- Statistik ---------- */

function tangentCircle(A, B, r, gap) {
  const R1 = A.r + r + gap;
  const R2 = B.r + r + gap;
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const d = Math.hypot(dx, dy) || 1;
  const a = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, R1 * R1 - a * a));
  const mx = A.x + (a * dx) / d;
  const my = A.y + (a * dy) / d;
  const p1 = { x: mx + (h * dy) / d, y: my - (h * dx) / d };
  const p2 = { x: mx - (h * dy) / d, y: my + (h * dx) / d };
  return p1.y > p2.y ? p1 : p2;
}

const bubble = (c, color, value, label, action, extra, key) =>
  `<button class="bubble" data-key="bub-${key}" data-a="${action}" ${extra || ''} style="left:${(c.x - c.r).toFixed(1)}px;top:${(c.y - c.r).toFixed(1)}px;width:${(c.r * 2).toFixed(1)}px;height:${(c.r * 2).toFixed(1)}px;background:${color}"><b>${eur0(value)}</b><span>${label}</span></button>`;

function statsOverviewBubbles(st) {
  const vmax = Math.max(st.income, st.spend, st.invest, 1);
  const rad = (v) => (v > 0 ? Math.max(41, 59 * Math.sqrt(v / vmax)) : 38);
  const A = { r: rad(st.income) };
  const B = { r: rad(st.spend) };
  const C = { r: rad(st.invest) };
  A.x = 0;
  A.y = 0;
  const ang = (-29 * Math.PI) / 180;
  B.x = (A.r + B.r + 4) * Math.cos(ang);
  B.y = (A.r + B.r + 4) * Math.sin(ang);
  Object.assign(C, tangentCircle(A, B, C.r, 4));
  const all = [A, B, C];
  const minX = Math.min.apply(null, all.map((c) => c.x - c.r));
  const maxX = Math.max.apply(null, all.map((c) => c.x + c.r));
  const minY = Math.min.apply(null, all.map((c) => c.y - c.r));
  const maxY = Math.max.apply(null, all.map((c) => c.y + c.r));
  const W = 337;
  const offX = (W - (maxX - minX)) / 2 - minX;
  all.forEach((c) => {
    c.x += offX;
    c.y += 8 - minY;
  });
  return `<div class="bubbles" style="height:${(maxY - minY + 16).toFixed(0)}px"><div class="bubbles-in" style="width:${W}px">
    ${bubble(A, 'var(--green)', st.income, 'Einnahmen', 'statMode', 'data-mode="income"', 'income')}
    ${bubble(B, '#7a3ff0', st.spend, 'Ausgaben', 'statMode', 'data-mode="spend"', 'spend')}
    ${bubble(C, '#0a5cff', st.invest, 'Investments', 'statMode', 'data-mode="invest"', 'invest')}
  </div></div>`;
}

function statsCategoryBubbles(st) {
  const vmax = st.cats.length ? st.cats[0].amount : 1;
  let html = `<button class="bubble back" data-a="statMode" data-mode="overview" style="left:-96px;top:44px;width:124px;height:124px;background:var(--green)" aria-label="Zurück zur Übersicht"></button>`;
  let width = 60;
  st.cats.forEach((c, i) => {
    const col = Math.floor(i / 2);
    const top = i % 2 === 0;
    const r = 42 + 9 * Math.sqrt(c.amount / vmax);
    const x = 96 + col * 106;
    const y = top ? 58 + (col % 2 ? -10 : 8) : 166 + (col % 2 ? -6 : 10);
    const op = 0.55 + 0.45 * Math.sqrt(c.amount / vmax);
    html += bubble({ x, y, r }, `rgba(108,58,232,${op.toFixed(2)})`, c.amount, esc(c.name), 'statCat', `data-cat="${esc(c.name)}"`, 'cat-' + i);
    width = Math.max(width, x + r + 28);
  });
  if (!st.cats.length) html += '<p class="empty" style="padding-top:90px;padding-left:80px">Keine Ausgaben in diesem Monat.</p>';
  return `<div class="bubbles scroll" style="height:232px" data-scroll="statbub"><div class="bubbles-in" style="width:${Math.max(337, width)}px">${html}</div></div>`;
}

SHEETS.stats = {
  viewKey: (p) => p.mode || 'overview',
  html(p) {
    const nowMk = monthKey(Date.now());
    if (p.mk === undefined) p.mk = nowMk;
    if (!p.mode) p.mode = 'overview';
    const view = p.view && (p.view === 'all' || acc(p.view)) ? p.view : 'all';
    const st = monthStats(p.mk, view);
    const months = [4, 3, 2, 1, 0].map((d) => nowMk - d);
    const dot = (c) => `<span class="row-ic"><i class="dot" style="background:${c}"></i></span>`;
    let body;
    if (p.mode === 'spend') {
      body =
        statsCategoryBubbles(st) +
        `<div class="sec"><button class="sec-link back" data-a="statMode" data-mode="overview">${ICON.chevLeft}<h2>Ausgaben</h2></button></div>` +
        st.cats
          .map(
            (c, i) => `<button class="row" data-a="statCat" data-cat="${esc(c.name)}">${dot(`rgba(108,58,232,${(0.55 + 0.45 * Math.sqrt(c.amount / st.cats[0].amount)).toFixed(2)})`)}
              <span class="row-main"><b>${esc(c.name)}</b><small>${eur(c.amount)}</small></span><span class="row-end"><b>${pct0((c.amount / st.spend) * 100)}</b></span></button>`
          )
          .join('');
    } else {
      body =
        statsOverviewBubbles(st) +
        secHTML('Kategorien') +
        `<button class="row" data-a="statList" data-kind="income">${dot('var(--green)')}<span class="row-main"><b>Einnahmen</b><small>${eur(st.income)}</small></span></button>
         <button class="row" data-a="statMode" data-mode="spend">${dot('#7a3ff0')}<span class="row-main"><b>Ausgaben</b><small>${eur(st.spend)}</small></span></button>
         <button class="row" data-a="statList" data-kind="invest">${dot('#0a5cff')}<span class="row-main"><b>Investments</b><small>${eur(st.invest)}</small></span></button>`;
    }
    return `${shTitle('Statistik', 'Behalte deine Ausgaben, Investments und Einkünfte im Blick')}
      ${accountChips(view, 'statView')}
      <div class="months" data-scroll="months">${months.map((m) => `<button class="${m === p.mk ? 'on' : ''}" data-a="statMonth" data-mk="${m}">${MON_SHORT[((m % 12) + 12) % 12]}</button>`).join('')}</div>
      ${body}
      <p class="legal">Kontaktiere uns, wenn du <b>Hilfe benötigst</b></p>`;
  },
};

SHEETS.txList = {
  html(p) {
    const list = S.tx.filter(p.filter);
    return shTitle(esc(p.title)) + (list.length ? txGroupsHTML(list, p.view || 'all') : '<p class="empty">Keine Transaktionen.</p>');
  },
};

/* ---------- Suche & Wertpapiere ---------- */

const SEARCH_CATS = [
  { id: 'brokerage', label: 'Aktien, ETFs und Derivate', icon: 'g_pulse' },
  { id: 'pm', label: 'Private Markets', icon: 'g_bank' },
  { id: 'bonds', label: 'Zinsprodukte', icon: 'g_ring' },
  { id: 'crypto', label: 'Crypto', icon: 'g_coin' },
];

function insRow(ins, action, slim) {
  return `<button class="row ${slim ? 'slim' : ''}" data-key="ins-${ins.id}" data-a="${action || 'searchPick'}" data-iid="${ins.id}">
    <span class="row-ic">${insIcon(ins)}</span>
    <span class="row-main"><b>${esc(ins.name)}</b>${slim ? '' : `<small>${eur(S.market[ins.id].price)}</small>`}</span>
    <span class="row-end">${chgHTML(S.market[ins.id].day)}</span>
  </button>`;
}

function ipoCards() {
  const styles = ['beige', 'rose', 'ink'];
  return `<div class="sec"><button class="sec-link" data-a="toast" data-msg="IPOs: in der Demo nicht handelbar"><h2>IPOs</h2>${ICON.chevRight}</button></div>
    <div class="ipos" data-scroll="ipos">${S.ipos
      .map((n, i) => `<button class="ipo ${styles[i % 3]}" data-a="toast" data-msg="${esc(n)}: Zeichnung in der Demo nicht möglich"><em>${esc(n.toUpperCase())}</em><b>${esc(n)} geht an die Börse</b><span>Sei Teil des IPOs.</span></button>`)
      .join('')}</div>`;
}

SHEETS.search = {
  viewKey: (p) => ((p.q || '').trim() ? 'q' : p.cat || 'home'),
  html(p) {
    const q = (p.q || '').trim().toLowerCase();
    if (q) {
      const hits = INSTRUMENTS.filter((i) => (!p.cat || i.acct === p.cat) && (i.name + ' ' + TYPE_LABEL[i.type]).toLowerCase().includes(q));
      return secHTML('Ergebnisse') + (hits.length ? hits.map((i) => insRow(i)).join('') : '<p class="empty">Nichts gefunden. Probiere „ETF“, „Aktien“ oder einen Namen.</p>');
    }
    if (p.cat) {
      const cat = SEARCH_CATS.find((c) => c.id === p.cat);
      const list = INSTRUMENTS.filter((i) => i.acct === p.cat);
      if (p.cat !== 'brokerage') return shTitle(cat.label) + '<div class="gap"></div>' + list.map((i) => insRow(i)).join('');
      const movers = list.filter((i) => i.type === 'stock').sort((a, b) => Math.abs(S.market[b.id].day) - Math.abs(S.market[a.id].day)).slice(0, 5);
      const popular = list.filter((i) => i.type === 'stock').slice(0, 7);
      return `${shTitle(p.title || 'Suche')}
        <div class="sec"><div class="sec-link"><h2>Top movers</h2>${ICON.chevRight}</div></div>
        <div class="cards movers" data-scroll="movers">${movers
          .map((i) => `<button class="card" data-a="searchPick" data-iid="${i.id}">${insIcon(i)}<span class="card-v">${esc(i.name)}</span>${chgHTML(S.market[i.id].day)}</button>`)
          .join('')}</div>
        ${secHTML('Beliebt')}
        <div class="chips wrap">${popular.map((i) => `<button class="chip ins" data-a="searchPick" data-iid="${i.id}">${insIcon(i)}${esc(i.name)}</button>`).join('')}</div>
        ${p.pick ? '' : ipoCards()}
        <div class="sec"><div class="sec-link"><h2>ETFs</h2>${ICON.chevRight}</div></div>
        ${list.filter((i) => i.type === 'etf').map((i) => insRow(i)).join('')}
        <div class="sec"><div class="sec-link"><h2>Aktien</h2>${ICON.chevRight}</div></div>
        ${list.filter((i) => i.type === 'stock').map((i) => insRow(i)).join('')}`;
    }
    return `${shTitle(p.title || 'Suche')}
      <div class="gap"></div>
      ${SEARCH_CATS.map((c) => `<button class="row slim" data-a="searchCat" data-cat="${c.id}"><span class="row-ic nav"><span class="tx-ic">${ICON[c.icon]}</span></span><span class="row-main"><b>${c.label}</b></span></button>`).join('')}
      ${p.pick ? '' : ipoCards()}
      ${secHTML('Zuletzt gesucht')}
      ${S.recent.map((id) => insRow(INSTR[id], 'searchPick', true)).join('')}`;
  },
  bottom(p) {
    return `<div class="searchbar">${p.cat ? `<button class="sq" data-a="searchCat" data-cat="" aria-label="Zurück">${ICON.chevLeft}</button>` : ''}<label class="sfield">${ICON.search}<input data-f="q" placeholder="Suche nach Aktien, ETFs, Kategorien…" autocomplete="off" enterkeyhint="search"></label></div>`;
  },
};

SHEETS.instrument = {
  html(p, sheet) {
    const ins = INSTR[p.iid];
    const m = S.market[p.iid];
    if (!p.tf) p.tf = 'd';
    const series = insSeries(p.iid, p.tf);
    const pos = position(p.iid);
    const wl = S.watchlist.includes(p.iid);
    const plan = S.plans.find((x) => x.iid === p.iid);
    const f = insFacts(p.iid);
    const acc2 = accentFor(ins);
    const ms = marketState(ins);
    const now = Date.now();
    const perf = pos ? posPerf(pos) : insSeries(p.iid, 'y').pct;
    return `<div class="ins-view" style="--acc:${acc2[0]};--acc-fg:${acc2[1]}">
      <div data-chart-root>
        <div class="ins-head">${insIcon(ins, 'md')}<button class="ins-add ${wl ? 'on' : ''}" data-a="toggleWatch" data-iid="${ins.id}" aria-label="Watchlist">${wl ? ICON.check : ICON.plus}</button></div>
        <div class="hero-label ins-name"><span>${esc(ins.name)}</span></div>
        <div class="hero-line pad"><span class="hero-amount" data-chart-amount>${eur(m.price)}</span><span class="hero-delta acc" data-chart-delta>${deltaHTML(series.pct)}</span><span class="hero-date" data-chart-date></span></div>
        ${tfHTML(p.tf, 'insTf')}
        <div class="closed ${ms.open ? 'hide' : ''}">${ICON.moon}<span>Handelsplatz ist geschlossen</span></div>
        ${chartHTML(series, 'ins' + sheet.key)}
      </div>
      <div class="cards" data-scroll="inscards">
        <button class="card" data-a="trade" data-side="buy" data-iid="${ins.id}"><span class="card-l">Position</span>${pos ? `<span class="card-v">${num(pos.value)}</span>` : `<i class="card-plus">${ICON.plus}</i>`}</button>
        <div class="card"><span class="card-l">${pos ? 'Performance' : '1 Jahr'}</span><span class="card-v">${chgHTML(perf)}</span></div>
        <button class="card" data-a="toast" data-msg="Preisalarme: in der Demo nicht verfügbar"><span class="card-l">Aktivität</span><i class="card-bell">${ICON.g_bell}</i></button>
        <button class="card" data-a="insPlan" data-iid="${ins.id}"><span class="card-l">Sparplan</span>${plan ? `<span class="card-v">${eurCompact(plan.amount)}</span>` : `<i class="card-plus">${ICON.plus}</i>`}</button>
      </div>
      <div class="sec"><button class="sec-link" data-a="insMore"><h2>Informationen</h2>${ICON.chevRight}</button></div>
      <p class="ins-desc ${p.more ? 'open' : ''}" data-a="insMore">${esc(f.desc)}</p>
      ${secHTML('Wichtigste Statistiken')}
      <div class="stat-pager" data-scroll="stats${sheet.key}">${f.cols.map((col) => `<div class="stat-col">${col.map((r) => `<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>`).join('')}</div>
      <button class="acc-link" data-a="toast" data-msg="Preisalarme: in der Demo nicht verfügbar">Preisalarme ${ICON.chevRight}</button>
      ${secHTML('Orderbuch')}
      <div class="ob-card"><i class="ob-ic">${ICON.swirl}</i><span><b>Bestpreis</b><small>${ms.open ? 'Geld ' + f.cols[f.cols.length - 2][2][1] + ' · Brief ' + f.cols[f.cols.length - 2][3][1] : 'Öffnet um 7:30 Uhr'}</small></span></div>
      <p class="legal tight">Aggregation aller relevanten Börsen mit handelbaren Kursen. Erfahre mehr über <b>Bestpreis</b>.</p>
      ${f.long
        ? `<div class="sec"><div class="sec-link"><h2>Derivate</h2>${ICON.chevRight}</div></div>
           <div class="ls"><div class="ls-long" style="width:${Math.max(34, f.long)}%"><span>Long</span><b>${pct0(f.long)}</b></div>
           <div class="ls-short"><i style="width:${Math.max(9, 100 - f.long)}%"></i><span>Short${NBSP}${NBSP}<em>${pct0(100 - f.long)}</em></span></div></div>
           <p class="legal tight">Handelsvolumen der letzten 7 Tage</p>`
        : ''}
      <div class="sec"><div class="sec-link"><h2>Nachrichten</h2>${ICON.chevRight}</div></div>
      <div class="news" data-scroll="news${sheet.key}">${f.news.map((n) => `<button class="news-item" data-a="toast" data-msg="Nachrichten sind in der Demo Platzhalter"><b>${esc(n.title)}</b><small>vor ${n.ago}</small></button>`).join('')}</div>
      ${f.events.length
        ? `<div class="sec"><div class="sec-link"><h2>Ereignisse</h2>${ICON.chevRight}</div></div>
           ${f.events.map((e) => `<div class="row"><span class="row-ic ev"><i class="ev-date"><b>${String(new Date(e.date).getDate()).padStart(2, '0')}</b>${MON_SHORT[new Date(e.date).getMonth()].replace('.', '')}</i></span><span class="row-main"><b>${e.title}</b><small>${inDaysLabel(e.date, now)} · ${e.sub}</small></span></div>`).join('')}`
        : ''}
      ${secHTML('User besitzen auch')}
      <div class="cards movers" data-scroll="peers${sheet.key}">${f.peers.map((id) => `<button class="card" data-a="instrument" data-iid="${id}">${insIcon(INSTR[id])}<span class="card-v">${esc(INSTR[id].name)}</span>${chgHTML(S.market[id].day)}</button>`).join('')}</div>
      <p class="legal">Kurse, Kennzahlen, Nachrichten und Termine sind zufällig erzeugt und dienen nur der Demonstration.</p>
    </div>`;
  },
  bottom(p) {
    const acc2 = accentFor(INSTR[p.iid]);
    return `<div class="bottombar inl acc" style="--acc:${acc2[0]};--acc-fg:${acc2[1]}"><button class="pill" data-a="insPlan" data-iid="${p.iid}"><span>Sparplan</span>${ICON.refresh}</button><button class="pill" data-a="tradeMenu" data-iid="${p.iid}"><span>Handeln</span>${ICON.pulse}</button></div>`;
  },
};

SHEETS.tradeMenu = {
  html(p) {
    const ins = INSTR[p.iid];
    const pos = position(p.iid);
    return (
      shTitle('Handeln', esc(ins.name)) +
      '<div class="gap"></div>' +
      navRow('g_down', 'Kaufen', 'Ab 1 € – Betrag frei wählbar', 'trade', `data-side="buy" data-iid="${ins.id}"`) +
      (pos ? navRow('g_up', 'Verkaufen', 'Deine Position: ' + eur(pos.value), 'trade', `data-side="sell" data-iid="${ins.id}"`) : '')
    );
  },
};

function openTrade(iid, side) {
  const ins = INSTR[iid];
  const st = { acct: currentCashAcc() };
  const buy = side === 'buy';
  openSheet('amount', {
    title: buy ? 'Kaufen' : 'Verkaufen',
    sub: ins.name,
    amt: '',
    cta: buy ? 'Jetzt kaufen' : 'Jetzt verkaufen',
    rows: () => [accPick(buy ? 'Zahlen mit' : 'Gutschrift auf', st.acct, (id) => (st.acct = id))],
    validate: (v) => {
      if (buy) return v > acc(st.acct).balance + 1e-9 ? 'Nicht genug Guthaben auf „' + acc(st.acct).name + '“' : '';
      const pos = position(iid);
      return !pos || v > pos.value + 1e-9 ? 'Mehr als deine Position (' + eur(pos ? pos.value : 0) + ')' : '';
    },
    quick: () => (buy ? [{ label: '10 €', value: 10 }, { label: '50 €', value: 50 }, { label: '100 €', value: 100 }] : [{ label: 'Alles', value: position(iid) ? position(iid).value : 0 }, { label: '50 %', value: position(iid) ? round2(position(iid).value / 2) : 0 }]),
    onConfirm: (v) => {
      if (buy) tradeBuy(iid, v, st.acct);
      else tradeSell(iid, v, st.acct);
      return (buy ? 'Kauf' : 'Verkauf') + ' über ' + eur(v) + ' ausgeführt';
    },
  });
}

SHEETS.watchlist = {
  html() {
    return shTitle('Watchlist', S.watchlist.length + ' Werte') + '<div class="gap"></div>' + (S.watchlist.length ? S.watchlist.map((id) => insRow(INSTR[id], 'instrument')).join('') : '<p class="empty">Deine Watchlist ist leer.</p>');
  },
  bottom() {
    return `<div class="fab-line"><button class="fab" data-a="sheet" data-sheet="search"><span>Hinzufügen</span>${ICON.plus}</button></div>`;
  },
};

/* ---------- Sparpläne, Orders, Analytics ---------- */

const pfChips = () => `<div class="chips">${PF_ACCOUNTS.filter((a) => a.id !== 'bonds').map((a) => `<span class="chip">${a.name}</span>`).join('')}</div>`;

SHEETS.plans = {
  html() {
    const now = Date.now();
    const next = S.plans.length ? Math.min.apply(null, S.plans.map((p) => nextDayOfMonth(p.day, now))) : null;
    const nextLabel = next ? inDaysLabel(next, now) : '';
    return `${shTitle('Sparpläne', next ? 'Nächste Ausführung ' + nextLabel.charAt(0).toLowerCase() + nextLabel.slice(1) : 'Regelmäßig investieren – schon ab 1 €')}
      ${pfChips()}
      ${S.plans.length ? secHTML('Aktiv') : ''}
      ${S.plans
        .map((p) => {
          const ins = INSTR[p.iid];
          const from = p.accountId !== 'main' && acc(p.accountId) ? ' · ' + esc(accName(p.accountId)) : '';
          return `<button class="row" data-a="planDetail" data-id="${p.id}"><span class="row-ic">${insIcon(ins)}</span>
            <span class="row-main"><b>${esc(ins.name)}</b><small>${inDaysLabel(nextDayOfMonth(p.day, now), now)} · Monatlich${from}</small></span>
            <span class="row-end"><b>${eurCompact(p.amount)}</b></span></button>`;
        })
        .join('')}
      <p class="legal">Kontaktiere uns, wenn du <b>Hilfe benötigst</b></p>`;
  },
  bottom() {
    return `<div class="fab-line"><button class="fab" data-a="planAdd"><span>Hinzufügen</span>${ICON.plus}</button></div>`;
  },
};

SHEETS.planDetail = {
  html(p) {
    const plan = S.plans.find((x) => x.id === p.id);
    if (!plan) return '';
    const ins = INSTR[plan.iid];
    const from = acc(plan.accountId) || acc('main');
    return `<div class="ins-head">${insIcon(ins, 'lg')}</div>
      ${shTitle(esc(ins.name), 'Sparplan · Monatlich')}
      <div class="gap"></div>
      ${kv('Betrag', eurCompact(plan.amount))}
      ${kv('Ausführung', 'Am ' + plan.day + '. des Monats')}
      ${kv('Nächste Ausführung', dayShort(nextDayOfMonth(plan.day, Date.now())))}
      ${secHTML('Zahlen mit', subAccounts().length ? '<i class="badge">Neu</i>' : '')}
      ${accPickRow(from, false, 'planAccount', `data-plan="${plan.id}"`).replace('<i class="radio "></i>', `<i class="pk-chev">${ICON.chevSmall}</i>`)}
      <div class="gap"></div>
      <button class="row danger" data-a="planDelete" data-id="${plan.id}"><span class="row-ic"><span class="tx-ic red">${ICON.g_trash}</span></span><span class="row-main"><b>Sparplan löschen</b></span></button>`;
  },
};

SHEETS.orders = {
  html() {
    const step = (n, t, s) => `<div class="row"><span class="row-ic"><span class="tx-ic num">${n}</span></span><span class="row-main"><b>${t}</b><small>${s}</small></span></div>`;
    return `${shTitle('Orders', 'Alle offenen Orders bearbeiten')}
      <div class="chips">${PF_ACCOUNTS.map((a) => `<span class="chip">${a.name}</span>`).join('')}</div>
      ${secHTML('So funktioniert es')}
      ${step(1, 'Investment auswählen', 'Aktien oder ETFs')}
      ${step(2, 'Betrag auswählen', 'Ab 1 €')}
      ${step(3, 'Order erteilen', 'Market, Limit oder Stop Order')}
      <p class="legal">Kontaktiere uns, wenn du <b>Hilfe benötigst</b></p>`;
  },
  bottom() {
    return `<div class="fab-line"><button class="fab" data-a="sheet" data-sheet="search" data-cat="brokerage"><span>Hinzufügen</span>${ICON.plus}</button></div>`;
  },
};

SHEETS.analytics = {
  html() {
    const groups = {};
    S.positions.forEach((p) => {
      const t = INSTR[p.iid].type;
      groups[t] = (groups[t] || 0) + p.value;
    });
    const parts = Object.entries(groups).map(([type, value]) => ({ type, value, color: TYPE_COLOR[type] })).sort((a, b) => b.value - a.value);
    const total = sum(parts, (x) => x.value);
    return `${shTitle('Analytics', 'Portfolio')}
      <div class="donut-wrap">${parts.length ? donutSVG(parts) : ''}</div>
      ${secHTML('Assets')}
      ${parts.length
        ? parts.map((x) => `<div class="row"><span class="row-ic"><i class="dot" style="background:${x.color}"></i></span><span class="row-main"><b>${TYPE_LABEL[x.type]}</b><small>${eur(x.value)}</small></span><span class="row-end"><b>${pct2((x.value / total) * 100)}</b></span></div>`).join('')
        : '<p class="empty">Noch keine Investments.</p>'}`;
  },
};

/* ---------- Profil: Konten & IBANs ---------- */

SHEETS.konto = {
  html() {
    return `${shTitle('Konten & Auszüge', esc(userName()))}
      ${secHTML('Cash')}
      ${S.accounts
        .map((a) => `<button class="row" data-a="accountDetails" data-id="${a.id}"><span class="row-ic">${accAvatar(a)}</span><span class="row-main"><b>${esc(a.name)}</b><small class="mono">${ibanPretty(a.iban)}</small></span><span class="row-end"><i class="pk-chev side">${ICON.chevRight}</i></span></button>`)
        .join('')}
      ${secHTML('Dokumente')}
      ${navRow('g_doc', 'Kontoauszug je Unterkonto', 'Monatlich als PDF in der Postbox', 'toast', 'data-msg="Dokumente: in der Demo nicht verfügbar"')}
      ${navRow('g_doc', 'Depotauszug', 'Quartalsweise', 'toast', 'data-msg="Dokumente: in der Demo nicht verfügbar"')}`;
  },
};
