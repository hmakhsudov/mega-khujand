/* Фасад в сумерках: тёплый свет в окнах квартир и выбор по этажам.
   Окна и полосы этажей — js/facade-light.js (tools/facade-light.py),
   квартиры — js/data.js. Свет — один прозрачный слой с окнами всего
   фасада: на canvas рисуются только окна нужных квартир, каждая со своей
   яркостью. SVG поверх — только линии этажа и рамка выбранной квартиры. */
(function () {
  'use strict';
  var D = window.MK_DATA, LT = window.MK_LIGHT && window.MK_LIGHT.dusk;
  var NS = 'http://www.w3.org/2000/svg';
  if (!D || !LT || !window.MK) return;

  function el(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  /* четырёхугольник, раздвинутый от центра на pad единиц рендера */
  function grow(q, pad) {
    var cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    return q.map(function (p) {
      var dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1;
      return [p[0] + dx / d * pad, p[1] + dy / d * pad];
    });
  }
  function pts(q) { return q.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function inQuad(q, x, y) {
    var s = 0;
    for (var i = 0; i < 4; i++) {
      var a = q[i], b = q[(i + 1) % 4];
      var c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
      if (c !== 0) { if (s === 0) s = c > 0 ? 1 : -1; else if ((c > 0 ? 1 : -1) !== s) return false; }
    }
    return true;
  }
  var ease = function (t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return 1 - Math.pow(1 - t, 3); };

  var CORP = 2;
  /* окна квартиры: стояки x … x+span−1 на её этаже */
  function lotWindows(l) {
    if (l.corp !== CORP) return [];
    var out = [];
    for (var i = 0; i < l.span; i++) {
      var q = LT.cells[l.sect + ':' + l.floor + ':' + (l.x + i)];
      if (q) out.push(q);
    }
    return out;
  }

  /* svg — пустой <svg>, canvas — холст под ним; оба поверх тёмного рендера
     с тем же кадрированием (object-fit: cover ↔ xMidYMid slice) */
  MK.facade = function (svg, o) {
    o = o || {};
    var cv = o.canvas, ctx = cv && cv.getContext('2d');
    svg.setAttribute('viewBox', '0 0 ' + LT.w + ' ' + LT.h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.classList.add('fc');
    var bandG = el('g', { 'class': 'fc__band' });
    var selG = el('g', { 'class': 'fc__sel' });
    svg.appendChild(bandG);
    svg.appendChild(selG);

    var lots = [], byId = {}, byFloor = {};
    D.LOTS.forEach(function (l) {
      var w = lotWindows(l);
      if (!w.length) return;
      var cx = 0, cy = 0;
      var boxes = w.map(function (q) {
        q.forEach(function (p) { cx += p[0]; cy += p[1]; });
        var xs = q.map(function (p) { return p[0]; }), ys = q.map(function (p) { return p[1]; });
        var x0 = Math.floor(Math.min.apply(null, xs)) - 4, y0 = Math.floor(Math.min.apply(null, ys)) - 4;
        return [x0, y0, Math.ceil(Math.max.apply(null, xs)) + 4 - x0, Math.ceil(Math.max.apply(null, ys)) + 4 - y0];
      });
      var it = { lot: l, win: w, boxes: boxes, cx: cx / (w.length * 4), cy: cy / (w.length * 4),
        on: false, amb: false, a: { onf: 0, dimf: 1, amb: 0 } };
      lots.push(it);
      byId[l.id] = it;
      (byFloor[l.floor] = byFloor[l.floor] || []).push(it);
    });
    var floors = Object.keys(byFloor).map(Number).sort(function (a, b) { return a - b; });
    floors.forEach(function (f, i) { byFloor[f].forEach(function (it) { it.fv = i + ((it.lot.x * 7) % 5) * 0.18; }); });
    var FN = floors.length + 3;

    /* полоса этажа: по секциям, в которых этот этаж есть */
    function bands(f) {
      var out = [];
      Object.keys(LT.floors).forEach(function (s) { var q = LT.floors[s][f]; if (q) out.push(q); });
      return out;
    }
    function floorAt(x, y) {
      for (var i = floors.length - 1; i >= 0; i--) {
        var b = bands(floors[i]);
        for (var j = 0; j < b.length; j++) if (inQuad(b[j], x, y)) return floors[i];
      }
      return null;
    }
    function lotAt(x, y, ok) {
      var f = floorAt(x, y);
      if (f == null) return null;
      var best = null, bd = 1e9;
      byFloor[f].forEach(function (it) {
        if (ok && !ok(it.lot)) return;
        it.win.forEach(function (q) {
          var d = Math.abs((q[0][0] + q[2][0]) / 2 - x);
          if (d < bd) { bd = d; best = it; }
        });
      });
      return bd < 70 ? best : null;
    }
    /* точка рендера ↔ точка в окне браузера */
    function client(x, y) {
      var m = svg.getScreenCTM();
      if (!m) return null;
      var p = svg.createSVGPoint(); p.x = x; p.y = y;
      p = p.matrixTransform(m);
      return [p.x, p.y];
    }
    function local(cx, cy) {
      var m = svg.getScreenCTM();
      if (!m) return null;
      var p = svg.createSVGPoint(); p.x = cx; p.y = cy;
      p = p.matrixTransform(m.inverse());
      return [p.x, p.y];
    }
    /* края этажа — для таблички лифта */
    function floorEdge(f, left) {
      var best = null;
      bands(f).forEach(function (q) {
        var x = left ? Math.min(q[0][0], q[3][0]) : Math.max(q[1][0], q[2][0]);
        var y = left ? (q[0][1] + q[3][1]) / 2 : (q[1][1] + q[2][1]) / 2;
        if (!best || (left ? x < best[0] : x > best[0])) best = [x, y];
      });
      return best;
    }

    /* ── свет на холсте ─────────────────────────────────────────────── */
    var img = null, ready = false, mode = o.mode || 'io', litV = 0, ioT = null, raf = 0, last = 0;
    var geo = { s: 1, ox: 0, oy: 0, k: 1 };
    function size() {
      if (!cv) return;
      var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!W || !H) return;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var s = Math.max(W / LT.w, H / LT.h);
      geo = { s: s * dpr, ox: (W - LT.w * s) / 2 * dpr, oy: (H - LT.h * s) / 2 * dpr, k: img ? img.naturalWidth / LT.w : 1 };
      kick();
    }
    if (cv) {
      img = new Image();
      img.decoding = 'async';
      img.onload = function () { ready = true; size(); };
      var hires = (cv.clientWidth || innerWidth) * (window.devicePixelRatio || 1) > 1500;
      img.src = LT.plate + (hires ? '-2400' : '-1200') + '.webp';
      addEventListener('resize', function () { size(); });
      if ('ResizeObserver' in window) new ResizeObserver(function () { size(); }).observe(cv);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    var TAU = { onf: 160, dimf: 140, amb: 650 };
    function step(now) {
      raf = 0;
      var dt = last ? Math.min(64, now - last) : 16;
      last = now;
      var busy = false, rm = MK.rm();
      lots.forEach(function (it) {
        var tg = { onf: it.on ? 1 : 0, dimf: hotFloor == null || it.lot.floor === hotFloor || it === hotLot ? 1 : 0.2, amb: it.amb ? 1 : 0 };
        ['onf', 'dimf', 'amb'].forEach(function (k) {
          var c = it.a[k], t = tg[k];
          if (c === t) return;
          c = rm ? t : c + (t - c) * (1 - Math.exp(-dt / TAU[k]));
          if (Math.abs(t - c) < 0.003) c = t; else busy = true;
          it.a[k] = c;
        });
        var lv;
        if (mode === 'scroll') lv = Math.max(0, Math.min(1, litV * FN - it.fv));
        else if (ioT == null) lv = 0;
        else if (rm) lv = 1;
        else { lv = ease((now - ioT - it.fv * 70) / 1100); if (lv < 1) busy = true; }
        it.alpha = Math.max(it.a.amb, lv) * it.a.onf * it.a.dimf;
      });
      draw();
      if (busy) { last = now; kick(); } else last = 0;
    }
    function draw() {
      if (!cv || !ready) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(geo.s, 0, 0, geo.s, geo.ox, geo.oy);
      var k = geo.k;
      lots.forEach(function (it) {
        if (!(it.alpha > 0.004)) return;
        ctx.globalAlpha = it.alpha > 1 ? 1 : it.alpha;
        it.boxes.forEach(function (b) { ctx.drawImage(img, b[0] * k, b[1] * k, b[2] * k, b[3] * k, b[0], b[1], b[2], b[3]); });
      });
      ctx.globalAlpha = 1;
    }

    /* ── этаж и квартира ────────────────────────────────────────────── */
    var hotFloor = null, hotLot = null;
    function drawFloor(f) {
      bandG.textContent = '';
      if (f == null) return;
      bands(f).forEach(function (q) {
        bandG.appendChild(el('polygon', { 'class': 'fc__slab', points: pts(q) }));
        bandG.appendChild(el('line', { 'class': 'fc__edge', x1: q[0][0], y1: q[0][1], x2: q[1][0], y2: q[1][1] }));
        bandG.appendChild(el('line', { 'class': 'fc__edge', x1: q[3][0], y1: q[3][1], x2: q[2][0], y2: q[2][1] }));
      });
    }
    function focusFloor(f) {
      if (f === hotFloor) return;
      hotFloor = f;
      svg.classList.toggle('is-floor', f != null);
      drawFloor(f);
      kick();
    }
    function focusLot(it) {
      if (it === hotLot) return;
      hotLot = it;
      selG.textContent = '';
      kick();
      if (!it) return;
      it.win.forEach(function (q) { selG.appendChild(el('polygon', { 'class': 'fc__pick' + (it.on ? '' : ' is-dark'), points: pts(grow(q, 6)) })); });
    }
    /* состояние света: fn(lot) → true, если в окнах горит свет */
    function paint(fn) { lots.forEach(function (it) { it.on = !!fn(it.lot); }); kick(); }

    return {
      svg: svg, lots: lots, byId: byId, byFloor: byFloor, floors: floors,
      floorAt: floorAt, lotAt: lotAt, client: client, local: local, floorEdge: floorEdge,
      focusFloor: focusFloor, focusLot: focusLot, paint: paint, drawFloor: drawFloor,
      setMode: function (m) { mode = m; kick(); },
      setLit: function (v) { if (v !== litV) { litV = v; kick(); } },
      lightUp: function () { if (ioT == null) { ioT = performance.now(); kick(); } },
      amb: function (it, on) { it.amb = on; kick(); },
      hot: function () { return { floor: hotFloor, lot: hotLot }; }
    };
  };
  MK.facade.windows = lotWindows;
})();
