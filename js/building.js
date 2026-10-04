/* Шахматка «Весь дом ночью»: четыре блока рядом, как подсвеченный макет
   вечером. Окно — квартира: горит — свободна. Наведение на этаж — табло
   лифта (свободно, цена от) и бирка квартиры; нажатие на окно раскрывает
   блок: этаж гипсовым макетом (js/model.js) со светом в свободных
   квартирах этажа и карточка выбранной квартиры. Лоты — js/data.js. */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = $('[data-vit]'), stage = $('[data-stage]');
  if (!D || !root || !stage) return;

  var HOUSE = D.HOUSE;
  var LIVE = HOUSE.filter(function (b) { return !b.pending; });
  var FIRST = D.FIRST, TOP = D.FLOORS;
  var S = { rooms: 'all', blk: null, floor: null, sel: null, peek: null, hot: null };
  var mqNarrow = matchMedia('(max-width: 759px)');
  var hoverable = matchMedia('(hover: hover)');

  function block(k) { return D.block(k); }
  function lotAt(b, f, x) { var r = b.floors[f - FIRST]; return r ? r.row[x] || null : null; }
  function roomOk(l) { return S.rooms === 'all' || l.rooms === S.rooms; }
  function lit(l) { return D.isOpen(l) && roomOk(l); }
  function floorLots(b, f) { var r = b.floors[f - FIRST]; return r ? r.row : []; }
  function floorInfo(b, f) {
    var all = floorLots(b, f).filter(roomOk), free = all.filter(D.isOpen);
    var min = free.length ? Math.min.apply(null, free.map(function (l) { return l.price; })) : 0;
    return { all: all.length, free: free.length, min: min };
  }
  function statusText(l) { return l.status === 'sale' ? 'свободна, скидка ' + l.disc + '%' : D.STATUS[l.status].toLowerCase(); }
  function winLabel(l) {
    return 'Блок ' + l.blk + ', ' + l.floor + ' этаж, квартира № ' + l.no + ', ' + l.code + ', ' + l.type + ', ' + D.area(l.area) + ', ' +
      statusText(l) + (D.isOpen(l) ? ', ' + D.money(l.price) : '');
  }

  /* ── клавиши комнатности и счётчик ─────────────────────────────── */
  var roomsBox = $('[data-rooms]');
  function renderKeys() {
    var keys = [['all', 'Все']].concat(D.ROOM_TYPES.map(function (r) { return [r, r + '-комнатные']; }));
    roomsBox.innerHTML = keys.map(function (k) {
      var n = D.LOTS.filter(function (l) { return D.isOpen(l) && (k[0] === 'all' || l.rooms === k[0]); }).length;
      return '<button class="seg__btn" type="button" data-r="' + k[0] + '" aria-pressed="' + (S.rooms === k[0]) + '">' + k[1] + ' <small class="tnum">' + n + '</small></button>';
    }).join('');
  }
  function renderCount() {
    var pool = D.LOTS.filter(roomOk), free = pool.filter(D.isOpen).length;
    $('[data-free-n]').textContent = free;
    $('[data-free-of]').textContent = D.plural(free, ['свободна', 'свободны', 'свободно']) + ' из ' + pool.length + ' ' +
      (S.rooms === 'all' ? D.plural(pool.length, ['квартиры', 'квартир', 'квартир']) : D.plural(pool.length, ['подходящей', 'подходящих', 'подходящих']));
  }

  /* ── башни ─────────────────────────────────────────────────────── */
  function winHtml(b, l, ti) {
    var cls = 'win win--' + l.status + (D.isOpen(l) ? ' win--lit' : '') + (roomOk(l) ? '' : ' is-dim') + (l.id === S.sel ? ' is-sel' : '');
    return '<span role="gridcell" class="tw__cell"><button type="button" class="' + cls + '" data-id="' + l.id + '" tabindex="-1" aria-label="' + winLabel(l) + '"' +
      ' style="--f:' + (l.floor - FIRST) + ';--t:' + ti + ';--j:' + ((l.x * 7 + l.floor * 3) % 5) + '"></button></span>';
  }
  function towerHtml(b, ti) {
    var lat = b.lat;
    if (b.pending) {
      return '<div class="tw tw--ghost" data-blk="' + b.k + '" style="--cols:7;view-transition-name:tw-' + lat + '">' +
        '<div class="tw__plate"><b>' + b.k + '</b><span>готовится</span></div>' +
        '<div class="tw__body tw__ghost"><p>Листов блока&nbsp;' + b.k + ' пока нет — квартиры появятся здесь вместе с ними.</p>' +
        '<a class="tw__ask" href="#lead" data-ask-g>Узнать первым</a></div>' +
        '<div class="tw__pod" aria-hidden="true"></div></div>';
    }
    var free = b.floors.reduce(function (s, r) { return s + r.row.filter(lit).length; }, 0);
    var rows = [];
    for (var f = TOP; f >= FIRST; f--) {
      rows.push('<div class="tw__row" role="row" data-f="' + f + '">' + floorLots(b, f).map(function (l) { return winHtml(b, l, ti); }).join('') + '</div>');
    }
    return '<div class="tw" data-blk="' + b.k + '" style="--cols:' + b.cols + ';view-transition-name:tw-' + lat + '">' +
      '<button class="tw__plate" type="button" data-open="' + b.k + '" aria-label="Открыть блок ' + b.k + ': ' + free + ' ' + D.plural(free, ['свободная квартира', 'свободные квартиры', 'свободных квартир']) + '">' +
        '<b>' + b.k + '</b><span><span class="tnum" data-blk-free>' + free + '</span> своб.</span></button>' +
      '<div class="tw__body" role="grid" aria-label="Блок ' + b.k + ': квартиры по этажам, ' + TOP + '–' + FIRST + ' этаж" aria-rowcount="' + (TOP - FIRST + 1) + '" aria-colcount="' + b.cols + '">' + rows.join('') + '</div>' +
      '<div class="tw__pod" aria-hidden="true">' + (ti === 0 ? '<span>1–2 · торговые</span>' : '') + '</div></div>';
  }
  function rulerHtml() {
    var out = ['<span class="vit__rl-top"></span>'];
    for (var f = TOP; f >= FIRST; f--) out.push('<span class="' + (f % 5 === 0 || f === TOP || f === FIRST ? 'is-mark' : '') + '">' + f + '</span>');
    out.push('<span class="is-pod">2</span><span class="is-pod">1</span>');
    return '<div class="vit__ruler" aria-hidden="true">' + out.join('') + '</div>';
  }
  function panelHtml() {
    return '<section class="flr" aria-labelledby="flr-h" data-flr style="view-transition-name:flr">' +
      '<header class="flr__head">' +
        '<div class="flr__title"><span class="label" data-flr-blk></span><h2 class="flr__h" id="flr-h"><b class="tnum" data-flr-n></b> этаж</h2></div>' +
        '<p class="flr__sum tnum" data-flr-sum></p>' +
        '<div class="flr__step">' +
          '<button class="flr__btn" type="button" data-step="1" aria-label="Этаж выше"><svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 9l4-4 4 4"/></svg></button>' +
          '<button class="flr__btn" type="button" data-step="-1" aria-label="Этаж ниже"><svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5l4 4 4-4"/></svg></button>' +
        '</div>' +
      '</header>' +
      '<div class="flr__m3d" data-flr-m3d></div>' +
      '<p class="small flr__note" data-flr-note></p>' +
      '<div class="flr__flat" data-flr-flat aria-live="polite"></div>' +
    '</section>';
  }
  function renderStage() {
    stage.innerHTML = rulerHtml() + HOUSE.map(towerHtml).join('') + panelHtml() +
      '<div class="lift vit__lift" data-lift hidden><b class="lift__n tnum"></b><span class="lift__t">этаж</span><span class="lift__c"></span></div>' +
      '<div class="vit__tag" data-tag hidden></div>';
    $$('.tw__body', stage).forEach(function (g) { var w = g.querySelector('.win--lit') || g.querySelector('.win'); if (w) w.tabIndex = 0; });
  }
  /* фильтр комнатности: перекрасить окна, не пересобирая башни */
  function repaint() {
    $$('.win[data-id]', stage).forEach(function (w) {
      var l = D.find(w.getAttribute('data-id'));
      w.classList.toggle('is-dim', !roomOk(l));
      w.classList.toggle('is-sel', l.id === S.sel);
    });
    LIVE.forEach(function (b) {
      var n = b.floors.reduce(function (s, r) { return s + r.row.filter(lit).length; }, 0);
      var el = $('.tw[data-blk="' + b.k + '"] [data-blk-free]', stage);
      if (el) el.textContent = n;
    });
  }

  /* ── этаж под курсором: табло лифта, перекрытие, бирка ─────────── */
  var liftEl = null, tagEl = null;
  function rowOf(b, f) { return $('.tw[data-blk="' + b.k + '"] .tw__row[data-f="' + f + '"]', stage); }
  function showFloor(b, f) {
    $$('.tw__row.is-hot', stage).forEach(function (r) { r.classList.remove('is-hot'); });
    $$('.tw.is-hot', stage).forEach(function (t) { t.classList.remove('is-hot'); });
    if (!b || f == null) { if (liftEl) liftEl.hidden = true; return; }
    var row = rowOf(b, f);
    if (!row) return;
    row.classList.add('is-hot');
    row.closest('.tw').classList.add('is-hot');
    if (S.blk) return;
    var info = floorInfo(b, f), sr = stage.getBoundingClientRect(), rr = row.getBoundingClientRect();
    var left = rr.right + 260 > sr.right;
    liftEl.querySelector('.lift__n').textContent = f;
    liftEl.querySelector('.lift__c').innerHTML = info.free
      ? info.free + ' из ' + info.all + ' ' + D.plural(info.free, ['свободна', 'свободны', 'свободно']) + '<br>от ' + D.money(info.min)
      : 'свободных нет';
    liftEl.classList.toggle('is-left', left);
    liftEl.style.left = (left ? rr.left : rr.right) - sr.left + 'px';
    liftEl.style.top = rr.top + rr.height / 2 - sr.top + 'px';
    liftEl.hidden = false;
  }
  function showTag(w) {
    if (!w || S.blk || !hoverable.matches) { if (tagEl) tagEl.hidden = true; return; }
    var l = D.find(w.getAttribute('data-id'));
    var open = D.isOpen(l);
    tagEl.innerHTML = '<p class="vit__tag-t">' + l.code + ' · ' + l.type + '</p>' +
      '<p class="vit__tag-m tnum">' + D.area(l.area) + ' · № ' + l.no + '</p>' +
      '<p class="vit__tag-p tnum">' + (open ? D.money(l.price) + (l.disc ? ' <small>−' + l.disc + '%</small>' : '') : D.STATUS[l.status]) + '</p>';
    var sr = stage.getBoundingClientRect(), wr = w.getBoundingClientRect();
    tagEl.style.left = wr.left + wr.width / 2 - sr.left + 'px';
    tagEl.style.top = wr.top - sr.top + 'px';
    tagEl.classList.toggle('is-below', wr.top - sr.top < 110);
    if (tagEl.classList.contains('is-below')) tagEl.style.top = wr.bottom - sr.top + 'px';
    tagEl.hidden = false;
  }

  /* ── блок крупно: этаж макетом и карточка квартиры ─────────────── */
  var m3d = null, plateKey = null;
  function curFloor() { return S.peek != null ? S.peek : S.floor; }
  function lotOfPlan(id, f) {
    var b = block(S.blk);
    if (!b) return null;
    var x = b.stacks.map(function (p) { return p.id; }).indexOf(id);
    return x > -1 ? lotAt(b, f == null ? curFloor() : f, x) : null;
  }
  function ensureModel() {
    if (m3d || !MK.model3d || !MK.model3d.floor) return;
    m3d = MK.model3d.floor($('[data-flr-m3d]', stage), {
      level: function (id, sel, hot) {
        var l = lotOfPlan(id);
        if (!l) return 0.04;
        var base = lit(l) ? 1.15 : D.isOpen(l) ? 0.3 : l.status === 'book' ? 0.18 : 0;
        if (l.id === S.sel) return 1.7;
        return id === hot ? Math.min(1.5, base + 0.4) : base;
      },
      off: function (id) { var l = lotOfPlan(id); return !l || !D.isOpen(l); },
      onSelect: function (id) { var l = lotOfPlan(id); if (l) pick(l, true); },
      onHot: function (id) {
        var l = id && lotOfPlan(id);
        $$('.win.is-hot', stage).forEach(function (w) { w.classList.remove('is-hot'); });
        if (l) { var w = $('.win[data-id="' + l.id + '"]', stage); if (w) w.classList.add('is-hot'); }
      }
    });
  }
  function renderPanel() {
    var b = block(S.blk), f = curFloor();
    if (!b || f == null) return;
    var info = floorInfo(b, f), p0 = b.stacks[0];
    $('[data-flr-blk]', stage).textContent = 'Блок ' + b.k;
    $('[data-flr-n]', stage).textContent = f;
    $('[data-flr-sum]', stage).innerHTML = info.free
      ? 'свободно ' + info.free + ' из ' + info.all + ' · от ' + D.money(info.min)
      : 'на этаже свободных нет';
    $('[data-step="1"]', stage).disabled = f >= TOP;
    $('[data-step="-1"]', stage).disabled = f <= FIRST;
    var typ = f >= p0.floors[0] && f <= p0.floors[1];
    $('[data-flr-note]', stage).textContent = (typ
      ? 'Типовой этаж по листам проекта (этажи ' + p0.floors[0] + '–' + p0.floors[1] + ')'
      : 'Показан типовой этаж ' + p0.floors[0] + '–' + p0.floors[1] + ' — планировки ' + f + '-го этажа уточняются') +
      (b.k === 'В' ? '; блок В спроектирован как блок Б.' : '.') + ' Мебель на макете иллюстративная.';
    if (m3d) {
      m3d.plate(b.plate);
      var sl = S.sel && D.find(S.sel);
      m3d.select(sl && sl.blk === b.k && sl.floor === f ? sl.plan : null);
      m3d.refresh();
    }
    renderFlat();
  }
  function renderFlat() {
    var box = $('[data-flr-flat]', stage), l = S.sel && D.find(S.sel);
    if (!l || l.blk !== S.blk) {
      var b = block(S.blk), info = b ? floorInfo(b, curFloor()) : null;
      box.innerHTML = '<p class="flr__hint">' + (info && info.free ? 'Нажмите на светящуюся квартиру на макете или окно в блоке — покажем планировку и цену.' : 'На этом этаже всё продано или забронировано — выберите другой этаж: светлые окна в блоке слева.') + '</p>';
      return;
    }
    var p = D.plan(l.plan), open = D.isOpen(l);
    var st = l.status === 'sale' ? 'Скидка ' + l.disc + '%' : D.STATUS[l.status];
    box.innerHTML = '<article class="flc">' +
      '<a class="flc__plan" href="' + D.lotHref(l) + '" tabindex="-1" aria-hidden="true"><img src="' + D.planSrc(l.plan) + '" alt="" width="' + (p ? p.img.w : 480) + '" height="' + (p ? p.img.h : 420) + '" decoding="async"></a>' +
      '<div class="flc__body">' +
        '<p class="flc__top"><span class="plate">' + l.code + '</span><span class="status' + (l.status === 'free' ? ' status--free' : l.status === 'sale' ? ' status--sale' : '') + '">' + st + '</span></p>' +
        '<h3 class="flc__t"><a href="' + D.lotHref(l) + '">' + l.type + ', <span class="tnum">' + D.area(l.area) + '</span></a></h3>' +
        '<p class="flc__m">Блок ' + l.blk + ' · ' + l.floor + ' этаж · квартира № ' + l.no + ' · ' + l.fin.toLowerCase() + '</p>' +
        '<p class="flc__price tnum">' + (open ? (l.was ? '<s>' + D.money(l.was) + '</s>' : '') + D.money(l.price) + '<small>' + D.num(D.perM(l)) + ' смн за м²</small>' : D.STATUS[l.status]) + '</p>' +
        '<div class="flc__act">' +
          (open ? '<a class="btn btn--dark btn--sm" href="' + D.lotHref(l, '#lead') + '">Забронировать</a>' : '<a class="btn btn--dark btn--sm" href="' + D.lotHref(l, '#lead') + '">Сообщить, если освободится</a>') +
          '<a class="btn btn--glass btn--sm" href="' + D.lotHref(l) + '">Подробнее</a>' +
        '</div>' +
      '</div></article>';
  }

  /* ── переходы между «весь дом» и «блок крупно» ─────────────────── */
  function transition(fn) {
    if (document.startViewTransition && !MK.rm()) document.startViewTransition(fn);
    else fn();
  }
  function syncUrl() {
    var q = S.sel ? '?id=' + encodeURIComponent(S.sel) : S.blk ? '?blk=' + block(S.blk).lat + '&floor=' + S.floor : '';
    history.replaceState(null, '', location.pathname + q);
  }
  function bestFloor(b) {
    var best = TOP, bn = -1;
    for (var f = TOP; f >= FIRST; f--) { var n = floorInfo(b, f).free; if (n > bn) { bn = n; best = f; } }
    return best;
  }
  function applyMode() {
    var b = block(S.blk);
    root.classList.toggle('is-focus', !!b);
    $('[data-bar]').hidden = !b;
    $$('.tw', stage).forEach(function (t) { t.hidden = !!b && t.getAttribute('data-blk') !== b.k; });
    $('[data-blks]').innerHTML = LIVE.map(function (x) {
      return '<button class="seg__btn" type="button" data-to="' + x.k + '" aria-pressed="' + (b && x.k === b.k) + '">Блок ' + x.k + '</button>';
    }).join('');
    showFloor(null);
    showTag(null);
    if (b) {
      ensureModel();
      renderPanel();
      $$('.tw__row.is-on', stage).forEach(function (r) { r.classList.remove('is-on'); });
      var row = rowOf(b, S.floor);
      if (row) row.classList.add('is-on');
      if (m3d) m3d.show();
    }
  }
  function openBlock(k, f, lotId) {
    var b = block(k);
    if (!b || b.pending) return;
    var was = S.blk;
    calm = Date.now() + 1200;
    S.blk = b.k;
    S.floor = f == null ? bestFloor(b) : f;
    S.peek = null;
    S.sel = lotId || null;
    var go = function () { applyMode(); repaint(); };
    if (was) go(); else transition(go);
    syncUrl();
    /* блок крупно — под шапкой: кнопка «Весь дом» у верхнего края */
    if (!was && !mqNarrow.matches) {
      var bar = $('[data-bar]'), hh = $('.hdr') ? $('.hdr').offsetHeight : 64;
      requestAnimationFrame(function () {
        var top = bar.getBoundingClientRect().top + scrollY - hh - 14;
        if (Math.abs(scrollY - top) > 40) scrollTo({ top: top, behavior: MK.rm() ? 'auto' : 'smooth' });
      });
    }
    if (mqNarrow.matches) requestAnimationFrame(toPanel);
  }
  function goHome() {
    S.blk = null; S.floor = null; S.peek = null;
    transition(function () { applyMode(); repaint(); });
    syncUrl();
  }
  function setFloor(f) {
    var b = block(S.blk);
    if (!b) return;
    S.floor = MK.clamp(f, FIRST, TOP);
    S.peek = null;
    var sl = S.sel && D.find(S.sel);
    if (sl && sl.floor !== S.floor) S.sel = null;
    $$('.tw__row.is-on', stage).forEach(function (r) { r.classList.remove('is-on'); });
    var row = rowOf(b, S.floor);
    if (row) row.classList.add('is-on');
    renderPanel();
    repaint();
    syncUrl();
  }
  function pick(l, fromModel) {
    S.sel = l.id;
    if (l.floor !== S.floor) { S.floor = l.floor; $$('.tw__row.is-on', stage).forEach(function (r) { r.classList.remove('is-on'); }); var row = rowOf(block(l.blk), l.floor); if (row) row.classList.add('is-on'); }
    S.peek = null;
    renderPanel();
    repaint();
    syncUrl();
    if (!fromModel && mqNarrow.matches) toPanel();
  }
  /* телефон: панель этажа над башней — подняться к ней вместе с «Весь дом» */
  function toPanel() {
    var hh = $('.hdr') ? $('.hdr').offsetHeight : 58;
    scrollTo({ top: $('[data-bar]').getBoundingClientRect().top + scrollY - hh - 10, behavior: MK.rm() ? 'auto' : 'smooth' });
  }

  /* ── события ───────────────────────────────────────────────────── */
  var calm = 0;                          /* после раскрытия блок съезжает под курсором — не листать этажи */
  stage.addEventListener('pointerover', function (e) {
    var w = e.target.closest('.win[data-id]');
    if (!w) return;
    var l = D.find(w.getAttribute('data-id')), b = block(l.blk);
    if (S.blk) {
      if (Date.now() < calm) return;
      if (l.floor !== curFloor()) { S.peek = l.floor; renderPanel(); }
      showFloor(b, l.floor);
      return;
    }
    showFloor(b, l.floor);
    showTag(w);
  });
  stage.addEventListener('pointerleave', function () {
    showFloor(null); showTag(null);
    if (S.blk && S.peek != null) { S.peek = null; renderPanel(); }
  });
  stage.addEventListener('click', function (e) {
    var w = e.target.closest('.win[data-id]'), pl = e.target.closest('[data-open]'), st = e.target.closest('[data-step]');
    if (w) {
      var l = D.find(w.getAttribute('data-id'));
      if (!S.blk) openBlock(l.blk, l.floor, l.id);
      else pick(l);
      return;
    }
    if (pl) { openBlock(pl.getAttribute('data-open')); return; }
    if (st) { setFloor(S.floor + +st.getAttribute('data-step')); return; }
    if (e.target.closest('[data-ask-g]')) {
      var sel = $('#lead select[name="interest"]');
      if (sel) sel.value = '';
    }
  });
  /* стрелки: по этажам и стоякам; на краю ряда — в соседний блок */
  stage.addEventListener('keydown', function (e) {
    var w = e.target.closest('.win[data-id]');
    if (!w) return;
    var l = D.find(w.getAttribute('data-id')), b = block(l.blk), f = l.floor, x = l.x, nb = b;
    if (e.key === 'ArrowUp') f++;
    else if (e.key === 'ArrowDown') f--;
    else if (e.key === 'ArrowLeft') x--;
    else if (e.key === 'ArrowRight') x++;
    else if (e.key === 'PageUp') f += 5;
    else if (e.key === 'PageDown') f -= 5;
    else if (e.key === 'Home') x = 0;
    else if (e.key === 'End') x = b.cols - 1;
    else return;
    e.preventDefault();
    f = MK.clamp(f, FIRST, TOP);
    if (!S.blk && (x < 0 || x >= b.cols)) {
      var i = LIVE.indexOf(b) + (x < 0 ? -1 : 1);
      if (i < 0 || i >= LIVE.length) return;
      nb = LIVE[i];
      x = x < 0 ? nb.cols - 1 : 0;
    }
    x = MK.clamp(x, 0, nb.cols - 1);
    var n = lotAt(nb, f, x), nw = n && $('.win[data-id="' + n.id + '"]', stage);
    if (!nw) return;
    $$('.win[tabindex="0"]', $('.tw[data-blk="' + nb.k + '"]', stage)).forEach(function (c) { c.tabIndex = -1; });
    nw.tabIndex = 0;
    nw.focus();
    if (S.blk && n.floor !== curFloor()) { S.peek = n.floor; renderPanel(); }
    showFloor(nb, n.floor);
    showTag(nw);
  });
  stage.addEventListener('focusin', function (e) {
    var w = e.target.closest('.win[data-id]');
    if (!w) return;
    var l = D.find(w.getAttribute('data-id'));
    showFloor(block(l.blk), l.floor);
    showTag(w);
  });
  stage.addEventListener('focusout', function (e) {
    if (!stage.contains(e.relatedTarget)) { showFloor(null); showTag(null); if (S.blk && S.peek != null) { S.peek = null; renderPanel(); } }
  });
  roomsBox.addEventListener('click', function (e) {
    var k = e.target.closest('[data-r]');
    if (!k) return;
    var v = k.getAttribute('data-r');
    S.rooms = v === 'all' ? 'all' : +v;
    $$('[data-r]', roomsBox).forEach(function (b) { b.setAttribute('aria-pressed', String(b === k)); });
    renderCount();
    repaint();
    if (S.blk) renderPanel();
  });
  $('[data-home]').addEventListener('click', goHome);
  $('[data-blks]').addEventListener('click', function (e) {
    var t = e.target.closest('[data-to]');
    if (t && t.getAttribute('data-to') !== S.blk) {
      var keep = S.floor;
      transition(function () { S.blk = t.getAttribute('data-to'); S.floor = keep; S.sel = null; S.peek = null; applyMode(); repaint(); });
      syncUrl();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.blk && !e.defaultPrevented && !document.querySelector('dialog[open]')) goHome();
  });
  var rz = 0;
  addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (S.blk) applyMode(); }, 120); });

  /* ── старт ─────────────────────────────────────────────────────── */
  renderKeys();
  renderCount();
  renderStage();
  liftEl = $('[data-lift]', stage);
  tagEl = $('[data-tag]', stage);
  var q = MK.params, start = D.find(q.get('id')), qb = block(q.get('blk') || '');
  if (start) openBlock(start.blk, start.floor, start.id);
  else if (qb && !qb.pending) openBlock(qb.k, /^\d+$/.test(q.get('floor') || '') ? MK.clamp(+q.get('floor'), FIRST, TOP) : null);
  /* вечер наступает: окна зажигаются снизу вверх, блок за блоком */
  if (!MK.rm()) {
    root.classList.add('is-intro');
    setTimeout(function () { root.classList.remove('is-intro'); }, 2600);
  }
  if (MK.motion) MK.motion();
})();
