/* Шахматка: корпус → секция → стояк → этаж, клавиатурная сетка и карточка лота */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var HOUSE = D.HOUSE;

  var S = { b: 0, s: 0, rooms: [], night: true, sel: null };
  var cursor = { r: 0, x: 0 };          // позиция фокуса: строка сверху вниз, стояк
  var matrix = [];                      // [строка][стояк] → лот (пентхаус занимает два стояка)
  var drawer = $('#drawer');
  var gridBox = $('[data-grid]');
  var board = $('[data-board]');

  /* глубокая ссылка: building.html?id=… или ?corp=1&sect=2 */
  (function readUrl() {
    var q = MK.params;
    var lot = D.find(q.get('id'));
    if (lot) {
      S.b = HOUSE.findIndex(function (b) { return b.k === lot.corp; });
      S.s = HOUSE[S.b].sec.findIndex(function (s) { return s.i === lot.sect; });
      S.sel = lot.id;
      return;
    }
    var bi = HOUSE.findIndex(function (b) { return String(b.k) === q.get('corp'); });
    if (bi > -1) {
      S.b = bi;
      var si = HOUSE[bi].sec.findIndex(function (s) { return String(s.i) === q.get('sect'); });
      if (si > -1) S.s = si;
    }
  })();

  function sec() { return HOUSE[S.b].sec[S.s]; }
  function lots(sc) { return sc.floors.reduce(function (a, r) { return a.concat(r.row.filter(Boolean)); }, []); }
  function roomOk(l) { return !S.rooms.length || S.rooms.indexOf(l.rooms) > -1; }
  function short(key) { return key === 's' ? 'Ст' : key === '4' ? 'П' : key + ' сп'; }
  function face(l) { return l.status === 'sold' ? '' : l.rooms === 0 ? 'С' : l.rooms === 4 ? 'П' : String(l.rooms); }

  /* ── боковая панель ─────────────────────────────────────────────── */
  function renderSide() {
    $('[data-corps]').innerHTML = HOUSE.map(function (b, i) {
      return '<button class="seg__btn" type="button" data-b="' + i + '" aria-pressed="' + (i === S.b) + '" aria-label="Корпус ' + b.k + '">' + b.k + '</button>';
    }).join('');
    $('[data-sects]').innerHTML = HOUSE[S.b].sec.map(function (sc, i) {
      var free = lots(sc).filter(D.isOpen).length;
      return '<button class="sect-btn" type="button" data-s="' + i + '" aria-pressed="' + (i === S.s) + '"><span>Секция № ' + sc.i + '</span><span>' + free + ' своб.</span></button>';
    }).join('');
    $$('[data-room]').forEach(function (b) { b.setAttribute('aria-pressed', String(S.rooms.indexOf(+b.getAttribute('data-room')) > -1)); });
    $$('[data-night]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-night') === '1') === S.night)); });
    var pool = lots(sec()).filter(roomOk);
    var free = pool.filter(D.isOpen).length;
    $('[data-free-n]').textContent = free;
    $('[data-free-of]').textContent = D.plural(free, ['свободна', 'свободны', 'свободно']) + ' из ' + pool.length + (S.rooms.length ? ' подходящих' : ' в секции');
    $('[data-free-bar]').style.transform = 'scaleX(' + (pool.length ? (free / pool.length).toFixed(3) : 0) + ')';
  }

  /* ── сетка ──────────────────────────────────────────────────────── */
  function cellLabel(l) {
    var st = l.status === 'sale' ? 'свободна, скидка ' + l.disc + '%' : D.STATUS[l.status].toLowerCase();
    return 'Этаж ' + l.floor + ', квартира № ' + l.no + ', ' + l.type + ', ' + D.area(l.area) + ', ' + st + (D.isOpen(l) ? ', ' + D.money(l.price) : '');
  }
  function renderGrid() {
    var sc = sec();
    var rows = sc.floors.slice().reverse();
    matrix = rows.map(function (r) {
      var m = [];
      r.row.forEach(function (l, x) { if (l) { m[x] = l; if (l.span === 2) m[x + 1] = l; } });
      return m;
    });
    var head = '<div class="grid__row grid__head" role="row"><span class="grid__fl" role="columnheader">Эт.</span>' +
      sc.stacks.map(function (st, x) {
        return '<span class="grid__col" role="columnheader" aria-label="Стояк ' + (x + 1) + ': ' + st.t.name + '">' + short(st.key) + '</span>';
      }).join('') + '</div>';
    var body = rows.map(function (r, ri) {
      var mark = r.f % 5 === 0 || r.f === sc.to;
      var cells = r.row.map(function (l, x) {
        if (!l) return '';
        var cls = 'cell cell--' + l.status + (l.span === 2 ? ' cell--w' : '') + (roomOk(l) ? '' : ' is-dim') + (l.id === S.sel ? ' is-sel' : '');
        var tip = '№ ' + l.no + ' · ' + l.type + ' · ' + D.area(l.area) + (D.isOpen(l) ? ' · ' + D.money(l.price) : ' · ' + D.STATUS[l.status].toLowerCase());
        return '<span role="gridcell"' + (l.span === 2 ? ' aria-colspan="2"' : '') + ' class="grid__cell"><button type="button" class="' + cls + '" data-id="' + l.id + '" data-r="' + ri + '" data-x="' + x + '" tabindex="-1" aria-label="' + cellLabel(l) + '" title="' + tip + '"' +
          (l.status === 'sold' ? ' aria-disabled="true"' : '') + '>' + face(l) + '</button></span>';
      }).join('');
      return '<div class="grid__row" role="row"><span class="grid__fl' + (mark ? ' is-mark' : '') + '" role="rowheader">' + r.f + '</span>' + cells + '</div>';
    }).join('');
    var com = '<div class="grid__row" role="row"><span class="grid__fl" role="rowheader">1</span><span class="grid__com" role="gridcell">Коммерция и лобби</span></div>';
    gridBox.innerHTML = '<div class="grid" style="--cols:' + sc.cols + '" role="grid" aria-label="' + HOUSE[S.b].name + ', секция ' + sc.i + ': квартиры по этажам и стоякам" aria-describedby="grid-hint" aria-rowcount="' + (rows.length + 2) + '">' + head + body + com + '</div>';
    $('[data-board-title]').textContent = HOUSE[S.b].name + ' · секция № ' + sc.i;
    $('[data-board-sub]').textContent = sc.from + '–' + sc.to + ' этаж · ' + sc.cols + ' ' + D.plural(sc.cols, ['квартира', 'квартиры', 'квартир']) + ' на этаже · верхний этаж — пентхаусы';
    $('[data-sect-prev]').disabled = S.s === 0;
    $('[data-sect-next]').disabled = S.s === HOUSE[S.b].sec.length - 1;
    board.classList.toggle('is-night', S.night);
    // стартовая позиция курсора: выбранный лот или первый свободный сверху
    var start = null;
    if (S.sel) start = gridBox.querySelector('[data-id="' + S.sel + '"]');
    if (!start) start = gridBox.querySelector('.cell--free,.cell--sale') || gridBox.querySelector('.cell');
    if (start) setCursor(+start.getAttribute('data-r'), +start.getAttribute('data-x'), false);
  }
  function btnAt(r, x) {
    var l = matrix[r] && matrix[r][x];
    return l ? gridBox.querySelector('[data-id="' + l.id + '"]') : null;
  }
  function setCursor(r, x, focus) {
    var b = btnAt(r, x);
    if (!b) return false;
    $$('.cell[tabindex="0"]', gridBox).forEach(function (c) { c.tabIndex = -1; });
    b.tabIndex = 0;
    cursor = { r: r, x: x };
    if (focus) { b.focus(); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    return true;
  }
  function move(dr, dx) {
    var r = cursor.r, x = cursor.x, cur = matrix[r][x];
    if (dx) {
      var nx = x;
      do { nx += dx; } while (matrix[r][nx] === cur && nx >= 0 && nx < matrix[r].length);
      if (nx >= 0 && matrix[r][nx]) setCursor(r, nx, true);
    } else {
      var nr = MK.clamp(r + dr, 0, matrix.length - 1);
      if (nr !== r && !setCursor(nr, x, true)) setCursor(nr, x - 1, true);
    }
  }
  gridBox.addEventListener('keydown', function (e) {
    if (!e.target.classList.contains('cell')) return;
    var k = e.key, row = matrix[cursor.r];
    if (k === 'ArrowRight') move(0, 1);
    else if (k === 'ArrowLeft') move(0, -1);
    else if (k === 'ArrowUp') move(-1, 0);
    else if (k === 'ArrowDown') move(1, 0);
    else if (k === 'PageUp') move(-5, 0);
    else if (k === 'PageDown') move(5, 0);
    else if (k === 'Home') { if (e.ctrlKey) setCursor(0, 0, true); else setCursor(cursor.r, 0, true); }
    else if (k === 'End') { if (e.ctrlKey) setCursor(matrix.length - 1, row.length - 1, true); else setCursor(cursor.r, row.length - 1, true); }
    else return;
    e.preventDefault();
  });
  gridBox.addEventListener('click', function (e) {
    var b = e.target.closest('.cell');
    if (!b) return;
    setCursor(+b.getAttribute('data-r'), +b.getAttribute('data-x'), false);
    if (b.getAttribute('aria-disabled') === 'true') return;
    openDrawer(D.find(b.getAttribute('data-id')), b);
  });

  /* ── карточка квартиры ──────────────────────────────────────────── */
  var lastCell = null;
  function openDrawer(l, from) {
    if (!l || typeof drawer.showModal !== 'function') { if (l) location.href = D.lotHref(l); return; }
    lastCell = from;
    S.sel = l.id;
    $$('.cell.is-sel', gridBox).forEach(function (c) { c.classList.remove('is-sel'); });
    if (from) from.classList.add('is-sel');
    var open = D.isOpen(l);
    var kind = $('[data-d-kind]');
    kind.textContent = l.status === 'sale' ? 'Свободна · скидка ' + l.disc + '%' : D.STATUS[l.status];
    kind.classList.toggle('is-sale', l.status === 'sale');
    $('[data-d-no]').textContent = l.type + ', № ' + l.no;
    $('[data-d-plan]').src = D.planSrc(l.plan);
    $('[data-d-plan]').alt = 'Планировка: ' + l.type.toLowerCase() + ', ' + D.area(l.area);
    $('[data-d-plan-link]').href = D.lotHref(l);
    $('[data-d-specs]').innerHTML = [
      ['Корпус', HOUSE[S.b].name.replace('Корпус ', '№ ')], ['Секция', '№ ' + sec().i],
      ['Этаж', l.floor + ' из ' + l.floors], ['Площадь', D.area(l.area)],
      ['Отделка', l.fin], ['Особенности', l.terrace ? 'Терраса' : l.river ? 'Вид на реку' : l.corner ? 'Угловая' : '—']
    ].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
    $('[data-d-note]').textContent = l.status === 'book'
      ? 'Квартира забронирована. Оставьте заявку — сообщим, если бронь снимут, и подберём похожую в этом же стояке.'
      : 'Планировка показана схематично. Точные размеры и цену подтвердит отдел продаж.';
    $('[data-d-price]').textContent = open ? D.money(l.price) : D.STATUS[l.status];
    $('[data-d-per]').innerHTML = open ? (l.was ? '<s>' + D.money(l.was) + '</s>' : '') + D.num(D.perM(l)) + ' смн за м²' : '';
    var cta = $('[data-d-cta]');
    cta.textContent = open ? 'Забронировать' : 'Оставить заявку';
    cta.href = D.lotHref(l, '#lead');
    $('[data-d-more]').href = D.lotHref(l);
    drawer.showModal();
    history.replaceState(null, '', location.pathname + '?id=' + encodeURIComponent(l.id));
  }
  drawer.addEventListener('close', function () { if (lastCell && document.contains(lastCell)) lastCell.focus(); });
  $('[data-d-close]').addEventListener('click', function () { drawer.close(); });
  drawer.addEventListener('click', function (e) { if (e.target === drawer) drawer.close(); });

  /* ── управление ─────────────────────────────────────────────────── */
  function syncUrl() {
    history.replaceState(null, '', location.pathname + '?corp=' + HOUSE[S.b].k + '&sect=' + sec().i);
  }
  function renderAll() { renderSide(); renderGrid(); }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var b = t.closest('[data-b]'), s = t.closest('[data-s]'), r = t.closest('[data-room]'), n = t.closest('[data-night]');
    if (b) { S.b = +b.getAttribute('data-b'); S.s = 0; S.sel = null; renderAll(); syncUrl(); }
    else if (s) { S.s = +s.getAttribute('data-s'); S.sel = null; renderAll(); syncUrl(); }
    else if (r) { var k = +r.getAttribute('data-room'), i = S.rooms.indexOf(k); if (i > -1) S.rooms.splice(i, 1); else S.rooms.push(k); renderAll(); }
    else if (n) { S.night = n.getAttribute('data-night') === '1'; renderSide(); board.classList.toggle('is-night', S.night); }
  });
  $('[data-sect-prev]').addEventListener('click', function () { if (S.s > 0) { S.s--; S.sel = null; renderAll(); syncUrl(); } });
  $('[data-sect-next]').addEventListener('click', function () { if (S.s < HOUSE[S.b].sec.length - 1) { S.s++; S.sel = null; renderAll(); syncUrl(); } });

  renderAll();
  if (S.sel) {
    var c = gridBox.querySelector('[data-id="' + S.sel + '"]');
    if (c) requestAnimationFrame(function () {
      board.scrollIntoView({ block: 'start', behavior: 'auto' });
      c.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
  }
})();
