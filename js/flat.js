/* Карточка квартиры: flat.html?id=<корпус>-<секция>-<этаж>-<стояк> */
(function () {
  'use strict';
  var D = window.MK_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var root = $('[data-flat]');
  var q = MK.params;

  /* id из ссылки; старые ссылки вида ?b=1&no=158 тоже находят лот */
  var lot = D.find(q.get('id'));
  if (!lot && /^\d+$/.test(q.get('no') || '') && /^[1-3]$/.test(q.get('b') || '')) {
    lot = D.LOTS.filter(function (l) { return l.corp === +q.get('b') && l.no === +q.get('no'); })[0] || null;
  }

  var ref = document.referrer || '';
  var back = /building\.html/.test(ref) ? { href: 'building.html', t: 'Назад к шахматке' }
    : /picker\.html/.test(ref) ? { href: 'picker.html', t: 'Назад к фасаду' }
    : { href: MK.session.get('mk-catalog') || 'flats.html', t: 'Назад к каталогу' };
  if (!/^(flats|building|picker)\.html/.test(back.href)) back.href = 'flats.html';
  document.querySelectorAll('[data-back]').forEach(function (a) { a.href = back.href; });

  var arrow = '<span class="ico-ring"><svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4"/></svg></span>';
  var backArrow = '<span class="ico-ring"><svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M12 7H2M6 3L2 7l4 4"/></svg></span>';
  var slot = $('[data-lead-slot]');

  if (!lot) { notFound(); return; }

  var open = D.isOpen(lot);
  var st = lot.status;
  var title = lot.type + ', ' + D.area(lot.area);
  document.title = title + ' — квартира №\u00a0' + lot.no + ', корпус ' + lot.corp + ' · MEGA KHUJAND';
  var md = document.querySelector('meta[name="description"]');
  if (md) md.content = lot.type + ' ' + D.area(lot.area) + ' на ' + lot.floor + ' этаже, корпус ' + lot.corp + ' MEGA KHUJAND в Худжанде. ' +
    (open ? 'Цена ' + D.money(lot.price) + '.' : D.STATUS[st] + '.') + ' Планировка, площади помещений и вид из окон.';

  var cta = {
    free: 'Забронировать', sale: 'Забронировать со скидкой', book: 'Сообщить, если освободится', sold: 'Подобрать похожую'
  }[st];
  var view = lot.terrace ? 'Терраса и панорама реки' : lot.river ? 'Вид на Сырдарью' : lot.corner ? 'Угловая, окна на две стороны' : 'Во внутренний двор';
  var rooms = D.roomsFor(lot);
  var inner = rooms.filter(function (r) { return !r.extra; });
  var extra = rooms.filter(function (r) { return r.extra; });

  var gallery = [];
  if (lot.river || lot.terrace) gallery.push(['aerial-river-2560', 'Сырдарья и набережная с высоты — вид в сторону реки']);
  gallery.push(lot.floor >= 12 ? ['facade-night-dusk-elevation', 'Фасад корпуса вечером'] : ['facade-day-hero-plaza', 'Фасад и площадь у корпуса']);
  gallery.push(lot.corner ? ['facade-day-corner-detail', 'Угловая часть фасада с панорамным остеклением'] : ['courtyard-playground-collage', 'Внутренний двор без машин']);
  if (gallery.length < 3) gallery.push(['retail-arcade-entrance', 'Входная группа и торговая аркада']);

  /* окна этой квартиры на рендере — первым кадром галереи */
  var win = D.windowOf(lot);
  function winFigure(w) {
    var xs = w.pts.map(function (p) { return p[0]; }), ys = w.pts.map(function (p) { return p[1]; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var W = 440, H = 246;
    var x0 = MK.clamp(cx - W / 2, 0, 2400 - W).toFixed(0), y0 = MK.clamp(cy - H / 2, 0, 1339 - H).toFixed(0);
    var pts = w.pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var href = 'picker.html?id=' + encodeURIComponent(lot.id);
    return '<figure class="gallery__win"><a class="gallery__img" href="' + href + '" aria-label="Открыть подбор на фасаде с этой квартирой">' +
      '<svg viewBox="' + x0 + ' ' + y0 + ' ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Окна квартиры на рендере фасада, ' + w.view.title.toLowerCase() + '">' +
      '<defs><mask id="win-hole"><rect width="2400" height="1339" fill="#fff"/><polygon points="' + pts + '" fill="#000"/></mask></defs>' +
      '<image href="media/opt/' + w.view.img + '-1920.webp" width="2400" height="1339"/>' +
      '<rect width="2400" height="1339" fill="rgba(16,15,12,.4)" mask="url(#win-hole)"/>' +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="34" fill="none" stroke="#F2DFB6" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
      '<polygon points="' + pts + '" fill="rgba(255,236,196,.3)" stroke="#F2DFB6" stroke-width="2" vector-effect="non-scaling-stroke"/>' +
      '</svg></a><figcaption>Окна этой квартиры на фасаде — нажмите, чтобы открыть подбор</figcaption></figure>';
  }

  var similar = D.LOTS.filter(function (x) { return x.id !== lot.id && D.isOpen(x); })
    .map(function (x) { return { x: x, d: Math.abs(x.area - lot.area) + Math.abs(x.rooms - lot.rooms) * 14 + Math.abs(x.floor - lot.floor) * 0.4 + (x.river === lot.river ? 0 : 5) + (x.corp === lot.corp ? 0 : 2) }; })
    .sort(function (a, b) { return a.d - b.d; }).slice(0, 4).map(function (o) { return o.x; });

  var statusCls = st === 'free' ? ' status--free' : st === 'sale' ? ' status--sale' : '';
  var statusTxt = st === 'sale' ? 'Скидка ' + lot.disc + '%' : D.STATUS[st];
  var note = {
    free: 'Цена предварительная и действует при 100% оплате. Об условиях рассрочки и ипотеки спросите менеджера.',
    sale: 'Скидка действует на этот лот, пока он свободен. Цена предварительная — точный расчёт подготовит менеджер.',
    book: 'Лот забронирован другим покупателем. Оставьте заявку — сообщим, если бронь снимут, и подберём похожую квартиру в этом же стояке.',
    sold: 'Эта квартира продана. Покажем свободные квартиры с такой же планировкой и видом — ниже похожие варианты.'
  }[st];

  root.innerHTML =
    '<div class="flat-top"><div class="flat-top__bar">' +
      '<nav class="crumbs" aria-label="Навигационная цепочка"><a href="index.html">Главная</a><span class="sep" aria-hidden="true">·</span><a href="flats.html">Квартиры</a><span class="sep" aria-hidden="true">·</span><span aria-current="page">' + lot.type + ' №\u00a0' + lot.no + '</span></nav>' +
      '<a class="link-arrow" href="' + back.href + '">' + backArrow + back.t + '</a>' +
    '</div></div>' +
    '<section class="flat-hero" aria-labelledby="flat-h">' +
      '<div>' +
        '<span class="status' + statusCls + '">' + statusTxt + '</span>' +
        '<h1 id="flat-h">' + lot.type + '<span class="tnum">, ' + D.area(lot.area) + '</span></h1>' +
        '<p class="flat-hero__sub">' + D.lotPlace(lot) + ' · квартира №\u00a0' + lot.no + '</p>' +
        '<dl class="kspecs">' +
          '<div><dt>Площадь</dt><dd>' + D.area(lot.area) + '</dd></div>' +
          '<div><dt>Спальни</dt><dd>' + (lot.rooms === 0 ? 'Студия' : lot.rooms === 4 ? '2 + терраса' : lot.rooms) + '</dd></div>' +
          '<div><dt>Этаж</dt><dd>' + lot.floor + ' из ' + lot.floors + '</dd></div>' +
          '<div><dt>Отделка</dt><dd>' + lot.fin + '</dd></div>' +
        '</dl>' +
        '<div class="price-card" data-price-card>' +
          '<div class="price-card__row">' +
            '<div><span class="label">Стоимость</span>' +
              (open ? '<b class="price-card__val">' + D.money(lot.price) + (lot.was ? '<s class="price-card__was">' + D.money(lot.was) + '</s>' : '') + '</b>' +
                '<span class="price-card__per">' + D.num(D.perM(lot)) + ' смн за м²</span>'
                : '<b class="price-card__val">' + D.STATUS[st] + '</b><span class="price-card__per">Цена не публикуется</span>') +
            '</div>' +
            '<div class="price-card__act"><a class="btn btn--dark btn--lg" href="#lead" data-go-lead>' + cta + '</a>' +
            '<a class="btn btn--soft btn--lg" href="' + D.SITE.phoneHref + '">Позвонить</a></div>' +
          '</div>' +
          '<p class="small">' + note + '</p>' +
        '</div>' +
      '</div>' +
      '<figure class="planbox">' +
        '<div class="planbox__head"><span class="label">Планировка</span><span>' + lot.plan.toUpperCase().replace('-', ' · ') + '</span></div>' +
        '<div class="planbox__img"><img src="' + D.planSrc(lot.plan, true) + '" alt="Планировка квартиры: ' + lot.type.toLowerCase() + ', ' + D.area(lot.area) + '. ' +
          inner.map(function (r) { return r.n.toLowerCase() + ' ' + D.area(r.a); }).join(', ') + '" width="526" height="504" decoding="async"></div>' +
        '<ul class="planbox__tags">' + MK.tags(lot).filter(function (t) { return t[1] !== 'tag--sale'; }).map(function (t) { return '<li>' + t[0] + '</li>'; }).join('') + '</ul>' +
      '</figure>' +
    '</section>' +
    '<section class="gallery" aria-label="Дом и окружение">' + (win ? winFigure(win) : '') + gallery.slice(0, win ? 2 : 3).map(function (g) {
      return '<figure><div class="gallery__img">' + MK.pic(g[0], g[1], { sizes: '(min-width: 900px) 33vw, 100vw' }) + '</div><figcaption>' + g[1] + '</figcaption></figure>';
    }).join('') + '</section>' +
    '<section class="flat-info">' +
      '<div><h2 class="eyebrow">Характеристики</h2><dl class="dl">' + [
        ['Корпус', '№\u00a0' + lot.corp], ['Секция', '№\u00a0' + lot.sect], ['Этаж', lot.floor + ' из ' + lot.floors],
        ['Номер квартиры', '№\u00a0' + lot.no], ['Общая площадь', D.area(lot.area)], ['Тип', lot.type],
        ['Отделка', lot.fin], ['Вид из окон', view], ['Высота потолков', D.SITE.ceiling], ['Срок сдачи', D.SITE.handover]
      ].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl></div>' +
      '<div><h2 class="eyebrow">Площади помещений</h2><dl class="dl dl--rooms">' +
        inner.map(function (r) { return '<div><dt>' + r.n + '</dt><dd>' + D.area(r.a) + '</dd></div>'; }).join('') +
        extra.map(function (r) { return '<div><dt>' + r.n + ' <span class="small">(не входит в площадь)</span></dt><dd>' + D.area(r.a) + '</dd></div>'; }).join('') +
        '</dl><div class="dl__total"><span class="label">Итого</span><b>' + D.area(lot.area) + '</b></div>' +
        '<p class="small" style="margin-top:18px">Площади указаны по проекту и могут отличаться от обмеров БТИ в пределах допуска. Планировка показана схематично.</p>' +
      '</div>' +
    '</section>' +
    (similar.length ? '<section class="similar" id="similar" aria-labelledby="sim-h">' +
      '<div class="similar__head"><div><h2 class="h4" id="sim-h">Похожие квартиры</h2><p class="small" style="margin-top:8px">Близкие по площади, этажу и виду</p></div>' +
      '<a class="link-arrow" href="flats.html?rooms=' + lot.rooms + '">Все ' + (lot.rooms === 0 ? 'студии' : lot.rooms === 4 ? 'пентхаусы' : 'квартиры «' + lot.type + '»') + ' ' + arrow + '</a></div>' +
      '<div class="lots">' + similar.map(function (x) { return MK.lotCard(x, { sm: true }); }).join('') + '</div></section>' : '');

  /* заявка с этой квартирой */
  var leadTitle = { free: 'Забронировать квартиру №\u00a0' + lot.no, sale: 'Забронировать квартиру №\u00a0' + lot.no, book: 'Сообщить, если освободится', sold: 'Подобрать похожую квартиру' }[st];
  MK.lead(slot, { lot: lot, title: leadTitle, sub: open ? 'Менеджер зафиксирует цену, ответит на вопросы и пригласит на показ.' : 'Менеджер сообщит об изменениях и предложит похожие варианты.' });
  if (!open) {
    $('[data-lead-h]').textContent = st === 'sold' ? 'Подберём похожую квартиру' : 'Сообщим, если бронь снимут';
    $('[data-lead-note]').textContent = 'Покажем свободные квартиры с такой же планировкой и видом — в этом же корпусе или по соседству.';
  }
  var gl = $('[data-grid-link]');
  if (gl) gl.href = 'building.html?id=' + encodeURIComponent(lot.id);

  /* липкая панель после блока цены */
  var sticky = $('[data-sticky]');
  $('[data-sticky-label]').textContent = lot.type + ' · №\u00a0' + lot.no;
  $('[data-sticky-price]').innerHTML = open ? D.money(lot.price) + '<span>' + D.area(lot.area) + '</span>' : D.STATUS[st] + '<span>' + D.area(lot.area) + '</span>';
  $('[data-sticky-cta]').textContent = open ? 'Забронировать' : 'Оставить заявку';
  var pastPrice = false, atLead = false;
  function syncSticky() { var on = pastPrice && !atLead; sticky.classList.toggle('is-on', on); sticky.inert = !on; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { pastPrice = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; syncSticky(); }).observe($('[data-price-card]'));
    new IntersectionObserver(function (en) { atLead = en[0].isIntersecting; syncSticky(); }, { rootMargin: '0px 0px -20% 0px' }).observe($('#lead'));
  }
  syncSticky();

  /* пришли по кнопке «Забронировать» с шахматки или фасада */
  function goLead(focus) {
    var el = document.getElementById('lead');
    el.scrollIntoView({ behavior: MK.rm() ? 'auto' : 'smooth', block: 'start' });
    if (focus) { var n = el.querySelector('input[name=name]'); if (n) n.focus({ preventScroll: true }); }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#lead"]');
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, '', location.pathname + location.search + '#lead');
    goLead(true);
  });
  if (location.hash === '#lead') requestAnimationFrame(function () { goLead(true); });

  function notFound() {
    document.title = 'Квартира не найдена · MEGA KHUJAND';
    var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
    var pick = D.LOTS.filter(D.isOpen).sort(function (a, b) { return a.rec - b.rec; }).slice(0, 4);
    var had = q.get('id') || q.get('no');
    root.innerHTML = '<section class="notfound" aria-labelledby="nf-h">' +
      '<nav class="crumbs" aria-label="Навигационная цепочка" style="justify-content:center"><a href="index.html">Главная</a><span class="sep" aria-hidden="true">·</span><a href="flats.html">Квартиры</a></nav>' +
      '<h1 id="nf-h" style="margin-top:18px">' + (had ? 'Такой квартиры нет в каталоге' : 'Квартира не выбрана') + '</h1>' +
      '<p>' + (had ? 'Возможно, ссылка устарела или в ней опечатка. Посмотрите свободные квартиры — или оставьте заявку, подберём похожую.' : 'Выберите квартиру в каталоге, на шахматке или прямо на фасаде — здесь откроется её планировка и цена.') + '</p>' +
      '<div class="row-btns"><a class="btn btn--dark btn--lg" href="flats.html">Все квартиры</a><a class="btn btn--soft btn--lg" href="building.html">Шахматка дома</a><a class="btn btn--soft btn--lg" href="picker.html">Подбор на фасаде</a></div>' +
      '<h2 class="eyebrow" style="justify-content:center;margin-top:clamp(40px,7vh,72px)">Сейчас в продаже</h2>' +
      '<div class="lots" style="margin-top:22px">' + pick.map(function (x) { return MK.lotCard(x, { sm: true }); }).join('') + '</div>' +
      '</section>';
    $('[data-sticky]').remove();
    MK.lead(slot, { title: 'Подберём квартиру', sub: 'Расскажите, что ищете, — менеджер пришлёт подходящие варианты.' });
  }
})();
