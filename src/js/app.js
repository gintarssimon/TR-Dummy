'use strict';

/* ---------- Rendering ---------- */

let $main;
let $head;
let $view;
let $sheets;
let $toast;
const cache = { head: null, body: null, key: null, force: false };
let sheetSeq = 0;
let suppressClickUntil = 0;
const EASE = 'cubic-bezier(.32,.72,0,1)';
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function saveScroll(root) {
  const m = {};
  root.querySelectorAll('[data-scroll]').forEach((el) => (m[el.dataset.scroll] = el.scrollLeft));
  return m;
}
function restoreScroll(root, m) {
  root.querySelectorAll('[data-scroll]').forEach((el) => {
    if (m[el.dataset.scroll]) el.scrollLeft = m[el.dataset.scroll];
  });
}

/* ---------- DOM-Abgleich ----------
 * Statt innerHTML komplett zu ersetzen, wird der bestehende Baum an das neue HTML angeglichen.
 * Elemente bleiben dadurch erhalten, und CSS-Übergänge (Schalter, Chips, Ringe, Balken, Bubbles) laufen weich. */

let inserted = null;
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-key') : null);

function morphChildren(parent, next) {
  let keyed = null;
  for (let c = parent.firstChild; c; c = c.nextSibling) {
    const k = keyOf(c);
    if (k) (keyed || (keyed = new Map())).set(k, c);
  }
  let cur = parent.firstChild;
  let n = next.firstChild;
  while (n) {
    const following = n.nextSibling;
    const k = keyOf(n);
    let match = null;
    if (k) {
      const cand = keyed && keyed.get(k);
      if (cand && cand.tagName === n.tagName) {
        match = cand;
        keyed.delete(k);
      }
    } else if (cur && cur.nodeType === n.nodeType && !keyOf(cur) && (n.nodeType !== 1 || cur.tagName === n.tagName)) {
      match = cur;
    }
    if (match) {
      if (match === cur) cur = cur.nextSibling;
      else parent.insertBefore(match, cur);
      morphNode(match, n);
    } else {
      parent.insertBefore(n, cur);
      if (inserted && n.nodeType === 1) inserted.push(n);
    }
    n = following;
  }
  while (cur) {
    const nx = cur.nextSibling;
    parent.removeChild(cur);
    cur = nx;
  }
}

function morphNode(a, b) {
  if (a.nodeType !== 1) {
    if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
    return;
  }
  const num0 = a.getAttribute('data-num');
  const aa = a.attributes;
  for (let i = aa.length - 1; i >= 0; i--) if (!b.hasAttribute(aa[i].name)) a.removeAttribute(aa[i].name);
  const ba = b.attributes;
  for (let i = 0; i < ba.length; i++) if (a.getAttribute(ba[i].name) !== ba[i].value) a.setAttribute(ba[i].name, ba[i].value);
  if (a.tagName === 'INPUT') return;
  morphChildren(a, b);
  const num1 = a.getAttribute('data-num');
  if (num0 !== null && num1 !== null && num0 !== num1) tweenNumber(a, +num0, +num1);
}

function morphInto(root, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  inserted = [];
  morphChildren(root, tpl.content);
  const list = inserted;
  inserted = null;
  // wenige neue Zeilen blenden weich ein; bei großen Listenwechseln würde das nur flackern
  if (list.length && list.length <= 10) list.forEach((el) => el.matches('.row, .card') && el.classList.add('m-in'));
}

/** Beträge zählen weich vom alten zum neuen Wert. */
const tweens = new WeakMap();
function tweenNumber(el, from, to) {
  if (reduceMotion()) return;
  const token = {};
  tweens.set(el, token);
  const t0 = performance.now();
  const step = (now) => {
    if (tweens.get(el) !== token || !el.isConnected) return;
    const t = clamp((now - t0) / 650, 0, 1);
    const e = 1 - Math.pow(1 - t, 4);
    el.textContent = eur(t >= 1 ? to : from + (to - from) * e);
    if (t < 1) requestAnimationFrame(step);
  };
  step(t0);
}

function fadeIn(el, dy) {
  if (reduceMotion() || !el.animate) return;
  el.animate([{ opacity: 0, transform: 'translateY(' + (dy === undefined ? 12 : dy) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE });
}

/* ---------- Hauptansicht ---------- */

function mountMain() {
  $main.innerHTML = '<div id="head"></div><div id="viewwrap"><div class="view" id="view"></div></div>' + bottomBarHTML();
  $head = document.getElementById('head');
  $view = document.getElementById('view');
}

/** Wechsel zwischen Ansichten: die alte gleitet als Kopie hinaus, die neue hinein. */
function transitionMain(html, fromKey, toKey) {
  const wrap = $view.parentNode;
  wrap.querySelectorAll('.view-ghost').forEach((g) => g.remove());
  if ($view.getAnimations) $view.getAnimations().forEach((a) => a.cancel());
  if (reduceMotion() || !$view.animate) {
    $view.innerHTML = html;
    $view.scrollTop = 0;
    return;
  }
  const ghost = $view.cloneNode(true);
  ghost.removeAttribute('id');
  ghost.classList.add('view-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  const top = $view.scrollTop;
  const sc = saveScroll($view);
  wrap.insertBefore(ghost, $view);
  ghost.scrollTop = top;
  restoreScroll(ghost, sc);
  $view.innerHTML = html;
  $view.scrollTop = 0;

  const fromTab = fromKey.split(':')[0];
  const toTab = toKey.split(':')[0];
  let out;
  let inn;
  let dur = 460;
  if (fromTab !== toTab) {
    const dir = TAB_ORDER[toTab] > TAB_ORDER[fromTab] ? 1 : -1;
    out = [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(' + -dir * 28 + '%)', opacity: 0 }];
    inn = [{ transform: 'translateX(' + dir * 100 + '%)' }, { transform: 'translateX(0)' }];
  } else if (fromKey === toKey) {
    out = [{ opacity: 1 }, { opacity: 0 }];
    inn = [{ opacity: 0 }, { opacity: 1 }];
    dur = 360;
  } else {
    const deeper = /:(all|overview)$/.test(fromKey);
    out = deeper ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.955)' }] : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(34px)' }];
    inn = deeper ? [{ opacity: 0, transform: 'translateY(34px)' }, { opacity: 1, transform: 'translateY(0)' }] : [{ opacity: 0, transform: 'scale(.955)' }, { opacity: 1, transform: 'scale(1)' }];
    dur = 400;
  }
  const done = () => ghost.remove();
  const ga = ghost.animate(out, { duration: dur * 0.8, easing: EASE, fill: 'forwards' });
  ga.onfinish = done;
  ga.oncancel = done;
  $view.animate(inn, { duration: dur, easing: EASE });
}

function renderMain() {
  const head = headerHTML();
  if (head !== cache.head) {
    if (cache.head === null) $head.innerHTML = head;
    else morphInto($head, head);
    cache.head = head;
  }
  const key = mainViewKey();
  const body = viewMain();
  if (cache.key === null) $view.innerHTML = body;
  else if (key !== cache.key || cache.force) transitionMain(body, cache.key, key);
  else if (body !== cache.body) morphInto($view, body);
  cache.key = key;
  cache.body = body;
  cache.force = false;
  syncCharts($view);
}

/* ---------- Sheets ---------- */

function hydrate(root, sheet) {
  root.querySelectorAll('[data-f]').forEach((inp) => {
    const v = sheet.p[inp.dataset.f] || '';
    if (inp.value !== v) inp.value = v;
  });
}

function sheetNode(sheet) {
  return $sheets.querySelector('.sheet[data-key="' + sheet.key + '"]');
}

function renderSheetNode(sheet, node) {
  const def = SHEETS[sheet.type];
  const body = def.html.call(def, sheet.p, sheet);
  const bottom = def.bottom ? def.bottom.call(def, sheet.p, sheet) : '';
  const vk = def.viewKey ? def.viewKey(sheet.p) : '';
  const $body = node.children[1];
  const $foot = node.children[2];
  const first = node._body === undefined;
  const switched = !first && node._vk !== vk;
  if (node._body !== body) {
    if (first) $body.innerHTML = body;
    else if (switched) {
      $body.innerHTML = body;
      $body.scrollTop = 0;
      fadeIn($body);
    } else morphInto($body, body);
    node._body = body;
    hydrate($body, sheet);
  }
  if (node._bottom !== bottom) {
    if (first) $foot.innerHTML = bottom;
    else if (switched) {
      $foot.innerHTML = bottom;
      fadeIn($foot, 0);
    } else morphInto($foot, bottom);
    $foot.hidden = !bottom;
    node._bottom = bottom;
    hydrate($foot, sheet);
  }
  node._vk = vk;
  syncCharts($body);
}

function renderSheets() {
  const keys = new Set(ui.sheets.map((s) => String(s.key)));
  Array.from($sheets.children).forEach((node) => {
    if (!keys.has(node.dataset.key) && !node.classList.contains('leave')) {
      node.classList.add('leave');
      node.classList.remove('under');
      node.style.transform = '';
      setTimeout(() => node.remove(), 520);
    }
  });
  ui.sheets.forEach((sheet, i) => {
    let node = sheetNode(sheet);
    if (!node) {
      node = document.createElement('section');
      node.className = 'sheet enter';
      node.dataset.key = sheet.key;
      node.dataset.type = sheet.type;
      node.innerHTML = '<div class="sheet-handle" data-a="close"><i></i></div><div class="sheet-scroll"></div><div class="sheet-bottom"></div>';
      $sheets.appendChild(node);
      void node.offsetHeight;
      requestAnimationFrame(() => node.classList.remove('enter'));
    }
    node.classList.toggle('under', i < ui.sheets.length - 1);
    renderSheetNode(sheet, node);
  });
  // die Ebene darunter tritt zurück, solange ein Sheet offen ist
  $main.classList.toggle('behind', ui.sheets.length > 0);
}

function render() {
  renderMain();
  renderSheets();
  const note = document.getElementById('note-seed');
  if (note) note.textContent = 'Seed ' + S.seed;
}

function openSheet(type, p) {
  const sheet = { key: ++sheetSeq, type, p: p || {} };
  ui.sheets.push(sheet);
  render();
  return sheet;
}
function closeSheet(sheet) {
  sheet = sheet || ui.sheets[ui.sheets.length - 1];
  if (!sheet) return;
  ui.sheets = ui.sheets.filter((s) => s !== sheet);
  render();
}
function closeSheetsOfType(type) {
  ui.sheets = ui.sheets.filter((s) => s.type !== type);
}

let toastTimer = null;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
}

/* ---------- Aktionen ---------- */

function openNewAccount() {
  if (subAccounts().length >= MAX_SUBS) {
    toast('Maximal ' + MAX_SUBS + ' Unterkonten möglich');
    return;
  }
  const used = S.accounts.map((a) => a.icon);
  openSheet('newAccount', { name: '', icon: ACC_ICON_KEYS.find((k) => !used.includes(k)) || ACC_ICON_KEYS[0] });
}

function openPlanAmount(iid) {
  const st = { acct: 'main' };
  const day = Math.min(28, new Date(Date.now() + DAY).getDate());
  openSheet('amount', {
    title: 'Sparplan',
    sub: INSTR[iid].name + ' · Monatlich',
    amt: '',
    cta: 'Sparplan erstellen',
    rows: () => [accPick('Zahlen mit', st.acct, (id) => (st.acct = id))],
    quick: () => [{ label: '25 €', value: 25 }, { label: '50 €', value: 50 }, { label: '100 €', value: 100 }],
    onConfirm: (v) => {
      S.plans.push({ id: 'p' + S.seq++, iid, amount: round2(v), day, accountId: st.acct });
      save();
      return 'Sparplan über ' + eurCompact(v) + ' erstellt';
    },
    after: () => closeSheetsOfType('search'),
  });
}

function resetUi(tab) {
  ui.sheets = [];
  ui.tab = tab;
  ui.cashAcc = 'all';
  ui.pfAcc = 'brokerage';
  ui.pfOverview = false;
  cache.force = true;
}

function pulse(sheet, sel) {
  const node = sheetNode(sheet);
  const el = node && node.querySelector(sel);
  if (el && el.animate && !reduceMotion()) el.animate([{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

const LS_ABS = 'cash-unterkonten-abs';

let secretTaps = [];
function openDemoMenu() {
  if (ui.sheets.some((s) => s.type === 'demo')) return;
  try {
    if (navigator.vibrate) navigator.vibrate(12);
  } catch (e) {
    /* ignore */
  }
  openSheet('demo');
}

const ACTIONS = {
  /** Verstecktes Demo-Menü: 5× schnell auf den Namen im Profil tippen (oder lange drücken). */
  secretTap() {
    const now = Date.now();
    secretTaps = secretTaps.filter((t) => now - t < 2500).concat(now);
    if (secretTaps.length >= 5) {
      secretTaps = [];
      openDemoMenu();
    }
  },
  depotRange(d) {
    const i = +d.i;
    const r = i < 0 ? null : { min: DEPOT_RANGES[i][0], max: DEPOT_RANGES[i][1], salt: 0 };
    setDepotRange(r);
    render();
    toast('Depotwert: ' + eur(pfValue('brokerage')));
  },
  depotReroll() {
    const cur = S.depotRange;
    if (!cur) return;
    setDepotRange({ min: cur.min, max: cur.max, salt: (cur.salt || 0) + 1 });
    render();
    toast('Depotwert: ' + eur(pfValue('brokerage')));
  },
  depotCustomSave(d, sheet) {
    const r = customRange(sheet.p);
    if (!r.ok) return;
    setDepotRange({ min: r.min, max: r.max, salt: 0 });
    closeSheet(sheet);
    toast('Depotwert: ' + eur(pfValue('brokerage')));
  },
  /** Tippen auf eine Veränderung schaltet überall zwischen Prozent und absoluten €-Werten um. */
  toggleAbs() {
    ui.abs = !ui.abs;
    try {
      localStorage.setItem(LS_ABS, ui.abs ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
    render();
    if (reduceMotion()) return;
    document.querySelectorAll('#app [data-a="toggleAbs"]:not(.card)').forEach((el) => {
      if (el.animate && !el.closest('.view-ghost')) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: EASE });
    });
  },
  tab(d) {
    if (ui.tab === d.tab) {
      $view.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
      return;
    }
    ui.tab = d.tab;
    render();
  },
  tf(d) {
    ui.tf = d.tf;
    render();
  },
  sort() {
    ui.sort = ui.sort === 'buy' ? 'day' : 'buy';
    render();
  },
  pfOverview() {
    ui.pfOverview = !ui.pfOverview;
    render();
  },
  pfAcc(d) {
    ui.pfAcc = d.id;
    ui.pfOverview = false;
    render();
  },
  cashAcc(d) {
    ui.cashAcc = d.id;
    render();
  },
  sheet(d) {
    const p = {};
    ['view', 'cat', 'q'].forEach((k) => d[k] && (p[k] = d[k]));
    openSheet(d.sheet, p);
  },
  close(d, sheet) {
    closeSheet(sheet);
  },
  toast(d) {
    toast(d.msg);
  },

  /* Überweisung */
  transferMenu() {
    openSheet('transferMenu');
  },
  flowMove() {
    closeSheetsOfType('transferMenu');
    if (!subAccounts().length) {
      toast('Eröffne zuerst ein Unterkonto');
      openNewAccount();
      return;
    }
    const cur = currentCashAcc();
    if (cur === 'main') openMove('main');
    else openMove('main', cur);
  },
  flowSend() {
    closeSheetsOfType('transferMenu');
    openSheet('pickContact');
  },
  flowDeposit() {
    closeSheetsOfType('transferMenu');
    openDeposit();
  },
  moveTo(d) {
    closeSheetsOfType('accountDetails');
    openMove('main', d.id);
  },
  pickContact(d, sheet) {
    const c = S.contacts.find((x) => x.id === d.id);
    ui.sheets = ui.sheets.filter((s) => s !== sheet);
    openSend(c);
  },
  pickAccount(d, sheet) {
    sheet.p.onPick(d.id);
    closeSheet(sheet);
  },
  confirmYes(d, sheet) {
    ui.sheets = ui.sheets.filter((s) => s !== sheet);
    sheet.p.onYes();
    render();
  },

  /* Betragseingabe */
  amtKey(d, sheet) {
    const before = sheet.p.amt || '';
    sheet.p.amt = amtPress(before, d.k);
    renderSheets();
    if (sheet.p.amt !== before) pulse(sheet, '.amt');
  },
  amtQuick(d, sheet) {
    sheet.p.amt = toAmtString(+d.v);
    renderSheets();
    pulse(sheet, '.amt');
  },
  amtRow(d, sheet) {
    const r = sheet.p.rows()[+d.i];
    if (r && r.pick) r.pick();
  },
  amtSwap(d, sheet) {
    sheet.p.swap();
    renderSheets();
    const node = sheetNode(sheet);
    const sw = node && node.querySelector('.swap');
    if (sw && sw.animate && !reduceMotion()) sw.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(180deg)' }], { duration: 380, easing: EASE });
  },
  amtConfirm(d, sheet) {
    const p = sheet.p;
    if (p.done) return;
    p.done = p.onConfirm(parseAmt(p.amt)) || 'Erledigt';
    render();
    setTimeout(() => {
      if (p.after) p.after();
      closeSheet(sheet);
      render();
    }, 1250);
  },

  /* Unterkonten */
  newAccount() {
    openNewAccount();
  },
  naIcon(d, sheet) {
    sheet.p.icon = d.icon;
    renderSheets();
  },
  naSuggest(d, sheet) {
    sheet.p.name = d.name;
    sheet.p.icon = d.icon;
    renderSheets();
    hydrate(sheetNode(sheet), sheet);
  },
  naSave(d, sheet) {
    const p = sheet.p;
    const name = (p.name || '').trim();
    if (!name) return;
    if (p.editId) {
      const a = acc(p.editId);
      a.name = name;
      a.icon = p.icon;
      save();
      closeSheet(sheet);
      toast('Gespeichert');
      return;
    }
    const a = createAccount({ name, icon: p.icon });
    resetUi('cash');
    ui.cashAcc = a.id;
    render();
    toast('Unterkonto „' + name + '“ eröffnet');
  },
  editAccount(d) {
    const a = acc(d.id);
    openSheet('newAccount', { editId: a.id, name: a.name, icon: a.icon });
  },
  editGoal(d) {
    openGoal(d.id);
  },
  editRule(d) {
    openRule(d.id);
  },
  accountDetails(d) {
    openSheet('accountDetails', { id: d.id });
  },
  copyIban(d) {
    const iban = ibanPretty(acc(d.id).iban);
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(iban).catch(() => {});
    } catch (e) {
      /* ignore */
    }
    toast('IBAN kopiert');
  },
  toggleCardLink(d) {
    S.card.accountId = S.card.accountId === d.id ? 'main' : d.id;
    save();
    render();
    toast('Karte bucht jetzt von „' + accName(S.card.accountId) + '“ ab');
  },
  toggleRoundUp(d) {
    const a = acc(d.id);
    const on = !a.roundUp;
    S.accounts.forEach((x) => (x.roundUp = false));
    a.roundUp = on;
    save();
    render();
  },
  setRoundUp(d, sheet) {
    S.accounts.forEach((x) => (x.roundUp = x.id === d.id));
    save();
    render();
    setTimeout(() => closeSheet(sheet), 260);
  },
  cardDetails(d, sheet) {
    sheet.p.details = !sheet.p.details;
    renderSheets();
    const node = sheetNode(sheet);
    const card = node && node.querySelector('.plastic');
    if (card && card.animate && !reduceMotion()) card.animate([{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0)' }], { duration: 420, easing: EASE });
  },
  cardLock() {
    S.card.locked = !S.card.locked;
    save();
    render();
    toast(S.card.locked ? 'Karte gesperrt' : 'Karte entsperrt');
  },
  cardPayWith() {
    openSheet('pickAccount', {
      title: 'Zahle mit',
      current: S.card.accountId,
      onPick: (id) => {
        if (id === S.card.accountId) return;
        S.card.accountId = id;
        save();
        toast('Karte bucht jetzt von „' + accName(id) + '“ ab');
      },
    });
  },
  cardRoundUp() {
    openSheet('roundUp');
  },
  closeAccount(d) {
    const a = acc(d.id);
    openSheet('confirm', {
      title: 'Unterkonto schließen?',
      text: `„${esc(a.name)}“ wird geschlossen. ${a.balance > 0 ? `Das Guthaben von <b>${eur(a.balance)}</b> wird auf dein Hauptkonto umgebucht. ` : ''}Die IBAN des Unterkontos ist danach nicht mehr erreichbar.`,
      cta: 'Unterkonto schließen',
      danger: true,
      onYes: () => {
        const name = a.name;
        closeAccount(a.id);
        resetUi('cash');
        toast('Unterkonto „' + name + '“ geschlossen');
      },
    });
  },
  simulatePay() {
    const r = simulateCardPayment();
    if (r.error) toast(r.error);
    else toast(r.merchant + ' · ' + eur(r.amount) + ' von „' + r.from.name + '“' + (r.rounded ? ' · ' + eur(r.rounded) + ' aufgerundet' : ''));
    render();
  },
  reroll() {
    reroll();
    resetUi('portfolio');
    render();
    toast('Neue Zufallsdaten · Seed ' + S.seed);
  },
  rerollEmpty() {
    reroll({ noSubs: true });
    resetUi('cash');
    render();
    toast('Start ohne Unterkonten · Seed ' + S.seed);
  },

  /* Transaktionen & Statistik */
  txDetail(d) {
    openSheet('txDetail', { id: d.id, view: d.view });
  },
  txView(d, sheet) {
    sheet.p.view = d.view;
    renderSheets();
    sheetNode(sheet).children[1].scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  },
  statView(d, sheet) {
    sheet.p.view = d.view;
    renderSheets();
  },
  statMonth(d, sheet) {
    sheet.p.mk = +d.mk;
    renderSheets();
  },
  statMode(d, sheet) {
    if (d.mode === 'income' || d.mode === 'invest') return ACTIONS.statList({ kind: d.mode }, sheet);
    sheet.p.mode = d.mode;
    renderSheets();
  },
  statList(d, sheet) {
    const p = sheet.p;
    const view = p.view || 'all';
    const base = (t) => monthKey(t.date) === p.mk && !t.cancelled && t.kind !== 'internal' && (view === 'all' || t.accountId === view);
    const filter = d.kind === 'income' ? (t) => base(t) && t.amount > 0 && !isInvestTx(t) : (t) => base(t) && isInvestTx(t);
    openSheet('txList', { title: d.kind === 'income' ? 'Einnahmen' : 'Investments', filter, view });
  },
  statCat(d, sheet) {
    const view = sheet.p.view || 'all';
    openSheet('txList', { title: d.cat, view, filter: (t) => t.category === d.cat && t.kind !== 'internal' && (view === 'all' || t.accountId === view) });
  },

  /* Suche & Handel */
  searchCat(d, sheet) {
    sheet.p.cat = d.cat || null;
    sheet.p.q = '';
    renderSheets();
    hydrate(sheetNode(sheet), sheet);
  },
  searchPick(d, sheet) {
    if (sheet && sheet.p.pick) return sheet.p.pick(d.iid);
    S.recent = [d.iid].concat(S.recent.filter((x) => x !== d.iid)).slice(0, 5);
    save();
    openSheet('instrument', { iid: d.iid });
  },
  instrument(d) {
    openSheet('instrument', { iid: d.iid });
  },
  insTf(d, sheet) {
    sheet.p.tf = d.tf;
    renderSheets();
  },
  toggleWatch(d) {
    const on = S.watchlist.includes(d.iid);
    S.watchlist = on ? S.watchlist.filter((x) => x !== d.iid) : [d.iid].concat(S.watchlist);
    save();
    render();
    toast(on ? 'Von der Watchlist entfernt' : 'Zur Watchlist hinzugefügt');
  },
  trade(d) {
    closeSheetsOfType('tradeMenu');
    openTrade(d.iid, d.side);
  },
  tradeMenu(d) {
    if (!position(d.iid)) return openTrade(d.iid, 'buy');
    openSheet('tradeMenu', { iid: d.iid });
  },
  insMore(d, sheet) {
    sheet.p.more = !sheet.p.more;
    renderSheets();
  },
  insPlan(d) {
    const plan = S.plans.find((x) => x.iid === d.iid);
    if (plan) openSheet('planDetail', { id: plan.id });
    else openPlanAmount(d.iid);
  },
  planAdd() {
    openSheet('search', { cat: 'brokerage', title: 'Sparplan hinzufügen', pick: openPlanAmount });
  },
  planDetail(d) {
    openSheet('planDetail', { id: d.id });
  },
  planAccount(d) {
    const plan = S.plans.find((x) => x.id === d.plan);
    openSheet('pickAccount', {
      title: 'Zahlen mit',
      current: plan.accountId,
      onPick: (id) => {
        plan.accountId = id;
        save();
      },
    });
  },
  planDelete(d, sheet) {
    S.plans = S.plans.filter((x) => x.id !== d.id);
    save();
    closeSheet(sheet);
    toast('Sparplan gelöscht');
  },
};

/* ---------- Events ---------- */

function sheetOf(el) {
  const node = el.closest('.sheet');
  if (!node) return null;
  return ui.sheets.find((s) => String(s.key) === node.dataset.key) || null;
}

function bindEvents() {
  const app = document.getElementById('app');

  app.addEventListener('click', (e) => {
    if (Date.now() < suppressClickUntil) return;
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled || el.closest('.view-ghost')) return;
    const fn = ACTIONS[el.dataset.a];
    if (!fn) return;
    const node = el.closest('.sheet');
    if (node && node.classList.contains('leave')) return;
    fn(el.dataset, sheetOf(el), el);
  });

  app.addEventListener('input', (e) => {
    const el = e.target.closest('[data-f]');
    if (!el) return;
    const sheet = sheetOf(el);
    if (!sheet) return;
    sheet.p[el.dataset.f] = el.value;
    renderSheets();
  });

  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input')) e.target.blur();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.sheets.length && !ui.sheets[ui.sheets.length - 1].p.done) closeSheet();
  });
  app.addEventListener('animationend', (e) => {
    if (e.animationName === 'mIn') e.target.classList.remove('m-in');
  });

  /* Verstecktes Demo-Menü: langes Drücken auf den Namen im Profil */
  let press = null;
  const cancelPress = () => {
    if (press) clearTimeout(press.timer);
    press = null;
  };
  app.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-secret]');
    if (!el) return;
    cancelPress();
    press = {
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        press = null;
        secretTaps = [];
        suppressClickUntil = Date.now() + 450;
        openDemoMenu();
      }, 650),
    };
  });
  app.addEventListener('pointermove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancelPress();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => app.addEventListener(t, cancelPress));
  app.addEventListener('contextmenu', (e) => {
    if (e.target.closest('[data-secret]')) e.preventDefault();
  });

  /* Sheet nach unten wegziehen */
  let drag = null;
  $sheets.addEventListener(
    'touchstart',
    (e) => {
      const node = e.target.closest('.sheet');
      if (!node || e.touches.length !== 1) return;
      const scroller = node.children[1];
      const inHandle = !!e.target.closest('.sheet-handle');
      if (!inHandle && !(scroller.contains(e.target) && scroller.scrollTop <= 0)) return;
      if (e.target.closest('.chart, input')) return;
      drag = { node, y0: e.touches[0].clientY, x0: e.touches[0].clientX, dy: 0, active: false };
    },
    { passive: true }
  );
  $sheets.addEventListener(
    'touchmove',
    (e) => {
      if (!drag) return;
      const dy = e.touches[0].clientY - drag.y0;
      const dx = e.touches[0].clientX - drag.x0;
      if (!drag.active) {
        if (dy > 9 && dy > Math.abs(dx) * 1.4) {
          drag.active = true;
          drag.node.classList.add('dragging');
        } else if (dy < -6 || Math.abs(dx) > 14) {
          drag = null;
          return;
        } else return;
      }
      if (e.cancelable) e.preventDefault();
      drag.dy = Math.max(0, dy);
      drag.node.style.transform = 'translateY(' + drag.dy + 'px)';
    },
    { passive: false }
  );
  const endDrag = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    suppressClickUntil = Date.now() + 350;
    d.node.classList.remove('dragging');
    d.node.style.transform = '';
    if (d.dy > 110) {
      const sheet = ui.sheets.find((s) => String(s.key) === d.node.dataset.key);
      if (sheet && !sheet.p.done) closeSheet(sheet);
    }
  };
  $sheets.addEventListener('touchend', endDrag);
  $sheets.addEventListener('touchcancel', endDrag);

  /* Wischen zwischen Portfolio und Cash */
  let swipe = null;
  $main.addEventListener(
    'touchstart',
    (e) => {
      swipe = null;
      if (e.touches.length !== 1 || !e.target.closest('#viewwrap') || e.target.closest('[data-scroll], .chart')) return;
      swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true }
  );
  $main.addEventListener(
    'touchend',
    (e) => {
      if (!swipe || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - swipe.x;
      const dy = e.changedTouches[0].clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
      const next = dx < 0 ? { portfolio: 'cash' } : { cash: 'portfolio', profile: 'cash' };
      if (!next[ui.tab]) return;
      suppressClickUntil = Date.now() + 350;
      ui.tab = next[ui.tab];
      render();
    },
    { passive: true }
  );

  bindCharts(app);
}

/** Ladescreen: kurz stehen lassen, dann weich in die App überblenden. */
function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const wait = new Promise((r) => setTimeout(r, reduceMotion() ? 500 : 1500));
  Promise.all([fonts.catch(() => {}), wait]).then(() => {
    document.getElementById('app').classList.add('ready');
    el.classList.add('out');
    setTimeout(() => el.remove(), 800);
  });
}

function tickClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent = timeShort(Date.now());
}

function init() {
  $main = document.getElementById('main');
  $sheets = document.getElementById('sheets');
  $toast = document.getElementById('toast');
  loadState();
  try {
    ui.abs = localStorage.getItem(LS_ABS) === '1';
  } catch (e) {
    /* ignore */
  }
  mountLogoSprite();
  mountMain();
  bindEvents();
  render();
  hideSplash();
  tickClock();
  setInterval(tickClock, 15000);
}

document.addEventListener('DOMContentLoaded', init);
