/* Планировки из проектной документации (js/plans-data.js, собирается
   tools/plans-extract.py): просмотрщик 3D-плана с номерами помещений,
   экспликация, ключ-план этажа, карточки. Общие части — для главной
   и страницы plans.html. */
(function () {
  'use strict';
  var P = window.MK_PLANS || { floors: {}, list: [] };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var af2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var NS = 'http://www.w3.org/2000/svg';

  var PL = MK.plans = {
    list: P.list,
    floors: P.floors,
    area: function (v) { return af2.format(v) + ' м²'; },
    kind: function (r) { return r === 0 ? 'Студия' : r === 4 ? 'Пентхаус' : r + '-комнатная'; },
    kinds: function (r) { return r === 0 ? 'Студии' : r === 4 ? 'Пентхаусы' : r + '-комнатные'; },
    find: function (id) {
      if (!id) return null;
      var k = String(id).toLowerCase();
      return P.list.filter(function (p) { return p.id === k || p.code.toLowerCase() === k; })[0] || null;
    },
    rooms: function () {
      var seen = {};
      P.list.forEach(function (p) { seen[p.rooms] = (seen[p.rooms] || 0) + 1; });
      return Object.keys(seen).map(Number).sort().map(function (r) { return { r: r, n: seen[r] }; });
    },
    floorsLabel: function (p) { return p.floors ? 'этажи ' + p.floors[0] + '–' + p.floors[1] : ''; },
    pic: function (p, w, sizes, cls, eager) {
      var set = function (ext) { return [480, 960, 1600].map(function (x) { return p.img.base + '-' + x + '.' + ext + ' ' + x + 'w'; }).join(', '); };
      return '<picture><source type="image/avif" srcset="' + set('avif') + '" sizes="' + sizes + '">' +
        '<source type="image/webp" srcset="' + set('webp') + '" sizes="' + sizes + '">' +
        '<img src="' + p.img.base + '-' + w + '.webp" alt="3D-вид сверху: планировка ' + p.code + ', ' + PL.kind(p.rooms).toLowerCase() + ', ' + PL.area(p.area) + '"' +
        (cls ? ' class="' + cls + '"' : '') + ' width="' + p.img.w + '" height="' + p.img.h + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async"></picture>';
    },
    /* помещения — прозой: кухня, спальни, санузлы, балконы, веранда */
    summary: function (p) {
      var by = function (n) { return p.items.filter(function (i) { return i.name === n; }); };
      var out = [];
      var k = by('Кухня')[0]; if (k) out.push('кухня ' + PL.area(k.area));
      var g = by('Гостиная')[0]; if (g) out.push('гостиная ' + PL.area(g.area));
      by('Спальня').forEach(function (s) { out.push('спальня ' + PL.area(s.area)); });
      var su = by('Санузел').length, bl = by('Балкон').length, ve = by('Веранда').length;
      if (su) out.push(su + ' ' + MK_DATA.plural(su, ['санузел', 'санузла', 'санузлов']));
      if (bl) out.push(bl + ' ' + MK_DATA.plural(bl, ['балкон', 'балкона', 'балконов']));
      if (ve) out.push(ve === 1 ? 'веранда' : ve + ' ' + MK_DATA.plural(ve, ['веранда', 'веранды', 'веранд']));
      return out.join(' · ');
    },
    shareText: function (p) { return 'Планировка ' + p.code + ' · ' + PL.kind(p.rooms).toLowerCase() + ', ' + PL.area(p.area) + ' — MEGA KHUJAND'; },
    url: function (p) { return new URL('plans.html?plan=' + p.id, location.href).href; }
  };

  /* ── просмотрщик: кадр плана, номера помещений, вход ───────────────
     opts.model — переключатель «Лист / Макет»: крупный план гипсового
     макета квартиры (js/model.js) с теми же номерами помещений */
  PL.viewer = function (root, opts) {
    opts = opts || {};
    var cur = null, view = 'sheet';
    var closeOf = function (p) { return opts.model && MK.model3d && p ? MK.model3d.close(p.id) : null; };
    root.innerHTML =
      '<div class="pv__board">' +
        '<span class="plate pv__code" data-code></span>' +
        (opts.model ? '<div class="seg pv__views" role="group" aria-label="Вид планировки" data-views hidden>' +
          '<button class="seg__btn" type="button" data-view="sheet" aria-pressed="true">Лист проекта</button>' +
          '<button class="seg__btn" type="button" data-view="model" aria-pressed="false">Макет</button></div>' : '') +
        '<div class="pv__fit" data-fit></div>' +
        (opts.zoom === false ? '' : '<button class="pv__zoom" type="button" data-zoom>' +
          '<svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 1.5h4v4M5.5 12.5h-4v-4M12.5 1.5L8 6M1.5 12.5L6 8"/></svg>Увеличить</button>') +
      '</div>';
    var fit = $('[data-fit]', root), board = $('.pv__board', root), views = $('[data-views]', root);
    function set(p) {
      cur = p;
      var c = closeOf(p), sizes = opts.sizes || '(min-width: 1000px) 56vw, 100vw';
      if (views) {
        views.hidden = !c;
        $$('[data-view]', views).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === (c ? view : 'sheet'))); });
      }
      $('[data-code]', root).textContent = p.code;
      board.classList.toggle('is-model', !!(c && view === 'model'));
      if (c && view === 'model') {
        board.style.setProperty('--ar', (c.w / c.h).toFixed(4));
        fit.innerHTML = MK.model3d.closeHtml(p, sizes);
        return;
      }
      board.style.setProperty('--ar', (p.img.w / p.img.h).toFixed(4));
      fit.innerHTML = PL.pic(p, 960, sizes, 'pv__img', opts.eager) +
        p.items.filter(function (i) { return i.x != null; }).map(function (i, k) {
          return '<span class="pv__pin" data-n="' + i.n + '" style="--x:' + i.x + '%;--y:' + i.y + '%;--i:' + k + '" aria-hidden="true">' + i.n + '</span>';
        }).join('') +
        (p.entry && p.entry.y >= 0 && p.entry.y <= 100 ? (function (e) {
          /* подпись сдвигаем по направлению стрелки из листа — к двери, не на номер */
          var r = e.rot * Math.PI / 180;
          return '<span class="pv__entry" style="--x:' + e.x + '%;--y:' + e.y + '%;--tx:' + (-50 + 62 * Math.cos(r)).toFixed(0) + '%;--ty:' + (-50 + 90 * Math.sin(r)).toFixed(0) + '%">Вход</span>';
        })(p.entry) : '');
    }
    root.addEventListener('pointerover', function (e) {
      var pin = e.target.closest('.pv__pin');
      if (pin && opts.onHover) opts.onHover(+pin.getAttribute('data-n'));
    });
    root.addEventListener('pointerout', function (e) {
      if (e.target.closest('.pv__pin') && opts.onHover) opts.onHover(null);
    });
    root.addEventListener('click', function (e) {
      var v = e.target.closest('[data-view]');
      if (v && cur) {
        view = v.getAttribute('data-view');
        MK.session.set('mk-pv-view', view);
        set(cur);
        return;
      }
      if (e.target.closest('[data-zoom]') && cur) PL.zoom(cur, closeOf(cur) && view === 'model' ? 'model' : 'sheet');
    });
    if (opts.model && MK.session.get('mk-pv-view') === 'model') view = 'model';
    return {
      set: set,
      hot: function (n) { $$('.pv__pin', root).forEach(function (x) { x.classList.toggle('is-on', +x.getAttribute('data-n') === n); }); }
    };
  };

  /* экспликация — номера совпадают с номерами на плане */
  PL.roomsHtml = function (p) {
    return '<ol class="pv__rooms">' + p.items.map(function (i) {
      return '<li data-n="' + i.n + '" tabindex="0"><span class="num" aria-hidden="true">' + i.n + '</span><span class="pv__rn">' + i.name + '</span><span class="pv__ra tnum">' + PL.area(i.area) + '</span></li>';
    }).join('') + '</ol>' +
    '<p class="pv__total"><span>Общая площадь, с балконами</span><b class="tnum">' + PL.area(p.area) + '</b></p>';
  };
  PL.bindRooms = function (box, viewer) {
    var on = function (n) {
      viewer.hot(n);
      $$('.pv__rooms li', box).forEach(function (li) { li.classList.toggle('is-on', +li.getAttribute('data-n') === n); });
    };
    box.addEventListener('pointerover', function (e) { var li = e.target.closest('.pv__rooms li'); if (li) on(+li.getAttribute('data-n')); });
    box.addEventListener('pointerleave', function () { on(null); });
    box.addEventListener('focusin', function (e) { var li = e.target.closest('.pv__rooms li'); if (li) on(+li.getAttribute('data-n')); });
    box.addEventListener('focusout', function () { on(null); });
    return on;
  };

  /* во весь экран: крупный кадр, прокрутка и масштаб пальцами */
  var zoomDlg = null;
  PL.zoom = function (p, view) {
    if (!zoomDlg) {
      zoomDlg = document.createElement('dialog');
      zoomDlg.className = 'pv-zoom';
      zoomDlg.setAttribute('aria-label', 'Планировка крупно');
      document.body.appendChild(zoomDlg);
      zoomDlg.addEventListener('click', function (e) { if (e.target === zoomDlg || e.target.closest('[data-close]')) zoomDlg.close(); });
      zoomDlg.addEventListener('close', function () { document.documentElement.style.overflow = ''; });
    }
    var c = view === 'model' && MK.model3d ? MK.model3d.close(p.id) : null;
    var src = c ? c.src + Math.max.apply(null, c.widths) + '.webp' : p.img.base + '-1600.webp';
    zoomDlg.innerHTML = '<div class="pv-zoom__bar"><span class="plate">' + p.code + '</span><span>' + PL.kind(p.rooms) + ', ' + PL.area(p.area) + '</span>' +
      '<button class="menu__close" type="button" data-close aria-label="Закрыть">' + MK.icon('close') + '</button></div>' +
      '<div class="pv-zoom__scroll' + (c ? ' is-model' : '') + '"><img src="' + src + '" alt="' + (c ? 'Гипсовый макет квартиры ' + p.code + ' с мебелью' : '3D-вид сверху: планировка ' + p.code) + '" width="' + (c ? c.w : p.img.w) + '" height="' + (c ? c.h : p.img.h) + '"></div>';
    if (typeof zoomDlg.showModal === 'function') { zoomDlg.showModal(); document.documentElement.style.overflow = 'hidden'; }
    else window.open(src, '_blank');
  };

  /* ── ключ-план этажа: квартиры с планировками кликабельны ──────── */
  var floorCache = {};
  PL.floor = function (root, floorKey, opts) {
    var f = P.floors[floorKey];
    if (!f) { root.hidden = true; return { select: function () {} }; }
    var sel = null;
    function paint() { $$('[data-plan]', root).forEach(function (a) { a.classList.toggle('is-sel', a.getAttribute('data-plan') === sel); a.setAttribute('aria-current', a.getAttribute('data-plan') === sel ? 'true' : 'false'); }); }
    var ready = (floorCache[f.svg] = floorCache[f.svg] || fetch(f.svg).then(function (r) { return r.text(); }));
    ready.then(function (txt) {
      root.innerHTML = txt;
      var svg = $('svg', root);
      if (!svg) return;
      svg.setAttribute('role', 'group');
      svg.setAttribute('aria-label', f.label + ': выберите квартиру');
      var g = document.createElementNS(NS, 'g');
      P.list.filter(function (p) { return p.floor === floorKey && p.key; }).forEach(function (p) {
        var a = document.createElementNS(NS, 'a');
        a.setAttribute('href', (opts.href || 'plans.html') + '?plan=' + p.id);
        a.setAttribute('class', 'fp__flat');
        a.setAttribute('data-plan', p.id);
        a.setAttribute('aria-label', 'Планировка ' + p.code + ', ' + PL.kind(p.rooms).toLowerCase() + ', ' + PL.area(p.area));
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', p.key);
        a.appendChild(path);
        g.appendChild(a);
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'fp__code');
        t.textContent = p.code;
        a.appendChild(t);
      });
      svg.appendChild(g);
      $$('.fp__flat', svg).forEach(function (a) {
        var b = $('path', a).getBBox(), t = $('text', a);
        t.setAttribute('x', (b.x + b.width / 2).toFixed(1));
        t.setAttribute('y', (b.y + b.height / 2 + 3).toFixed(1));
        a.addEventListener('click', function (e) {
          if (!opts.onSelect) return;
          e.preventDefault();
          opts.onSelect(a.getAttribute('data-plan'));
        });
      });
      paint();
    }).catch(function () { root.hidden = true; });
    return { select: function (id) { sel = id; paint(); } };
  };

  /* карточка планировки */
  PL.card = function (p, href) {
    return '<a class="pcard" href="' + (href || 'plans.html') + '?plan=' + p.id + '" data-plan="' + p.id + '">' +
      '<span class="pcard__img">' + PL.pic(p, 480, '(min-width: 900px) 22vw, 50vw') + '</span>' +
      '<span class="pcard__body"><span class="plate">' + p.code + '</span>' +
      '<b class="pcard__t">' + PL.kind(p.rooms) + ', <span class="tnum">' + PL.area(p.area) + '</span></b>' +
      '<span class="pcard__m">' + PL.summary(p) + '</span>' +
      '<span class="pcard__f">' + PL.floorsLabel(p) + (p.mirrorOf ? ' · зеркальная ' + p.mirrorOf : '') + '</span></span></a>';
  };

  /* отправить планировку: системное «Поделиться» или WhatsApp */
  PL.share = function (p) {
    var text = PL.shareText(p), url = PL.url(p);
    if (navigator.share) { navigator.share({ title: text, text: text, url: url }).catch(function () {}); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  };

  /* ═════════════ страница «Планировки» ═══════════════════════════════ */
  var page = $('[data-plans-page]');
  if (!page) return;
  var S = { plan: null, rooms: 'all' };
  var q = MK.params;
  S.plan = PL.find(q.get('plan')) || null;
  if (/^[0-4]$/.test(q.get('rooms') || '')) S.rooms = +q.get('rooms');
  if (!S.plan) S.plan = P.list.filter(function (p) { return S.rooms === 'all' || p.rooms === S.rooms; })[0] || P.list[0];

  var keys = $('[data-pkeys]'), cards = $('[data-pcards]'), info = $('[data-pinfo]');
  var cnt = $('[data-plans-count]'); if (cnt) cnt.textContent = P.list.length;
  var viewer = PL.viewer($('[data-pview]'), { eager: true, model: true, onHover: function (n) { onRoom(n); } });
  var onRoom = PL.bindRooms(info, viewer);
  var floor = null, floorKey = null;
  var lead = MK.lead($('[data-plan-lead]'), { title: 'Узнать цену и наличие', sub: 'Сообщим, на каких этажах есть квартиры с этой планировкой и сколько они стоят сейчас.', plan: S.plan, method: 'call' });

  keys.innerHTML = [{ r: 'all', n: P.list.length }].concat(PL.rooms()).map(function (k) {
    return '<button class="seg__btn" type="button" data-r="' + k.r + '" aria-pressed="false">' + (k.r === 'all' ? 'Все' : PL.kinds(k.r)) + ' <small>' + k.n + '</small></button>';
  }).join('');

  function renderCards() {
    $$('[data-r]', keys).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-r') === String(S.rooms))); });
    var list = P.list.filter(function (p) { return S.rooms === 'all' || p.rooms === S.rooms; });
    cards.innerHTML = list.map(function (p) { return PL.card(p); }).join('');
    paintCards();
  }
  function paintCards() {
    $$('.pcard', cards).forEach(function (c) { c.classList.toggle('is-sel', c.getAttribute('data-plan') === S.plan.id); c.setAttribute('aria-current', c.getAttribute('data-plan') === S.plan.id ? 'true' : 'false'); });
  }
  function renderPlan(push) {
    var p = S.plan;
    viewer.set(p);
    info.innerHTML =
      '<div class="pinfo__top"><span class="plate">' + p.code + '</span><span class="pinfo__fl">' + (P.floors[p.floor] ? P.floors[p.floor].label : '') + '</span></div>' +
      '<h2 class="pinfo__h">' + PL.kind(p.rooms) + ', <span class="tnum">' + PL.area(p.area) + '</span></h2>' +
      '<p class="pinfo__sum">' + PL.summary(p) + '</p>' +
      (p.mirrorOf ? '<p class="small pinfo__mir">Зеркальная версия планировки ' + p.mirrorOf + ': те же помещения и площади, расположение отражено.</p>' : '') +
      PL.roomsHtml(p) +
      '<div class="pinfo__act">' +
        '<a class="btn btn--dark" href="#lead" data-ask>Узнать цену и наличие</a>' +
        '<button class="btn btn--soft" type="button" data-share>Отправить планировку</button>' +
      '</div>' +
      '<a class="link-arrow link-arrow--muted" href="' + p.pdf + '" download="MEGA-KHUJAND-' + p.code + '.pdf">Скачать лист планировки (PDF) ' + MK.icon('arrow') + '</a>';
    if (floorKey !== p.floor) {
      floorKey = p.floor;
      floor = PL.floor($('[data-pfloor]'), p.floor, { onSelect: function (id) { choose(id, true); } });
      $('[data-pfloor-l]').textContent = P.floors[p.floor] ? P.floors[p.floor].label : '';
    }
    floor.select(p.id);
    floorView(p);
    lead.setPlan(p);
    paintCards();
    document.title = 'Планировка ' + p.code + ' — ' + PL.kind(p.rooms).toLowerCase() + ', ' + PL.area(p.area) + ' — MEGA KHUJAND';
    if (push) history.replaceState(null, '', location.pathname + '?plan=' + p.id);
  }
  /* этаж: гипсовый макет со светом выбранной квартиры или схема из листа */
  var fviews = $('[data-fviews]'), f3el = $('[data-pfloor3d]'), f2el = $('[data-pfloor]'), fnote = $('[data-fnote]');
  var f3 = null, fview = MK.session.get('mk-fp-view') === 'plan' ? 'plan' : 'model';
  var NOTE = {
    model: 'Свет горит в выбранной квартире, приглушённый — в других квартирах этажа. Нажмите на квартиру, чтобы открыть её планировку.',
    plan: fnote ? fnote.textContent : ''
  };
  function floorView(p) {
    var has = !!(MK.model3d && MK.model3d.plateOf(p.id));
    var v = has ? fview : 'plan';
    if (fviews) fviews.hidden = !has;
    if (v === 'model' && !f3) f3 = MK.model3d.floor(f3el, { onSelect: function (id) { choose(id, true); } });
    f3el.hidden = v !== 'model';
    f2el.hidden = v === 'model';
    if (f3) { f3.select(p.id); if (v === 'model') f3.show(); }
    $$('[data-fview]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-fview') === v)); });
    if (fnote) fnote.textContent = NOTE[v];
  }
  if (fviews) fviews.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fview]');
    if (!b) return;
    fview = b.getAttribute('data-fview');
    MK.session.set('mk-fp-view', fview);
    floorView(S.plan);
  });
  function choose(id, scroll) {
    var p = PL.find(id);
    if (!p) return;
    S.plan = p;
    renderPlan(true);
    if (scroll) $('#plan').scrollIntoView({ behavior: MK.rm() ? 'auto' : 'smooth', block: 'start' });
  }
  keys.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (!b) return;
    var v = b.getAttribute('data-r');
    S.rooms = v === 'all' ? 'all' : +v;
    renderCards();
  });
  cards.addEventListener('click', function (e) {
    var c = e.target.closest('.pcard');
    if (!c || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    choose(c.getAttribute('data-plan'), true);
  });
  info.addEventListener('click', function (e) {
    if (e.target.closest('[data-share]')) PL.share(S.plan);
    if (e.target.closest('[data-ask]')) lead.setPlan(S.plan);
  });
  renderCards();
  renderPlan(false);
  if (MK.motion) MK.motion();
})();
