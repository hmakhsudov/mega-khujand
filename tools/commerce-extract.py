#!/usr/bin/env python3
"""Первые два этажа (торговые помещения) из листов проекта — упрощённая схема.

Листы 1–2 этажей блоков (PDF из ArchiCAD, чистый вектор) лежат в
media/plans/commerce/src/<блок>-<этаж>.pdf: a-1, a-2, b-2, v-1, v-2, g-1, g-2
(буква блока латиницей: а→a, б→b, в→v, г→g). Квартир там нет, макет по ним
не строится; на сайте они — тихий раздел в конце plans.html.

Скрипт перерисовывает каждый лист в SVG без осей, размеров, марок и подписей:
стены и колонны (тёмно-красная заливка листа) — заливкой, перегородки, окна,
двери, лестницы и лифты — линиями, цвета — гипс и графит сайта. Только дом:
пандусы (клин уклона и их контур), граница участка, крыльца, приямки и
навесы снаружи отбрасываются — без подписей листа они читались как
непонятные треугольники и рамки. Тамбуры и эркеры за линией фасада остаются:
их стены толстые и по цепочке примыкают к стенам дома.
    pip install pymupdf
    python3 tools/commerce-extract.py
Результат: media/plans/commerce/<блок>-<этаж>.svg. Подписи в листах нарисованы
линиями (шрифт ArchiCAD), а не текстом, поэтому площади из экспликации
вписаны в plans.html руками.
"""
import glob, math, os, sys
from collections import defaultdict

import pymupdf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'media/plans/commerce/src')
OUT = os.path.join(ROOT, 'media/plans/commerce')
WALL = '#3B4144'                 # --ink-2
LINE = '#596164'                 # --ink-3
PAD = 60                         # pt вокруг стен: входы, пандусы, эркеры
GLYPH = 7                        # pt: штрихи короче — буквы и цифры подписей
SNAP = .45                       # pt: штрих касается стены или длинной линии
RAMP_PAD = 2.5                   # pt: контур пандуса чуть шире клина
TOUCH = 3                        # pt: штрих дальше от габарита стен — не часть дома
SHORT = 12                       # pt: короткий наружный отрезок у стены — створка двери


def red(c):
    return bool(c) and abs(c[0] - .42) < .05 and c[1] < .1 and c[2] < .1


def black(c):
    return bool(c) and sum(c) < .1


def ends(d):
    for it in d['items']:
        if it[0] == 'l':
            yield it[1]; yield it[2]
        elif it[0] == 'c':
            yield it[1]; yield it[4]


def size(d):
    r = d['rect']
    return max(r.width, r.height)


def line1(d):
    """Единственный отрезок по горизонтали или вертикали: (ось, коорд., от, до)."""
    if len(d['items']) != 1 or d['items'][0][0] != 'l':
        return None
    a, b = d['items'][0][1], d['items'][0][2]
    if abs(a.y - b.y) < .05:
        return ('h', round(a.y, 1), min(a.x, b.x), max(a.x, b.x))
    if abs(a.x - b.x) < .05:
        return ('v', round(a.x, 1), min(a.y, b.y), max(a.y, b.y))
    return None


RAMP_LEN = 25                    # pt: линия клина пандуса не короче
RAMP_ANGLE = 35                  # °: клин острее — дверные створки и марши шире


def wedges(strokes):
    """Рамки клиньев уклона: пары длинных наклонных отрезков с общей точкой."""
    segs = []
    for d in strokes:
        for it in d['items']:
            if it[0] != 'l':
                continue
            a, b = it[1], it[2]
            dx, dy = b.x - a.x, b.y - a.y
            L = math.hypot(dx, dy)
            if L >= RAMP_LEN and abs(dx) > .3 and abs(dy) > .3:
                segs.append((a, b, L))
    out = []
    for i in range(len(segs)):
        for j in range(i + 1, len(segs)):
            a1, b1, l1 = segs[i]
            a2, b2, l2 = segs[j]
            for p, q1 in ((a1, b1), (b1, a1)):
                for r, q2 in ((a2, b2), (b2, a2)):
                    if abs(p.x - r.x) < .6 and abs(p.y - r.y) < .6:
                        cos = ((q1.x - p.x) * (q2.x - r.x) + (q1.y - p.y) * (q2.y - r.y)) / (l1 * l2)
                        if math.degrees(math.acos(max(-1, min(1, cos)))) < RAMP_ANGLE:
                            out.append(pymupdf.Rect(p, p) | q1 | q2)
    return out


def item_ends(it):
    if it[0] == 'l':
        return it[1], it[2]
    if it[0] == 'c':
        return it[1], it[4]
    r = pymupdf.Rect(it[1]) if it[0] == 're' else it[1].rect
    return r.tl, r.br


def inside(p, q, box, n=10):
    """Доля отрезка p–q внутри прямоугольника (по n+1 точкам)."""
    k = 0
    for i in range(n + 1):
        x, y = p.x + (q.x - p.x) * i / n, p.y + (q.y - p.y) * i / n
        k += box.x0 <= x <= box.x1 and box.y0 <= y <= box.y1
    return k / (n + 1)


def segs_of(it):
    """Отрезки элемента пути: линия, хорда кривой, стороны прямоугольника."""
    if it[0] == 'l':
        return [(it[1], it[2])]
    if it[0] == 'c':
        return [(it[1], it[4])]
    if it[0] == 're':
        r = pymupdf.Rect(it[1])
        c = [r.tl, r.tr, r.br, r.bl]
    else:
        q = it[1]
        c = [q.ul, q.ur, q.lr, q.ll]
    return [(c[i], c[(i + 1) % 4]) for i in range(4)]


def seg_dist(pt, a, b):
    dx, dy = b.x - a.x, b.y - a.y
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / L2))
    return math.hypot(pt.x - a.x - t * dx, pt.y - a.y - t * dy)


def house_only(strokes, walls, touch):
    """Дом без благоустройства. Остаётся то, что в основном внутри габарита
    стен, короткие отрезки у стены (створки дверей) и всё, что по цепочке
    примыкает к ним линиями стен, окон и дверей (толщина от 0,8 pt): так
    сохраняются тамбуры и эркеры за линией фасада. Граница участка, контуры
    пандусов, крыльца и приямки нарисованы тонкими линиями — они отпадают."""
    items = []                                    # [номер штриха, элемент, отрезки, толщина]
    for di, d in enumerate(strokes):
        for it in d['items']:
            items.append((di, it, segs_of(it), d['width']))
    keep = [False] * len(items)
    for k, (di, it, sg, w) in enumerate(items):
        p, q = item_ends(it)
        f = inside(p, q, touch)
        if f >= .5 or (f > 0 and math.hypot(q.x - p.x, q.y - p.y) <= SHORT):
            keep[k] = True
    anchor = [s for d in walls for it in d['items'] for s in segs_of(it)]
    CELL = 4.0
    grid = defaultdict(list)
    def cells(a, b):
        for gx in range(int(min(a.x, b.x) // CELL) - 1, int(max(a.x, b.x) // CELL) + 2):
            for gy in range(int(min(a.y, b.y) // CELL) - 1, int(max(a.y, b.y) // CELL) + 2):
                yield gx, gy
    def add(seg):
        for c in cells(*seg):
            grid[c].append(seg)
    for s in anchor:
        add(s)
    for k, (di, it, sg, w) in enumerate(items):
        if keep[k]:
            for s in sg:
                add(s)
    def joined(sg):
        for a, b in sg:
            for pt in (a, b):                     # конец элемента лежит на опорной линии
                for s in grid.get((int(pt.x // CELL), int(pt.y // CELL)), ()):
                    if seg_dist(pt, *s) <= .6:
                        return True
            for c in cells(a, b):                 # конец опорной линии лежит на элементе
                for s in grid.get(c, ()):
                    if seg_dist(s[0], a, b) <= .6 or seg_dist(s[1], a, b) <= .6:
                        return True
        return False
    changed = True
    while changed:
        changed = False
        for k, (di, it, sg, w) in enumerate(items):
            if not keep[k] and w >= .8 and joined(sg):
                keep[k] = True
                changed = True
                for s in sg:
                    add(s)
    out = []
    for di, d in enumerate(strokes):
        kept = [it for k, (dj, it, sg, w) in enumerate(items) if dj == di and keep[k]]
        if not kept:
            continue
        if len(kept) == len(d['items']):
            out.append(d)
            continue
        r = pymupdf.Rect(*item_ends(kept[0]))
        for it in kept:
            for pt in item_ends(it):
                r |= pt
        out.append(dict(d, items=kept, rect=r))
    return out


def path_d(items):
    out, last = [], None
    for it in items:
        if it[0] == 'l':
            p1, p2 = it[1], it[2]
            if last is None or abs(last.x - p1.x) > .01 or abs(last.y - p1.y) > .01:
                out.append('M%.1f %.1f' % (p1.x, p1.y))
            out.append('L%.1f %.1f' % (p2.x, p2.y)); last = p2
        elif it[0] == 'c':
            p1, c1, c2, p2 = it[1], it[2], it[3], it[4]
            if last is None or abs(last.x - p1.x) > .01 or abs(last.y - p1.y) > .01:
                out.append('M%.1f %.1f' % (p1.x, p1.y))
            out.append('C%.1f %.1f %.1f %.1f %.1f %.1f' % (c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)); last = p2
        elif it[0] == 're':
            r = it[1]
            out.append('M%.1f %.1fh%.1fv%.1fh%.1fZ' % (r.x0, r.y0, r.width, r.height, -r.width)); last = None
        elif it[0] == 'qu':
            q = it[1]
            out.append('M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ' % (q.ul.x, q.ul.y, q.ur.x, q.ur.y, q.lr.x, q.lr.y, q.ll.x, q.ll.y)); last = None
    return ''.join(out)


def plan(path):
    page = pymupdf.open(path)[0]
    dr = page.get_drawings()
    walls = [d for d in dr if red(d.get('fill'))]
    if not walls:
        sys.exit('%s: нет стен (тёмно-красной заливки)' % path)
    core = pymupdf.Rect(walls[0]['rect'])
    for d in walls:
        core |= d['rect']
    zone = core + (-PAD, -PAD, PAD, PAD)
    strokes = [d for d in dr if d.get('fill') is None and black(d.get('color')) and (d.get('width') or 0) >= .7
               and zone.contains(d['rect'])]      # рамка листа и штамп — мимо

    # оси: пунктир из отдельных штрихов на одной прямой, уходящей за стены к кружкам
    rows = defaultdict(list)
    for d in strokes:
        s = line1(d)
        if s:
            rows[s[:2]].append((s, d))
    axis = set()
    for (o, _), ss in rows.items():
        lo, hi = min(s[2] for s, _ in ss), max(s[3] for s, _ in ss)
        a0, a1 = (core.x0, core.x1) if o == 'h' else (core.y0, core.y1)
        if len(ss) >= 5 and (lo < a0 - 25 or hi > a1 + 25):
            axis.update(id(d) for _, d in ss)
    strokes = [d for d in strokes if id(d) not in axis]

    # пандусы: уклон в листе нарисован клином — две длинные наклонные линии
    # из одной точки под острым углом (подпись «i=12°» — синим, её нет).
    # Без подписи клин читается как непонятный треугольник, поэтому пандус
    # убирается целиком: клин и всё, что лежит в его рамке (контур пандуса).
    ramps = [r for r in wedges(strokes) if zone.contains(r)]
    def in_ramp(d):
        return any((r + (-RAMP_PAD, -RAMP_PAD, RAMP_PAD, RAMP_PAD)).contains(d['rect']) for r in ramps)
    strokes = [d for d in strokes if not in_ramp(d)]

    # благоустройство вокруг дома (граница участка, контуры пандусов, приямки,
    # крыльца, стрелки входа) — мимо. Решается по каждому отрезку: толстые
    # (стены тамбуров) остаются, если примыкают к габариту стен; тонкие —
    # если в основном внутри габарита или короткие и примыкают (створки дверей).
    touch = core + (-TOUCH, -TOUCH, TOUCH, TOUCH)
    strokes = house_only(strokes, walls, touch)

    # подписи: короткие штрихи, не касающиеся стен и длинных линий
    long_ = [d for d in strokes if size(d) >= GLYPH]
    grid = defaultdict(list)
    for d in long_:
        for p in ends(d):
            grid[(int(p.x), int(p.y))].append(p)
    boxes = [d['rect'] + (-SNAP, -SNAP, SNAP, SNAP) for d in walls]

    def touches(p):
        for gx in (int(p.x) - 1, int(p.x), int(p.x) + 1):
            for gy in (int(p.y) - 1, int(p.y), int(p.y) + 1):
                for q in grid.get((gx, gy), ()):
                    if abs(q.x - p.x) <= SNAP and abs(q.y - p.y) <= SNAP:
                        return True
        return any(b.contains(p) for b in boxes)

    glyphs = [d for d in strokes if size(d) < GLYPH and not any(touches(p) for p in ends(d))]
    gid = set(id(d) for d in glyphs)
    keep = [d for d in strokes if id(d) not in gid]

    # подчёркивания под площадями: горизонталь с буквами прямо над ней
    def underline(d):
        s = line1(d)
        if not s or s[0] != 'h' or not 8 <= s[3] - s[2] <= 80:
            return False
        n = sum(1 for g in glyphs if s[2] - 1 <= (g['rect'].x0 + g['rect'].x1) / 2 <= s[3] + 1
                and s[1] - 9 <= g['rect'].y1 <= s[1] + .3)
        return n >= 3
    keep = [d for d in keep if not underline(d)]

    box = pymupdf.Rect(core)
    for d in keep:
        box |= d['rect']
    box = box + (-6, -6, 6, 6)

    thin, thick = [], []
    for d in keep:
        (thick if d['width'] >= 1.4 else thin).append(path_d(d['items']))
    fill = ''.join(path_d(d['items']) for d in walls)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" fill="none" '
            'stroke-linecap="round" stroke-linejoin="round">'
            '<path stroke="%s" stroke-width=".45" d="%s"/>'
            '<path stroke="%s" stroke-width=".8" d="%s"/>'
            '<path fill="%s" d="%s"/></svg>\n'
            % (box.x0, box.y0, box.width, box.height, LINE, ''.join(thin), WALL, ''.join(thick), WALL, fill))


def main():
    pdfs = sorted(glob.glob(os.path.join(SRC, '*.pdf')))
    if not pdfs:
        sys.exit('нет PDF в media/plans/commerce/src/')
    for p in pdfs:
        name = os.path.splitext(os.path.basename(p))[0]
        svg = plan(p)
        fn = os.path.join(OUT, name + '.svg')
        with open(fn, 'w', encoding='utf-8') as fh:
            fh.write(svg)
        print('%s.svg  %d КБ' % (name, len(svg) // 1024))


if __name__ == '__main__':
    main()
