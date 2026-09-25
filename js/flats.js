/* Каталог квартир: фильтры, сортировка, плитка и строки из data.js */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* в каталоге — всё, что не продано; бронь видна, если снять «Только свободные» */
  var POOL = D.LOTS.filter(function (l) { return l.status !== 'sold'; });
  function bounds(k, step) {
    var v = POOL.map(function (l) { return l[k]; });
    return [Math.floor(Math.min.apply(null, v) / step) * step, Math.ceil(Math.max.apply(null, v) / step) * step];
  }
  var B = { price: bounds('price', 10000), area: bounds('area', 1), floor: bounds('floor', 1) };
  var SORTS = ['rec', 'price-asc', 'price-desc', 'area-asc', 'area-desc', 'floor-asc', 'floor-desc'];
  function defaults() {
    return { rooms: [], price: B.price.slice(), area: B.area.slice(), floor: B.floor.slice(), corp: '', fin: '',
      terrace: false, river: false, corner: false, open: true, fav: false, sort: 'rec', view: 'grid' };
  }
  var S = defaults();
  var STEP = { grid: 12, list: 30 };
  var shown = STEP.grid;
  var mqNarrow = matchMedia('(max-width: 760px)');

  /* ── состояние ⇄ адресная строка ────────────────────────────────── */
  function readUrl() {
    var q = MK.params;
    var rooms = (q.get('rooms') || '').split(',').filter(function (x) { return /^[0-4]$/.test(x); }).map(Number);
    var h = location.hash.replace('#', '');
    if (!rooms.length && /^[0-4]$/.test(h)) rooms = [+h];
    if (!rooms.length && h === 'pent') rooms = [4];
    S.rooms = rooms.filter(function (r, i, a) { return a.indexOf(r) === i; });
    ['price', 'area', 'floor'].forEach(function (k) {
      var m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(q.get(k) || '');
      if (!m) return;
      var a = MK.clamp(+m[1], B[k][0], B[k][1]), b = MK.clamp(+m[2], B[k][0], B[k][1]);
      S[k] = a <= b ? [a, b] : [b, a];
    });
    if (/^[1-3]$/.test(q.get('corp') || '')) S.corp = q.get('corp');
    if (D.FINISHES.indexOf(q.get('fin')) > -1) S.fin = q.get('fin');
    ['terrace', 'river', 'corner', 'fav'].forEach(function (k) { S[k] = q.get(k) === '1'; });
    S.open = q.get('open') !== '0';
    if (SORTS.indexOf(q.get('sort')) > -1) S.sort = q.get('sort');
    if (q.get('view') === 'list') S.view = 'list';
  }
  function writeUrl() {
    var q = new URLSearchParams();
    var d = defaults();
    if (S.rooms.length) q.set('rooms', S.rooms.slice().sort().join(','));
    ['price', 'area', 'floor'].forEach(function (k) { if (S[k][0] !== d[k][0] || S[k][1] !== d[k][1]) q.set(k, S[k][0] + '-' + S[k][1]); });
    if (S.corp) q.set('corp', S.corp);
    if (S.fin) q.set('fin', S.fin);
    ['terrace', 'river', 'corner', 'fav'].forEach(function (k) { if (S[k]) q.set(k, '1'); });
    if (!S.open) q.set('open', '0');
    if (S.sort !== 'rec') q.set('sort', S.sort);
    if (S.view !== 'grid') q.set('view', S.view);
    var qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    MK.session.set('mk-catalog', 'flats.html' + (qs ? '?' + qs : ''));
  }
  function activeCount() {
    var d = defaults(), n = 0;
    if (S.rooms.length) n++;
    ['price', 'area', 'floor'].forEach(function (k) { if (S[k][0] !== d[k][0] || S[k][1] !== d[k][1]) n++; });
    ['corp', 'fin', 'terrace', 'river', 'corner', 'fav'].forEach(function (k) { if (S[k]) n++; });
    if (!S.open) n++;
    return n;
  }

  /* ── выборка ────────────────────────────────────────────────────── */
  function filtered() {
    var favs = S.fav ? MK.fav.list() : null;
    var out = POOL.filter(function (l) {
      return (!S.rooms.length || S.rooms.indexOf(l.rooms) > -1) &&
        l.price >= S.price[0] && l.price <= S.price[1] &&
        l.area >= S.area[0] && l.area <= S.area[1] &&
        l.floor >= S.floor[0] && l.floor <= S.floor[1] &&
        (!S.corp || String(l.corp) === S.corp) && (!S.fin || l.fin === S.fin) &&
        (!S.terrace || l.terrace) && (!S.river || l.river) && (!S.corner || l.corner) &&
        (!S.open || D.isOpen(l)) && (!favs || favs.indexOf(l.id) > -1);
    });
    var by = {
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      'area-asc': function (a, b) { return a.area - b.area; },
      'area-desc': function (a, b) { return b.area - a.area; },
      'floor-asc': function (a, b) { return a.floor - b.floor || a.price - b.price; },
      'floor-desc': function (a, b) { return b.floor - a.floor || a.price - b.price; },
      rec: function (a, b) { return (D.isOpen(b) - D.isOpen(a)) || a.rec - b.rec; }
    };
    return out.sort(by[S.sort] || by.rec);
  }

  /* ── разметка выдачи ────────────────────────────────────────────── */
  var COLS = [['Тип'], ['Корп. / секц.'], ['План'], ['Площадь', 'area'], ['Этаж', 'floor'], ['№'], ['Отделка'], ['Особенности'], ['Стоимость', 'price'], ['']];
  function headHtml() {
    var cur = S.sort.split('-');
    return '<div class="rows__head">' + COLS.map(function (c) {
      if (!c[1]) return '<span>' + c[0] + '</span>';
      var on = cur[0] === c[1];
      var dir = on ? cur[1] : '';
      var next = on && dir === 'asc' ? 'по убыванию' : 'по возрастанию';
      return '<span><button type="button" data-sortcol="' + c[1] + '" aria-pressed="' + on + '" aria-label="Сортировать: ' + c[0].toLowerCase() + ', ' + next + '">' + c[0] +
        (on ? '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="' + (dir === 'asc' ? 'M5 2l4 6H1z' : 'M5 8L1 2h8z') + '"/></svg>' : '') + '</button></span>';
    }).join('') + '</div>';
  }
  function rowHtml(l) {
    var open = D.isOpen(l);
    var feats = [l.terrace && 'терраса', l.river && 'вид на реку', l.corner && 'угловая'].filter(Boolean).join(' · ') || '—';
    return '<li class="row' + (l.status === 'book' ? ' row--book' : '') + '">' +
      '<span class="row__type"><a class="lot__link" href="' + D.lotHref(l) + '">' + l.type +
      '<span class="sr-only">, ' + D.area(l.area) + ', ' + D.lotPlace(l) + ', квартира № ' + l.no + ', ' + (open ? D.money(l.price) : 'забронирована') + '</span></a></span>' +
      '<span aria-hidden="true">' + l.corp + ' / ' + l.sect + '</span>' +
      '<span class="row__plan" aria-hidden="true"><img src="' + D.planSrc(l.plan) + '" alt="" loading="lazy" decoding="async"></span>' +
      '<span aria-hidden="true">' + D.area(l.area) + '</span>' +
      '<span aria-hidden="true">' + l.floor + ' из ' + l.floors + '</span>' +
      '<span aria-hidden="true">' + l.no + '</span>' +
      '<span aria-hidden="true">' + l.fin + '</span>' +
      '<span aria-hidden="true">' + feats + '</span>' +
      '<span class="row__price" aria-hidden="true">' + (open ? D.money(l.price) + '<small>' + (l.disc ? 'скидка ' + l.disc + '%' : D.num(D.perM(l)) + ' смн/м²') + '</small>' : 'Забронирована') + '</span>' +
      '<span class="row__fav"><button class="fav" type="button" data-fav="' + l.id + '" aria-pressed="' + MK.fav.has(l.id) + '" aria-label="В избранное: ' + l.type + ' № ' + l.no + '">' + MK.icon('heart', '') + '</button></span></li>';
  }
  function emptyHtml() {
    if (S.fav && !MK.fav.list().length) {
      return '<div class="empty"><h2>В избранном пока пусто</h2><p>Отмечайте квартиры сердечком на карточке — они соберутся здесь, и их удобно сравнить или обсудить с менеджером.</p>' +
        '<div class="row-btns"><button class="btn btn--dark" type="button" data-unfav>Показать все квартиры</button></div></div>';
    }
    return '<div class="empty"><h2>Под эти условия ничего не нашлось</h2><p>Попробуйте расширить диапазон цены или площади, снять часть отметок — или посмотрите дом целиком на шахматке.</p>' +
      '<div class="row-btns"><button class="btn btn--dark" type="button" data-reset>Сбросить фильтры</button><a class="btn btn--soft" href="building.html">Шахматка дома</a><a class="btn btn--soft" href="#lead">Подобрать с менеджером</a></div></div>';
  }

  var res = $('[data-results]'), more = $('[data-more]');
  function view() { return mqNarrow.matches ? 'grid' : S.view; }
  function render(focusFrom) {
    var list = filtered();
    var v = view();
    $('[data-found]').textContent = D.num(list.length);
    $('[data-found-word]').textContent = D.plural(list.length, ['квартира', 'квартиры', 'квартир']);
    var n = activeCount();
    $$('[data-reset]').forEach(function (b) { b.disabled = n === 0; });
    $('[data-flt-count]').textContent = n ? '· ' + n : '';
    $('[data-fav-count]').textContent = MK.fav.list().length;
    if (!list.length) {
      res.innerHTML = emptyHtml();
      more.hidden = true;
    } else {
      var slice = list.slice(0, shown);
      res.innerHTML = v === 'grid'
        ? '<div class="lots">' + slice.map(function (l) { return MK.lotCard(l); }).join('') + '</div>'
        : '<div class="rows"><div class="rows__in">' + headHtml() + '<ul>' + slice.map(rowHtml).join('') + '</ul></div></div>';
      var rest = list.length - shown;
      more.hidden = rest <= 0;
      if (rest > 0) {
        var k = Math.min(STEP[v], rest);
        more.innerHTML = '<button class="btn btn--soft btn--lg" type="button" data-show-more>Показать ещё ' + k + '</button><p>Показано ' + D.num(shown) + ' из ' + D.num(list.length) + '</p>';
      }
      if (focusFrom != null) {
        var links = $$('.lot__link', res);
        if (links[focusFrom]) links[focusFrom].focus();
      }
    }
    syncControls();
    writeUrl();
  }

  /* ── элементы управления ────────────────────────────────────────── */
  var ranges = {};
  var fmt = {
    price: function (v) { return D.num(v); },
    area: function (v) { return String(Math.round(v)); },
    floor: function (v) { return String(Math.round(v)); }
  };
  $$('[data-range]').forEach(function (root) {
    var k = root.getAttribute('data-range');
    ranges[k] = MK.range(root, {
      min: B[k][0], max: B[k][1], step: k === 'price' ? 10000 : 1, fmt: fmt[k],
      label: k === 'price' ? 'Стоимость' : k === 'area' ? 'Площадь' : 'Этаж',
      onChange: function (a, b) { S[k] = [a, b]; shown = STEP[view()]; render(); }
    });
  });
  function syncControls() {
    $$('[data-room]').forEach(function (b) { b.setAttribute('aria-pressed', String(S.rooms.indexOf(+b.getAttribute('data-room')) > -1)); });
    $$('[data-chip]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!S[b.getAttribute('data-chip')])); });
    $('[data-f="corp"]').value = S.corp;
    $('[data-f="fin"]').value = S.fin;
    $('[data-sort]').value = S.sort;
    $$('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === S.view)); });
    Object.keys(ranges).forEach(function (k) {
      var cur = ranges[k].get();
      if (cur[0] !== S[k][0] || cur[1] !== S[k][1]) ranges[k].set(S[k][0], S[k][1], true);
    });
  }
  function change(fn) { fn(); shown = STEP[view()]; render(); }

  $$('[data-room]').forEach(function (b) {
    b.addEventListener('click', function () {
      change(function () {
        var r = +b.getAttribute('data-room'), i = S.rooms.indexOf(r);
        if (i > -1) S.rooms.splice(i, 1); else S.rooms.push(r);
      });
    });
  });
  $$('[data-chip]').forEach(function (b) {
    b.addEventListener('click', function () { change(function () { var k = b.getAttribute('data-chip'); S[k] = !S[k]; }); });
  });
  $$('[data-f]').forEach(function (s) {
    s.addEventListener('change', function () { change(function () { S[s.getAttribute('data-f')] = s.value; }); });
  });
  $('[data-sort]').addEventListener('change', function (e) { S.sort = e.target.value; render(); });
  $$('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { S.view = b.getAttribute('data-view'); shown = STEP[S.view]; render(); });
  });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-reset]')) {
      var keep = { sort: S.sort, view: S.view };
      S = defaults(); S.sort = keep.sort; S.view = keep.view;
      shown = STEP[view()];
      render();
    } else if (t.closest('[data-unfav]')) {
      change(function () { S.fav = false; });
    } else if (t.closest('[data-show-more]')) {
      var from = shown;
      shown += STEP[view()];
      render(from);
    } else if (t.closest('[data-sortcol]')) {
      var c = t.closest('[data-sortcol]').getAttribute('data-sortcol');
      S.sort = c + (S.sort === c + '-asc' ? '-desc' : '-asc');
      render();
      var b = $('[data-sortcol="' + c + '"]'); if (b) b.focus();
    }
  });
  document.addEventListener('mk:fav', function () {
    $('[data-fav-count]').textContent = MK.fav.list().length;
    if (S.fav) render();
  });
  var fl = $('#filters'), tog = $('[data-flt-toggle]');
  tog.addEventListener('click', function () {
    var on = !fl.classList.contains('is-open');
    fl.classList.toggle('is-open', on);
    tog.setAttribute('aria-expanded', String(on));
  });
  if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', function () { render(); });

  readUrl();
  render();
})();
