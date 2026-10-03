#!/usr/bin/env python3
"""Первые два этажа (торговые помещения) из листов проекта — упрощённая схема.

Листы 1–2 этажей блоков (PDF из ArchiCAD, чистый вектор) лежат в
media/plans/commerce/src/<блок>-<этаж>.pdf: a-1, a-2, b-2, v-1, v-2, g-1, g-2
(буква блока латиницей: а→a, б→b, в→v, г→g). Квартир там нет, макет по ним
не строится; на сайте они — тихий раздел в конце plans.html.

Скрипт перерисовывает каждый лист в SVG без осей, размеров, марок и подписей:
стены и колонны (тёмно-красная заливка листа) — заливкой, перегородки, окна,
двери, лестницы и лифты — линиями, цвета — гипс и графит сайта.
    pip install pymupdf
    python3 tools/commerce-extract.py
Результат: media/plans/commerce/<блок>-<этаж>.svg. Подписи в листах нарисованы
линиями (шрифт ArchiCAD), а не текстом, поэтому площади из экспликации
вписаны в plans.html руками.
"""
import glob, os, sys
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
