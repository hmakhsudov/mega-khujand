/* Главная: сцены со скроллом и блоки, собранные из data.js */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var smooth = function () { return MK.rm() ? 'auto' : 'smooth'; };

  /* ── герой: вордмарк-маска → рендер ─────────────────────────────── */
  var hero = $('.hero'), stage = $('.hero__stage'), bar = $('.hero__bar'), hdr = $('#hdr'), pill = $('#pill');
  function fitMark() {
    var vw = innerWidth, vh = innerHeight;
    var sc = Math.max(vw / 1600, vh / 900);
    var top = (hdr ? hdr.offsetHeight : 80);
    var region = vh - bar.offsetHeight - top - 20;
    var wmk = Math.min(1, (vw / sc) / 1140, Math.max(0.24, region / (360 * sc)));
    var target = top + region / 2 + 6;
    var wmy = (target - vh / 2) / sc + 19 * wmk;
    stage.style.setProperty('--wmk', wmk.toFixed(4));
    stage.style.setProperty('--wmy', wmy.toFixed(1));
  }
  fitMark();
  addEventListener('resize', fitMark);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMark);

  var heroPast = false;
  MK.pin(hero, function (p, r) {
    heroPast = r.bottom < innerHeight * 0.35;
    if (p == null) {
      stage.style.setProperty('--p', '0');
      hero.classList.remove('is-dark');
      if (hdr) hdr.classList.remove('is-hidden');
    } else {
      stage.style.setProperty('--p', p.toFixed(4));
      hero.classList.toggle('is-dark', p > 0.4);
      if (hdr) hdr.classList.toggle('is-hidden', p > 0.2);
    }
    syncPill();
  });

  /* ── пилюля: появляется после героя, прячется у формы ───────────── */
  var leadSec = $('#lead');
  var nearLead = false;
  function syncPill() { pill.classList.toggle('is-on', heroPast && !nearLead); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { nearLead = en[0].isIntersecting; syncPill(); }, { rootMargin: '0px 0px -35% 0px' }).observe(leadSec);
    var links = $$('a[href^="#"]', pill);
    var cur = null;
    var secIo = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        cur = '#' + e.target.id;
        links.forEach(function (a) {
          if (a.getAttribute('href') === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['arch', 'atmosphere', 'infra', 'plans', 'service', 'lead'].forEach(function (id) { var el = document.getElementById(id); if (el) secIo.observe(el); });
  }

  /* ── атмосфера: три главы ───────────────────────────────────────── */
  var chap = $('#atmosphere'), chapItems = $$('[data-chap]', chap), chapSegs = $$('.chap__segs i', chap);
  var ci = 0;
  function setChap(i) {
    if (i === ci) return;
    ci = i;
    chapItems.forEach(function (n, k) { n.classList.toggle('is-on', k === i); n.classList.toggle('is-before', k < i); });
    chapSegs.forEach(function (n, k) { n.classList.toggle('is-on', k === i); });
  }
  MK.pin(chap, function (p) {
    if (p == null) return;
    setChap(Math.min(2, Math.floor(MK.clamp01((p - 0.03) / 0.92) * 3)));
  });

  /* ── панорама ───────────────────────────────────────────────────── */
  var pano = $('#pano'), panoStage = $('.pano__stage', pano);
  MK.pin(pano, function (p) { panoStage.style.setProperty('--p', p == null ? '1' : p.toFixed(4)); });

  /* ── инфраструктура ─────────────────────────────────────────────── */
  var infra = $('#infra'), iBtns = $$('.infra__btn', infra), iShots = $$('[data-shot]', infra), iDescs = $$('.infra__desc', infra);
  var iPanel = $('[data-infra-panel]', infra);
  var ii = 0, iPinned = false, iTimer = 0;
  function setInfra(i) {
    if (i === ii) return;
    ii = i;
    iBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
    iShots.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    clearTimeout(iTimer);
    if (MK.rm()) { iPanel.textContent = iDescs[i].textContent; return; }
    iPanel.classList.add('is-swap');
    iTimer = setTimeout(function () { iPanel.textContent = iDescs[i].textContent; iPanel.classList.remove('is-swap'); }, 200);
  }
  MK.pin(infra, function (p) {
    iPinned = p != null;
    if (p != null) setInfra(Math.min(7, Math.floor(MK.clamp01((p - 0.04) / 0.9) * 8)));
  });
  iBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (iPinned) {
        var top = infra.getBoundingClientRect().top + scrollY;
        var run = infra.offsetHeight - innerHeight;
        scrollTo({ top: top + run * ((i + 0.5) / 8 * 0.9 + 0.04), behavior: smooth() });
      }
      setInfra(i);
    });
  });

  /* ── планировки ─────────────────────────────────────────────────── */
  var PL = {
    4: { title: 'Пентхаус', d: 'Лоты на верхних этажах с индивидуальным доступом на лифте, панорамным остеклением и открытой террасой.', files: ['pent-a', 'pent-b', 'pent-c'] },
    3: { title: '3 спальни', d: 'В коллекции — балконы и лоджии, изолированная мастер-спальня, гостевой санузел и кухня-гостиная на всю ширину квартиры.', files: ['three-a', 'three-b', 'three-c', 'three-d'] },
    2: { title: '2 спальни', d: 'Избранные конфигурации квартир: с отдельной постирочной и гардеробной или с кухней-гостиной в три окна.', files: ['two-a', 'two-b', 'two-c', 'two-d'] },
    1: { title: '1 спальня', d: 'Кухня-гостиная с окном во всю стену и изолированная спальня — планировка, в которой день и ночь не мешают друг другу.', files: ['one-a', 'one-b', 'one-c', 'one-d'] },
    0: { title: 'Студия', d: 'Пространство для начала — максимум света, свободы и функциональности в каждом метре.', files: ['studio-a', 'studio-b', 'studio-c', 'studio-d'] }
  };
  var st = D.stats();
  var plRoot = $('#plans');
  var plTypes = $$('[data-type]', plRoot), plThumbs = $('[data-pl-thumbs]', plRoot), plImg = $('[data-pl-img]', plRoot);
  var plState = { r: 2, i: 0 };
  function variant(f) { return f.split('-')[1].toUpperCase(); }
  function planStats(f) {
    var ls = D.LOTS.filter(function (l) { return l.plan === f; });
    var open = ls.filter(D.isOpen);
    var as = ls.map(function (l) { return l.area; });
    return { open: open.length, lo: Math.min.apply(null, as), hi: Math.max.apply(null, as) };
  }
  function renderPlans(focusThumb) {
    var t = PL[plState.r], files = t.files, f = files[plState.i];
    var ts = st.byType[plState.r];
    plTypes.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-type') === plState.r)); });
    $('[data-pl-title]', plRoot).textContent = t.title;
    $('[data-pl-desc]', plRoot).textContent = t.d;
    $('[data-pl-facts]', plRoot).innerHTML = ts.open
      ? 'В продаже <b>' + ts.open + '</b> · от <b class="tnum">' + D.money(ts.minPrice) + '</b>'
      : 'Сейчас свободных нет — оставьте заявку, сообщим о новых лотах';
    var cta = $('[data-pl-cta]', plRoot);
    cta.href = 'flats.html?rooms=' + plState.r;
    cta.textContent = ts.open ? 'Показать ' + ts.open + ' ' + D.plural(ts.open, ['квартиру', 'квартиры', 'квартир']) : 'Смотреть каталог';
    plThumbs.innerHTML = files.map(function (x, k) {
      return '<li><button class="plans__thumb" type="button" data-k="' + k + '" aria-pressed="' + (k === plState.i) + '" aria-label="Вариант ' + variant(x) + '">' +
        '<img src="' + D.planSrc(x) + '" alt="" loading="lazy" decoding="async"></button></li>';
    }).join('');
    plImg.src = D.planSrc(f);
    plImg.alt = 'Планировка: ' + t.title.toLowerCase() + ', вариант ' + variant(f);
    var ps = planStats(f);
    $('[data-pl-cap]', plRoot).textContent = 'Вариант ' + variant(f) + ' · ' + D.area(ps.lo).replace(' м²', '') + '–' + D.area(ps.hi) + (ps.open ? ' · в продаже ' + ps.open : '');
    if (focusThumb) { var b = plThumbs.querySelector('[data-k="' + plState.i + '"]'); if (b) b.focus(); }
  }
  plTypes.forEach(function (b) {
    b.addEventListener('click', function () { plState = { r: +b.getAttribute('data-type'), i: 0 }; renderPlans(); });
  });
  plThumbs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]');
    if (b) { plState.i = +b.getAttribute('data-k'); renderPlans(true); }
  });
  $('[data-pl-prev]', plRoot).addEventListener('click', function () {
    var n = PL[plState.r].files.length; plState.i = (plState.i - 1 + n) % n; renderPlans();
  });
  $('[data-pl-next]', plRoot).addEventListener('click', function () {
    var n = PL[plState.r].files.length; plState.i = (plState.i + 1) % n; renderPlans();
  });
  renderPlans();

  /* ── сервис: лента ──────────────────────────────────────────────── */
  var track = $('[data-srv-track]'), rail = $('[data-srv-rail]'), sPrev = $('[data-srv-prev]'), sNext = $('[data-srv-next]');
  var sQueued = false;
  function syncRail() {
    sQueued = false;
    var max = track.scrollWidth - track.clientWidth;
    var ratio = Math.min(1, track.clientWidth / Math.max(1, track.scrollWidth));
    var p = max > 0 ? MK.clamp01(track.scrollLeft / max) : 0;
    rail.style.width = (ratio * 100).toFixed(2) + '%';
    rail.style.transform = 'translateX(' + (p * (100 / Math.max(ratio, 0.001) - 100)).toFixed(2) + '%)';
    sPrev.disabled = track.scrollLeft < 4;
    sNext.disabled = track.scrollLeft > max - 4;
  }
  function queueRail() { if (!sQueued) { sQueued = true; requestAnimationFrame(syncRail); } }
  track.addEventListener('scroll', queueRail, { passive: true });
  addEventListener('resize', queueRail);
  function step(d) {
    var card = track.firstElementChild;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    track.scrollBy({ left: d * (card.offsetWidth + gap), behavior: smooth() });
  }
  sPrev.addEventListener('click', function () { step(-1); });
  sNext.addEventListener('click', function () { step(1); });
  syncRail();
})();
