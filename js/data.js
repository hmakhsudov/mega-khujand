/* MEGA KHUJAND — единый источник данных о доме.
   Шахматка, каталог, карточка квартиры, подбор на фасаде и цифры на главной
   берут лоты только отсюда. Все значения — заглушки до выгрузки из отдела
   продаж; полный список — в TODO-CONTENT.md. */
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

  var TYPES = {
    s: { r: 0, name: 'Студия', short: 'Ст', a: [26, 34], plans: ['studio-a', 'studio-b', 'studio-c', 'studio-d'] },
    1: { r: 1, name: '1 спальня', short: '1', a: [38, 50], plans: ['one-a', 'one-b', 'one-c', 'one-d'] },
    2: { r: 2, name: '2 спальни', short: '2', a: [55, 74], plans: ['two-a', 'two-b', 'two-c', 'two-d'] },
    3: { r: 3, name: '3 спальни', short: '3', a: [80, 106], plans: ['three-a', 'three-b', 'three-c', 'three-d'] },
    4: { r: 4, name: 'Пентхаус', short: 'П', a: [132, 188], plans: ['pent-a', 'pent-b', 'pent-c'] }
  };
  var ROOM_NAMES = ['Студия', '1 спальня', '2 спальни', '3 спальни', 'Пентхаус'];
  var FINISHES = ['Без отделки', 'Предчистовая', 'С отделкой'];
  var STATUS = {
    free: 'Свободна',
    sale: 'Со скидкой',
    book: 'Забронирована',
    sold: 'Продана'
  };

  /* Нарезка дома: корпус → секция → стояки слева направо.
     Первый этаж каждой секции — коммерция и лобби, квартиры начинаются
     со второго. Верхний этаж — пентхаусы, каждый занимает два стояка.
     Секции 1–3 корпусов 1 и 2 совпадают с сеткой окон на рендерах
     (см. FACADE ниже), поэтому стояков и этажей в них ровно столько,
     сколько видно на фасаде. */
  var BLD = [
    { k: 1, name: 'Корпус 1', sec: [
      { i: 1, from: 2, to: 17, st: ['1', '2', '2', '3', '2', '2', '1', 's'] },
      { i: 2, from: 2, to: 17, st: ['2', '3', '3', '2'] },
      { i: 3, from: 2, to: 16, st: ['s', '1', '2', '3', '3', '2', '1', '1'] },
      { i: 4, from: 2, to: 16, st: ['s', '1', '2', '2', '3', '3', '2', '1', '1'] }
    ] },
    { k: 2, name: 'Корпус 2', sec: [
      { i: 1, from: 2, to: 17, st: ['1', '2', '2', '3', '2', '1', 's'] },
      { i: 2, from: 2, to: 18, st: ['s', '1', '2', '3', '3', '2', '1', '2'] },
      { i: 3, from: 2, to: 18, st: ['1', '2', '3', '3', '2', '1'] }
    ] },
    { k: 3, name: 'Корпус 3', sec: [
      { i: 1, from: 2, to: 8, st: ['2', '3', '3', '2', '3'] },
      { i: 2, from: 2, to: 8, st: ['3', '2', '3', '3'] }
    ] }
  ];

  /* Плоскости фасада на рендерах 2400×1339: четыре угла (tl, tr, br, bl)
     и поля окна внутри ячейки. Калибровка — calibration/cal-FINAL.json. */
  var FACADE = [
    { k: 'day', title: 'Днём · площадь', img: 'facade-day-hero-plaza', corp: 1, planes: [
      { sect: 1, padU: 0.28, padV: 0.17, q: [[592, 376], [816, 266], [810, 940], [587, 954]] },
      { sect: 2, padU: 0.24, padV: 0.16, q: [[948, 213], [1150, 127], [1148, 920], [944, 931]] },
      { sect: 3, padU: 0.27, padV: 0.23, q: [[1154, 188], [1400, 372], [1400, 977], [1154, 951]] }
    ] },
    { k: 'dusk', title: 'Вечером · бульвар', img: 'facade-night-dusk-elevation', corp: 2, planes: [
      { sect: 1, padU: 0.25, padV: 0.22, q: [[563, 295], [809, 210], [809, 986], [563, 970]] },
      { sect: 2, padU: 0.26, padV: 0.23, q: [[814, 202], [1130, 97], [1130, 1086], [814, 1060]] },
      { sect: 3, padU: 0.18, padV: 0.26, q: [[1090, 47], [1390, 265], [1390, 1054], [1090, 1071]] }
    ] }
  ];

  /* Экспликация помещений по проекту планировки (м²); на лоте площади
     масштабируются к его общей площади. */
  var PLAN_ROOMS = {
    studio: [['Гостиная', 24.6], ['Холл', 5.1], ['Санузел', 3.7]],
    one: [['Кухня-гостиная', 25.8], ['Спальня', 15.4], ['Холл', 6.4], ['Санузел', 3.6]],
    two: [['Кухня-гостиная', 28.4], ['Спальня', 15.2], ['Спальня', 14.4], ['Холл', 7.1], ['Санузел', 3.9]],
    three: [['Кухня-гостиная', 39.2], ['Мастер-спальня', 16.8], ['Спальня', 14.1], ['Спальня', 13.6], ['Холл', 8.6], ['Санузел', 4.2], ['Гостевой санузел', 2.4]],
    pent: [['Кухня-гостиная', 54.2], ['Мастер-спальня', 24.2], ['Спальня', 19.4], ['Холл', 10.4], ['Санузел', 5.0]]
  };
  var PENT_TERRACE = 26.4;

  function lcg(seed) {
    var s = seed >>> 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  var r1 = function (v) { return Math.round(v * 10) / 10; };

  var LOTS = [];
  var BY_ID = Object.create(null);
  var HOUSE = BLD.map(function (b) {
    var no = 0;
    return {
      k: b.k, name: b.name,
      sec: b.sec.map(function (sc) {
        var rnd = lcg(b.k * 7919 + sc.i * 104729);
        var cols = sc.st.length, top = sc.to;
        var stacks = sc.st.map(function (key, x) {
          var t = TYPES[key];
          return {
            key: key, t: t,
            area: r1(t.a[0] + rnd() * (t.a[1] - t.a[0])),
            plan: t.plans[Math.floor(rnd() * t.plans.length)],
            river: x < 2 || x > cols - 3,
            corner: x === 0 || x === cols - 1
          };
        });
        var floors = [];
        for (var f = sc.from; f <= top; f++) {
          var row = [];
          var isTop = f === top;
          var fl = (f - sc.from) / Math.max(1, top - sc.from);
          for (var x = 0; x < cols; x++) {
            if (isTop && x % 2 === 1) { row.push(null); continue; }
            var st = stacks[x];
            var t = isTop ? TYPES[4] : st.t;
            var span = isTop && x + 1 < cols ? 2 : 1;
            var area = isTop ? r1(t.a[0] + rnd() * (t.a[1] - t.a[0])) : r1(st.area + (rnd() - 0.5) * 1.6);
            var plan = isTop ? t.plans[Math.floor(rnd() * t.plans.length)] : st.plan;
            var river = isTop ? true : st.river;
            var per = SITE.priceBase * (1 + fl * 0.34) * (river ? 1.06 : 1) * (isTop ? 1.42 : 1);
            per = Math.round(per / 100) * 100;
            var soldBias = 0.62 - fl * 0.3;
            var u = rnd();
            var status = u < soldBias ? 'sold' : u < soldBias + 0.06 ? 'book' : u < soldBias + 0.15 ? 'sale' : 'free';
            var disc = status === 'sale' ? [5, 7, 10][Math.floor(rnd() * 3)] : 0;
            var full = Math.round(per * area / 1000) * 1000;
            var fu = rnd();
            var lot = {
              id: b.k + '-' + sc.i + '-' + f + '-' + x,
              corp: b.k, sect: sc.i, floor: f, floors: top, x: x, span: span,
              no: 0,
              key: isTop ? '4' : st.key, rooms: t.r, type: t.name,
              area: area, plan: plan, river: river,
              corner: span === 2 ? (x === 0 || x + 1 === cols - 1) : st.corner,
              terrace: isTop || (st.river && rnd() < 0.18),
              fin: isTop ? (fu < 0.5 ? FINISHES[1] : FINISHES[2]) : FINISHES[fu < 0.4 ? 0 : fu < 0.72 ? 1 : 2],
              status: status, disc: disc,
              price: disc ? Math.round(full * (1 - disc / 100) / 1000) * 1000 : full,
              was: disc ? full : 0,
              rec: rnd()
            };
            row.push(lot);
          }
          floors.push({ f: f, row: row });
        }
        return { i: sc.i, from: sc.from, to: top, cols: cols, stacks: stacks, floors: floors };
      })
    };
  });

  /* Номера квартир — сквозные внутри корпуса: по секциям, снизу вверх,
     слева направо. */
  HOUSE.forEach(function (b) {
    var n = 0;
    b.sec.forEach(function (sc) {
      sc.floors.forEach(function (r) {
        r.row.forEach(function (lot) {
          if (!lot) return;
          lot.no = ++n;
          LOTS.push(lot);
          BY_ID[lot.id] = lot;
        });
      });
    });
  });

  var nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  var af = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function money(v) { return nf.format(Math.round(v)) + ' смн'; }
  function num(v) { return nf.format(Math.round(v)); }
  function area(v) { return af.format(v) + ' м²'; }
  function plural(n, forms) {
    var m = n % 100, k = n % 10;
    return (m > 10 && m < 20) || k === 0 || k > 4 ? forms[2] : k === 1 ? forms[0] : forms[1];
  }
  function isOpen(l) { return l.status === 'free' || l.status === 'sale'; }
  function perM(l) { return l.price / l.area; }
  function planSrc(p, dark) { return 'media/plans/' + (dark ? '' : 'light/') + p + '.svg'; }
  function lotHref(l, hash) { return 'flat.html?id=' + encodeURIComponent(l.id) + (hash || ''); }
  function lotTitle(l) { return l.type + ', ' + area(l.area); }
  function lotPlace(l) { return 'Корпус ' + l.corp + ' · секция ' + l.sect + ' · этаж ' + l.floor + ' из ' + l.floors; }
  function lotLabel(l) { return l.type + ' №\u00a0' + l.no + ', корпус ' + l.corp; }
  function roomsFor(l) {
    var fam = l.plan.split('-')[0];
    var base = PLAN_ROOMS[fam] || [];
    var sum = base.reduce(function (s, r) { return s + r[1]; }, 0) || 1;
    var k = l.area / sum;
    var rows = base.map(function (r) { return { n: r[0], a: r1(r[1] * k) }; });
    if (fam === 'pent') rows.push({ n: 'Терраса', a: PENT_TERRACE, extra: true });
    return rows;
  }
  function find(id) { return typeof id === 'string' && BY_ID[id] ? BY_ID[id] : null; }

  function stats() {
    var open = LOTS.filter(isOpen);
    var byType = [0, 1, 2, 3, 4].map(function (r) {
      var all = LOTS.filter(function (l) { return l.rooms === r; });
      var av = all.filter(isOpen);
      var min = av.length ? Math.min.apply(null, av.map(function (l) { return l.price; })) : 0;
      return { rooms: r, total: all.length, open: av.length, minPrice: min };
    });
    var sections = HOUSE.reduce(function (s, b) { return s + b.sec.length; }, 0);
    var maxFloor = Math.max.apply(null, LOTS.map(function (l) { return l.floor; }));
    return {
      total: LOTS.length,
      open: open.length,
      booked: LOTS.filter(function (l) { return l.status === 'book'; }).length,
      sold: LOTS.filter(function (l) { return l.status === 'sold'; }).length,
      corps: HOUSE.length,
      sections: sections,
      maxFloor: maxFloor,
      minPrice: open.length ? Math.min.apply(null, open.map(function (l) { return l.price; })) : 0,
      byType: byType
    };
  }

  root.MK_DATA = {
    SITE: SITE, TYPES: TYPES, ROOM_NAMES: ROOM_NAMES, FINISHES: FINISHES, STATUS: STATUS,
    BLD: BLD, HOUSE: HOUSE, LOTS: LOTS, FACADE: FACADE,
    find: find, stats: stats, isOpen: isOpen, perM: perM, roomsFor: roomsFor,
    money: money, num: num, area: area, plural: plural,
    planSrc: planSrc, lotHref: lotHref, lotTitle: lotTitle, lotPlace: lotPlace, lotLabel: lotLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
