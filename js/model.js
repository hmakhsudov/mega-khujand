/* Гипсовый макет типового этажа. Сцена посчитана в Blender (Cycles) по
   чертежу этажа из проектной документации: tools/model-floor.py →
   model-render.py → model-pack.py → js/model-data.js.
   На главной этажи раскрываются по прокрутке, потом в квартирах по очереди
   загорается свет; на странице планировок — тот же этаж со светом выбранной
   квартиры и крупный план квартиры с номерами помещений. */
(function () {
  'use strict';
  var M = window.MK_MODEL;
  if (!M || !M.final || !window.MK) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var AR = M.final.h / M.final.w;            /* все кадры 16:9, одна камера */
  var IDS = Object.keys(M.final.layers).sort();
  var VB = 1000;                             /* SVG-слой: 1000 × 562,5 */
  var lite = !!(navigator.connection && navigator.connection.saveData);
  var dpr = function () { return Math.min(window.devicePixelRatio || 1, 2); };
  var hover = matchMedia('(hover: hover)');
  var plan = function (id) { return MK.plans && MK.plans.find(id); };

  function pickW(widths, need) {
    var ws = widths.slice().sort(function (a, b) { return a - b; });
    for (var i = 0; i < ws.length; i++) if (ws[i] >= need) return ws[i];
    return ws[ws.length - 1];
  }
  function load(src) {
    var im = new Image();
    im.decoding = 'async';
    im.src = src;
    return (im.decode ? im.decode() : new Promise(function (ok, no) { im.onload = ok; im.onerror = no; }))
      .then(function () { return im; });
  }
  function smooth(t) { t = MK.clamp01(t); return t * t * (3 - 2 * t); }
  /* кадр 4:3 (телефон) — по высоте с обрезкой боков, макет остаётся целым;
     широкий или почти квадратный — целиком, края гаснут в графит */
  function fitMode(box) {
    var a = box.clientWidth / Math.max(1, box.clientHeight);
    return a >= 1.25 && a < 1.6 ? 'cover' : 'contain';
  }

  /* ── холст: кадр раскладки, финальный кадр, свет квартир ───────────
     Свет — разница «квартира горит» минус «темно», сложение «lighter»
     восстанавливает кадр Cycles; яркость слоя = globalAlpha. */
  function Painter(cv, box, mode) {
    var ctx = cv.getContext('2d');
    var s = 1;
    var me = { a: null, b: null, k: 0, mix: 1, base: null, layers: {}, light: {}, R: { x: 0, y: 0, w: 0, h: 0 }, mode: mode };
    IDS.forEach(function (id) { me.light[id] = 0; });
    /* холст занимает ровно прямоугольник кадра: края гаснут маской CSS */
    me.size = function () {
      var W = box.clientWidth, H = box.clientHeight;
      if (!W || !H) return me.R;
      var w = me.mode === 'cover' ? Math.max(W, H / AR) : Math.min(W, H / AR);
      me.R = { x: (W - w) / 2, y: (H - w * AR) / 2, w: w, h: w * AR, W: W, H: H };
      s = Math.min(dpr(), M.final.w / w);
      cv.style.left = me.R.x + 'px';
      cv.style.top = me.R.y + 'px';
      cv.style.width = w + 'px';
      cv.style.height = me.R.h + 'px';
      cv.width = Math.round(w * s);
      cv.height = Math.round(me.R.h * s);
      return me.R;
    };
    function put(im, a) {
      if (!im || a <= 0) return;
      ctx.globalAlpha = Math.min(a, 1);
      ctx.drawImage(im, 0, 0, cv.width, cv.height);
    }
    me.render = function () {
      if (!me.R.w) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, cv.width, cv.height);
      var fin = me.base ? me.mix : 0;
      if (fin < 1) { put(me.a, 1); if (me.b && me.k > 0.004) put(me.b, me.k); }
      put(me.base, fin);
      if (fin > 0) {
        ctx.globalCompositeOperation = 'lighter';
        IDS.forEach(function (id) {
          var v = me.light[id] * fin;
          if (v < 0.004 || !me.layers[id]) return;
          put(me.layers[id], v);
          if (v > 1) put(me.layers[id], v - 1);
        });
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
      me.drawn = me.drawn || !!(me.a || fin);
    };
    me.loadFinal = function () {
      if (me.fin) return me.fin;
      var w = pickW(M.final.widths, (me.R.w || 960) * s);
      me.fin = Promise.all([load(M.final.base + w + '.webp')].concat(IDS.map(function (id) { return load(M.final.layers[id] + w + '.webp'); })))
        .then(function (ims) {
          me.base = ims[0];
          IDS.forEach(function (id, i) { me.layers[id] = ims[i + 1]; });
          me.render();
          return me;
        });
      return me.fin;
    };
    return me;
  }

  /* плавная смена яркости квартир: cur → goal, экспонента ~110 мс */
  function Tween(init, onStep) {
    var cur = {}, goal = {}, raf = 0, last = 0;
    IDS.forEach(function (id) { cur[id] = goal[id] = init; });
    function tick(t) {
      raf = 0;
      var dt = last ? Math.min(64, t - last) : 16, k = 1 - Math.exp(-dt / 110), moving = false;
      last = t;
      IDS.forEach(function (id) {
        var d = goal[id] - cur[id];
        if (Math.abs(d) < 0.004) cur[id] = goal[id];
        else { cur[id] += d * k; moving = true; }
      });
      onStep(cur);
      if (moving) raf = requestAnimationFrame(tick); else last = 0;
    }
    return {
      cur: cur,
      to: function (g, instant) {
        IDS.forEach(function (id) { goal[id] = g(id); if (instant) cur[id] = goal[id]; });
        if (instant) { onStep(cur); return; }
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };
  }

  /* кадры раскладки: сначала первый и последний, потом каждый 16-й, 8-й…
     — при быстрой прокрутке всегда есть соседние кадры для наплыва */
  function Seq(need, every, onLoad) {
    var S = M.seq, n = S.n, w = pickW(S.widths, need), fr = new Array(n), q = [], busy = 0, seen = {};
    var add = function (i) { if (i >= 0 && i < n && !seen[i]) { seen[i] = 1; q.push(i); } };
    add(0); add(n - 1);
    [16, 8, 4, 2, 1].forEach(function (st) { if (st >= every) for (var i = 0; i < n; i += st) add(i); });
    var total = q.length, got = 0;
    function src(i) { return S.src + w + '/f' + ('00' + i).slice(-3) + '.webp'; }
    function pump() {
      while (busy < 4 && q.length) {
        (function (i) {
          busy++;
          load(src(i)).then(function (im) { fr[i] = im; got++; onLoad(i); }, function () { got++; })
            .then(function () { busy--; pump(); });
        })(q.shift());
      }
    }
    /* кадры рядом с текущим держим расшифрованными (ImageBitmap, вне
       основного потока), дальние отпускаем: прокрутка не ждёт декодера */
    var bm = {}, wip = {};
    function warm(c) {
      if (!window.createImageBitmap) return;
      for (var i = Math.max(0, c - 3); i <= Math.min(n - 1, c + 4); i++) {
        if (fr[i] && !bm[i] && !wip[i]) (function (i) {
          wip[i] = 1;
          createImageBitmap(fr[i]).then(function (b) { wip[i] = 0; if (Math.abs(i - c) > 8) b.close(); else bm[i] = b; }, function () { wip[i] = 0; });
        })(i);
      }
      Object.keys(bm).forEach(function (k) { if (Math.abs(k - c) > 8) { bm[k].close(); delete bm[k]; } });
    }
    var pic = function (i) { return bm[i] || fr[i]; };
    return {
      n: n,
      start: function () { if (!busy && q.length === total) pump(); },
      done: function () { return got >= total; },
      at: function (f) {
        var i0 = Math.floor(f), lo = -1, hi = -1, i;
        warm(Math.round(f));
        for (i = Math.min(i0, n - 1); i >= 0; i--) if (fr[i]) { lo = i; break; }
        for (i = Math.max(i0 + 1, 0); i < n; i++) if (fr[i]) { hi = i; break; }
        if (lo < 0 && hi < 0) return null;
        if (lo < 0 || hi < 0) return { a: pic(lo < 0 ? hi : lo), b: null, k: 0 };
        return { a: pic(lo), b: pic(hi), k: MK.clamp01((f - lo) / (hi - lo)) };
      }
    };
  }

  /* квартиры поверх кадра: ссылки-контуры в SVG, бирка, клавиатура */
  function pathD(rings) {
    return rings.map(function (r) {
      return 'M' + r.map(function (p) { return (p[0] * VB).toFixed(1) + ' ' + (p[1] * VB * AR).toFixed(1); }).join('L') + 'Z';
    }).join('');
  }
  function Flats(svg, href, label) {
    IDS.forEach(function (id) {
      var f = M.final.flats[id];
      if (!f) return;
      var a = document.createElementNS(NS, 'a');
      a.setAttribute('href', href(id));
      a.setAttribute('class', 'm3d__flat');
      a.setAttribute('data-flat', id);
      if (label) a.setAttribute('aria-label', label(id));
      else a.setAttribute('tabindex', '-1');      /* дублирует клавишу квартиры */
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', pathD(f.poly));
      a.appendChild(p);
      svg.appendChild(a);
    });
  }
  function kindArea(p) { return MK.plans.kind(p.rooms) + ', ' + MK.plans.area(p.area); }

  MK.model3d = { data: M };

  /* ═════════ главная: раскладка этажей по прокрутке ═════════════════ */
  MK.model3d.stage = function (root) {
    var frame = $('[data-m3d-frame]', root), cv = $('[data-m3d-cv]', root), layer = $('[data-m3d-layer]', root);
    var svg = $('[data-m3d-hit]', root), tag = $('[data-m3d-tag]', root), keys = $('[data-m3d-keys]', root);
    var fls = $('[data-m3d-fls]', root), caps = $$('[data-m3d-cap]', root);
    var mqScene = matchMedia('(min-width: 900px)');
    var P = Painter(cv, frame, 'contain');
    var seq = null, f = 0, hot = null, pinned = null, live = false, hideT = 0;
    var ORDER = IDS.slice().sort(function (a, b) { return M.final.flats[a].label[0] - M.final.flats[b].label[0]; });
    var ramp = {};                /* включение света по шкале: 0…1 */
    IDS.forEach(function (id) { ramp[id] = 0; });
    var tw = Tween(1.12, function (cur) { IDS.forEach(function (id) { P.light[id] = ramp[id] * cur[id]; }); P.render(); });
    var scene = function () { return mqScene.matches && !MK.rm(); };
    var still = function () { return MK.rm() || lite || !M.seq; };

    var hint = $('[data-m3d-hint]', root);
    if (hint) hint.textContent = ' ' + (hover.matches ? 'Наведите' : 'Нажмите') + ' на квартиру — покажем площадь и откроем планировку.';

    /* подписи этажей, как табло лифта */
    var FL = M.seq ? M.seq.floors : [];
    fls.innerHTML = FL.map(function (n) {
      return '<span class="lift is-left is-ride m3d__fl"><span class="lift__n">' + n + '</span><span class="lift__t">этаж</span></span>';
    }).join('');
    var flEls = $$('.m3d__fl', fls);

    /* клавиши квартир — ссылки на планировки; контуры на кадре дублируют
       их для мыши и пальца, поэтому скрыты от клавиатуры и чтения */
    keys.innerHTML = IDS.map(function (id) {
      var p = plan(id);
      return p ? '<a class="seg__btn" href="plans.html?plan=' + id + '" data-k="' + id + '" aria-label="Планировка ' + p.code + ': ' + kindArea(p).toLowerCase() + '">' +
        p.code + ' <small>' + MK.plans.area(p.area) + '</small></a>' : '';
    }).join('');
    Flats(svg, function (id) { return 'plans.html?plan=' + id; });

    function layout() {
      P.mode = fitMode(frame);
      var R = P.size();
      layer.style.left = R.x + 'px';
      layer.style.top = R.y + 'px';
      layer.style.width = R.w + 'px';
      layer.style.height = R.h + 'px';
      root.classList.toggle('is-narrow', frame.clientWidth < 620);
    }

    /* ── свет и бирка ─────────────────────────────────────────────── */
    function focusLight() {
      var on = hot || pinned;
      tw.to(function (id) { return !on ? 1.12 : id === on ? 1.8 : 0.14; });
      root.classList.toggle('has-hot', !!on);
    }
    function showTag(id) {
      var p = plan(id), F = M.final.flats[id];
      if (!p || !F) return;
      clearTimeout(hideT);
      tag.innerHTML = '<b>' + p.code + ' · ' + MK.plans.kind(p.rooms) + '</b>' +
        '<span>' + MK.plans.area(p.area) + ' · ' + MK.plans.floorsLabel(p) + '</span>' +
        '<a href="plans.html?plan=' + p.id + '" tabindex="-1">Открыть планировку ' + MK.icon('arrow') + '</a>';
      tag.hidden = false;
      var below = F.label[1] < 0.26;
      tag.classList.toggle('is-below', below);
      /* бирка не выходит за видимую часть кадра */
      var R = P.R, v0 = Math.max(0, -R.x / R.w), v1 = Math.min(1, (R.W - R.x) / R.w), half = 118 / R.w;
      tag.style.left = (MK.clamp(F.label[0], v0 + half, v1 - half) * 100).toFixed(2) + '%';
      tag.style.top = (F.label[1] * 100 + (below ? 6 : 0)) + '%';
    }
    function setHot(id) {
      if (!live) id = null;
      if (id === hot) return;
      hot = id;
      var on = hot || pinned;
      if (on) showTag(on); else tag.hidden = true;
      $$('.m3d__flat', svg).forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-flat') === on); });
      $$('[data-k]', keys).forEach(function (b) { b.classList.toggle('is-hot', b.getAttribute('data-k') === hot && hot !== pinned); });
      focusLight();
    }
    function setPinned(id) {
      pinned = id;
      $$('[data-k]', keys).forEach(function (b) { b.classList.toggle('is-pin', b.getAttribute('data-k') === id); });
      hot = undefined;
      setHot(null);
    }
    function later() { clearTimeout(hideT); hideT = setTimeout(function () { setHot(null); }, 240); }

    svg.addEventListener('pointerover', function (e) {
      var a = e.target.closest('.m3d__flat');
      if (a && e.pointerType === 'mouse') { clearTimeout(hideT); setHot(a.getAttribute('data-flat')); }
    });
    svg.addEventListener('pointerout', function (e) {
      if (e.target.closest('.m3d__flat') && e.pointerType === 'mouse') later();
    });
    svg.addEventListener('click', function (e) {
      var a = e.target.closest('.m3d__flat');
      if (!a) return;
      var id = a.getAttribute('data-flat');
      /* палец: первое касание — бирка, второе — планировка */
      if (!hover.matches && pinned !== id) { e.preventDefault(); setPinned(id); }
    });
    svg.addEventListener('focusin', function (e) { var a = e.target.closest('.m3d__flat'); if (a) setHot(a.getAttribute('data-flat')); });
    svg.addEventListener('focusout', function () { later(); });
    tag.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    tag.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') later(); });
    keys.addEventListener('pointerover', function (e) { var b = e.target.closest('[data-k]'); if (b && e.pointerType === 'mouse') { clearTimeout(hideT); setHot(b.getAttribute('data-k')); } });
    keys.addEventListener('pointerout', function (e) { if (e.target.closest('[data-k]') && e.pointerType === 'mouse') later(); });
    keys.addEventListener('focusin', function (e) { var b = e.target.closest('[data-k]'); if (b && b.matches(':focus-visible')) { clearTimeout(hideT); setHot(b.getAttribute('data-k')); } });
    keys.addEventListener('focusout', function () { later(); });
    keys.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      var id = b.getAttribute('data-k');
      /* палец: первое касание — свет и бирка, второе — планировка */
      if (!hover.matches && pinned !== id) { e.preventDefault(); setPinned(id); }
    });
    frame.addEventListener('click', function (e) {
      if (pinned && !e.target.closest('.m3d__flat') && !e.target.closest('[data-m3d-tag]')) setPinned(null);
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && (pinned || hot)) setPinned(null); });

    /* ── состояние по времени раскладки ─────────────────────────────
       t: 0…1 — кадры; fin: наплыв финального кадра; lit: свет по очереди */
    var capOn = -1;
    function caption(i) {
      if (i === capOn) return;
      capOn = i;
      caps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
    }
    function floors(t) {
      if (!M.seq) return;
      var A = M.seq.anchors, x = t * (A.length - 1), i0 = Math.floor(x), i1 = Math.min(i0 + 1, A.length - 1), k = x - i0;
      flEls.forEach(function (el, i) {
        var a = A[i0][i], b = A[i1][i], px = a[0] + (b[0] - a[0]) * k, py = a[1] + (b[1] - a[1]) * k;
        var o = smooth((t - 0.04) / 0.1);
        if (i > 0) o *= MK.clamp01((py - 0.05) / 0.1) * (1 - smooth((t - 0.5) / 0.06));
        else o *= 1 - smooth((t - 0.9) / 0.1);
        el.style.left = (px * 100).toFixed(2) + '%';
        el.style.top = (py * 100).toFixed(2) + '%';
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o < 0.01 ? 'hidden' : '';
      });
      var last = flEls[0];
      if (last) $('.lift__n', last).textContent = t > 0.5 ? FL[0] + '–' + FL[FL.length - 1] : FL[0];
      if (last) $('.lift__t', last).textContent = t > 0.5 ? 'этажи' : 'этаж';
    }
    function setLive(on) {
      if (on === live) return;
      live = on;
      root.classList.toggle('is-live', on);
      if (!on) setPinned(null);
    }
    /* t — раскладка 0…1, fin — финальный кадр, lit — доля включённого света */
    function state(t, fin, lit) {
      f = t * ((seq ? seq.n : 1) - 1);
      var fr = seq ? seq.at(f) : null;
      P.a = fr ? fr.a : null;
      P.b = fr ? fr.b : null;
      P.k = fr ? fr.k : 0;
      P.mix = fin;
      ORDER.forEach(function (id, i) { ramp[id] = smooth(lit * (ORDER.length + 1.5) - i * 1.1); });
      IDS.forEach(function (id) { P.light[id] = ramp[id] * tw.cur[id]; });
      P.render();
      if (P.drawn) root.classList.add('is-cv');
      floors(t);
      caption(t < 0.3 ? 0 : t < 0.72 ? 1 : 2);
      setLive(lit >= 1);
    }

    /* ── режимы ──────────────────────────────────────────────────── */
    var mode = null, played = false, playRaf = 0, near = false;
    function ensure() {
      if (still()) { P.loadFinal(); return; }
      if (!seq) {
        /* кадры раскладки идут в движении: хватает 1,6 пикселя на точку */
        var need = (P.R.w || frame.clientWidth) * Math.min(dpr(), 1.6);
        seq = Seq(need, scene() ? 1 : 2, function () { MK.tick(); if (mode !== 'scene') redraw(); });
      }
      seq.start();
      P.loadFinal().then(function () { MK.tick(); redraw(); });
    }
    var last = { t: 0, fin: 0, lit: 0 };
    function redraw() { state(last.t, last.fin, last.lit); }
    function go(t, fin, lit) { last = { t: t, fin: fin, lit: lit }; redraw(); }

    function play() {
      if (played) return;
      played = true;
      var t0 = 0, w0 = 0, D = 5200, L = 1300;
      function step(ts) {
        if (!w0) w0 = ts;
        /* ждём кадры раскладки, но не дольше 3,5 с */
        if (!t0) {
          if (seq && !seq.done() && ts - w0 < 3500) { go(0, 0, 0); playRaf = requestAnimationFrame(step); return; }
          t0 = ts;
        }
        var e = ts - t0;
        go(smooth(e / D), smooth((e - D) / 500), MK.clamp01((e - D - 200) / L));
        playRaf = e < D + L + 300 ? requestAnimationFrame(step) : 0;
      }
      playRaf = requestAnimationFrame(step);
    }

    function setMode() {
      var m = still() ? 'still' : scene() ? 'scene' : 'play';
      if (m === mode) return;
      mode = m;
      root.setAttribute('data-m3d-mode', m);
      cancelAnimationFrame(playRaf);
      layout();
      if (m === 'still') { P.loadFinal().then(function () { go(1, 1, 1); }); go(1, 1, 1); caption(2); }
      else if (m === 'play') { if (played) go(1, 1, 1); else go(0, 0, 0); }
      MK.tick();
    }

    /* закреплённая сцена: прогресс прокрутки → раскладка */
    var TL = { seq: 0.62, fin: [0.62, 0.7], lit: [0.68, 0.86] };
    MK.pin(root, function (p, r, vh) {
      if (r.top < vh * 2.2 && r.bottom > -vh) { if (!near) { near = true; ensure(); } }
      if (mode === 'scene' && p != null) {
        go(MK.clamp01(p / TL.seq), MK.clamp01((p - TL.fin[0]) / (TL.fin[1] - TL.fin[0])), MK.clamp01((p - TL.lit[0]) / (TL.lit[1] - TL.lit[0])));
      }
    });
    /* широкий экран: кадры подгружаются, пока читают героя; телефон —
       только когда макет рядом */
    addEventListener('load', function () {
      setTimeout(function () { if (mode === 'scene' && !near) { near = true; ensure(); } }, 1500);
    });
    /* мобильный: раскладка играет один раз, когда макет на экране */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting && mode === 'play') { ensure(); play(); } });
      }, { threshold: 0.45 }).observe(frame);
    }
    var rz = 0;
    addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { layout(); redraw(); }, 80); });
    if (mqScene.addEventListener) mqScene.addEventListener('change', setMode);
    var mqR = matchMedia('(prefers-reduced-motion: reduce)');
    if (mqR.addEventListener) mqR.addEventListener('change', setMode);
    setMode();
    return { set: setPinned };
  };

  /* ═════════ «Где квартира на этаже»: свет выбранной квартиры ═══════ */
  MK.model3d.floor = function (root, opts) {
    opts = opts || {};
    root.innerHTML =
      '<canvas class="m3d__cv" aria-hidden="true"></canvas>' +
      '<div class="m3d__layer"><svg class="m3d__hit" viewBox="0 0 ' + VB + ' ' + (VB * AR) + '" preserveAspectRatio="none" tabindex="-1" role="group" aria-label="Типовой этаж: выберите квартиру"></svg>' +
      IDS.map(function (id) {
        var p = plan(id), F = M.final.flats[id];
        return p && F ? '<span class="m3d__code" data-c="' + id + '" style="left:' + (F.label[0] * 100).toFixed(2) + '%;top:' + (F.label[1] * 100).toFixed(2) + '%" aria-hidden="true">' + p.code + '</span>' : '';
      }).join('') + '</div>';
    var cv = $('canvas', root), layer = $('.m3d__layer', root), svg = $('svg', root);
    var P = Painter(cv, root, 'contain'), sel = null, hot = null;
    IDS.forEach(function (id) { P.light[id] = 0; });
    var tw = Tween(0, function (cur) { IDS.forEach(function (id) { P.light[id] = cur[id]; }); P.render(); });
    Flats(svg, function (id) { return (opts.href || 'plans.html') + '?plan=' + id; }, function (id) {
      var p = plan(id);
      return p ? 'Планировка ' + p.code + ': ' + kindArea(p).toLowerCase() : id;
    });
    function paint(instant) {
      tw.to(function (id) { return id === sel ? 1.2 : id === hot ? 0.8 : 0.26; }, instant);
      $$('.m3d__flat', svg).forEach(function (a) {
        var id = a.getAttribute('data-flat');
        a.classList.toggle('is-sel', id === sel);
        a.setAttribute('aria-current', id === sel ? 'true' : 'false');
      });
      $$('[data-c]', layer).forEach(function (c) { var id = c.getAttribute('data-c'); c.classList.toggle('is-sel', id === sel); c.classList.toggle('is-hot', id === hot && id !== sel); });
    }
    function layout() {
      P.mode = fitMode(root);
      var R = P.size();
      layer.style.left = R.x + 'px';
      layer.style.top = R.y + 'px';
      layer.style.width = R.w + 'px';
      layer.style.height = R.h + 'px';
      P.render();
    }
    svg.addEventListener('pointerover', function (e) { var a = e.target.closest('.m3d__flat'); if (a) { hot = a.getAttribute('data-flat'); paint(); } });
    svg.addEventListener('pointerout', function (e) { if (e.target.closest('.m3d__flat')) { hot = null; paint(); } });
    svg.addEventListener('focusin', function (e) { var a = e.target.closest('.m3d__flat'); if (a) { hot = a.getAttribute('data-flat'); paint(); } });
    svg.addEventListener('focusout', function () { hot = null; paint(); });
    svg.addEventListener('click', function (e) {
      var a = e.target.closest('.m3d__flat');
      if (!a || !opts.onSelect || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      opts.onSelect(a.getAttribute('data-flat'));
    });
    var shown = false;
    function show() {
      if (shown) return;
      shown = true;
      layout();
      P.loadFinal().then(function () { layout(); paint(true); root.classList.add('is-cv'); });
    }
    var rz = 0;
    addEventListener('resize', function () { if (!shown) return; clearTimeout(rz); rz = setTimeout(layout, 80); });
    return {
      show: show,
      relayout: function () { if (shown) layout(); },
      select: function (id) { sel = id; paint(!shown); }
    };
  };

  /* ═════════ крупный план квартиры: кадр и номера помещений ════════ */
  MK.model3d.close = function (id) { return M.close && M.close[id] || null; };
  MK.model3d.closeHtml = function (p, sizes) {
    var c = MK.model3d.close(p.id);
    if (!c) return '';
    var set = function (ext) { return c.widths.slice().sort(function (a, b) { return a - b; }).map(function (w) { return c.src + w + '.' + ext + ' ' + w + 'w'; }).join(', '); };
    return '<picture><source type="image/avif" srcset="' + set('avif') + '" sizes="' + sizes + '">' +
      '<source type="image/webp" srcset="' + set('webp') + '" sizes="' + sizes + '">' +
      '<img class="pv__img pv__img--model" src="' + c.src + pickW(c.widths, 960) + '.webp" alt="Гипсовый макет квартиры ' + p.code + ' с мебелью: вид сверху под углом" width="' + c.w + '" height="' + c.h + '" decoding="async"></picture>' +
      c.rooms.filter(function (r) { return r.n != null; }).map(function (r, k) {
        return '<span class="pv__pin" data-n="' + r.n + '" style="--x:' + (r.x * 100).toFixed(2) + '%;--y:' + (r.y * 100).toFixed(2) + '%;--i:' + k + '" aria-hidden="true">' + r.n + '</span>';
      }).join('');
  };

  var home = $('[data-m3d]');
  if (home) MK.model3d.home = MK.model3d.stage(home);
})();
