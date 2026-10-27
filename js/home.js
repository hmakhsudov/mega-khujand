/* Главная — страница объекта «Сырдарья»: первый экран, о доме, место,
   свободные квартиры по комнатам, планировки,
   условия, ход строительства и заявка; данные — js/object.js и data.js */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* шапка прозрачная над первым экраном, графитовая после прокрутки */
  var hdr = $('#hdr');
  if (hdr) {
    var solid = function () { hdr.classList.toggle('is-solid', scrollY > 24); };
    solid();
    addEventListener('scroll', solid, { passive: true });
  }

  /* ── свободные квартиры по комнатам: число и площади из каталога ── */
  var LOTS = D.LOTS || [];
  $$('[data-pick-n]').forEach(function (el) {
    var r = +el.getAttribute('data-pick-n');
    var all = LOTS.filter(function (l) { return l.rooms === r; });
    var free = all.filter(D.isOpen);
    var li = el.closest('li');
    if (!all.length) { li.hidden = true; return; }
    el.innerHTML = '<span class="led' + (free.length ? ' is-on' : '') + '" aria-hidden="true"></span>' +
      (free.length ? free.length + ' в продаже' : 'сейчас нет в продаже');
    var areas = all.map(function (l) { return l.area; });
    var lo = Math.min.apply(null, areas), hi = Math.max.apply(null, areas);
    $('[data-pick-a="' + r + '"]').textContent = lo === hi ? D.area(lo) : D.area(lo).replace(/\s*м²$/, '') + '–' + D.area(hi);
  });

  /* что выбрал покупатель в планировках — сразу в форму шоурума */
  function wish(r) {
    var f = $('#lead select[name="interest"]');
    if (f && D.ROOM_NAMES[r]) f.value = D.ROOM_NAMES[r];
  }

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
