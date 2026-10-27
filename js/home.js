/* Главная — страница объекта «Сырдарья»: первый экран, о доме, место,
   свободные квартиры (фасад, где горят окна свободных квартир), планировки,
   условия, ход строительства и заявка; данные — js/object.js и data.js */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var ease = function (t) { t = MK.clamp01(t); return t * t * (3 - 2 * t); };

  var model = $('[data-model]'), frame = $('[data-frame]');

  /* ── макет: свет в окнах свободных квартир, выбор по этажам ────── */
  var svgF = $('[data-fsvg]');
  var F = MK.home = MK.facade(svgF, { canvas: $('[data-fcv]'), mode: 'io' });
  var lift = $('[data-lift]'), tag = $('[data-tag]');
  var total = F.lots.length;
  var NF = F.floors.length;

  var ROOMS = [['all', 'Все']].concat(D.ROOM_TYPES.map(function (r) { return [r, r + '-комнатные']; }));
  var keys = $('[data-keys]');
  var isFree = function (l) { return D.isOpen(l); };
  var cnt = function (r) { return F.lots.filter(function (it) { return isFree(it.lot) && (r === 'all' || it.lot.rooms === r); }).length; };
  ROOMS = ROOMS.filter(function (k) { return cnt(k[0]) > 0; });
  keys.innerHTML = ROOMS.map(function (k) {
    return '<button class="seg__btn" type="button" data-r="' + k[0] + '" aria-pressed="' + (k[0] === 'all') + '">' + k[1] + ' <small>' + cnt(k[0]) + '</small></button>';
  }).join('');
  var sel = 'all';
  var countEl = $('[data-count]'), go = $('[data-go]'), goFlats = $('[data-go-flats]');
  var match = function (l) { return isFree(l) && (sel === 'all' || l.rooms === sel); };
  function paintKeys() {
    $$('[data-r]', keys).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-r') === String(sel))); });
    F.paint(match);
    var n = cnt(sel);
    var word = sel === 'all' ? '' : ' — ' + ROOMS.filter(function (k) { return k[0] === sel; })[0][1].toLowerCase();
    countEl.innerHTML = 'Вид с бульвара: горит свет в <b>' + n + '</b> ' + D.plural(n, ['квартире', 'квартирах', 'квартирах']) + word +
      ' из ' + total + ' на этом фасаде. ' + (matchMedia('(hover: hover)').matches ? 'Наведите' : 'Нажмите') + ' на дом — покажем этаж.';
    go.href = 'picker.html?v=dusk' + (sel === 'all' ? '' : '&rooms=' + sel);
    if (sel !== 'all') wish(sel);
    goFlats.href = sel === 'all' ? 'flats.html' : 'flats.html?rooms=' + sel;
    hideTag();
    if (hotF != null) showLift(hotF);
  }
  keys.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (!b) return;
    var v = b.getAttribute('data-r');
    sel = v === 'all' ? 'all' : +v;
    paintKeys();
  });

  /* что выбрал покупатель на макете или в планировках — сразу в форму шоурума */
  function wish(r) {
    var f = $('#lead select[name="interest"]');
    if (f && D.ROOM_NAMES[r]) f.value = D.ROOM_NAMES[r];
  }

  /* табличка этажа — как в лифте: номер, свободные и цена от */
  var hotF = null;
  function floorInfo(f) {
    var list = (F.byFloor[f] || []).filter(function (it) { return match(it.lot); });
    var min = list.length ? Math.min.apply(null, list.map(function (it) { return it.lot.price; })) : 0;
    return { n: list.length, min: min };
  }
  function placeLift(f, side) {
    var fr = frame.getBoundingClientRect();
    var e = F.floorEdge(f), c = e && F.client(e[0], e[1]);
    if (!c) return false;
    var left = side != null ? side : c[0] - fr.left + lift.offsetWidth + 40 > fr.width;
    if (left) { e = F.floorEdge(f, true); c = e && F.client(e[0], e[1]); if (!c) return false; }
    lift.classList.toggle('is-left', left);
    /* кадр может обрезать края фасада (cover) — табличка остаётся в кадре */
    var w = lift.offsetWidth + 34, x = c[0] - fr.left;
    x = left ? MK.clamp(x, w + 8, fr.width - 8) : MK.clamp(x, 8, fr.width - w - 8);
    lift.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(MK.clamp(c[1] - fr.top, 40, fr.height - 40)) + 'px)';
    return true;
  }
  function showLift(f, ride) {
    var inf = floorInfo(f);
    lift.innerHTML = '<b class="lift__n tnum">' + f + '</b><span class="lift__t">этаж</span>' +
      (ride ? '' : '<span class="lift__c">' + (inf.n ? inf.n + ' ' + D.plural(inf.n, ['свободная', 'свободные', 'свободных']) + (sel === 'all' ? '' : '') + (D.priced ? '<br>от ' + D.money(inf.min) : '') : 'свободных нет') + '</span>');
    lift.classList.toggle('is-ride', !!ride);
    lift.hidden = false;
    if (!placeLift(f)) lift.hidden = true;
  }
  function hideLift() { lift.hidden = true; }

  /* подъём света: табличка едет по фасаду вместе с фронтом света */
  var riding = false;
  function ride(lit) {
    if (!F || hotF != null) return;
    if (lit > 0.001 && lit < 0.985) {
      var i = MK.clamp(Math.floor(lit * (NF + 3) - 1), 0, NF - 1);
      var f = F.floors[i];
      F.drawFloor(f);
      showLift(f, true);
      riding = true;
    } else if (riding) {
      riding = false;
      F.drawFloor(null);
      hideLift();
    }
  }

  /* бирка квартиры у окна */
  var hot = null, hideT = 0;
  function showTag(it) {
    clearTimeout(hideT);
    hot = it;
    F.focusLot(it);
    var l = it.lot;
    tag.innerHTML = '<b>' + l.type + ' · ' + D.area(l.area) + '</b>' +
      '<span>Этаж ' + l.floor + ' · № ' + l.no + (D.priced ? ' · ' + D.money(l.price) : '') + '</span>' +
      '<a href="' + D.lotHref(l) + '">Открыть квартиру ' + MK.icon('arrow') + '</a>';
    tag.hidden = false;
    var c = F.client(it.cx, Math.min.apply(null, it.win.map(function (q) { return Math.min(q[0][1], q[1][1]); })));
    var fr = frame.getBoundingClientRect();
    if (!c) return;
    var x = MK.clamp(c[0] - fr.left, 120, fr.width - 120), yy = c[1] - fr.top;
    var below = yy < 130;
    if (below) yy = F.client(it.cx, Math.max.apply(null, it.win.map(function (q) { return Math.max(q[2][1], q[3][1]); })))[1] - fr.top;
    tag.classList.toggle('is-below', below);
    tag.style.left = x.toFixed(0) + 'px';
    tag.style.top = yy.toFixed(0) + 'px';
    /* бирка не должна закрывать табличку этажа — табличку уводим на другой край */
    if (!lift.hidden && hotF != null) {
      var tr = tag.getBoundingClientRect(), lr = lift.getBoundingClientRect();
      if (tr.left < lr.right && tr.right > lr.left && tr.top < lr.bottom && tr.bottom > lr.top) placeLift(hotF, !lift.classList.contains('is-left'));
    }
  }
  function hideTag() {
    if (!tag) return;
    hot = null;
    F.focusLot(null);
    tag.hidden = true;
  }
  function later() { clearTimeout(hideT); hideT = setTimeout(hideTag, 260); }
  function setFloor(f) {
    if (f === hotF) return;
    hotF = f;
    F.focusFloor(f);
    if (f == null) { hideLift(); return; }
    riding = false;
    showLift(f);
  }
  function live() { return true; }
  frame.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !live()) return;
    if (e.target.closest('[data-tag]')) { clearTimeout(hideT); return; }
    var p = F.local(e.clientX, e.clientY);
    if (!p) return;
    setFloor(F.floorAt(p[0], p[1]));
    var it = F.lotAt(p[0], p[1], match);
    if (it) { if (it !== hot) showTag(it); } else if (hot) later();
  });
  frame.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return;
    setFloor(null); later();
  });
  frame.addEventListener('click', function (e) {
    if (e.target.closest('[data-tag]') || !live()) return;
    var p = F.local(e.clientX, e.clientY);
    if (!p) return;
    var it = F.lotAt(p[0], p[1], match);
    if (it && e.pointerType === 'mouse' && it === hot) { location.href = D.lotHref(it.lot); return; }
    var f = F.floorAt(p[0], p[1]);
    setFloor(f);
    if (it) showTag(it); else hideTag();
  });
  tag.addEventListener('pointerenter', function () { clearTimeout(hideT); });
  tag.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') later(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { hideTag(); setFloor(null); } });
  addEventListener('resize', function () { if (hotF != null) placeLift(hotF); hideTag(); });
  paintKeys();

  /* свет загорается один раз, когда фасад появляется на экране */
  var litOnce = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !litOnce) { litOnce = true; F.lightUp(); }
    }, { threshold: 0.3 }).observe(frame);
  } else F.lightUp();

  /* ── номера на рендерах: точка изображения → точка кадра (cover) ── */
  function placePins() {
    $$('[data-pins]').forEach(function (fig) {
      var ar = +fig.getAttribute('data-ar') || 1.79;
      var op = (fig.getAttribute('data-op') || '50 50').split(' ').map(function (v) { return +v / 100; });
      var W = fig.clientWidth, H = fig.clientHeight;
      if (!W || !H) return;
      var iw, ih;
      if (W / H > ar) { iw = W; ih = W / ar; } else { ih = H; iw = H * ar; }
      var ox = (W - iw) * op[0], oy = (H - ih) * op[1];
      $$('.pin', fig).forEach(function (p) {
        var x = ox + (+p.getAttribute('data-u')) * iw, y = oy + (+p.getAttribute('data-v')) * ih;
        p.style.setProperty('--x', (x / W * 100).toFixed(2) + '%');
        p.style.setProperty('--y', (y / H * 100).toFixed(2) + '%');
        p.hidden = x < 12 || y < 12 || x > W - 12 || y > H - 12;
      });
    });
  }
  placePins();
  addEventListener('resize', placePins);
  addEventListener('load', placePins);

  /* подсветка номера при наведении на строку легенды */
  $$('[data-legend] [data-k]').forEach(function (li) {
    var k = li.getAttribute('data-k');
    var pin = $('.pin[data-k="' + k + '"]');
    if (!pin || li.closest('.loc__list')) return;
    var on = function (v) { li.classList.toggle('is-on', v); pin.classList.toggle('is-on', v); };
    li.addEventListener('pointerenter', function () { on(true); });
    li.addEventListener('pointerleave', function () { on(false); });
  });

  /* ── место: строка легенды ↔ номер на карте, «линейка» от дома ──── */
  var loc = $('[data-loc]');
  if (loc) {
    var locRuler = $('[data-ruler]', loc), locHome = $('.loc__home', loc);
    var locFit = function () {
      /* номера и подписи, ушедшие за край кадра (телефон), прячем целиком */
      var f = loc.parentNode.getBoundingClientRect();
      $$('.pin,.loc__lbl', loc).forEach(function (el) {
        el.style.visibility = '';
        var r = el.getBoundingClientRect();
        el.style.visibility = (r.left < f.left + 6 || r.right > f.right - 6 || r.top < f.top + 6 || r.bottom > f.bottom - 6) ? 'hidden' : '';
      });
    };
    var locCur = null;
    var locMark = function (k, on) {
      var li = $('.loc__list [data-k="' + k + '"]'), pin = $('.pin[data-k="' + k + '"]', loc);
      if (li) li.classList.toggle('is-on', on);
      if (pin) pin.classList.toggle('is-on', on);
      if (k === 'l1') locHome.classList.toggle('is-on', on);
      if (on && pin) {
        var xy = pin.getAttribute('data-xy').split(' ');
        locRuler.setAttribute('x2', xy[0]); locRuler.setAttribute('y2', xy[1]);
      }
      locRuler.classList.toggle('is-on', on && !!pin);
    };
    var locSet = function (k) { if (locCur && locCur !== k) locMark(locCur, false); locCur = k; if (k) locMark(k, true); };
    $$('.loc__list [data-k]').forEach(function (li) {
      var k = li.getAttribute('data-k');
      li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') locSet(k); });
      li.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') locSet(null); });
      li.addEventListener('click', function () { locSet(locCur === k ? null : k); });
    });
    $$('.pin', loc).forEach(function (p) {
      var k = p.getAttribute('data-k');
      p.addEventListener('pointerenter', function () { locSet(k); });
      p.addEventListener('pointerleave', function () { locSet(null); });
    });
    locFit();
    addEventListener('resize', locFit);
  }

  /* ── планировки из проекта (js/plans-data.js) ────────────────────── */
  var PLN = MK.plans;
  if (PLN && PLN.list.length) {
    var hp = { r: PLN.list[0].rooms, id: PLN.list[0].id };
    var hpKeys = $('[data-hp-keys]'), hpList = $('[data-hp-list]'), hpRooms = $('[data-hp-rooms]');
    var hpView = PLN.viewer($('[data-hp-view]'), { sizes: '(min-width: 900px) 55vw, 100vw', onHover: function (n) { hpOn(n); } });
    var hpOn = PLN.bindRooms(hpRooms, hpView);
    hpKeys.innerHTML = PLN.rooms().map(function (k) {
      return '<button class="seg__btn" type="button" data-r="' + k.r + '" aria-pressed="false">' + PLN.kinds(k.r) + ' <small>' + k.n + '</small></button>';
    }).join('');
    var hpRender = function () {
      var list = PLN.list.filter(function (p) { return p.rooms === hp.r; });
      if (!list.some(function (p) { return p.id === hp.id; })) hp.id = list[0].id;
      var p = PLN.find(hp.id);
      $$('[data-r]', hpKeys).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-r') === hp.r)); });
      hpList.innerHTML = list.map(function (x) {
        return '<button class="ptype" type="button" data-id="' + x.id + '" aria-pressed="' + (x.id === hp.id) + '"><span class="led' + (x.id === hp.id ? ' is-on' : '') + '"></span>' +
          '<span class="ptype__name">' + x.code + '</span><span class="ptype__n tnum">' + PLN.area(x.area) + '</span>' +
          '<span class="ptype__p">' + PLN.summary(x) + (x.mirrorOf ? ' · зеркальная ' + x.mirrorOf : '') + '</span></button>';
      }).join('');
      hpView.set(p);
      hpRooms.innerHTML = PLN.roomsHtml(p);
      $('[data-hp-open]').href = 'plans.html?plan=' + p.id;
      $('[data-hp-open]').textContent = 'Открыть планировку ' + p.code;
    };
    hpKeys.addEventListener('click', function (e) {
      var b = e.target.closest('[data-r]');
      if (b) { hp.r = +b.getAttribute('data-r'); hpRender(); wish(hp.r); }
    });
    hpList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-id]');
      if (b) { hp.id = b.getAttribute('data-id'); hpRender(); }
    });
    $('[data-hp-ask]').addEventListener('click', function () {
      var slot = $('#lead [data-lead-slot]');
      if (slot && slot._lead) slot._lead.setPlan(PLN.find(hp.id));
    });
    hpRender();
  }

  /* ── блоки, которые появляются, когда есть данные ─────────────────
     условия покупки — js/object.js (terms), ход строительства —
     js/progress-data.js (tools/progress.py из папок media/progress/<дата>/),
     застройщик — SITE.developer в js/data.js */
  var OBJ = window.MK_OBJECT || {};
  var esc = MK.esc;
  if (OBJ.terms && OBJ.terms.length) {
    $('[data-terms-list]').innerHTML = OBJ.terms.map(function (t) {
      return '<li><h3>' + esc(t.t) + '</h3>' + (t.d ? '<p>' + esc(t.d) + '</p>' : '') + '</li>';
    }).join('');
    $('[data-terms]').hidden = false;
  }
  var PRG = window.MK_PROGRESS || [];
  if (PRG.length) {
    var fmtDate = function (d) {
      var m = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      var p = d.split('-');
      return +p[2] + ' ' + m[+p[1] - 1] + ' ' + p[0];
    };
    $('[data-progress-stage]').textContent = (PRG[0].stage ? PRG[0].stage + ' ' : '') + 'Фото от ' + fmtDate(PRG[0].date) + '.';
    $('[data-progress-list]').innerHTML = PRG.map(function (g) {
      return '<section class="progress__set"><h3 class="progress__date">' + fmtDate(g.date) + (g.stage ? ' · <span>' + esc(g.stage) + '</span>' : '') + '</h3>' +
        '<div class="progress__photos">' + g.photos.map(function (ph) {
          return '<a class="progress__ph" href="' + ph.full + '" target="_blank" rel="noopener"><img src="' + ph.src + '" width="' + ph.w + '" height="' + ph.h + '" alt="Стройка, ' + fmtDate(g.date) + '" loading="lazy" decoding="async"></a>';
        }).join('') + '</div></section>';
    }).join('');
    $('[data-progress]').hidden = false;
  }
  var DEV = D.SITE.developer || {};
  if (DEV.about || (DEV.done && DEV.done.length) || (DEV.docs && DEV.docs.length)) {
    $('[data-dev-about]').textContent = DEV.about || '';
    $('[data-dev-done]').innerHTML = (DEV.done || []).map(function (o) { return '<li><h3>' + esc(o.t) + '</h3>' + (o.d ? '<p>' + esc(o.d) + '</p>' : '') + '</li>'; }).join('');
    $('[data-dev-docs]').innerHTML = (DEV.docs || []).map(function (o) { return '<li><a class="link-arrow" href="' + esc(o.href) + '" download>' + esc(o.t) + ' · PDF</a></li>'; }).join('');
    $('[data-dev]').hidden = false;
  }

  if (MK.motion) MK.motion();
})();
