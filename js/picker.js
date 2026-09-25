/* Подбор на фасаде: полигоны окон по гомографии плоскостей рендера,
   лоты — те же, что в шахматке и каталоге (data.js) */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var BANDS = { all: null, low: [2, 7], mid: [8, 13], high: [14, 99] };
  var S = { v: 0, rooms: 'all', band: 'all', free: false, ov: true, sel: null, hover: null, limit: 14 };
  var narrow = matchMedia('(max-width: 900px)');

  /* собираем окна для каждого ракурса из секций data.js */
  var VIEWS = D.FACADE.map(function (view) {
    var items = [];
    view.planes.forEach(function (pl, pi) {
      var sc = D.secOf(view.corp, pl.sect);
      var H = D.homography(pl.q);
      sc.floors.forEach(function (r) {
        r.row.forEach(function (l) {
          if (!l) return;
          var p = D.windowQuad(pl, sc, l, H);
          items.push({ lot: l, plane: pi, pts: p.map(function (x) { return x[0].toFixed(1) + ',' + x[1].toFixed(1); }).join(' '),
            cx: (p[0][0] + p[1][0]) / 2, cy: (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4, top: Math.min(p[0][1], p[1][1]) });
        });
      });
    });
    return { k: view.k, title: view.title, img: view.img, corp: view.corp, sects: view.planes.map(function (p) { return p.sect; }), items: items };
  });
  var byId = {};
  VIEWS.forEach(function (v, vi) { v.items.forEach(function (it) { byId[it.lot.id] = { vi: vi, it: it }; }); });

  /* ── фильтры ────────────────────────────────────────────────────── */
  function filtersOn() { return S.rooms !== 'all' || S.band !== 'all' || S.free; }
  function match(l) {
    if (S.rooms !== 'all' && String(l.rooms) !== S.rooms) return false;
    if (S.free && !D.isOpen(l)) return false;
    var b = BANDS[S.band];
    if (b && (l.floor < b[0] || l.floor > b[1])) return false;
    return true;
  }
  function view() { return VIEWS[S.v]; }
  function pool() {
    return view().items.filter(function (it) { return match(it.lot); })
      .sort(function (a, b) { return (D.isOpen(b.lot) - D.isOpen(a.lot)) || b.lot.floor - a.lot.floor || a.plane - b.plane || a.lot.x - b.lot.x; });
  }

  /* ── фасад ──────────────────────────────────────────────────────── */
  var svg = $('[data-svg]'), polysG = $('[data-polys]'), frame = $('[data-frame]'), tip = $('[data-tip]');
  var polys = {};
  function renderFacade() {
    var v = view();
    $('[data-shot]').innerHTML = MK.pic(v.img, 'MEGA KHUJAND, ' + v.title.toLowerCase() + ': подсветка квартир корпуса ' + v.corp, { eager: true, sizes: '(min-width: 900px) 70vw, 100vw' });
    polysG.textContent = '';
    polys = {};
    v.items.forEach(function (it) {
      var p = document.createElementNS(NS, 'polygon');
      p.setAttribute('points', it.pts);
      p.setAttribute('data-id', it.lot.id);
      polysG.appendChild(p);
      polys[it.lot.id] = p;
    });
    svg.classList.toggle('is-night', v.k === 'dusk');
    svg.setAttribute('aria-label', 'Фасад, ' + v.title.toLowerCase() + ': корпус ' + v.corp + ', секции ' + v.sects.join(', ') + '. ' + $('#pk-help').textContent);
    $('[data-views]').innerHTML = VIEWS.map(function (x, i) {
      return '<button class="seg__btn" type="button" data-view="' + i + '" aria-pressed="' + (i === S.v) + '">' + x.title + '</button>';
    }).join('');
    $('[data-note]').textContent = 'На этом ракурсе — корпус ' + v.corp + ', секции ' + v.sects.join(', ') + '. Остальные секции — на шахматке. Подсветка нанесена на рендер комплекса; площади и цены предварительные.';
  }
  function paintPolys() {
    var on = filtersOn();
    svg.classList.toggle('is-filter', on);
    frame.classList.toggle('is-filter', on);
    view().items.forEach(function (it) {
      var p = polys[it.lot.id], l = it.lot, ok = match(l);
      var cls = 'st-' + (l.status === 'sale' ? 'free' : l.status);
      if (on) cls += ok ? ' is-match' : ' is-out';
      if (l.id === S.sel || l.id === S.hover) cls += ' is-hot';
      p.setAttribute('class', cls);
    });
    svg.classList.toggle('is-off', !S.ov);
  }

  /* подсказка над окном */
  function showTip(id) {
    var rec = byId[id];
    if (!rec || rec.vi !== S.v || !S.ov) { tip.classList.remove('is-on'); return; }
    var l = rec.it.lot;
    $('b', tip).textContent = l.type + ' · ' + D.area(l.area);
    $('span', tip).textContent = 'Этаж ' + l.floor + ' · № ' + l.no + ' · ' + (D.isOpen(l) ? D.money(l.price) + (l.disc ? ' (−' + l.disc + '%)' : '') : D.STATUS[l.status].toLowerCase());
    var x = rec.it.cx / 2400 * 100, y = rec.it.top / 1339 * 100;
    tip.style.left = MK.clamp(x, 9, 91) + '%';
    tip.style.top = y + '%';
    tip.style.transform = 'translate(-50%, calc(-100% - 10px))';
    if (y < 12) tip.style.transform = 'translate(-50%, 34px)';
    tip.classList.add('is-on');
  }

  /* ── боковая панель ─────────────────────────────────────────────── */
  function renderSel() {
    var l = S.sel ? D.find(S.sel) : null;
    var box = $('[data-sel]');
    if (!l) {
      box.innerHTML = '<p class="label">Выберите квартиру</p><div class="pk__sel-row"><div><p class="pk__sel-title">Нажмите на окно на фасаде</p>' +
        '<p class="pk__sel-meta">Или выберите строку в списке — подсветим квартиру на рендере.</p></div>' +
        '<span class="pk__sel-plan is-empty"><img src="' + D.planSrc('two-a') + '" alt=""></span></div>';
      return;
    }
    var open = D.isOpen(l);
    box.innerHTML = '<p class="label">Квартира № ' + l.no + (l.status === 'sale' ? ' · скидка ' + l.disc + '%' : l.status !== 'free' ? ' · ' + D.STATUS[l.status].toLowerCase() : '') + '</p>' +
      '<div class="pk__sel-row"><div><p class="pk__sel-title">' + l.type + ', ' + D.area(l.area) + '</p>' +
      '<p class="pk__sel-meta">' + D.lotPlace(l) + (l.terrace ? ' · терраса' : l.river ? ' · вид на реку' : '') + '</p></div>' +
      '<span class="pk__sel-plan"><img src="' + D.planSrc(l.plan) + '" alt=""></span></div>' +
      '<div class="pk__sel-foot"><span class="pk__sel-price">' + (open ? D.money(l.price) : D.STATUS[l.status]) + '</span>' +
      '<span class="pk__sel-act"><a class="btn btn--soft btn--sm" href="' + D.lotHref(l) + '">Подробнее</a>' +
      '<a class="btn btn--dark btn--sm" href="' + D.lotHref(l, '#lead') + '">' + (open ? 'Забронировать' : 'Похожие') + '</a></span></div>';
    if (!open) box.querySelector('.btn--dark').href = 'flats.html?rooms=' + l.rooms;
  }
  function renderList() {
    var list = pool();
    var n = list.length;
    $('[data-found]').textContent = n;
    $('[data-found-word]').textContent = D.plural(n, ['квартира', 'квартиры', 'квартир']) + (filtersOn() ? ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'подходит' : 'подходят') : ' на этом ракурсе');
    var box = $('[data-list]');
    if (!n) {
      box.innerHTML = '<div class="pk__empty">На этом ракурсе под фильтр ничего не попало.<br>Смените ракурс или ослабьте фильтры.<br><button class="btn btn--soft btn--sm" type="button" data-clear>Сбросить фильтры</button></div>';
      return;
    }
    box.innerHTML = list.slice(0, S.limit).map(function (it) {
      var l = it.lot, open = D.isOpen(l);
      return '<button class="pk__item' + (l.id === S.hover ? ' is-hot' : '') + '" type="button" data-pick="' + l.id + '" aria-pressed="' + (l.id === S.sel) + '">' +
        '<span class="pk__item-plan"><img src="' + D.planSrc(l.plan) + '" alt="" loading="lazy"></span>' +
        '<span class="pk__item-txt"><b>' + l.type + ' · ' + D.area(l.area) + '</b><span>Секция ' + l.sect + ' · этаж ' + l.floor + ' · № ' + l.no + '</span></span>' +
        '<span class="pk__item-end"><b>' + (open ? D.money(l.price) : '—') + '</b><span class="' + (open ? 'is-free' : '') + '">' + (l.status === 'sale' ? '−' + l.disc + '%' : D.STATUS[l.status].toLowerCase()) + '</span></span></button>';
    }).join('') + (n > S.limit ? '<button class="btn btn--soft btn--sm btn--block" type="button" data-more style="margin-top:12px">Показать ещё ' + Math.min(14, n - S.limit) + '</button>' : '');
  }
  function render() { paintPolys(); renderSel(); renderList(); syncControls(); }
  function syncControls() {
    $$('[data-room]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-room') === S.rooms)); });
    $$('[data-band]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-band') === S.band)); });
    $('[data-free]').setAttribute('aria-pressed', String(S.free));
    var ov = $('[data-ov]');
    ov.setAttribute('aria-pressed', String(S.ov));
    $('span', ov).textContent = S.ov ? 'Скрыть подсветку' : 'Показать подсветку';
  }
  function select(id, opts) {
    opts = opts || {};
    S.sel = id;
    paintPolys(); renderSel(); renderList();
    if (opts.tip) showTip(id);
    if (opts.reveal && narrow.matches) $('[data-sel]').scrollIntoView({ block: 'nearest', behavior: MK.rm() ? 'auto' : 'smooth' });
  }

  /* ── события ────────────────────────────────────────────────────── */
  polysG.addEventListener('mouseover', function (e) {
    var p = e.target.closest('polygon'); if (!p) return;
    S.hover = p.getAttribute('data-id'); paintPolys(); showTip(S.hover);
  });
  polysG.addEventListener('mouseout', function (e) {
    if (!e.target.closest('polygon')) return;
    S.hover = null; paintPolys(); if (S.sel) showTip(S.sel); else tip.classList.remove('is-on');
  });
  /* клик или тап выбирает ближайшее окно — на телефоне окна меньше пальца */
  svg.addEventListener('click', function (e) {
    if (!S.ov) return;
    var m = svg.getScreenCTM();
    if (!m) return;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var loc = pt.matrixTransform(m.inverse());
    var best = null, bd = Infinity;
    view().items.forEach(function (it) {
      if (filtersOn() && !match(it.lot)) return;
      var dx = (it.cx - loc.x), dy = (it.cy - loc.y) * 1.4, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = it; }
    });
    if (best && bd < 90 * 90) select(best.lot.id, { tip: true, reveal: true });
  });
  /* клавиатура: стрелки по стоякам и этажам в пределах плоскости */
  svg.addEventListener('keydown', function (e) {
    var keys = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (e.key === 'Enter' && S.sel) { location.href = D.lotHref(D.find(S.sel)); return; }
    if (!keys[e.key]) return;
    e.preventDefault();
    var items = view().items.filter(function (it) { return !filtersOn() || match(it.lot); });
    if (!items.length) return;
    var cur = S.sel && byId[S.sel] && byId[S.sel].vi === S.v ? byId[S.sel].it : null;
    if (!cur) { select(items[0].lot.id, { tip: true }); return; }
    var d = keys[e.key], best = null, bestD = Infinity;
    items.forEach(function (it) {
      if (it === cur) return;
      var dx = it.cx - cur.cx, dy = cur.top - it.top;
      var along = d[0] ? dx * d[0] : dy * d[1];
      if (along <= 4) return;
      var across = d[0] ? Math.abs(dy) : Math.abs(dx);
      var score = along + across * 3;
      if (score < bestD) { bestD = score; best = it; }
    });
    if (best) select(best.lot.id, { tip: true });
  });
  svg.addEventListener('focus', function () { if (S.sel) showTip(S.sel); });
  svg.addEventListener('blur', function () { if (!S.hover) tip.classList.remove('is-on'); });

  document.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('[data-pick]'))) { select(b.getAttribute('data-pick'), { tip: true }); b = $('[data-pick="' + S.sel + '"]'); if (b) b.focus(); }
    else if ((b = t.closest('[data-room]'))) { S.rooms = b.getAttribute('data-room'); S.limit = 14; render(); }
    else if ((b = t.closest('[data-band]'))) { S.band = b.getAttribute('data-band'); S.limit = 14; render(); }
    else if (t.closest('[data-free]')) { S.free = !S.free; S.limit = 14; render(); }
    else if (t.closest('[data-ov]')) { S.ov = !S.ov; render(); if (!S.ov) tip.classList.remove('is-on'); }
    else if ((b = t.closest('[data-view]'))) { var v = +b.getAttribute('data-view'); if (v !== S.v) { S.v = v; S.sel = null; S.hover = null; S.limit = 14; tip.classList.remove('is-on'); renderFacade(); render(); $('[data-view="' + v + '"]').focus(); } }
    else if (t.closest('[data-more]')) { var from = S.limit; S.limit += 14; renderList(); var items = $$('[data-pick]'); if (items[from]) items[from].focus(); }
    else if (t.closest('[data-clear]')) { S.rooms = 'all'; S.band = 'all'; S.free = false; render(); }
  });
  $('[data-list]').addEventListener('mouseover', function (e) {
    var b = e.target.closest('[data-pick]'); if (!b) return;
    var id = b.getAttribute('data-pick'); if (id === S.hover) return;
    S.hover = id; paintPolys(); showTip(id);
  });
  $('[data-list]').addEventListener('mouseleave', function () { S.hover = null; paintPolys(); if (S.sel) showTip(S.sel); else tip.classList.remove('is-on'); });

  /* ?id= — открыть сразу нужный ракурс и квартиру */
  var want = MK.params.get('id');
  if (want && byId[want]) { S.v = byId[want].vi; S.sel = want; }
  renderFacade();
  render();
  if (S.sel) showTip(S.sel);
})();
