/* MEGA KHUJAND — общий рантайм страниц.
   Один цикл кадров на скролл/ресайз (не больше одного rAF за кадр),
   IntersectionObserver включает в работу только видимые сцены. */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var doc = document.documentElement;
  var MK = window.MK = {};

  /* ── утилиты ────────────────────────────────────────────────────── */
  MK.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  MK.clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : (v === v ? v : 0); };
  MK.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  MK.params = new URLSearchParams(location.search);
  MK.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  MK.rm = function () { return mqReduce.matches; };
  var syncRm = function () { doc.classList.toggle('rm', mqReduce.matches); };
  syncRm();
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function () { syncRm(); MK.tick(); });
  MK.store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }
  };
  MK.session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* нет доступа */ } }
  };
  MK.icon = function (name, cls) {
    var P = {
      arrow: '<path d="M2 7h10M8 3l4 4-4 4"/>',
      back: '<path d="M12 7H2M6 3L2 7l4 4"/>',
      close: '<path d="M2 2l10 10M12 2L2 12"/>',
      heart: '<path d="M10 17S2.6 12.6 2.6 7.6A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7.4 2c0 5-7.4 9.4-7.4 9.4z"/>',
      lock: '<rect x="2" y="6" width="10" height="7" rx="1.6"/><path d="M4.4 6V4.2a2.6 2.6 0 0 1 5.2 0V6"/>',
      alert: '<circle cx="10" cy="10" r="7.5"/><path d="M10 6.2v4.6M10 13.6v.2"/>',
      check: '<path d="M5 10.4l3.3 3.3L15.2 6.6"/>',
      tick: '<path d="M2 6.4l2.6 2.6L10 3.6"/>'
    };
    var vb = name === 'heart' || name === 'alert' || name === 'check' ? '0 0 20 20' : name === 'tick' ? '0 0 12 12' : '0 0 14 14';
    return '<svg class="' + (cls || 'ico') + '" viewBox="' + vb + '" aria-hidden="true" focusable="false">' + P[name] + '</svg>';
  };

  /* ── цикл кадров ────────────────────────────────────────────────── */
  var active = new Set();
  var queued = false;
  function run() {
    queued = false;
    var y = window.scrollY, vh = window.innerHeight, vw = window.innerWidth;
    active.forEach(function (fn) { fn(y, vh, vw); });
  }
  MK.tick = function () { if (!queued) { queued = true; requestAnimationFrame(run); } };
  addEventListener('scroll', MK.tick, { passive: true });
  addEventListener('resize', MK.tick);
  addEventListener('load', MK.tick);
  MK.always = function (fn) { active.add(fn); MK.tick(); };

  /* fn работает, только пока элемент рядом с экраном; при входе и выходе
     вызывается ещё раз, чтобы сцена не застряла в промежуточном состоянии */
  var watchers = new Map();
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var fn = watchers.get(en.target);
      if (!fn) return;
      if (en.isIntersecting) active.add(fn); else active.delete(fn);
      fn(window.scrollY, window.innerHeight, window.innerWidth);
    });
  }, { rootMargin: '30% 0px 30% 0px' }) : null;
  MK.watch = function (el, fn) {
    if (!el) return;
    if (io) { watchers.set(el, fn); io.observe(el); }
    else active.add(fn);
    fn(window.scrollY, window.innerHeight, window.innerWidth);
  };

  /* прогресс закреплённой сцены: 0 у верхней кромки, 1 — когда сцена
     отъехала; null — сцена не закреплена (мобильный/уменьшенное движение) */
  MK.pin = function (sec, cb) {
    MK.watch(sec, function (y, vh) {
      var r = sec.getBoundingClientRect();
      var run = r.height - vh;
      if (run < 8) { cb(null, r, vh); return; }
      cb(MK.clamp01(-r.top / run), r, vh);
    });
  };

  /* --e: появление элемента снизу (0 → 1 за ~полэкрана) */
  function initReveal() {
    document.querySelectorAll('[data-e]').forEach(function (el) {
      MK.watch(el, function (y, vh) {
        if (MK.rm()) { el.style.setProperty('--e', '1'); return; }
        var r = el.getBoundingClientRect();
        var e = MK.clamp01((vh * 0.9 - r.top) / (vh * 0.56));
        el.style.setProperty('--e', e.toFixed(3));
      });
    });
  }

  /* ── листва ─────────────────────────────────────────────────────── */
  function initFoliage() {
    var fol = document.querySelector('.fol');
    if (!fol) return;
    var last = null;
    MK.always(function (y) {
      var v = MK.rm() ? 0 : Math.round(y * -0.05);
      if (v !== last) { last = v; fol.style.setProperty('--sy', v); }
    });
  }

  /* ── мобильное меню ─────────────────────────────────────────────── */
  function initMenu() {
    var menu = document.getElementById('menu');
    if (!menu || typeof menu.showModal !== 'function') return;
    var openers = document.querySelectorAll('[data-menu-open]');
    var last = null;
    openers.forEach(function (b) {
      b.addEventListener('click', function () {
        last = b;
        menu.showModal();
        doc.style.overflow = 'hidden';
        openers.forEach(function (o) { o.setAttribute('aria-expanded', 'true'); });
      });
    });
    menu.addEventListener('close', function () {
      doc.style.overflow = '';
      openers.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
      if (last) last.focus();
    });
    menu.querySelectorAll('[data-menu-close], a').forEach(function (a) {
      a.addEventListener('click', function () { menu.close(); last = null; });
    });
  }

  /* ── избранное ──────────────────────────────────────────────────── */
  MK.fav = {
    list: function () { var v = MK.store.get('mk-fav', []); return Array.isArray(v) ? v.filter(function (id) { return D.find(id); }) : []; },
    has: function (id) { return MK.fav.list().indexOf(id) > -1; },
    toggle: function (id) {
      var l = MK.fav.list();
      var i = l.indexOf(id);
      if (i > -1) l.splice(i, 1); else l.push(id);
      MK.store.set('mk-fav', l);
      return i < 0;
    }
  };

  /* ── изображения ────────────────────────────────────────────────── */
  var STOCK = { 'courtyard-sports-aerial': 1, 'rooftop-terrace-aerial': 1, 'aerial-river-daytime': 1 };
  MK.pic = function (name, alt, o) {
    o = o || {};
    var w = STOCK[name] ? [480, 800, 1080] : [640, 1280, 1920];
    var set = function (ext) { return w.map(function (x) { return 'media/opt/' + name + '-' + x + '.' + ext + ' ' + x + 'w'; }).join(', '); };
    var sizes = o.sizes || '100vw';
    return '<picture' + (o.pcls ? ' class="' + o.pcls + '"' : '') + '>' +
      '<source type="image/avif" srcset="' + set('avif') + '" sizes="' + sizes + '">' +
      '<source type="image/webp" srcset="' + set('webp') + '" sizes="' + sizes + '">' +
      '<img src="media/opt/' + name + '-' + w[1] + '.jpg" alt="' + MK.esc(alt || '') + '"' +
      (o.cls ? ' class="' + o.cls + '"' : '') +
      (o.eager ? '' : ' loading="lazy"') + ' decoding="async" width="' + (STOCK[name] ? 1080 : 2400) + '" height="' + (STOCK[name] ? 607 : 1339) + '">' +
      '</picture>';
  };

  /* ── карточка лота ──────────────────────────────────────────────── */
  MK.tags = function (l) {
    var t = [];
    if (l.status === 'sale') t.push(['−' + l.disc + '%', 'tag--sale']);
    if (l.terrace) t.push(['Терраса', 'tag--accent']);
    if (l.river) t.push(['Вид на реку', 'tag--accent']);
    if (l.corner) t.push(['Угловая', '']);
    t.push([l.fin, '']);
    return t;
  };
  MK.priceHtml = function (l) {
    if (!D.isOpen(l)) return '<span class="lot__lock">' + MK.icon('lock') + D.STATUS[l.status] + '</span>';
    return (l.was ? '<s>' + D.money(l.was) + '</s>' : '') + D.money(l.price) +
      '<small>' + D.num(D.perM(l)) + ' смн за м²</small>';
  };
  MK.lotCard = function (l, o) {
    o = o || {};
    var fav = MK.fav.has(l.id);
    var st = l.status === 'book' ? ', забронирована' : l.status === 'sale' ? ', скидка ' + l.disc + '%' : '';
    return '<article class="lot' + (o.sm ? ' lot--sm' : '') + (l.status === 'book' ? ' lot--book' : '') + '">' +
      '<div class="lot__head"><h3 class="lot__type"><a class="lot__link" href="' + D.lotHref(l) + '">' + l.type +
      '<span class="sr-only">, ' + D.area(l.area) + ', ' + D.lotPlace(l) + ', квартира №\u00a0' + l.no + st + '</span></a></h3>' +
      '<span class="lot__area" aria-hidden="true">' + D.area(l.area) + '</span></div>' +
      '<p class="lot__meta" aria-hidden="true">' + (o.sm ? 'Корпус ' + l.corp + ' · этаж ' + l.floor + ' · №\u00a0' + l.no : D.lotPlace(l) + ' · №\u00a0' + l.no) + '</p>' +
      '<div class="lot__plan"><img src="' + D.planSrc(l.plan) + '" alt="" loading="lazy" decoding="async"></div>' +
      (o.sm ? '' : '<ul class="lot__tags">' + MK.tags(l).map(function (t) { return '<li class="tag ' + t[1] + '">' + t[0] + '</li>'; }).join('') + '</ul>') +
      '<div class="lot__foot"><p class="lot__price">' + MK.priceHtml(l) + '</p>' +
      (o.noFav ? '' : '<button class="fav" type="button" data-fav="' + l.id + '" aria-pressed="' + fav + '" aria-label="В избранное: ' + l.type + ' №\u00a0' + l.no + '">' + MK.icon('heart', '') + '</button>') +
      '</div></article>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (!b) return;
    var on = MK.fav.toggle(b.getAttribute('data-fav'));
    document.querySelectorAll('[data-fav="' + b.getAttribute('data-fav') + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(on)); });
    document.dispatchEvent(new CustomEvent('mk:fav'));
  });

  /* ── двойной слайдер ────────────────────────────────────────────── */
  MK.range = function (root, o) {
    var lo = root.querySelector('[data-lo]'), hi = root.querySelector('[data-hi]');
    var loN = root.querySelector('[data-lo-num]'), hiN = root.querySelector('[data-hi-num]');
    var rng = root.querySelector('.rng');
    var fmt = o.fmt || String;
    var parse = o.parse || function (s) { return parseFloat(String(s).replace(/\s| /g, '').replace(',', '.')); };
    [lo, hi].forEach(function (i) { i.min = o.min; i.max = o.max; i.step = o.step; });
    var st = { lo: o.min, hi: o.max };
    function paint() {
      var span = o.max - o.min || 1;
      rng.style.setProperty('--lo', ((st.lo - o.min) / span).toFixed(4));
      rng.style.setProperty('--hi', ((st.hi - o.min) / span).toFixed(4));
      lo.value = st.lo; hi.value = st.hi;
      lo.setAttribute('aria-valuetext', (o.label || '') + ' от ' + fmt(st.lo));
      hi.setAttribute('aria-valuetext', (o.label || '') + ' до ' + fmt(st.hi));
      if (document.activeElement !== loN) loN.value = fmt(st.lo);
      if (document.activeElement !== hiN) hiN.value = fmt(st.hi);
    }
    function set(a, b, silent) {
      a = MK.clamp(a, o.min, o.max); b = MK.clamp(b, o.min, o.max);
      if (a > b) { var t = a; a = b; b = t; }
      st.lo = a; st.hi = b; paint();
      if (!silent) o.onChange(st.lo, st.hi);
    }
    lo.addEventListener('input', function () { var v = +lo.value; set(Math.min(v, st.hi), st.hi); });
    hi.addEventListener('input', function () { var v = +hi.value; set(st.lo, Math.max(v, st.lo)); });
    function commit(which) {
      var inp = which === 'lo' ? loN : hiN;
      var v = parse(inp.value);
      if (!isFinite(v)) v = which === 'lo' ? o.min : o.max;
      if (which === 'lo') set(Math.min(v, st.hi), st.hi); else set(st.lo, Math.max(v, st.lo));
      inp.value = fmt(which === 'lo' ? st.lo : st.hi);
    }
    [['lo', loN], ['hi', hiN]].forEach(function (p) {
      p[1].addEventListener('change', function () { commit(p[0]); });
      p[1].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(p[0]); } });
      p[1].addEventListener('blur', function () { p[1].value = fmt(p[0] === 'lo' ? st.lo : st.hi); });
    });
    paint();
    return { set: set, get: function () { return [st.lo, st.hi]; }, isFull: function () { return st.lo <= o.min && st.hi >= o.max; } };
  };

  /* ── встраиваемые 3D и подбор ───────────────────────────────────── */
  function initEmbeds() {
    document.querySelectorAll('[data-embed]').forEach(function (box) {
      var src = box.getAttribute('data-embed');
      var title = box.getAttribute('data-embed-title') || '';
      var min = +box.getAttribute('data-embed-auto') || 0;
      var btn = box.querySelector('[data-embed-go]');
      function go(focus) {
        if (box.classList.contains('is-loading') || box.classList.contains('is-live')) return;
        box.classList.add('is-loading');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span>Загружаем…'; }
        var f = document.createElement('iframe');
        f.src = src; f.title = title;
        f.setAttribute('allow', 'fullscreen');
        f.addEventListener('load', function () {
          box.classList.remove('is-loading');
          box.classList.add('is-live');
          if (focus) f.focus();
        });
        box.appendChild(f);
      }
      if (btn) btn.addEventListener('click', function () { go(true); });
      if (min && 'IntersectionObserver' in window) {
        var ob = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting && innerWidth >= min) { go(false); ob.disconnect(); }
        }, { rootMargin: '400px 0px' });
        ob.observe(box);
      }
    });
  }

  /* ── заявка ─────────────────────────────────────────────────────── */
  var METHODS = [
    ['call', 'Звонок'],
    ['whatsapp', 'WhatsApp'],
    ['telegram', 'Telegram'],
    ['visit', 'Визит в шоурум']
  ];
  var METHOD_DONE = {
    call: 'позвонит вам',
    whatsapp: 'напишет вам в WhatsApp',
    telegram: 'напишет вам в Telegram',
    visit: 'позвонит, чтобы согласовать время визита в шоурум'
  };
  var uid = 0;
  function phoneDigits(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.indexOf('992') === 0) d = d.slice(3);
    return d.slice(0, 9);
  }
  function fmtPhone(d) {
    var p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
    return '+992 ' + p.join(' ');
  }
  function formHtml(id, o) {
    var t = o.title || 'Оставьте заявку';
    return '<div class="form-card" data-lead-card>' +
      '<div data-lead-body>' +
      '<h3 class="form-card__title" id="' + id + '-t">' + MK.esc(t) + '</h3>' +
      '<p class="form-card__sub">' + MK.esc(o.sub || 'Менеджер отдела продаж свяжется с вами удобным способом.') + '</p>' +
      '<form class="form" novalidate aria-labelledby="' + id + '-t">' +
      '<div class="form__lot" data-lot hidden></div>' +
      '<input type="hidden" name="lot" value="">' +
      '<div class="field"><label class="field__label" for="' + id + '-name">Как к вам обращаться</label>' +
      '<input class="input" id="' + id + '-name" name="name" type="text" autocomplete="name" maxlength="80" required aria-describedby="' + id + '-name-e">' +
      '<p class="field__err" id="' + id + '-name-e"></p></div>' +
      '<div class="field"><label class="field__label" for="' + id + '-phone">Телефон</label>' +
      '<input class="input tnum" id="' + id + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+992 __ ___ __ __" required aria-describedby="' + id + '-phone-e">' +
      '<p class="field__err" id="' + id + '-phone-e"></p></div>' +
      '<fieldset class="field"><legend class="field__label">Как удобнее связаться</legend><div class="opts">' +
      METHODS.map(function (m, i) {
        return '<label class="opt"><input type="radio" name="method" value="' + m[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + m[1] + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<div class="field" data-interest><label class="field__label" for="' + id + '-int">Что ищете <i>— необязательно</i></label>' +
      '<span class="select select--block"><select id="' + id + '-int" name="interest">' +
      '<option value="">Пока присматриваюсь</option>' +
      D.ROOM_NAMES.map(function (n) { return '<option>' + n + '</option>'; }).join('') +
      '</select></span></div>' +
      '<div class="hp" aria-hidden="true"><label>Компания<input type="text" name="company" tabindex="-1" autocomplete="off"></label></div>' +
      '<div data-alert role="alert"></div>' +
      '<button class="btn btn--dark btn--lg btn--block" type="submit">Отправить заявку</button>' +
      '<p class="form__note">Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Ответим в часы работы шоурума: ' + D.SITE.showroomHours + '.</p>' +
      '</form></div>' +
      '<div class="form-done" data-lead-done hidden tabindex="-1"></div>' +
      '</div>';
  }
  function lotSummary(l) {
    return '<span class="form__lot-plan"><img src="' + D.planSrc(l.plan) + '" alt=""></span>' +
      '<span class="form__lot-txt"><b>' + l.type + ' №\u00a0' + l.no + ', ' + D.area(l.area) + '</b>' +
      'Корпус ' + l.corp + ' · этаж ' + l.floor + (D.isOpen(l) ? ' · ' + D.money(l.price) : ' · ' + D.STATUS[l.status].toLowerCase()) + '</span>' +
      '<button class="form__lot-x" type="button" data-lot-x aria-label="Убрать квартиру из заявки">' + MK.icon('close') + '</button>';
  }
  MK.lead = function (slot, o) {
    o = o || {};
    var id = 'lf' + (++uid);
    slot.innerHTML = formHtml(id, o);
    var card = slot.querySelector('[data-lead-card]');
    var body = card.querySelector('[data-lead-body]');
    var form = card.querySelector('form');
    var done = card.querySelector('[data-lead-done]');
    var lotBox = form.querySelector('[data-lot]');
    var interest = form.querySelector('[data-interest]');
    var alertBox = form.querySelector('[data-alert]');
    var btn = form.querySelector('button[type=submit]');
    var name = form.elements.name, phone = form.elements.phone;

    function setLot(l) {
      form.elements.lot.value = l ? l.id : '';
      lotBox.hidden = !l;
      interest.hidden = !!l;
      lotBox.innerHTML = l ? lotSummary(l) : '';
    }
    lotBox.addEventListener('click', function (e) {
      if (e.target.closest('[data-lot-x]')) { setLot(null); form.elements.interest.focus(); }
    });
    setLot(o.lot || null);

    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+992 '; });
    phone.addEventListener('blur', function () { if (!phoneDigits(phone.value)) phone.value = ''; });
    phone.addEventListener('input', function () {
      var pos = phone.selectionStart || phone.value.length;
      var before = phoneDigits(phone.value.slice(0, pos)).length;
      var d = phoneDigits(phone.value);
      phone.value = fmtPhone(d);
      var n = 0, i = 5;
      for (; i < phone.value.length && n < before; i++) if (/\d/.test(phone.value[i])) n++;
      try { phone.setSelectionRange(i, i); } catch (e) { /* type=tel поддерживает */ }
      if (phone.getAttribute('aria-invalid') === 'true' && d.length === 9) setErr(phone, '');
    });
    name.addEventListener('input', function () { if (name.value.trim()) setErr(name, ''); });

    function setErr(inp, msg) {
      var e = document.getElementById(inp.getAttribute('aria-describedby'));
      e.textContent = msg;
      if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
    }
    function validate() {
      var ok = true, first = null;
      if (!name.value.trim()) { setErr(name, 'Укажите имя — так менеджер поймёт, как к вам обращаться.'); ok = false; first = first || name; }
      else setErr(name, '');
      var d = phoneDigits(phone.value);
      if (!d.length) { setErr(phone, 'Укажите телефон, чтобы мы могли связаться.'); ok = false; first = first || phone; }
      else if (d.length < 9) { setErr(phone, 'Номер неполный: после +992 нужно 9 цифр, например +992 44 600 00 00.'); ok = false; first = first || phone; }
      else setErr(phone, '');
      if (first) first.focus();
      return ok;
    }
    function busy(on) {
      btn.disabled = on;
      btn.innerHTML = on ? '<span class="spin" aria-hidden="true"></span>Отправляем…' : 'Отправить заявку';
    }
    async function send(payload) {
      if (MK.params.get('lead') === 'fail') { await MK.wait(700); throw new Error('forced'); }
      var url = D.SITE.leadEndpoint;
      if (!url) {
        await MK.wait(800);
        var saved = MK.store.get('mk-leads', []);
        saved.push(payload);
        MK.store.set('mk-leads', saved.slice(-20));
        return;
      }
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      try {
        var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined });
        if (!r.ok) throw new Error('HTTP ' + r.status);
      } finally { clearTimeout(timer); }
    }
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      alertBox.innerHTML = '';
      if (form.elements.company.value) return;
      if (!validate()) return;
      var method = (form.querySelector('input[name=method]:checked') || {}).value || 'call';
      var lot = D.find(form.elements.lot.value);
      var payload = {
        name: name.value.trim(), phone: fmtPhone(phoneDigits(phone.value)), method: method,
        lot: lot ? lot.id : null, lotLabel: lot ? D.lotLabel(lot) : null,
        interest: lot ? null : (form.elements.interest.value || null),
        page: location.pathname.split('/').pop() || 'index.html', at: new Date().toISOString()
      };
      busy(true);
      try {
        await send(payload);
        done.innerHTML = '<span class="form-done__mark" aria-hidden="true">' + MK.icon('check', '') + '</span>' +
          '<h3 class="form-card__title">Заявка принята</h3>' +
          '<p>' + MK.esc(payload.name) + ', менеджер ' + METHOD_DONE[method] + ' по номеру <b class="tnum">' + payload.phone + '</b>' +
          (lot ? ' и расскажет о квартире №\u00a0' + lot.no + ' в корпусе ' + lot.corp : '') + '. Отвечаем ' + D.SITE.showroomHours + '.</p>' +
          (D.SITE.leadEndpoint ? '' : '<p class="form__demo">Демонстрационный режим: заявка сохранена только в этом браузере и в отдел продаж не отправлена. Чтобы связаться сейчас, позвоните ' + D.SITE.phone + '.</p>') +
          '<div class="row"><a class="btn btn--soft btn--sm" href="' + D.SITE.phoneHref + '">Позвонить сейчас</a>' +
          '<button class="btn btn--soft btn--sm" type="button" data-again>Новая заявка</button></div>';
        body.hidden = true;
        done.hidden = false;
        done.focus();
      } catch (err) {
        alertBox.innerHTML = '<div class="form__alert">' + MK.icon('alert') +
          '<span>Заявка не отправилась — похоже, пропало соединение. Попробуйте ещё раз или позвоните: <a href="' + D.SITE.phoneHref + '">' + D.SITE.phone + '</a>.</span></div>';
      }
      busy(false);
    });
    done.addEventListener('click', function (e) {
      if (!e.target.closest('[data-again]')) return;
      form.reset();
      setLot(o.lot || null);
      done.hidden = true;
      body.hidden = false;
      name.focus();
    });
    return { setLot: setLot };
  };

  /* ── цифры из data.js в разметке ─────────────────────────────────
     В HTML записаны те же значения — страница читается и без JS,
     а скрипт держит их в согласии с data.js. */
  function bindData() {
    var s = D.stats();
    var val = { total: D.num(s.total), open: D.num(s.open), corps: s.corps, sections: s.sections, minPrice: D.money(s.minPrice), maxFloor: s.maxFloor };
    var raw = { total: s.total, open: s.open, corps: s.corps, sections: s.sections };
    document.querySelectorAll('[data-stat]').forEach(function (n) {
      var k = n.getAttribute('data-stat');
      if (k in val) n.textContent = val[k];
    });
    document.querySelectorAll('[data-stat-word]').forEach(function (n) {
      var k = n.getAttribute('data-stat-word');
      var f = (n.getAttribute('data-forms') || '').split('|');
      if (k in raw && f.length === 3) n.textContent = D.plural(raw[k], f);
    });
    document.querySelectorAll('[data-site]').forEach(function (n) {
      var k = n.getAttribute('data-site');
      if (k in D.SITE) n.textContent = D.SITE[k];
    });
  }

  /* ── старт ──────────────────────────────────────────────────────── */
  initReveal();
  initFoliage();
  initMenu();
  initEmbeds();
  document.querySelectorAll('[data-lead-slot]').forEach(function (s) {
    if (s.hasAttribute('data-lead-manual')) return;
    MK.lead(s, { title: s.getAttribute('data-title') || undefined, sub: s.getAttribute('data-sub') || undefined, lot: D.find(MK.params.get('lot')) });
  });
  document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
  bindData();
})();
