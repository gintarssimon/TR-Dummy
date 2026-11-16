'use strict';

/* ---------- Rendering ---------- */

let $main;
let $sheets;
let $toast;
const cache = { main: '', resetScroll: false };
let sheetSeq = 0;
let suppressClickUntil = 0;

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

function renderMain() {
  const html = headerHTML() + `<div class="view" id="view">${viewMain()}</div>` + bottomBarHTML();
  if (html === cache.main && !cache.resetScroll) return;
  const old = document.getElementById('view');
  const top = old ? old.scrollTop : 0;
  const sc = saveScroll($main);
  if (html !== cache.main) {
    $main.innerHTML = html;
    cache.main = html;
  }
  const view = document.getElementById('view');
  view.scrollTop = cache.resetScroll ? 0 : top;
  if (!cache.resetScroll) restoreScroll($main, sc);
  cache.resetScroll = false;
}

function hydrate(root, sheet) {
  root.querySelectorAll('[data-f]').forEach((inp) => (inp.value = sheet.p[inp.dataset.f] || ''));
}

function sheetNode(sheet) {
  return $sheets.querySelector('.sheet[data-key="' + sheet.key + '"]');
}

function renderSheetNode(sheet, node) {
  const def = SHEETS[sheet.type];
  const body = def.html.call(def, sheet.p, sheet);
  const bottom = def.bottom ? def.bottom.call(def, sheet.p, sheet) : '';
  const $body = node.children[1];
  const $foot = node.children[2];
  if (node._body !== body) {
    const sc = saveScroll($body);
    $body.innerHTML = body;
    node._body = body;
    restoreScroll($body, sc);
    hydrate($body, sheet);
  }
  if (node._bottom !== bottom) {
    $foot.innerHTML = bottom;
    $foot.hidden = !bottom;
    node._bottom = bottom;
    hydrate($foot, sheet);
  }
}

function renderSheets() {
  const keys = new Set(ui.sheets.map((s) => String(s.key)));
  Array.from($sheets.children).forEach((node) => {
    if (!keys.has(node.dataset.key) && !node.classList.contains('leave')) {
      node.classList.add('leave');
      node.style.transform = '';
      setTimeout(() => node.remove(), 400);
    }
  });
  ui.sheets.forEach((sheet) => {
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
    renderSheetNode(sheet, node);
  });
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
  const used = S.accounts.map((a) => a.emoji);
  openSheet('newAccount', { name: '', emoji: EMOJIS.find((e) => !used.includes(e)) || EMOJIS[0] });
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
  cache.resetScroll = true;
}

const ACTIONS = {
  tab(d) {
    cache.resetScroll = true;
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
    cache.resetScroll = true;
    render();
  },
  pfAcc(d) {
    ui.pfAcc = d.id;
    ui.pfOverview = false;
    cache.resetScroll = true;
    render();
  },
  cashAcc(d) {
    ui.cashAcc = d.id;
    cache.resetScroll = true;
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
  flowMove(d, sheet) {
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
    sheet.p.amt = amtPress(sheet.p.amt || '', d.k);
    renderSheets();
  },
  amtQuick(d, sheet) {
    sheet.p.amt = toAmtString(+d.v);
    renderSheets();
  },
  amtRow(d, sheet) {
    const r = sheet.p.rows()[+d.i];
    if (r && r.pick) r.pick();
  },
  amtSwap(d, sheet) {
    sheet.p.swap();
    renderSheets();
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
    }, 1150);
  },

  /* Unterkonten */
  newAccount() {
    openNewAccount();
  },
  naEmoji(d, sheet) {
    sheet.p.emoji = d.e;
    renderSheets();
  },
  naSuggest(d, sheet) {
    sheet.p.name = d.name;
    sheet.p.emoji = d.e;
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
      a.emoji = p.emoji;
      save();
      closeSheet(sheet);
      toast('Gespeichert');
      return;
    }
    const a = createAccount({ name, emoji: p.emoji });
    resetUi('cash');
    ui.cashAcc = a.id;
    render();
    toast('Unterkonto „' + name + '“ eröffnet');
  },
  editAccount(d) {
    const a = acc(d.id);
    openSheet('newAccount', { editId: a.id, name: a.name, emoji: a.emoji });
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
  setCardAccount(d) {
    if (S.card.accountId === d.id) return;
    S.card.accountId = d.id;
    save();
    render();
    toast('Karte bucht jetzt von „' + accName(d.id) + '“ ab');
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
    sheetNode(sheet).children[1].scrollTop = 0;
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
    const node = sheetNode(sheet);
    hydrate(node, sheet);
    node.children[1].scrollTop = 0;
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
    openTrade(d.iid, d.side);
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
    if (!el || el.disabled) return;
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

  bindCharts(app);
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
  bindEvents();
  render();
  tickClock();
  setInterval(tickClock, 15000);
}

document.addEventListener('DOMContentLoaded', init);
