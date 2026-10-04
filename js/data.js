/* MEGA KHUJAND — единый источник данных о доме.
   Шахматка, каталог, карточка квартиры, подбор на фасаде и цифры на главной
   берут лоты только отсюда. Планировки — из листов проекта (js/plans-data.js
   подключается раньше этого файла); статусы, цены и номера — заглушки до
   выгрузки из отдела продаж; полный список — в TODO-CONTENT.md. */
(function (root) {
  'use strict';

  var SITE = {
    name: 'MEGA KHUJAND',
    phone: '+992 44 600 00 00',
    phoneHref: 'tel:+992446000000',
    whatsapp: 'https://wa.me/992446000000',
    telegram: 'https://t.me/+992446000000',
    showroom: 'Шоурум на набережной Сырдарьи',
    showroomHours: 'ежедневно, 9:00–19:00',
    handover: 'IV квартал 2026',
    ceiling: '3,1 м',
    walkMinutes: 5,
    priceBase: 9400,
    /* Адрес приёма заявок (POST, JSON). Пока пусто — форма работает
       в демонстрационном режиме и никуда не отправляет данные. */
    leadEndpoint: ''
  };

  var ROOM_NAMES = ['Студия', '1-комнатная', '2-комнатная', '3-комнатная', 'Пентхаус'];
  var FINISHES = ['Без отделки', 'Предчистовая', 'С отделкой'];
  var STATUS = {
    free: 'Свободна',
    sale: 'Со скидкой',
    book: 'Забронирована',
    sold: 'Продана'
  };

  /* Дом со слов заказчика (2026-10-04): четыре жилых блока по 18 этажей,
     1–2 этажи — торговые помещения, квартиры с 3-го. Стояки блока — квартиры
     его типового этажа из листов проекта (js/plans-data.js), слева направо
     по коду: А-1…А-8 в блоке А, Б-1…Б-7 в блоках Б и В (спроектированы
     одинаково). Листы описывают этажи 3–7 (А) и 3–6 (Б); выше типовой этаж
     повторяется — допущение до выгрузки (у лота typical: false). Листов
     блока Г нет — он показан без квартир. Площади и комнатность — из листов;
     статусы, цены, отделка и номера — заглушка из генератора. */
  var FLOORS = 18, FIRST = 3;
  var BLD = [
    { k: 'А', lat: 'a', plate: 'a-3-7', plans: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'] },
    { k: 'Б', lat: 'b', plate: 'b-3-6', plans: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'] },
    { k: 'В', lat: 'v', plate: 'b-3-6', plans: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'] },
    { k: 'Г', lat: 'g', plate: null, plans: [] }
  ];

  /* Плоскости фасада на рендерах 2400×1339: четыре угла (tl, tr, br, bl),
     сетка окон (стояки × этажи from…to) и поля окна внутри ячейки.
     Калибровка — calibration/cal-FINAL.json; ключи света «секция:этаж:стояк»
     в js/facade-light.js — по номеру плоскости sect. Какие блоки видны
     на рендерах, не сверено: привязка плоскостей к блокам (blk) условная,
     окно стояка x показывает квартиру стояка x этого блока. */
  var FACADE = [
    { k: 'day', title: 'Днём · площадь', img: 'facade-day-hero-plaza', planes: [
      { sect: 1, blk: 'А', cols: 8, from: 2, to: 17, padU: 0.28, padV: 0.17, q: [[592, 376], [816, 266], [810, 940], [587, 954]] },
      { sect: 2, blk: 'Б', cols: 4, from: 2, to: 17, padU: 0.24, padV: 0.16, q: [[948, 213], [1150, 127], [1148, 920], [944, 931]] },
      { sect: 3, blk: 'В', cols: 8, from: 2, to: 16, padU: 0.27, padV: 0.23, q: [[1154, 188], [1400, 372], [1400, 977], [1154, 951]] }
    ] },
    { k: 'dusk', title: 'Вечером · бульвар', img: 'facade-night-dusk-elevation', planes: [
      { sect: 1, blk: 'Б', cols: 7, from: 2, to: 17, padU: 0.25, padV: 0.22, q: [[563, 295], [809, 210], [809, 986], [563, 970]] },
      { sect: 2, blk: 'А', cols: 8, from: 2, to: 18, padU: 0.26, padV: 0.23, q: [[814, 202], [1130, 97], [1130, 1086], [814, 1060]] },
      { sect: 3, blk: 'В', cols: 6, from: 2, to: 18, padU: 0.18, padV: 0.26, q: [[1090, 47], [1390, 265], [1390, 1054], [1090, 1071]] }
    ] }
  ];

  var PLANS = (root.MK_PLANS && root.MK_PLANS.list) || [];
  var PLAN = Object.create(null);
  PLANS.forEach(function (p) { PLAN[p.id] = p; });

  function lcg(seed) {
    var s = seed >>> 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }

  var LOTS = [];
  var BY_ID = Object.create(null);
  var HOUSE = BLD.map(function (b, bi) {
    var rnd = lcg((bi + 1) * 7919 + 104729);
    var stacks = b.plans.map(function (id) { return PLAN[id]; }).filter(Boolean);
    var cols = stacks.length, floors = [], no = 0;
    for (var f = FIRST; cols && f <= FLOORS; f++) {
      var fl = (f - FIRST) / (FLOORS - FIRST), row = [];
      for (var x = 0; x < cols; x++) {
        var p = stacks[x];
        var per = Math.round(SITE.priceBase * (1 + fl * 0.34) / 100) * 100;
        var soldBias = 0.62 - fl * 0.3, u = rnd();
        var status = u < soldBias ? 'sold' : u < soldBias + 0.06 ? 'book' : u < soldBias + 0.15 ? 'sale' : 'free';
        var disc = status === 'sale' ? [5, 7, 10][Math.floor(rnd() * 3)] : 0;
        var full = Math.round(per * p.area / 1000) * 1000, fu = rnd();
        var lot = {
          id: b.lat + '-' + f + '-' + (x + 1),
          blk: b.k, floor: f, floors: FLOORS, x: x, span: 1, no: ++no,
          plan: p.id, code: p.code, rooms: p.rooms, type: ROOM_NAMES[p.rooms] || p.rooms + '-комнатная',
          area: p.area, typical: f >= p.floors[0] && f <= p.floors[1],
          veranda: p.items.some(function (it) { return it.name === 'Веранда'; }),
          fin: FINISHES[fu < 0.4 ? 0 : fu < 0.72 ? 1 : 2],
          status: status, disc: disc,
          price: disc ? Math.round(full * (1 - disc / 100) / 1000) * 1000 : full,
          was: disc ? full : 0,
          rec: rnd()
        };
        row.push(lot);
        LOTS.push(lot);
        BY_ID[lot.id] = lot;
      }
      floors.push({ f: f, row: row });
    }
    return { k: b.k, lat: b.lat, name: 'Блок ' + b.k, plate: b.plate, pending: !cols,
      from: FIRST, to: FLOORS, cols: cols, stacks: stacks, floors: floors };
  });
  /* комнатность, которая есть в доме: 1, 2, 3 */
  var ROOM_TYPES = LOTS.reduce(function (a, l) { if (a.indexOf(l.rooms) < 0) a.push(l.rooms); return a; }, []).sort();

  var nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  /* площади — как в экспликации листа, до сотых */
  var af = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  function money(v) { return nf.format(Math.round(v)) + ' смн'; }
  function num(v) { return nf.format(Math.round(v)); }
  function area(v) { return af.format(v) + ' м²'; }
  function plural(n, forms) {
    var m = n % 100, k = n % 10;
    return (m > 10 && m < 20) || k === 0 || k > 4 ? forms[2] : k === 1 ? forms[0] : forms[1];
  }
  function isOpen(l) { return l.status === 'free' || l.status === 'sale'; }
  function perM(l) { return l.price / l.area; }
  /* кадр настоящей планировки из листа: 480, 960 или 1600 px */
  function planSrc(id, w) { return 'media/plans/real/' + id + '-' + (w || 480) + '.webp'; }
  function lotHref(l, hash) { return 'flat.html?id=' + encodeURIComponent(l.id) + (hash || ''); }
  function lotTitle(l) { return l.type + ', ' + area(l.area); }
  function lotPlace(l) { return 'Блок ' + l.blk + ' · этаж ' + l.floor + ' из ' + l.floors; }
  function lotLabel(l) { return l.type + ' № ' + l.no + ', блок ' + l.blk; }
  /* экспликация — ровно по листу планировки */
  function roomsFor(l) {
    var p = PLAN[l.plan];
    return p ? p.items.map(function (it) { return { n: it.name, a: it.area }; }) : [];
  }
  function find(id) { return typeof id === 'string' && BY_ID[id] ? BY_ID[id] : null; }
  function block(k) { return HOUSE.filter(function (b) { return b.k === k || b.lat === k; })[0] || null; }

  /* Окно лота на рендере: гомография единичного квадрата плоскости фасада
     (tl, tr, br, bl) → четырёхугольник окна с полями padU / padV внутри ячейки. */
  function homography(q) {
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    var den = dx1 * dy2 - dy1 * dx2;
    var g = (sx * dy2 - sy * dx2) / den, h = (dx1 * sy - dy1 * sx) / den;
    return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g: g, h: h };
  }
  function hmap(H, u, v) { var w = H.g * u + H.h * v + 1; return [(H.a * u + H.b * v + H.c) / w, (H.d * u + H.e * v + H.f) / w]; }
  /* плоскость, на которой видно окно квартиры (если видно) */
  function planeOf(view, l) {
    return view.planes.filter(function (p) { return p.blk === l.blk && l.x < p.cols && l.floor >= p.from && l.floor <= p.to; })[0] || null;
  }
  function windowQuad(pl, l, H) {
    H = H || homography(pl.q);
    var rows = pl.to - pl.from + 1, cw = 1 / pl.cols, rh = 1 / rows;
    var u0 = l.x * cw + cw * pl.padU, u1 = (l.x + l.span) * cw - cw * pl.padU;
    var v0 = (pl.to - l.floor) * rh + rh * pl.padV, v1 = (pl.to - l.floor + 1) * rh - rh * pl.padV;
    return [hmap(H, u0, v0), hmap(H, u1, v0), hmap(H, u1, v1), hmap(H, u0, v1)];
  }
  /* ракурс и окно квартиры, если её стояк виден на одном из рендеров */
  function windowOf(l) {
    for (var i = 0; i < FACADE.length; i++) {
      var pl = planeOf(FACADE[i], l);
      if (pl) return { view: FACADE[i], pts: windowQuad(pl, l) };
    }
    return null;
  }
  /* ключ окна в слое света вечернего рендера (js/facade-light.js) */
  function lightKey(l) {
    var v = FACADE.filter(function (x) { return x.k === 'dusk'; })[0], pl = v && planeOf(v, l);
    return pl ? pl.sect + ':' + l.floor + ':' + l.x : null;
  }

  function stats() {
    var open = LOTS.filter(isOpen);
    var byType = ROOM_TYPES.map(function (r) {
      var all = LOTS.filter(function (l) { return l.rooms === r; });
      var av = all.filter(isOpen);
      var min = av.length ? Math.min.apply(null, av.map(function (l) { return l.price; })) : 0;
      return { rooms: r, total: all.length, open: av.length, minPrice: min };
    });
    return {
      total: LOTS.length,
      open: open.length,
      booked: LOTS.filter(function (l) { return l.status === 'book'; }).length,
      sold: LOTS.filter(function (l) { return l.status === 'sold'; }).length,
      blocks: HOUSE.length,
      maxFloor: FLOORS,
      minPrice: open.length ? Math.min.apply(null, open.map(function (l) { return l.price; })) : 0,
      byType: byType
    };
  }

  root.MK_DATA = {
    SITE: SITE, ROOM_NAMES: ROOM_NAMES, ROOM_TYPES: ROOM_TYPES, FINISHES: FINISHES, STATUS: STATUS,
    BLD: BLD, HOUSE: HOUSE, LOTS: LOTS, FACADE: FACADE, FLOORS: FLOORS, FIRST: FIRST,
    find: find, block: block, plan: function (id) { return PLAN[id] || null; },
    stats: stats, isOpen: isOpen, perM: perM, roomsFor: roomsFor,
    homography: homography, planeOf: planeOf, windowQuad: windowQuad, windowOf: windowOf, lightKey: lightKey,
    money: money, num: num, area: area, plural: plural,
    planSrc: planSrc, lotHref: lotHref, lotTitle: lotTitle, lotPlace: lotPlace, lotLabel: lotLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
