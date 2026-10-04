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
  var base = { s: 1, tx: 0, ty: 0, fx: 0, fy: 0, r: 0, zc: 60, W: 1, H: 1 };
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
    /* масштаб, при котором штрих буквы целиком закрывает кадр: дальше плиту
       можно просто убрать — без белой вспышки и лишних кадров */
    var far = Math.max(Math.hypot(base.fx, base.fy), Math.hypot(W - base.fx, base.fy), Math.hypot(base.fx, H - base.fy), Math.hypot(W - base.fx, H - base.fy));
    base.zc = base.r > 1 ? MK.clamp(far / base.r * 1.06, 6, 90) : 60;
    applyMark(1);
  }
  /* точка внутри штриха буквы у центра: при пролёте она раскрывается на весь экран */
  function focal(W, H) {
    base.fx = W / 2; base.fy = H / 2; base.r = 0; base.W = W; base.H = H;
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
      if (best) { base.fx = best[0] / k; base.fy = best[1] / k; base.r = bs / k; }
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

  /* ── сцена: одна шкала прокрутки — пролёт, свет по этажам, пульт ── */
  var lastZ = -1, P = 0;
  var T = { zoom: 0.22, dim: [0.2, 0.08], lit: [0.25, 0.4], con: [0.62, 0.08] };
  MK.watch(hero, function (y, vh) {
    if (!scene()) {
      if (lastZ !== 1) { lastZ = 1; applyMark(1); }
      stage.classList.remove('is-open'); stage.classList.add('is-veiled');
      return;
    }
    var hh = hdr ? hdr.offsetHeight : 64;
    var r = hero.getBoundingClientRect();
    var run = r.height - (vh - hh);
    var p = P = run > 8 ? MK.clamp01((hh - r.top) / run) : 0;
    var t = MK.clamp01(p / T.zoom);
    var z = Math.exp(Math.log(base.zc) * Math.pow(t, 1.7));
    if (Math.abs(z - lastZ) > 0.0005) { lastZ = z; applyMark(z); }
    var veiled = t < 1;
    stage.style.setProperty('--bo', (1 - ease((p - 0.008) / 0.05)).toFixed(3));
    stage.style.setProperty('--pz', MK.clamp01(p / 0.4).toFixed(4));
    stage.style.setProperty('--dim', ease((p - T.dim[0]) / T.dim[1]).toFixed(3));
    stage.style.setProperty('--con', ease((p - T.con[0]) / T.con[1]).toFixed(3));
    var lit = MK.clamp01((p - T.lit[0]) / T.lit[1]);
    model.style.setProperty('--lit', lit.toFixed(4));
    if (F) F.setLit(lit);
    stage.classList.toggle('is-veiled', veiled);
    stage.classList.toggle('is-open', !veiled);
    if (veiled) hideTag();
    ride(lit);
  });

  /* фокус с клавиатуры на пульте: докручиваем сцену до момента, где он виден */
  model.addEventListener('focusin', function () {
    if (!scene()) return;
    var hh = hdr ? hdr.offsetHeight : 64;
    var r = hero.getBoundingClientRect();
    var run = r.height - (innerHeight - hh);
    var p = MK.clamp01((hh - r.top) / run);
    if (p < 0.72) scrollTo({ top: scrollY + (0.76 - p) * run, behavior: 'auto' });
  });

  /* ── макет: свет в окнах свободных квартир, выбор по этажам ────── */
  var svgF = $('[data-fsvg]');
  var F = MK.home = MK.facade(svgF, { canvas: $('[data-fcv]'), mode: scene() ? 'scroll' : 'io' });
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
      (ride ? '' : '<span class="lift__c">' + (inf.n ? inf.n + ' ' + D.plural(inf.n, ['свободная', 'свободные', 'свободных']) + (sel === 'all' ? '' : '') + '<br>от ' + D.money(inf.min) : 'свободных нет') + '</span>');
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
      '<span>Этаж ' + l.floor + ' · № ' + l.no + ' · ' + D.money(l.price) + '</span>' +
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
  function live() { return !scene() || stage.classList.contains('is-open'); }
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

  /* режим света: по шкале сцены или один раз при появлении */
  var litOnce = false;
  function syncMode() {
    F.setMode(scene() ? 'scroll' : 'io');
    if (!scene()) model.style.removeProperty('--lit');
  }
  syncMode();
  if (sceneMq.addEventListener) sceneMq.addEventListener('change', function () { syncMode(); queueFit(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !litOnce) { litOnce = true; F.lightUp(); }
    }, { threshold: 0.3 }).observe(frame);
  } else F.lightUp();

  /* вечер наступает: пока сцена в буквах, в доме понемногу зажигаются окна */
  if (scene()) {
    var amb = F.lots.filter(function (it) { return isFree(it.lot); }).sort(function (a, b) { return ((a.lot.no * 37) % 101) - ((b.lot.no * 37) % 101); }).slice(0, 26);
    amb.forEach(function (it, i) {
      setTimeout(function () { if (P < T.lit[0]) F.amb(it, true); }, 500 + i * 230 + ((it.lot.no * 13) % 7) * 60);
    });
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

  if (MK.motion) MK.motion();
})();
