#!/usr/bin/env python3
"""Геометрия типового этажа для 3D-макета.

Ключ-план этажа в листах планировок (media/plans/src/*.pdf) — векторный
чертёж ArchiCAD: стены залиты чёрным, окна — белые прямоугольники в проёмах,
двери — тонкие створки и дуги распашки, балконы — большие дуги. Из него
собирается media/model/floor.json в метрах (x вправо, y вверх, центр этажа
в нуле):

  walls     стены (контур и отверстия);
  doors     проёмы дверей: над ними перемычка, у наружных — стекло;
  windows   проёмы окон: подоконник, перемычка, стекло;
  balconies полукруглые балконы: дуга ограждения;
  stair     лестница: прямоугольник маршей и число ступеней;
  lifts     шахты лифтов;
  slab      плита перекрытия;
  flats     квартиры из листов (код, комнатность, площадь, контур).

Масштаб — по площадям квартир из листов (метры на единицу чертежа).
Запуск из корня репозитория:
  pip install pymupdf shapely && python3 tools/model-floor.py
"""
import glob
import json
import math
import os
import re

import pymupdf
from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.validation import make_valid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANS_JS = os.path.join(ROOT, 'js/plans-data.js')
OUT = os.path.join(ROOT, 'media/model/floor.json')


def load_plans():
    src = open(PLANS_JS, encoding='utf-8').read()
    return json.loads(src[src.index('{'):src.rindex(';')])


def bez(p0, p1, p2, p3, n=16):
    out = []
    for k in range(n + 1):
        t = k / n
        out.append(((1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * p1.x + 3 * (1 - t) * t * t * p2.x + t ** 3 * p3.x,
                    (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * p1.y + 3 * (1 - t) * t * t * p2.y + t ** 3 * p3.y))
    return out


def rings(items):
    """Пути рисунка PDF → списки точек (новый список — где путь прерывается)."""
    out, cur = [], []
    for it in items:
        if it[0] == 'l':
            seg = [(it[1].x, it[1].y), (it[2].x, it[2].y)]
        elif it[0] == 'c':
            seg = bez(*it[1:5])
        elif it[0] == 're':
            r = it[1]
            seg = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1), (r.x0, r.y0)]
        elif it[0] == 'qu':
            q = it[1]
            seg = [(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y), (q.ul.x, q.ul.y)]
        else:
            continue
        if cur and math.dist(cur[-1], seg[0]) < 1e-3:
            cur += seg[1:]
        else:
            if len(cur) > 1:
                out.append(cur)
            cur = list(seg)
    if len(cur) > 1:
        out.append(cur)
    return out


def polys_of(geom):
    if geom.is_empty:
        return []
    if geom.geom_type == 'Polygon':
        return [geom]
    return [g for g in getattr(geom, 'geoms', []) if g.geom_type == 'Polygon']


def mrr(p):
    """Длинная и короткая стороны и оси минимального прямоугольника."""
    c = list(p.minimum_rotated_rectangle.exterior.coords)[:4]
    if math.dist(c[0], c[1]) >= math.dist(c[1], c[2]):
        a, b = c[0], c[1]
        ends = [((c[1][0] + c[2][0]) / 2, (c[1][1] + c[2][1]) / 2), ((c[3][0] + c[0][0]) / 2, (c[3][1] + c[0][1]) / 2)]
    else:
        a, b = c[1], c[2]
        ends = [((c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2), ((c[2][0] + c[3][0]) / 2, (c[2][1] + c[3][1]) / 2)]
    L = max(math.dist(c[0], c[1]), math.dist(c[1], c[2]))
    S = min(math.dist(c[0], c[1]), math.dist(c[1], c[2]))
    return L, S, ends


def main():
    plans = load_plans()
    fk = sorted(plans['floors'])[0]
    floor = plans['floors'][fk]
    x0, y0, x1, y1 = floor['box']
    box = pymupdf.Rect(x0, y0, x1, y1)
    sheet = sorted(glob.glob(os.path.join(ROOT, 'media/plans/src/*.pdf')))[0]
    page = pymupdf.open(sheet)[0]
    dr = [d for d in page.get_drawings() if box.contains(pymupdf.Rect(d['rect']).tl)]

    # масштаб: метры на единицу чертежа — по площадям квартир из листов
    def kpoly(s):
        v = [float(x) for x in re.findall(r'-?[\d.]+', s)]
        return Polygon(list(zip(v[0::2], v[1::2])))
    ks = [math.sqrt(p['area'] / kpoly(p['key']).area) for p in plans['list'] if p.get('key')]
    K = sum(ks) / len(ks)
    U = lambda m: m / K

    black, white, arcs, strokes = [], [], [], []
    for d in dr:
        if d['type'] == 'f':
            if d['fill'] and tuple(round(c, 2) for c in d['fill']) == (1.0, 0.47, 0.47):
                continue                     # подсветка квартиры в листе
            for r in rings(d['items']):
                if len(r) < 3:
                    continue
                p = make_valid(Polygon(r))
                for q in polys_of(p):
                    (black if d['fill'][0] < 0.1 else white).append(q)
        elif d['type'] == 's':
            curved = any(i[0] == 'c' for i in d['items'])
            for r in rings(d['items']):
                if curved:
                    arcs.append(LineString(r))
                else:
                    for a, b in zip(r, r[1:]):
                        if math.dist(a, b) > 1e-3:
                            strokes.append(LineString([a, b]))

    walls = unary_union(black)
    wall_list = polys_of(walls)
    wtree = STRtree(wall_list)

    # окна — прямоугольники в толщину стены; створки дверей — тонкие
    windows_raw, leaves = [], []
    for w in white:
        L, S, _ = mrr(w)
        if S * K >= 0.12 and L * K >= 0.4:
            windows_raw.append(w)
        elif S * K < 0.12 and L * K >= 0.3:
            leaves.append(w)
    big = [a for a in arcs if math.dist(a.coords[0], a.coords[-1]) * K > 1.6]
    small = [a for a in arcs if math.dist(a.coords[0], a.coords[-1]) * K <= 1.6]

    # торцы стен с наружной нормалью
    faces = []
    for p in wall_list:
        for ring in [p.exterior] + list(p.interiors):
            cs = list(ring.coords)
            for a, b in zip(cs, cs[1:]):
                el = math.dist(a, b)
                if not (U(0.06) <= el <= U(0.8)):
                    continue
                dx, dy = (b[0] - a[0]) / el, (b[1] - a[1]) / el
                n = (dy, -dx)
                mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
                if p.buffer(1e-6).contains(Point(mid[0] + n[0] * 0.05, mid[1] + n[1] * 0.05)):
                    n = (-n[0], -n[1])
                faces.append({'a': a, 'b': b, 'mid': mid, 'n': n, 'd': (dx, dy), 'seg': LineString([a, b])})
    ftree = STRtree([f['seg'] for f in faces])
    wbuf = walls.buffer(U(0.03))

    def near_faces(pt, r):
        P = Point(pt)
        return [faces[i] for i in ftree.query(P.buffer(r)) if faces[i]['seg'].distance(P) <= r]

    def sweep(f, maxd):
        """Проём: торец стены, протянутый до стены напротив."""
        mid, n = f['mid'], f['n']
        ray = LineString([(mid[0] + n[0] * 0.02, mid[1] + n[1] * 0.02), (mid[0] + n[0] * U(maxd), mid[1] + n[1] * U(maxd))])
        best = None
        for j in wtree.query(ray):
            x = ray.intersection(wall_list[j])
            if not x.is_empty:
                dd = Point(mid).distance(x)
                best = dd if best is None or dd < best else best
        if best is None or best < U(0.25):
            return None
        a, b = f['a'], f['b']
        dx, dy = f['d']
        A = (a[0] + dx * 0.01, a[1] + dy * 0.01)
        B = (b[0] - dx * 0.01, b[1] - dy * 0.01)
        rect = Polygon([A, B, (B[0] + n[0] * best, B[1] + n[1] * best), (A[0] + n[0] * best, A[1] + n[1] * best)])
        if rect.buffer(-0.04).intersects(walls):
            return None
        cs = list(rect.exterior.coords)
        for i in (1, 3):
            side = LineString([cs[i], cs[i + 1]])
            if side.intersection(wbuf).length > 0.3 * side.length:
                return None                  # прямоугольник лёг вдоль стены — это не проём
        return rect

    found = []
    for w in leaves:
        _, _, ends = mrr(w)
        pts = list(ends)
        for a in small:
            for k in (0, -1):
                if any(math.dist(a.coords[k], q) < U(0.06) for q in ends):
                    pts.append(a.coords[-1] if k == 0 else a.coords[0])
        for q in pts:
            for f in near_faces(q, U(0.12)):
                r = sweep(f, 1.7)
                if r is not None:
                    found.append(('door', r))
    for w in windows_raw:
        _, _, ends = mrr(w)
        for q in ends:
            for f in near_faces(q, U(0.15)):
                r = sweep(f, 3.5)
                if r is not None and r.intersection(w).area > 0.2 * w.area:
                    found.append(('window', r))
    openings = []
    for kind, r in sorted(found, key=lambda t: (t[0] != 'window', -t[1].area)):
        if any(r.intersection(o[1]).area > 0.4 * min(r.area, o[1].area) for o in openings):
            continue
        openings.append((kind, r))

    # плита: стены с закрытыми проёмами, без внутренних пустот
    closed = unary_union([walls] + [r for _, r in openings]).buffer(U(0.35)).buffer(-U(0.35))
    outline = max(polys_of(closed), key=lambda p: p.area)
    slab = Polygon(outline.exterior)

    # балконы: большие дуги снаружи плиты, концы — у стены
    balconies = []
    for a in big:
        cs = list(a.coords)
        poly = make_valid(Polygon(cs + [cs[0]]))
        if poly.area <= 0:
            continue
        mid = a.interpolate(0.5, normalized=True)
        if slab.contains(mid):
            continue
        balconies.append(cs)

    # лестница: параллельные проступи одной длины с ровным шагом
    free = [s for s in strokes if not s.within(walls.buffer(U(0.02)))]
    horiz = [s for s in free if abs(s.coords[0][1] - s.coords[1][1]) < 1e-3 and 0.9 <= s.length * K <= 3.6]
    groups = {}
    for s in horiz:
        xs = sorted((s.coords[0][0], s.coords[1][0]))
        key = (round(xs[0] / U(0.08)), round(xs[1] / U(0.08)))
        groups.setdefault(key, []).append((s.coords[0][1], xs))
    stair = None
    for key, g in groups.items():
        ys = sorted(set(round(y, 2) for y, _ in g))
        if len(ys) < 6:
            continue
        steps = [b - a for a, b in zip(ys, ys[1:])]
        st = sorted(steps)[len(steps) // 2]
        if not (0.2 <= st * K <= 0.4):
            continue
        xs = g[0][1]
        if stair is None or len(ys) > stair['n']:
            stair = {'x0': xs[0], 'x1': xs[1], 'y0': ys[0], 'y1': ys[-1], 'n': len(ys), 'step': st}

    # лифты: пары диагоналей крест-накрест
    diag = [s for s in free if abs(s.coords[0][0] - s.coords[1][0]) > 1e-3 and abs(s.coords[0][1] - s.coords[1][1]) > 1e-3 and s.length * K > 1.2]
    lifts = []
    used = set()
    for i, a in enumerate(diag):
        for j, b in enumerate(diag):
            if j <= i or i in used or j in used or not a.crosses(b):
                continue
            bb = a.union(b).envelope
            if 1.0 <= math.sqrt(bb.area) * K <= 3.0:
                lifts.append(list(bb.exterior.bounds if False else bb.bounds))
                used.update((i, j))

    # квартиры из листов
    flats = {}
    for p in plans['list']:
        if p.get('key'):
            flats[p['id']] = {'code': p['code'], 'rooms': p['rooms'], 'area': p['area'], 'poly': list(kpoly(p['key']).exterior.coords)[:-1]}

    # в метры: x вправо, y вверх, центр плиты в нуле
    cx, cy = slab.centroid.x, slab.centroid.y
    M = lambda pt: [round((pt[0] - cx) * K, 4), round(-(pt[1] - cy) * K, 4)]

    def ring(cs):
        return [M(p) for p in list(cs)[:-1]] if math.dist(cs[0], cs[-1]) < 1e-6 else [M(p) for p in cs]

    def opening(kind, r):
        cs = list(r.exterior.coords)[:4]
        ext = r.buffer(U(0.12)).intersects(slab.exterior)
        return {'quad': [M(p) for p in cs], 'outer': bool(ext)}

    data = {
        'source': os.path.relpath(sheet, ROOT),
        'floor': fk,
        'scale': round(K, 6),
        'size': [round((slab.bounds[2] - slab.bounds[0]) * K, 3), round((slab.bounds[3] - slab.bounds[1]) * K, 3)],
        'walls': [{'outer': ring(p.exterior.coords), 'holes': [ring(h.coords) for h in p.interiors]} for p in wall_list],
        'doors': [opening(k, r) for k, r in openings if k == 'door'],
        'windows': [opening(k, r) for k, r in openings if k == 'window'],
        'balconies': [[M(p) for p in b] for b in balconies],
        'stair': None if not stair else {
            'box': [M((stair['x0'], stair['y0'])), M((stair['x1'], stair['y1']))],
            'treads': stair['n'], 'step': round(stair['step'] * K, 3)},
        'lifts': [[M((b[0], b[1])), M((b[2], b[3]))] for b in lifts],
        'slab': ring(slab.exterior.coords),
        'flats': {k: dict(v, poly=[M(p) for p in v['poly']]) for k, v in flats.items()},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    print('scale %.4f m/unit · floor %.1f × %.1f m · walls %d · doors %d · windows %d · balconies %d · stair %s · lifts %d · flats %d'
          % (K, data['size'][0], data['size'][1], len(data['walls']), len(data['doors']), len(data['windows']),
             len(data['balconies']), 'yes' if stair else 'no', len(lifts), len(flats)))


if __name__ == '__main__':
    main()
