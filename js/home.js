/* Главная «Выставочный макет»: плита с вырезанным именем → макет в сумерках,
   где горят окна свободных квартир; планировки и легенды из data.js */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var ease = function (t) { t = MK.clamp01(t); return t * t * (3 - 2 * t); };

  var stage = $('[data-stage]'), veil = $('[data-veil]'), bar = $('[data-bar]');
  var mark = $('[data-mark]'), wm = $('[data-wm]');
  var model = $('[data-model]'), frame = $('[data-frame]');
  var hero = $('.hero'), hdr = $('#hdr');
  var sceneMq = matchMedia('(min-width: 900px)');
  function scene() { return sceneMq.matches && !MK.rm(); }

  /* ── плита: вписываем имя в поле над подписью ──────────────────── */
  var base = { s: 1, tx: 0, ty: 0, fx: 0, fy: 0 };
  function fitMark() {
    var r = mark.getBoundingClientRect();
    var W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    mark.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    ['[data-mask]', '[data-mrect]', '[data-prect]'].forEach(function (s) {
      var n = $(s, mark); n.setAttribute('width', W); n.setAttribute('height', H);
    });
    var overlap = getComputedStyle(bar).position === 'absolute' ? bar.offsetHeight : 0;
    var top = W < 560 ? 18 : Math.max(24, H * 0.05);
    var area = H - overlap - top - (overlap ? Math.max(18, H * 0.03) : 18);
    wm.setAttribute('transform', '');
    var bb = wm.getBBox();
    if (!bb.width) return;
    var s = Math.min((W * (W < 560 ? 0.9 : 0.86)) / bb.width, area / bb.height);
    var cx = W / 2, cy = top + area / 2;
    base.s = s;
    base.tx = cx - (bb.x + bb.width / 2) * s;
    base.ty = cy - (bb.y + bb.height / 2) * s;
    focal(W, H);
    applyMark(1);
  }
  /* точка внутри штриха буквы у центра: при пролёте она раскрывается на весь экран */
  function focal(W, H) {
    base.fx = W / 2; base.fy = H / 2;
    try {
      var k = 0.25, cw = Math.ceil(W * k), ch = Math.ceil(H * k);
      var c = document.createElement('canvas'); c.width = cw; c.height = ch;
      var g = c.getContext('2d');
      g.setTransform(base.s * k, 0, 0, base.s * k, base.tx * k, base.ty * k);
      g.font = '800 100px Unbounded';
      if ('letterSpacing' in g) g.letterSpacing = '-2px';
      g.textAlign = 'center';
      g.fillText('MEGA', 0, 0);
      g.fillText('KHUJAND', 0, 90);
      var d = g.getImageData(0, 0, cw, ch).data;
      /* двухпроходная карта расстояний до края штриха: берём точку на оси
         самого толстого штриха ближе к центру — дыра раскрывается ровно */
      var n = cw * ch, dt = new Float32Array(n), INF = 1e6, D2 = 1.4142;
      for (var i = 0; i < n; i++) dt[i] = d[i * 4 + 3] > 128 ? INF : 0;
      for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) {
        var o = y * cw + x; if (!dt[o]) continue;
        var m = dt[o];
        if (x > 0) m = Math.min(m, dt[o - 1] + 1); else m = 0;
        if (y > 0) { m = Math.min(m, dt[o - cw] + 1); if (x > 0) m = Math.min(m, dt[o - cw - 1] + D2); if (x < cw - 1) m = Math.min(m, dt[o - cw + 1] + D2); } else m = 0;
        dt[o] = m;
      }
      for (var y2 = ch - 1; y2 >= 0; y2--) for (var x2 = cw - 1; x2 >= 0; x2--) {
        var o2 = y2 * cw + x2; if (!dt[o2]) continue;
        var m2 = dt[o2];
        if (x2 < cw - 1) m2 = Math.min(m2, dt[o2 + 1] + 1); else m2 = 0;
        if (y2 < ch - 1) { m2 = Math.min(m2, dt[o2 + cw] + 1); if (x2 < cw - 1) m2 = Math.min(m2, dt[o2 + cw + 1] + D2); if (x2 > 0) m2 = Math.min(m2, dt[o2 + cw - 1] + D2); } else m2 = 0;
        dt[o2] = m2;
      }
      var tx = cw / 2, ty = ch / 2, best = null, bs = -Infinity, diag = Math.hypot(cw, ch);
      for (var y3 = 0; y3 < ch; y3++) for (var x3 = 0; x3 < cw; x3++) {
        var v = dt[y3 * cw + x3]; if (v < 2) continue;
        var sc = v - 0.06 * Math.hypot(x3 - tx, y3 - ty) * (60 / diag);
        if (sc > bs) { bs = sc; best = [x3, y3]; }
      }
      if (best) { base.fx = best[0] / k; base.fy = best[1] / k; }
    } catch (e) { /* без canvas — зум от центра */ }
  }
  function applyMark(z) {
    var f = z === 1 ? '' : 'translate(' + base.fx.toFixed(1) + ' ' + base.fy.toFixed(1) + ') scale(' + z.toFixed(4) + ') translate(' + (-base.fx).toFixed(1) + ' ' + (-base.fy).toFixed(1) + ') ';
    wm.setAttribute('transform', f + 'translate(' + base.tx.toFixed(1) + ' ' + base.ty.toFixed(1) + ') scale(' + base.s.toFixed(4) + ')');
  }
  var fitQueued = false;
  function queueFit() { if (!fitQueued) { fitQueued = true; requestAnimationFrame(function () { fitQueued = false; fitMark(); MK.tick(); }); } }
  addEventListener('resize', queueFit);
  if (document.fonts && document.fonts.load) document.fonts.load('800 100px Unbounded').then(queueFit, queueFit);
  fitMark();

  /* ── сцена: одна шкала прокрутки — пролёт, свет, пульт ─────────── */
  var lastZ = -1;
  MK.watch(hero, function (y, vh) {
    if (!scene()) {
      if (lastZ !== 1) { lastZ = 1; applyMark(1); }
      stage.classList.remove('is-open'); stage.classList.add('is-veiled');
      return;
    }
    var hh = hdr ? hdr.offsetHeight : 64;
    var r = hero.getBoundingClientRect();
    var run = r.height - (vh - hh);
    var p = run > 8 ? MK.clamp01((hh - r.top) / run) : 0;
    var t = MK.clamp01(p / 0.25);
    var z = Math.exp(Math.log(160) * Math.pow(t, 1.5));
    if (Math.abs(z - lastZ) > 0.0005) { lastZ = z; applyMark(z); }
    var vo = 1 - ease((p - 0.235) / 0.07);
    stage.style.setProperty('--bo', (1 - ease((p - 0.012) / 0.06)).toFixed(3));
    stage.style.setProperty('--vo', vo.toFixed(3));
    stage.style.setProperty('--pz', MK.clamp01(p / 0.42).toFixed(4));
    stage.style.setProperty('--dim', ease((p - 0.3) / 0.1).toFixed(3));
    stage.style.setProperty('--con', ease((p - 0.56) / 0.08).toFixed(3));
    model.style.setProperty('--lit', MK.clamp01((p - 0.38) / 0.22).toFixed(4));
    stage.classList.toggle('is-veiled', vo > 0.02);
    stage.classList.toggle('is-open', vo <= 0.02);
    if (vo > 0.02) hideTag();
  });

  /* фокус с клавиатуры на пульте: докручиваем сцену до момента, где он виден */
  model.addEventListener('focusin', function () {
    if (!scene()) return;
    var hh = hdr ? hdr.offsetHeight : 64;
    var r = hero.getBoundingClientRect();
    var run = r.height - (innerHeight - hh);
    var p = MK.clamp01((hh - r.top) / run);
    if (p < 0.66) scrollTo({ top: scrollY + (0.7 - p) * run, behavior: 'auto' });
  });

  /* ── макет: окна свободных квартир на рендере в сумерках ───────── */
  var VIEW = D.FACADE.filter(function (v) { return v.k === 'dusk'; })[0] || D.FACADE[D.FACADE.length - 1];
  var items = [];
  /* плоскость с сильным наклоном верхней кромки не ложится на сетку окон
     рендера — её окна не зажигаем; верхний этаж уходит в корону — тоже */
  VIEW.planes.forEach(function (pl) {
    var sc = D.secOf(VIEW.corp, pl.sect);
    if (!sc) return;
    if (Math.abs((pl.q[1][1] - pl.q[0][1]) / (pl.q[1][0] - pl.q[0][0])) > 0.5) return;
    var H = D.homography(pl.q);
    var litPl = { padU: Math.min(0.42, pl.padU + 0.1), padV: Math.min(0.36, pl.padV + 0.05), q: pl.q };
    var hitPl = { padU: 0.03, padV: 0.04, q: pl.q };
    sc.floors.forEach(function (row) {
      row.row.forEach(function (l) {
        if (!l || l.floor >= sc.to) return;
        var pts = function (q) { return q.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
        items.push({ lot: l, open: D.isOpen(l), lit: pts(D.windowQuad(litPl, sc, l, H)), hit: pts(D.windowQuad(hitPl, sc, l, H)), f: (l.floor - sc.from) + ((l.x * 7) % 3) * 0.3 });
      });
    });
  });
  var open = items.filter(function (it) { return it.open; });
  var litG = $('[data-lit]'), hitG = $('[data-hit]');
  open.forEach(function (it, i) {
    var a = document.createElementNS(NS, 'polygon');
    a.setAttribute('points', it.lit);
    a.setAttribute('style', '--f:' + it.f.toFixed(2));
    litG.appendChild(a);
    var b = document.createElementNS(NS, 'polygon');
    b.setAttribute('points', it.hit);
    b.setAttribute('data-i', i);
    hitG.appendChild(b);
    it.a = a; it.b = b;
  });

  var ROOMS = [['all', 'Все'], [0, 'Студии'], [1, '1-комнатные'], [2, '2-комнатные'], [3, '3-комнатные'], [4, 'Пентхаусы']];
  var keys = $('[data-keys]');
  var cnt = function (r) { return open.filter(function (it) { return r === 'all' || it.lot.rooms === r; }).length; };
  ROOMS = ROOMS.filter(function (k) { return cnt(k[0]) > 0; });
  keys.innerHTML = ROOMS.map(function (k) {
    return '<button class="seg__btn" type="button" data-r="' + k[0] + '" aria-pressed="' + (k[0] === 'all') + '">' + k[1] + ' <small>' + cnt(k[0]) + '</small></button>';
  }).join('');
  var sel = 'all';
  var countEl = $('[data-count]'), go = $('[data-go]'), goFlats = $('[data-go-flats]');
  function paintKeys() {
    $$('[data-r]', keys).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-r') === String(sel))); });
    open.forEach(function (it) {
      var out = sel !== 'all' && it.lot.rooms !== sel;
      it.a.classList.toggle('is-out', out);
      it.b.classList.toggle('is-out', out);
    });
    var n = cnt(sel);
    var word = sel === 'all' ? '' : ' — ' + ROOMS.filter(function (k) { return k[0] === sel; })[0][1].toLowerCase();
    countEl.innerHTML = 'Корпус ' + VIEW.corp + ', вид с бульвара: светится <b>' + n + '</b> ' + D.plural(n, ['окно', 'окна', 'окон']) + word +
      ' из ' + items.length + ' ' + D.plural(items.length, ['квартиры', 'квартир', 'квартир']) + ' этого фасада.';
    go.href = 'picker.html?v=' + VIEW.k + (sel === 'all' ? '' : '&rooms=' + sel);
    if (sel !== 'all') wish(sel);
    goFlats.href = sel === 'all' ? 'flats.html' : 'flats.html?rooms=' + sel;
    hideTag();
  }
  keys.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (!b) return;
    var v = b.getAttribute('data-r');
    sel = v === 'all' ? 'all' : +v;
    paintKeys();
  });
  paintKeys();

  /* что выбрал покупатель на макете или в планировках — сразу в форму шоурума */
  function wish(r) {
    var f = $('#lead select[name="interest"]');
    if (f && D.ROOM_NAMES[r]) f.value = D.ROOM_NAMES[r];
  }

  /* латунная бирка у окна */
  var tag = $('[data-tag]'), hot = null, hideT = 0;
  function showTag(it) {
    clearTimeout(hideT);
    if (hot && hot !== it) hot.a.classList.remove('is-hot');
    hot = it;
    it.a.classList.add('is-hot');
    var l = it.lot;
    tag.innerHTML = '<b>' + l.type + ' · ' + D.area(l.area) + '</b>' +
      '<span>Этаж ' + l.floor + ' · № ' + l.no + ' · ' + D.money(l.price) + '</span>' +
      '<a href="' + D.lotHref(l) + '">Открыть квартиру ' + MK.icon('arrow') + '</a>';
    tag.hidden = false;
    var fr = frame.getBoundingClientRect(), pr = it.b.getBoundingClientRect();
    var x = MK.clamp(pr.left + pr.width / 2 - fr.left, 110, fr.width - 110);
    var below = pr.top - fr.top < 110;
    tag.classList.toggle('is-below', below);
    tag.style.left = x.toFixed(0) + 'px';
    tag.style.top = (below ? pr.bottom - fr.top : pr.top - fr.top).toFixed(0) + 'px';
  }
  function hideTag() {
    if (!tag) return;
    if (hot) hot.a.classList.remove('is-hot');
    hot = null;
    tag.hidden = true;
  }
  function later() { clearTimeout(hideT); hideT = setTimeout(hideTag, 280); }
  hitG.addEventListener('pointerover', function (e) {
    var p = e.target.closest('polygon');
    if (p && e.pointerType === 'mouse') showTag(open[+p.getAttribute('data-i')]);
  });
  hitG.addEventListener('pointerout', function (e) { if (e.pointerType === 'mouse') later(); });
  hitG.addEventListener('click', function (e) {
    var p = e.target.closest('polygon');
    if (p) showTag(open[+p.getAttribute('data-i')]);
  });
  tag.addEventListener('pointerenter', function () { clearTimeout(hideT); });
  tag.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') later(); });
  frame.addEventListener('click', function (e) { if (!e.target.closest('polygon, [data-tag]')) hideTag(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTag(); });

  /* режим света: по шкале сцены или один раз при появлении */
  var litOnce = false;
  function syncMode() {
    model.setAttribute('data-mode', scene() ? 'scroll' : 'io');
    if (!scene()) model.style.removeProperty('--lit');
  }
  syncMode();
  if (sceneMq.addEventListener) sceneMq.addEventListener('change', function () { syncMode(); queueFit(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !litOnce) { litOnce = true; model.classList.add('is-lit'); }
    }, { threshold: 0.3 }).observe(frame);
  } else model.classList.add('is-lit');

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
    if (!pin) return;
    var on = function (v) { li.classList.toggle('is-on', v); pin.classList.toggle('is-on', v); };
    li.addEventListener('pointerenter', function () { on(true); });
    li.addEventListener('pointerleave', function () { on(false); });
  });

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
})();
