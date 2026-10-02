#!/usr/bin/env python3
"""Планировки из листов проектной документации (PDF из ArchiCAD).

Каждый лист: код планировки (А-1…, Б-1…), комнатность, общая площадь,
экспликация с номерами помещений, номера на плане, стрелка входа (не во всех
листах), ключ-план типового этажа с выделенной квартирой и 3D-вид сверху
(растр 3840×2160). У каждой серии свой типовой этаж: А — этажи 3–7, Б — 3–6.

Скрипт повторяемый: положите новые PDF в media/plans/src/ и запустите
    pip install pymupdf pillow numpy
    python3 tools/plans-extract.py
Он пересоберёт:
    media/plans/real/<id>-{480,960,1600}.{avif,webp} — кадр плана, фон приведён к гипсу сайта
    media/plans/real/floor-<серия>-<этажи>.svg          — ключ-план этажа (вектор)
    js/plans-data.js                                    — данные для сайта
Названия помещений нормализуются (Гостинная → Гостиная, Спальная → Спальня,
С/у → Санузел); площади берутся ровно как в экспликации.
"""
import glob, json, os, re, sys
from collections import deque

import numpy as np
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'media/plans/src')
OUT = os.path.join(ROOT, 'media/plans/real')
DATA = os.path.join(ROOT, 'js/plans-data.js')
WIDTHS = (480, 960, 1600)
ENTRY_FILL = (0.66, 0.06, 0.01)   # красная стрелка входа (на 3D-виде)
MARK_FILL = (0.89, 0.68, 0.17)    # жёлтые кружки с номерами
SHEET_X = 430                     # правее — 3D-вид, левее — экспликация и ключ-план
NAMES = {'Гостинная': 'Гостиная', 'Спальная': 'Спальня', 'С/у': 'Санузел'}
# блоки серий — со слов архитектора (2026-10): буква кода — блок; у блоков Б и В
# одинаковые типовые этажи, листы есть только для Б, поэтому они показаны вместе
BLOCKS = {'a': 'Блок А', 'b': 'Блоки Б и В'}
LAT = {'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e'}


def rgb(c):
    return tuple(round(v, 2) for v in c) if c else None


def tinted(c):
    """Цветная заливка: не чёрная, не белая, не серая. Квартира на ключ-плане
    подсвечена такой заливкой, в каждом листе своим цветом (в листах Б —
    розовым, в листах А — розовым, голубым, зелёным, красным…)."""
    c = rgb(c)
    return bool(c) and max(c) - min(c) > 0.1


def num(s):
    return float(s.replace(',', '.'))


# ── кадр плана: квартира по содержимому (полы, мебель, плитка), голубой
#    оттенок рендера снимается, чтобы фон совпал с гипсом сайта ──
PLASTER2 = np.array([227, 230, 227], np.float32)


def frame(im, mask=None):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    H, W, _ = a.shape
    # цвет фона по краевой полосе без артефактов, приводим к гипсу
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3)])
    ebr = edge[:, 2] - edge[:, 0]
    bgc = np.median(edge[(ebr > 15) & (ebr < 32)], axis=0)
    if mask is not None:
        # за контуром, которым лист обрезает 3D-вид, — фон рендера:
        # там в растре бывают служебные подписи («Г4») и обрывки сцены
        k = np.asarray(mask.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)[..., None] / 255
        a = a * k + bgc * (1 - k)
    lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
    br = a[..., 2] - a[..., 0]
    s = 4
    g = lambda x: x[:H // s * s, :W // s * s].reshape(H // s, s, W // s, s).mean((1, 3))
    inside = (g(br) < 12) & (g(lum) < 236)          # фон и стены рендера голубее
    h, w = inside.shape
    # дилатация на ~10 клеток (40 px): комнаты сцепляются через стены
    d = inside.copy()
    for _ in range(10):
        d = d | np.roll(d, 1, 0) | np.roll(d, -1, 0) | np.roll(d, 1, 1) | np.roll(d, -1, 1)
    lab = np.zeros((h, w), np.int32); sizes = [0]
    for y in range(h):
        for x in range(w):
            if d[y, x] and not lab[y, x]:
                k = len(sizes); n = 0; lab[y, x] = k; q = deque([(y, x)])
                while q:
                    cy, cx = q.popleft(); n += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and d[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = k; q.append((ny, nx))
                sizes.append(n)
    big = [k for k, n in enumerate(sizes) if k and n > max(sizes) * .03]
    ys, xs = np.where(np.isin(lab, big))
    m = int(max(W, H) * .012)
    box = (max(0, xs.min() * s - m), max(0, ys.min() * s - m), min(W, xs.max() * s + s + m), min(H, ys.max() * s + s + m))
    if mask is not None:
        # контур обрезки — силуэт квартиры с балконами: кадр по нему
        x0, y0, x1, y1 = mask.getbbox()
        box = (max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m))
    gain = PLASTER2 / np.maximum(bgc, 1)
    out = np.clip(a * gain, 0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGB'), box


def outline(items, n=12):
    """Контур пути PDF → кольца точек (кривые Безье — ломаной)."""
    out, cur = [], []
    for it in items:
        if it[0] == 'l':
            seg = [it[1], it[2]]
        elif it[0] == 'c':
            p0, p1, p2, p3 = it[1:5]
            seg = [p0 * (1 - t) ** 3 + p1 * 3 * (1 - t) ** 2 * t + p2 * 3 * (1 - t) * t * t + p3 * t ** 3
                   for t in (k / n for k in range(n + 1))]
        elif it[0] == 're':
            r = it[1]
            seg = [r.tl, r.tr, r.br, r.bl, r.tl]
        elif it[0] == 'qu':
            q = it[1]
            seg = [q.ul, q.ur, q.lr, q.ll, q.ul]
        else:
            continue
        if cur and abs(cur[-1].x - seg[0].x) < 1e-3 and abs(cur[-1].y - seg[0].y) < 1e-3:
            cur += seg[1:]
        else:
            if len(cur) > 2:
                out.append(cur)
            cur = list(seg)
    if len(cur) > 2:
        out.append(cur)
    return [[(p.x, p.y) for p in r] for r in out]


def clip_mask(size, rings, bb):
    """Маска растра по контуру обрезки (правило чёт-нечет, как W* в листе)."""
    W, H = size
    m = Image.new('L', (W, H), 0)
    for r in rings:
        layer = Image.new('L', (W, H), 0)
        ImageDraw.Draw(layer).polygon([((x - bb.x0) / bb.width * W, (y - bb.y0) / bb.height * H) for x, y in r], fill=255)
        m = ImageChops.difference(m, layer)
    return m


# ── ключ-план: вектор листа в SVG, стили — классами, цвета задаёт сайт ──
def path_d(items):
    out = []
    last = None
    for it in items:
        op = it[0]
        if op == 'l':
            p1, p2 = it[1], it[2]
            if last is None or abs(last.x - p1.x) > .01 or abs(last.y - p1.y) > .01:
                out.append('M%.1f %.1f' % (p1.x, p1.y))
            out.append('L%.1f %.1f' % (p2.x, p2.y)); last = p2
        elif op == 'c':
            p1, c1, c2, p2 = it[1], it[2], it[3], it[4]
            if last is None or abs(last.x - p1.x) > .01 or abs(last.y - p1.y) > .01:
                out.append('M%.1f %.1f' % (p1.x, p1.y))
            out.append('C%.1f %.1f %.1f %.1f %.1f %.1f' % (c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)); last = p2
        elif op == 're':
            r = it[1]
            out.append('M%.1f %.1fh%.1fv%.1fh%.1fZ' % (r.x0, r.y0, r.width, r.height, -r.width)); last = None
        elif op == 'qu':
            qd = it[1]
            out.append('M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ' % (qd.ul.x, qd.ul.y, qd.ur.x, qd.ur.y, qd.lr.x, qd.lr.y, qd.ll.x, qd.ll.y)); last = None
    return ''.join(out)


def keyplan_svg(drawings, box):
    groups = []
    for g in drawings:
        if tinted(g.get('fill')):
            continue                      # подсветка квартиры листа
        if g.get('fill') is not None:
            f = rgb(g['fill'])
            cls = 'kp-w' if sum(f) < 1.5 else 'kp-b'
            key = ('f', cls)
        else:
            c = rgb(g.get('color')) or (0, 0, 0)
            cls = 'kp-l' if sum(c) < 1.5 else 'kp-t'
            key = ('s', cls, round(g.get('width') or .5, 2))
        d = path_d(g['items'])
        if not d:
            continue
        if groups and groups[-1][0] == key:
            groups[-1][1].append(d)
        else:
            groups.append([key, [d]])
    parts = []
    for key, ds in groups:
        if key[0] == 'f':
            parts.append('<path class="%s" d="%s"/>' % (key[1], ''.join(ds)))
        else:
            parts.append('<path class="%s" stroke-width="%s" d="%s"/>' % (key[1], key[2], ''.join(ds)))
    x0, y0, x1, y1 = box
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            % (x0, y0, x1 - x0, y1 - y0)) + ''.join(parts) + '</svg>'


def spans(page):
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                t = s['text'].strip()
                if t:
                    yield t, pymupdf.Rect(s['bbox']), s['size']


def parse(path):
    doc = pymupdf.open(path)
    page = doc[0]
    dr = page.get_drawings()
    sp = list(spans(page))
    code = next(t for t, r, sz in sp if re.fullmatch(r'[А-ЯA-Z]-\d+', t))
    kind = next(t for t, r, sz in sp if 'КОМНАТН' in t)
    rooms = int(re.match(r'(\d+)', kind).group(1))
    area = num(next(t for t, r, sz in sp if sz > 40).split()[0])
    fl = next(t for t, r, sz in sp if t.startswith('План') and 'этаж' in t)
    fm = re.search(r'(\d+)\s*[-–]\s*(\d+)', fl)
    floors = [int(fm.group(1)), int(fm.group(2))] if fm else None
    # экспликация: строки левой колонки по высоте
    left = [(t, r) for t, r, sz in sp if r.x1 < 440 and 225 < r.y0 < 520 and 20 < sz < 30]
    rows = {}
    for t, r in left:
        key = round(r.y0 / 6)
        rows.setdefault(key, []).append((r.x0, t))
    items = []
    for key in sorted(rows):
        cells = [t for x, t in sorted(rows[key])]
        line = ' '.join(cells)
        m = re.match(r'(\d+)\.\s*(.+?)\s+([\d.,]+)\s*м', line)
        if m:
            nm = m.group(2).strip()
            items.append({'n': int(m.group(1)), 'name': NAMES.get(nm, nm), 'src': nm, 'area': num(m.group(3))})
    # видимый растр 3D-плана (самый видимый в правой части листа)
    best, bi = None, -1
    for info in page.get_image_info(xrefs=True):
        bb = pymupdf.Rect(info['bbox'])
        vis = max(0, min(bb.x1, page.rect.x1) - max(bb.x0, SHEET_X)) * max(0, min(bb.y1, page.rect.y1) - max(bb.y0, 0))
        if vis > bi:
            bi, best = vis, info
    mirror = best['transform'][0] < 0
    raw = doc.extract_image(best['xref'])['image']
    bb = pymupdf.Rect(best['bbox'])
    # контур, которым лист обрезает 3D-вид (W* n перед рисованием растра)
    clip, ca = None, 0
    for g in page.get_drawings(extended=True):
        if g['type'] == 'clip' and len(g['items']) >= 8:
            sc = pymupdf.Rect(g['scissor'])
            if bb.contains(sc) and sc.get_area() > ca:
                clip, ca = outline(g['items']), sc.get_area()
    # номера помещений: кружки + цифра внутри
    marks = {}
    circles = [g['rect'] for g in dr if rgb(g.get('fill')) == MARK_FILL]
    for t, r, sz in sp:
        if re.fullmatch(r'\d+', t) and r.x0 > SHEET_X and 12 < sz < 20:
            c = next((cc for cc in circles if cc.contains(pymupdf.Point((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))), r)
            marks[int(t)] = ((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2)
    # стрелка входа — только на 3D-виде: в листе А-6 тем же красным залита квартира на ключ-плане
    ent = next((g for g in dr if rgb(g.get('fill')) == ENTRY_FILL and g['rect'].x0 > SHEET_X), None)
    entry = None
    if ent:
        import math
        pts = [it[1] for it in ent['items']]
        # основание стрелки лежит по оси листа, вершина — третья точка
        apex = pts[0]
        for i in range(3):
            a, b, c = pts[i], pts[(i + 1) % 3], pts[(i + 2) % 3]
            if abs(b.x - c.x) < .6 or abs(b.y - c.y) < .6:
                apex = a
                base = ((b.x + c.x) / 2, (b.y + c.y) / 2)
                break
        cx = (pts[0].x + pts[1].x + pts[2].x) / 3; cy = (pts[0].y + pts[1].y + pts[2].y) / 3
        entry = (cx, cy, math.degrees(math.atan2(apex.y - base[1], apex.x - base[0])))
    kbox = None
    kp = [g for g in dr if g['rect'].x1 < 440 and g['rect'].y0 > 560]
    keys = [g for g in kp if tinted(g.get('fill'))]
    if len(keys) > 1:
        print('  ! на ключ-плане', os.path.basename(path), 'несколько цветных заливок, беру первую')
    key = keys[0] if keys else None
    if kp:
        r = kp[0]['rect']
        for g in kp[1:]:
            r = r | g['rect']
        kbox = (r.x0, r.y0, r.x1, r.y1)
    return dict(code=code, rooms=rooms, kind=kind, area=area, floors=floors, floorLabel=fl, items=items,
                raw=raw, mirror=mirror, bbox=bb, clip=clip, marks=marks, entry=entry,
                key=path_d(key['items']) if key else None, kbox=kbox, drawings=kp, xref_bytes=len(raw))


def prov(fn, pdf):
    """Происхождение растра — соседний <файл>.json (как у остальных картинок
    сайта); дата прежней записи сохраняется, если источник тот же."""
    note = ("Origin: furnished 3D top view from the developer's plan sheet media/plans/src/%s, extracted and "
            "framed by tools/plans-extract.py (render background graded to the site plaster); not generated by Impeccable." % pdf)
    side = fn + '.json'
    old = json.load(open(side, encoding='utf-8')) if os.path.exists(side) else {}
    if old.get('prompt') == note:
        return
    stamp = __import__('datetime').datetime.now(__import__('datetime').timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    with open(side, 'w', encoding='utf-8') as fh:
        json.dump({'prompt': note, 'createdAt': stamp}, fh, ensure_ascii=False, indent=2)
        fh.write('\n')


def main():
    os.makedirs(OUT, exist_ok=True)
    pdfs = sorted(glob.glob(os.path.join(SRC, '*.pdf')))
    if not pdfs:
        sys.exit('нет PDF в media/plans/src/')
    plans, floorsvg = [], {}
    for p in pdfs:
        d = parse(p)
        pid = ''.join(LAT.get(ch, ch.lower()) for ch in d['code'] if ch != '-')
        im = Image.open(__import__('io').BytesIO(d['raw'])).convert('RGB')
        if d['mirror']:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        W, H = im.size
        mask = clip_mask(im.size, d['clip'], d['bbox']) if d['clip'] else None
        graded, (cx0, cy0, cx1, cy1) = frame(im, mask)
        crop = graded.crop((cx0, cy0, cx1, cy1))
        cw, ch = crop.size
        for w in WIDTHS:
            hh = round(ch * w / cw)
            r = crop.resize((w, hh), Image.LANCZOS)
            for ext, kw in (('webp', dict(quality=82, method=6)), ('avif', dict(quality=60))):
                fn = os.path.join(OUT, '%s-%d.%s' % (pid, w, ext))
                r.save(fn, **kw)
                prov(fn, os.path.basename(p))
        bb = d['bbox']
        def to_img(x, y):
            u = (x - bb.x0) / bb.width * W
            v = (y - bb.y0) / bb.height * H
            return round((u - cx0) / cw * 100, 2), round((v - cy0) / ch * 100, 2)
        items = []
        for it in d['items']:
            m = d['marks'].get(it['n'])
            x, y = to_img(*m) if m else (None, None)
            items.append({'n': it['n'], 'name': it['name'], 'area': it['area'], 'x': x, 'y': y})
        entry = None
        if d['entry']:
            ex, ey = to_img(d['entry'][0], d['entry'][1])
            entry = {'x': ex, 'y': ey, 'rot': round(d['entry'][2])}
        # этаж — серия кода (А, Б…) и этажи из подписи ключ-плана: у серий
        # свои плиты (А — этажи 3–7, Б — 3–6), ключ-план у всех листов серии один
        series = re.sub(r'\d', '', pid)
        fl = '%d-%d' % tuple(d['floors']) if d['floors'] else 'plan'
        fkey = '%s-%s' % (series, fl)
        if fkey not in floorsvg and d['kbox']:
            kb = d['kbox']
            with open(os.path.join(OUT, 'floor-%s.svg' % fkey), 'w') as f:
                f.write(keyplan_svg(d['drawings'], kb))
            block = BLOCKS.get(series)
            floorsvg[fkey] = {'label': (block + ', типовой этаж ' if block else 'Типовой этаж ') + fl.replace('-', '–'), 'block': block,
                              'svg': 'media/plans/real/floor-%s.svg' % fkey,
                              'box': [round(v, 1) for v in kb]}
        elif fkey in floorsvg and d['kbox'] and max(abs(a - b) for a, b in zip(floorsvg[fkey]['box'], d['kbox'])) > 0.5:
            print('  ! ключ-план', d['code'], 'не совпадает с первым листом серии — другая плита?')
        plans.append({'id': pid, 'code': d['code'], 'rooms': d['rooms'], 'area': d['area'],
                      'floors': d['floors'], 'floor': fkey, 'img': {'base': 'media/plans/real/' + pid, 'w': cw, 'h': ch},
                      'pdf': 'media/plans/src/' + os.path.basename(p), 'items': items, 'entry': entry, 'key': d['key'],
                      'mirror': d['mirror'], '_raw': d['xref_bytes']})
        s = sum(i['area'] for i in d['items'])
        print('✓', d['code'], d['kind'], d['area'], 'сумма помещений', round(s, 2), 'зеркально' if d['mirror'] else '')
    # зеркальные пары: один и тот же растр, один лист отражён
    for p in plans:
        twin = next((q for q in plans if q is not p and q['_raw'] == p['_raw'] and not q['mirror']), None) if p['mirror'] else None
        p['mirrorOf'] = twin['code'] if twin else None
    for p in plans:
        p.pop('_raw'); p.pop('mirror')
    plans.sort(key=lambda p: (p['rooms'], p['code'].split('-')[0], int(re.sub(r'\D', '', p['code']))))
    js = ('/* Сгенерировано tools/plans-extract.py из листов media/plans/src/*.pdf — не редактировать вручную.\n'
          '   Площади — ровно по экспликации проекта; координаты номеров и входа — в % кадра плана. */\n'
          'window.MK_PLANS = ' + json.dumps({'floors': floorsvg, 'list': plans}, ensure_ascii=False, indent=1) + ';\n')
    with open(DATA, 'w') as f:
        f.write(js)
    print('планировок:', len(plans), '→', os.path.relpath(DATA, ROOT))


if __name__ == '__main__':
    main()
