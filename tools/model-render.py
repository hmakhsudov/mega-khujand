#!/usr/bin/env python3
"""Гипсовый макет типового этажа в Blender (Cycles) и кадры для сайта.

Читает media/model/floor.json (tools/model-floor.py) и строит макет:
стены с проёмами дверей и окон, стекло и рамы, полукруглые балконы
с ограждением, лестницу, шахты лифтов, плиту перекрытия. Из четырёх
одинаковых этажей (3–6) собирается стопка для раскладки.

Режимы (python из окружения с модулем bpy):
  final          финальный кадр: основа + свет каждой квартиры отдельным слоем
  close          крупный план каждой квартиры («кукольный домик»)
  seq            80 кадров раскладки для прокрутки
  all            всё перечисленное подряд
  anchors        только подписи этажей по кадрам, без рендера
  close-anchors  только номера комнат на крупных планах, без рендера
  scene          сохранить сцену финального кадра в <папка>/model-floor.blend —
                 открыть в Blender и посмотреть, покрутить, подобрать свет

  pip install bpy==4.5.4 shapely   # Python 3.11
  python tools/model-render.py all /путь/к/сырым   # затем tools/model-pack.py

Считает на видеокарте, если она есть (Metal на Mac с Apple Silicon,
OptiX/CUDA, HIP), иначе на процессоре. MK_DEVICE=CPU — только процессор.
Можно запускать и самим Blender: blender -b -P tools/model-render.py -- all /путь
(тогда shapely нужно поставить в Python внутри Blender).
"""
import json
import math
import os
import sys

import bpy  # первым: модуль bpy подключает bmesh и mathutils
import bmesh
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLOOR = os.path.join(ROOT, 'media/model/floor.json')
OUT = os.path.join(ROOT, 'media/model')

WALL_H = 3.0        # высота стен этажа в макете
SLAB_T = 0.22       # толщина плиты
FTF = WALL_H + SLAB_T
DOOR_H = 2.15
OUTER_DOOR_H = 2.3
SILL = 0.85
HEAD = 2.4
FLOORS = [3, 4, 5, 6]
FURN = os.path.join(ROOT, 'tools/model-furniture.json')

D = json.load(open(FLOOR, encoding='utf-8'))
F = json.load(open(FURN, encoding='utf-8'))


# ── материалы ─────────────────────────────────────────────────────────
def mat(name, rgb, rough=0.85, spec=0.3, metal=0.0, trans=0.0, emit=None, es=0.0, ior=1.45, bevel=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Metallic'].default_value = metal
    b.inputs['Transmission Weight'].default_value = trans
    b.inputs['IOR'].default_value = ior
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = es
    if bevel:
        bv = m.node_tree.nodes.new('ShaderNodeBevel')
        bv.inputs['Radius'].default_value = bevel
        bv.samples = 6
        m.node_tree.links.new(bv.outputs['Normal'], b.inputs['Normal'])
    return m


def materials(look):
    return {
        'plaster': mat('plaster', (0.80, 0.80, 0.78), 0.92, 0.25, bevel=look.get('bevel', 0.012)),
        'top': mat('top', look.get('top', (0.035, 0.037, 0.04)), 0.7, 0.25),
        'slab': mat('slab', look.get('floor', (0.62, 0.62, 0.605)), 0.9, 0.2),
        'edge': mat('edge', (0.74, 0.74, 0.72), 0.9, 0.2, bevel=look.get('bevel', 0.012)),
        'glass': mat('glass', (0.86, 0.91, 0.95), 0.03, 0.5, 0.0, 1.0),
        'frame': mat('frame', (0.03, 0.032, 0.035), 0.45, 0.4, 0.4),
        'void': mat('void', (0.004, 0.004, 0.005), 1.0, 0.0),
        'furn': mat('furn', (0.84, 0.83, 0.81), 0.8, 0.3, bevel=look.get('bevel', 0.012)),
        'screen': mat('screen', (0.012, 0.013, 0.015), 0.25, 0.5),
        'ground': mat('ground', look.get('ground', (0.011, 0.012, 0.013)), 0.42, 0.45),
    }


# ── геометрия ─────────────────────────────────────────────────────────
def clean(ring):
    out = []
    for p in ring:
        if not out or math.dist(out[-1], p) > 1e-4:
            out.append(tuple(p))
    if len(out) > 1 and math.dist(out[0], out[-1]) < 1e-4:
        out.pop()
    return out


def area2(r):
    return sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r))) / 2


def prism(bm, outer, holes, z0, z1, mi=0, top=None, bottom=None):
    """Призма по многоугольнику с отверстиями: дно, крышка, стенки."""
    outer = clean(outer)
    holes = [clean(h) for h in holes if len(clean(h)) >= 3]
    if len(outer) < 3:
        return
    if area2(outer) < 0:
        outer = outer[::-1]
    holes = [h[::-1] if area2(h) > 0 else h for h in holes]
    rings = [outer] + holes
    pts = [p for r in rings for p in r]
    tris = tessellate_polygon([[Vector((x, y, 0)) for x, y in r] for r in rings])
    vb = [bm.verts.new((x, y, z0)) for x, y in pts]
    vt = [bm.verts.new((x, y, z1)) for x, y in pts]
    for a, b, c in tris:
        try:
            f = bm.faces.new((vt[a], vt[b], vt[c])); f.material_index = mi if top is None else top
            f = bm.faces.new((vb[c], vb[b], vb[a])); f.material_index = mi if bottom is None else bottom
        except ValueError:
            pass
    off = 0
    for r in rings:
        n = len(r)
        for i in range(n):
            j = (i + 1) % n
            try:
                f = bm.faces.new((vb[off + i], vb[off + j], vt[off + j], vt[off + i])); f.material_index = mi
            except ValueError:
                pass
        off += n


def box(bm, c, ax, ay, sx, sy, z0, z1, mi):
    """Брус: центр c, оси ax/ay (единичные), размеры sx/sy, высота z0…z1."""
    pts = []
    for u, v in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        pts.append((c[0] + ax[0] * sx / 2 * u + ay[0] * sy / 2 * v, c[1] + ax[1] * sx / 2 * u + ay[1] * sy / 2 * v))
    prism(bm, pts, [], z0, z1, mi)


def quad_axes(q):
    """Длинная ось проёма (вдоль стены) и короткая (толщина)."""
    e1 = (q[1][0] - q[0][0], q[1][1] - q[0][1])
    e2 = (q[2][0] - q[1][0], q[2][1] - q[1][1])
    l1, l2 = math.hypot(*e1), math.hypot(*e2)
    c = (sum(p[0] for p in q) / 4, sum(p[1] for p in q) / 4)
    if l1 >= l2:
        return c, (e1[0] / l1, e1[1] / l1), (e2[0] / l2, e2[1] / l2), l1, l2
    return c, (e2[0] / l2, e2[1] / l2), (e1[0] / l1, e1[1] / l1), l2, l1


def glazing(bm, q, z0, z1, mi_glass, mi_frame):
    c, ax, ay, L, T = quad_axes(q)
    box(bm, c, ax, ay, L, 0.025, z0, z1, mi_glass)
    fw = 0.055
    for u in (-0.5, 0.5):
        box(bm, (c[0] + ax[0] * (L / 2 - fw / 2) * u * 2, c[1] + ax[1] * (L / 2 - fw / 2) * u * 2), ax, ay, fw, 0.07, z0, z1, mi_frame)
    if L > 1.1:
        n = 2 if L < 2.2 else 3
        for k in range(1, n):
            t = -L / 2 + L * k / n
            box(bm, (c[0] + ax[0] * t, c[1] + ax[1] * t), ax, ay, 0.045, 0.07, z0, z1, mi_frame)
    box(bm, c, ax, ay, L, 0.07, z0, z0 + fw, mi_frame)
    box(bm, c, ax, ay, L, 0.07, z1 - fw, z1, mi_frame)


def to_obj(bm, name, mats, coll):
    me = bpy.data.meshes.new(name)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = False
    return ob


def stair_geometry(bm, mi):
    """Двухмаршевая лестница: найденный марш и второй рядом, площадка у верха."""
    s = D.get('stair')
    if not s:
        return
    (ax, ay), (bx, by) = s['box']
    x0, x1 = sorted((ax, bx))
    y0, y1 = sorted((ay, by))
    n = max(8, s['treads'] + 1)
    w = x1 - x0
    gap = 0.12
    # второй марш — с той стороны, где в лестничной клетке есть место
    from shapely.geometry import Polygon, Point, box as sbox
    from shapely.ops import unary_union
    walls = unary_union([Polygon(clean(wl['outer']), [clean(h) for h in wl['holes']]).buffer(0) for wl in D['walls']])
    right = sbox(x1 + gap, y0, x1 + gap + w, y1)
    left = sbox(x0 - gap - w, y0, x0 - gap, y1)
    second = right if right.intersection(walls).area < left.intersection(walls).area else left
    sx0, sy0, sx1, sy1 = second.bounds
    rise = WALL_H / 2 / n
    run = (y1 - y0) / n
    for i in range(n):
        # первый марш поднимается к площадке (к большему y)
        prism(bm, [(x0, y0 + run * i), (x1, y0 + run * i), (x1, y0 + run * (i + 1)), (x0, y0 + run * (i + 1))], [], 0, rise * (i + 1), mi)
        # второй — от площадки обратно вниз по плану, вверх по высоте
        prism(bm, [(sx0, y1 - run * (i + 1)), (sx1, y1 - run * (i + 1)), (sx1, y1 - run * i), (sx0, y1 - run * i)], [], 0, WALL_H / 2 + rise * (i + 1), mi)
    lx0, lx1 = min(x0, sx0), max(x1, sx1)
    land = sbox(lx0, y1, lx1, y1 + 1.25).difference(walls)
    for p in getattr(land, 'geoms', [land]):
        if p.geom_type == 'Polygon' and p.area > 0.2:
            prism(bm, list(p.exterior.coords), [], 0, WALL_H / 2, mi)


# ── мебель по 3D-видам из листов ──────────────────────────────────────
def room_rects():
    """Комнаты квартир из model-furniture.json, уточнённые по граням стен."""
    from shapely.geometry import Point, Polygon, box as sbox
    from shapely.ops import unary_union
    walls = unary_union([Polygon(clean(w['outer']), [clean(h) for h in w['holes']]).buffer(0) for w in D['walls']])
    ops = unary_union([Polygon(o['quad']).buffer(0.01) for o in D['doors'] + D['windows']])
    free = Polygon(D['slab']).buffer(0).difference(unary_union([walls, ops]))
    faces = [g for g in getattr(free, 'geoms', [free]) if g.area > 0.2]
    out = {}
    for fid, spec in F.items():
        if fid.startswith('_'):
            continue
        src = F[spec['mirror']] if 'mirror' in spec else spec
        rooms = []
        for i, r in enumerate(spec['rooms']):
            x0, y0, x1, y1 = r['room']
            seed = Point((x0 + x1) / 2, (y0 + y1) / 2)
            face = next((f for f in faces if f.contains(seed)), None)
            if face is not None:
                clip = face.intersection(sbox(x0 - 0.35, y0 - 0.35, x1 + 0.35, y1 + 0.35))
                bx = clip.bounds
                # грань стены точнее ручной оценки, но не дальше 0,35 м от неё
                x0, y0, x1, y1 = bx
            items = src['rooms'][i].get('items', [])
            rooms.append({'name': r['name'], 'rect': (x0, y0, x1, y1), 'items': items, 'mirror': 'mirror' in spec})
        out[fid] = rooms
    return out


FLIP = {'e': 'w', 'w': 'e', 'n': 'n', 's': 's'}


def furniture(bm, rooms, mi_furn, mi_screen, mi_glass):
    def rect(R, it, mirror):
        x0, y0, x1, y1 = R
        u0, u1 = it['u']
        if mirror:
            u0, u1 = 1 - u1, 1 - u0
        v0, v1 = it['v']
        w, h = x1 - x0, y1 - y0
        return [x0 + w * u0 + (0.02 if u0 == 0 else 0), y0 + h * v0 + (0.02 if v0 == 0 else 0),
                x0 + w * u1 - (0.02 if u1 == 1 else 0), y0 + h * v1 - (0.02 if v1 == 1 else 0)]

    lift = [0.0]

    def blk(a, b, c, d, z0, z1, mi=None):
        if c - a < 0.005 or d - b < 0.005 or z1 - z0 < 0.002:
            return
        # угловые диваны и столешницы перекрываются: совпавшие грани
        # Cycles рисует чёрными пятнами, поэтому у каждого предмета своя высота
        z0, z1 = (z0 + lift[0] if z0 > 0 else z0), z1 + lift[0]
        prism(bm, [(a, b), (c, b), (c, d), (a, d)], [], z0, z1, mi_furn if mi is None else mi)

    def edge(r, side, t):
        """Полоса толщиной t вдоль стороны side прямоугольника r."""
        a, b, c, d = r
        return {'w': (a, b, a + t, d), 'e': (c - t, b, c, d), 's': (a, b, c, b + t), 'n': (a, d - t, c, d)}[side]

    def rest(r, side, t):
        a, b, c, d = r
        return {'w': (a + t, b, c, d), 'e': (a, b, c - t, d), 's': (a, b + t, c, d), 'n': (a, b, c, d - t)}[side]

    for room in rooms:
        R, mirror = room['rect'], room['mirror']
        for k, it in enumerate(room['items']):
            lift[0] = 0.004 * (k % 5)
            r = rect(R, it, mirror)
            side = it.get('side', 's')
            if mirror:
                side = ''.join(FLIP[c] for c in side)
            sd = side[0]
            t = it['t']
            a, b, c, d = r
            if t == 'counter':
                blk(*rest(r, FLIP[sd] if sd in 'ew' else {'n': 's', 's': 'n'}[sd], 0.03), 0, 0.86)
                blk(a, b, c, d, 0.86, 0.9)
            elif t == 'tall':
                blk(a, b, c, d, 0, 2.0)
            elif t == 'wardrobe':
                blk(a, b, c, d, 0, 2.15)
            elif t in ('console', 'night'):
                blk(a, b, c, d, 0, 0.5)
            elif t == 'bench':
                blk(a, b, c, d, 0, 0.45)
            elif t == 'ottoman':
                blk(a, b, c, d, 0, 0.42)
            elif t == 'tv':
                blk(*edge(r, sd, 0.045), 0.95, 1.62, mi_screen)
            elif t == 'sofa':
                blk(*rest(r, sd, 0.2), 0, 0.42)
                blk(*edge(r, sd, 0.2), 0, 0.8)
            elif t == 'armchair':
                blk(*rest(r, sd, 0.16), 0, 0.42)
                blk(*edge(r, sd, 0.16), 0, 0.8)
                for o in (('n', 's') if sd in 'ew' else ('e', 'w')):
                    blk(*edge(r, o, 0.1), 0, 0.6)
            elif t == 'bed':
                blk(*rest(r, sd, 0.08), 0, 0.28)
                m = rest(rest(r, sd, 0.08), FLIP[sd] if sd in 'ew' else {'n': 's', 's': 'n'}[sd], 0.03)
                blk(m[0] + (0.03 if sd in 'ns' else 0), m[1] + (0.03 if sd in 'ew' else 0), m[2] - (0.03 if sd in 'ns' else 0), m[3] - (0.03 if sd in 'ew' else 0), 0.28, 0.52)
                blk(*edge(r, sd, 0.08), 0, 1.1)
                # две подушки у изголовья
                hx = edge(rest(r, sd, 0.12), sd, 0.36)
                if sd in 'ew':
                    mid = (hx[1] + hx[3]) / 2
                    blk(hx[0], hx[1] + 0.08, hx[2], mid - 0.04, 0.52, 0.64)
                    blk(hx[0], mid + 0.04, hx[2], hx[3] - 0.08, 0.52, 0.64)
                else:
                    mid = (hx[0] + hx[2]) / 2
                    blk(hx[0] + 0.08, hx[1], mid - 0.04, hx[3], 0.52, 0.64)
                    blk(mid + 0.04, hx[1], hx[2] - 0.08, hx[3], 0.52, 0.64)
            elif t == 'table':
                blk(a, b, c, d, 0.72, 0.76)
                for x, y in ((a + 0.07, b + 0.07), (c - 0.12, b + 0.07), (a + 0.07, d - 0.12), (c - 0.12, d - 0.12)):
                    blk(x, y, x + 0.05, y + 0.05, 0, 0.72)
            elif t == 'ctable':
                blk(a, b, c, d, 0.36, 0.41)
                blk(a + 0.06, b + 0.06, c - 0.06, d - 0.06, 0, 0.36)
            elif t == 'chair':
                blk(a, b, c, d, 0.42, 0.47)
                blk(*edge(r, sd, 0.05), 0.47, 0.9)
                for x, y in ((a + 0.02, b + 0.02), (c - 0.06, b + 0.02), (a + 0.02, d - 0.06), (c - 0.06, d - 0.06)):
                    blk(x, y, x + 0.04, y + 0.04, 0, 0.42)
            elif t == 'desk':
                blk(a, b, c, d, 0.72, 0.75)
                for o in (('n', 's') if sd in 'ew' else ('e', 'w')):
                    blk(*edge(r, o, 0.04), 0, 0.72)
            elif t == 'toilet':
                blk(*edge(r, sd, 0.17), 0, 0.78)
                bw = rest(r, sd, 0.17)
                inset = 0.04
                blk(bw[0] + (inset if sd in 'ns' else 0), bw[1] + (inset if sd in 'ew' else 0), bw[2] - (inset if sd in 'ns' else 0), bw[3] - (inset if sd in 'ew' else 0), 0, 0.4)
            elif t == 'sink':
                blk(a, b, c, d, 0, 0.85)
            elif t == 'shower':
                blk(a, b, c, d, 0, 0.05)
                for o in 'nsew':
                    if o not in side:
                        blk(*edge(r, o, 0.012), 0.05, 2.0, mi_glass)
            elif t == 'plant':
                cx, cy = (a + c) / 2, (b + d) / 2
                rr = min(c - a, d - b) / 2
                blk(cx - rr * 0.55, cy - rr * 0.55, cx + rr * 0.55, cy + rr * 0.55, 0, 0.42)
                res = bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=9, radius=rr)
                for v in res['verts']:
                    v.co.z += 0.78
                    v.co.x += cx
                    v.co.y += cy
                for f in {f for v in res['verts'] for f in v.link_faces}:
                    f.material_index = mi_furn
                    f.smooth = True


def build_floor(M, name='floor'):
    """Один этаж в собственной коллекции; z=0 — чистый пол."""
    coll = bpy.data.collections.new(name)
    # стены: бока — гипс, срез — свой материал
    bm = bmesh.new()
    for wl in D['walls']:
        prism(bm, wl['outer'], wl['holes'], 0, WALL_H, 0, top=1, bottom=0)
    for o in D['doors']:
        h = OUTER_DOOR_H if o['outer'] else DOOR_H
        prism(bm, o['quad'], [], h, WALL_H, 0, top=1, bottom=0)
    for o in D['windows']:
        prism(bm, o['quad'], [], 0, SILL, 0, top=0, bottom=0)
        prism(bm, o['quad'], [], HEAD, WALL_H, 0, top=1, bottom=0)
    to_obj(bm, name + '_walls', [M['plaster'], M['top']], coll)
    # плита и балконы
    bm = bmesh.new()
    prism(bm, D['slab'], [], -SLAB_T, 0, 1, top=0, bottom=1)
    for b in D['balconies']:
        prism(bm, b, [], -SLAB_T, -0.02, 1, top=0, bottom=1)
    to_obj(bm, name + '_slab', [M['slab'], M['edge']], coll)
    # остекление и рамы
    bm = bmesh.new()
    for o in D['windows']:
        glazing(bm, o['quad'], SILL, HEAD, 0, 1)
    for o in D['doors']:
        if o['outer']:
            glazing(bm, o['quad'], 0, OUTER_DOOR_H, 0, 1)
    to_obj(bm, name + '_glass', [M['glass'], M['frame']], coll)
    # ограждения балконов: графитовый поручень и частые стойки — как штриховка на чертеже
    bm = bmesh.new()
    for b in D['balconies']:
        pts = clean(b)
        acc = 0.0
        for a, c in zip(pts, pts[1:]):
            L = math.dist(a, c)
            if L < 0.02:
                continue
            ax = ((c[0] - a[0]) / L, (c[1] - a[1]) / L)
            ay = (-ax[1], ax[0])
            mid = ((a[0] + c[0]) / 2, (a[1] + c[1]) / 2)
            box(bm, mid, ax, ay, L + 0.03, 0.045, 1.0, 1.05, 0)
            box(bm, mid, ax, ay, L + 0.03, 0.03, 0.08, 0.12, 0)
            t = (0.14 - acc) % 0.14
            while t < L:
                box(bm, (a[0] + ax[0] * t, a[1] + ax[1] * t), ax, ay, 0.022, 0.022, 0.1, 1.0, 0)
                t += 0.14
            acc = (acc + L) % 0.14
    to_obj(bm, name + '_rail', [M['frame']], coll)
    # лестница и шахты лифтов
    bm = bmesh.new()
    stair_geometry(bm, 0)
    to_obj(bm, name + '_stair', [M['plaster']], coll)
    bm = bmesh.new()
    for fid, rooms in ROOMS.items():
        furniture(bm, rooms, 0, 1, 2)
    to_obj(bm, name + '_furn', [M['furn'], M['screen'], M['glass']], coll)
    bm = bmesh.new()
    for (ax, ay), (bx, by) in D['lifts']:
        x0, x1 = sorted((ax, bx))
        y0, y1 = sorted((ay, by))
        prism(bm, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], [], 0.0, 0.012, 0)
    to_obj(bm, name + '_lift', [M['void']], coll)
    return coll


# ── сцена ─────────────────────────────────────────────────────────────
ROOMS = {}


def scene_base(look):
    global ROOMS
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ROOMS = room_rects()
    sc = bpy.context.scene
    M = materials(look)
    floor = build_floor(M)
    plates = {}
    for i, f in enumerate(FLOORS):
        e = bpy.data.objects.new('plate_%d' % f, None)
        e.instance_type = 'COLLECTION'
        e.instance_collection = floor
        e.location = (0, 0, i * FTF)
        sc.collection.objects.link(e)
        plates[f] = e
    # основание витрины
    bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, -SLAB_T - 0.002))
    g = bpy.context.object
    g.name = 'ground'
    g.data.materials.append(M['ground'])
    # мир
    w = bpy.data.worlds.new('room')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*look.get('world', (0.006, 0.0068, 0.008)), 1)
    bg.inputs[1].default_value = 1.0
    return sc, M, floor, plates


def light(name, kind, loc, target, energy, size=1.0, color=(1, 1, 1), group=None, shape='DISK'):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == 'AREA':
        ld.size = size
        ld.shape = shape
    elif kind in ('POINT', 'SPOT'):
        ld.shadow_soft_size = size
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    if target is not None:
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if group:
        ob.lightgroup = group
    return ob


def studio(look):
    """Свет витрины: большой мягкий ключ сверху-слева, заполнение и контровой."""
    k = look.get('key', 1.0)
    light('key', 'AREA', (-22, -26, 34), (0, 0, 0), 26000 * k, 26, (1.0, 0.97, 0.93), 'env')
    light('fill', 'AREA', (30, -6, 16), (0, 0, 0), 5200 * k, 30, (0.86, 0.92, 1.0), 'env')
    light('rim', 'AREA', (8, 34, 22), (0, 0, 0), 7000 * k, 22, (0.95, 0.96, 1.0), 'env')
    bpy.context.scene.world.lightgroup = 'env'


WARM = (1.0, 0.62, 0.32)


def flat_lights(plate_z, energy=11.0, only=None):
    """Тёплый свет в квартирах из листов: по лампе в центре каждой комнаты
    (в больших — две), мощность по площади. Каждая квартира — своя группа света."""
    vl = bpy.context.view_layer
    out = {}
    for fid, rooms in ROOMS.items():
        if only and fid not in only:
            continue
        if fid not in vl.lightgroups:
            vl.lightgroups.add(name=fid)
        ls = []
        for k, room in enumerate(rooms):
            x0, y0, x1, y1 = room['rect']
            w, h = x1 - x0, y1 - y0
            area = w * h
            n = 2 if max(w, h) > 4.6 else 1
            for j in range(n):
                if n == 1:
                    x, y = (x0 + x1) / 2, (y0 + y1) / 2
                elif w > h:
                    x, y = x0 + w * (j + 0.5) / 2, (y0 + y1) / 2
                else:
                    x, y = (x0 + x1) / 2, y0 + h * (j + 0.5) / 2
                ls.append(light('L_%s_%d_%d' % (fid, k, j), 'POINT', (x, y, plate_z + 2.5), None, energy * area / n, 0.45, WARM, fid))
        out[fid] = ls
    return out


def camera(name='cam', lens=60):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_end = 2000
    ob = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.scene.camera = ob
    return ob


def aim(cam, az, el, dist, target=(0, 0, 0)):
    """Камера по азимуту и углу над горизонтом, смотрит в target."""
    t = Vector(target)
    a, e = math.radians(az), math.radians(el)
    cam.location = t + Vector((math.cos(e) * math.sin(a), -math.cos(e) * math.cos(a), math.sin(e))) * dist
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()


_DEVICE = []


def gpu():
    """Включить видеокарту для Cycles, если она есть: Metal (Mac на Apple
    Silicon), OptiX/CUDA (NVIDIA), HIP (AMD), oneAPI (Intel)."""
    if _DEVICE:
        return _DEVICE[0]
    kind = 'CPU'
    if os.environ.get('MK_DEVICE', '').upper() != 'CPU':
        try:
            prefs = bpy.context.preferences.addons['cycles'].preferences
            for t in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
                try:
                    prefs.compute_device_type = t
                except TypeError:
                    continue
                prefs.get_devices()
                devs = [d for d in prefs.devices if d.type == t]
                if devs:
                    for d in prefs.devices:
                        d.use = d.type == t
                    kind = t
                    break
        except Exception as e:      # нет модуля cycles или настроек — считаем на CPU
            print('GPU недоступна:', e)
    print('Cycles:', kind)
    _DEVICE.append(kind)
    return kind


def render_setup(w, h, spp, look):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU' if gpu() == 'CPU' else 'GPU'
    sc.cycles.samples = spp
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = look.get('noise', 0.03)
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 3
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 4
    sc.cycles.transparent_max_bounces = 4
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = look.get('agx', 'AgX - Medium High Contrast')
    sc.view_settings.exposure = look.get('exposure', 0.0)
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '8'
    sc.render.use_persistent_data = True


def dof(cam, focus, fstop):
    cam.data.dof.use_dof = fstop > 0
    if fstop > 0:
        cam.data.dof.focus_distance = (cam.location - Vector(focus)).length
        cam.data.dof.aperture_fstop = fstop


def render(path):
    sc = bpy.context.scene
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


# ── раскладка: этажи расходятся, верхние улетают, камера спускается к этажу ──
def smooth(t):
    t = 0.0 if t < 0 else 1.0 if t > 1 else t
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = 0.0 if t < 0 else 1.0 if t > 1 else t
    return 1 - (1 - t) ** 3


FINAL = {'az': -32.0, 'el': 54.0, 'dist': 80.0, 'target': (0.0, 0.6, 0.0)}
CLOSE_LOOK = {'key': 0.42, 'top': (0.07, 0.075, 0.08)}


def pose(t):
    """Положение этажей и камеры в момент t ∈ [0, 1]."""
    g = 4.6 * smooth(t / 0.34)
    z = []
    for i in range(len(FLOORS)):
        lift = 0.0 if i == 0 else (smooth((t - 0.34) / 0.42) ** 1.5) * (52 + 14 * i)
        z.append(i * (FTF + g) + lift)
    k1 = smooth(t / 0.34)                    # первая фаза: стопка раскрывается
    k2 = smooth((t - 0.30) / 0.70)           # вторая: камера идёт к этажу
    az = -56 + (FINAL['az'] + 56) * smooth(t)
    el = 12 + 16 * k1 + (FINAL['el'] - 28) * k2
    dist = 98 + 14 * k1 + (FINAL['dist'] - 112) * k2
    zc = 1.5 * (FTF + g) + 1.2
    tx, ty, tz = FINAL['target']
    target = (tx * k2, ty * k2, zc + (tz - zc) * k2)
    return z, az, el, dist, target


def place(plates, cam, t):
    z, az, el, dist, target = pose(t)
    for i, f in enumerate(FLOORS):
        plates[f].location = (0, 0, z[i])
    aim(cam, az, el, dist, target)
    bpy.context.view_layer.update()
    return target


def project(cam, pts):
    """Точки мира → доли кадра (x вправо, y вниз)."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    out = []
    for p in pts:
        co = world_to_camera_view(sc, cam, Vector(p))
        out.append([round(co.x, 4), round(1 - co.y, 4)])
    return out


def plate_marks(cam, zs):
    """Подписи этажей: самая левая на экране точка контура плиты на середине
    высоты стен — табличка встаёт слева от плиты, не закрывая её."""
    out = []
    for z in zs:
        pr = project(cam, [(x, y, z + 1.5) for x, y in D['slab']])
        out.append(min(pr, key=lambda q: q[0]))
    return out


def run_seq(n, w, h, spp, look, outdir, frames=None, fstop=0.7):
    sc, M, floor, plates = scene_base(look)
    studio(look)
    cam = camera(lens=50)
    render_setup(w, h, spp, look)
    os.makedirs(outdir, exist_ok=True)
    anchors = []
    for i in range(n):
        t = i / (n - 1)
        target = place(plates, cam, t)
        dof(cam, target, fstop)
        z = pose(t)[0]
        anchors.append(plate_marks(cam, z))
        if frames is not None and i not in frames:
            continue
        path = os.path.join(outdir, 'f%03d.png' % i)
        if os.path.exists(path) and os.environ.get('MK_SKIP_DONE'):
            continue
        render(path)
    return anchors


def final_pass(w, h, spp, look, outdir):
    """Финальный кадр раскладки: основа и свет каждой квартиры отдельно.
    Группы света Cycles → в композиторе основа + квартира, каждый слой
    очищается от шума (Denoise с альбедо и нормалями)."""
    sc, M, floor, plates = scene_base(look)
    vl = bpy.context.view_layer
    vl.lightgroups.add(name='env')
    studio(look)
    cam = camera(lens=50)
    place(plates, cam, 1.0)
    dof(cam, FINAL['target'], look.get('fstop', 0.7))
    flat_lights(0, energy=look.get('energy', 11.0))
    render_setup(w, h, spp, look)
    vl.cycles.denoising_store_passes = True
    sc.use_nodes = True
    nt = sc.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    rl = nt.nodes.new('CompositorNodeRLayers')
    comp = nt.nodes.new('CompositorNodeComposite')
    nt.links.new(rl.outputs['Image'], comp.inputs['Image'])
    fo = nt.nodes.new('CompositorNodeOutputFile')
    fo.base_path = outdir
    fo.format.file_format = 'PNG'
    fo.format.color_depth = '16'
    fo.file_slots.clear()

    def denoised(src):
        dn = nt.nodes.new('CompositorNodeDenoise')
        dn.prefilter = 'ACCURATE'
        nt.links.new(src, dn.inputs['Image'])
        nt.links.new(rl.outputs['Denoising Normal'], dn.inputs['Normal'])
        nt.links.new(rl.outputs['Denoising Albedo'], dn.inputs['Albedo'])
        return dn.outputs['Image']
    base = denoised(rl.outputs['Combined_env'])
    fo.file_slots.new('base')
    nt.links.new(base, fo.inputs['base'])
    for fid in ROOMS:
        add = nt.nodes.new('CompositorNodeMixRGB')
        add.blend_type = 'ADD'
        add.inputs[0].default_value = 1.0
        nt.links.new(rl.outputs['Combined_env'], add.inputs[1])
        nt.links.new(rl.outputs['Combined_' + fid], add.inputs[2])
        fo.file_slots.new('lit_' + fid)
        nt.links.new(denoised(add.outputs[0]), fo.inputs['lit_' + fid])
    render(os.path.join(outdir, 'final-combined.png'))
    # контуры квартир для наведения: комнаты на половине высоты стен
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    flats = {}
    for fid, rooms in ROOMS.items():
        quads = []
        for room in rooms:
            x0, y0, x1, y1 = room['rect']
            q = project(cam, [(x0, y0, 1.5), (x1, y0, 1.5), (x1, y1, 1.5), (x0, y1, 1.5)])
            quads.append(Polygon(q).buffer(0.004))
        u = unary_union(quads).simplify(0.0015)
        parts = [g for g in getattr(u, 'geoms', [u]) if g.geom_type == 'Polygon']
        xs = [(r['rect'][0] + r['rect'][2]) / 2 for r in rooms]
        ys = [(r['rect'][1] + r['rect'][3]) / 2 for r in rooms]
        flats[fid] = {'poly': [[[round(x, 4), round(y, 4)] for x, y in list(p.exterior.coords)[:-1]] for p in parts],
                      'label': project(cam, [(sum(xs) / len(xs), sum(ys) / len(ys), 3.3)])[0]}
    return flats


def close_camera(fid, w, h, look):
    """Камера крупного плана: квартира целиком, сверху под углом."""
    rooms = ROOMS[fid]
    xs = [v for r in rooms for v in (r['rect'][0], r['rect'][2])]
    ys = [v for r in rooms for v in (r['rect'][1], r['rect'][3])]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    size = max(max(xs) - min(xs), (max(ys) - min(ys)) * w / h * 0.75)
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = w, h
    cam = camera(lens=50)
    aim(cam, look.get('az', -28), look.get('el', 60), size * look.get('k', 2.9), (cx, cy, 0.4))
    bpy.context.view_layer.update()
    return cam, (cx, cy)


def close_rooms(cam, fid, z=2.0):
    """Номера помещений: центр комнаты на высоте 2 м — номер встаёт внутри
    проёма комнаты в кадре; у пола его закрыла бы ближняя стена санузла."""
    return [{'name': r['name'], 'at': project(cam, [((r['rect'][0] + r['rect'][2]) / 2, (r['rect'][1] + r['rect'][3]) / 2, z)])[0]}
            for r in ROOMS[fid]]


def close_pass(fid, w, h, spp, look, outdir):
    """Крупный план квартиры: свет только в ней, мебель, подписи комнат."""
    sc, M, floor, plates = scene_base(look)
    studio(look)
    for f in FLOORS[1:]:
        plates[f].hide_render = True
    flat_lights(0, energy=look.get('energy', 8.0), only=[fid])
    cam, (cx, cy) = close_camera(fid, w, h, look)
    dof(cam, (cx, cy, 0.4), look.get('fstop', 0.9))
    render_setup(w, h, spp, look)
    render(os.path.join(outdir, 'close-%s.png' % fid))
    return close_rooms(cam, fid)


def save_scene(outdir):
    """Сцена финального кадра как .blend: свет квартир включён, верхние
    этажи сняты — открыть в Blender и смотреть в режиме Rendered."""
    sc, M, floor, plates = scene_base({})
    studio({})
    cam = camera(lens=50)
    place(plates, cam, float(os.environ.get('MK_T', 1.0)))
    dof(cam, FINAL['target'], 0.7)
    flat_lights(0)
    render_setup(1920, 1080, 160, {})
    path = os.path.join(outdir, 'model-floor.blend')
    bpy.ops.wm.save_as_mainfile(filepath=path)
    print('saved', path)


if __name__ == '__main__':
    # python tools/model-render.py all /путь  или  blender -b -P tools/model-render.py -- all /путь
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    mode = args[0] if args else 'final'
    outdir = os.path.abspath(args[1] if len(args) > 1 else os.path.join(OUT, 'raw'))
    os.makedirs(outdir, exist_ok=True)
    meta_path = os.path.join(outdir, 'meta.json')
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    if mode in ('final', 'all'):
        meta['final'] = {'w': 1920, 'h': 1080, 'flats': final_pass(1920, 1080, 160, {'fstop': 0.7}, outdir)}
        json.dump(meta, open(meta_path, 'w'))
    if mode in ('close', 'all'):
        meta.setdefault('close', {})
        for fid in ROOMS or room_rects():
            meta['close'][fid] = {'w': 1600, 'h': 1200, 'rooms': close_pass(fid, 1600, 1200, 128, CLOSE_LOOK, outdir)}
            json.dump(meta, open(meta_path, 'w'))
    if mode == 'close-anchors':
        # только номера помещений на крупных планах, без рендера
        scene_base(CLOSE_LOOK)
        for fid in ROOMS:
            cam, _ = close_camera(fid, 1600, 1200, CLOSE_LOOK)
            meta.setdefault('close', {}).setdefault(fid, {'w': 1600, 'h': 1200})['rooms'] = close_rooms(cam, fid)
        json.dump(meta, open(meta_path, 'w'))
    if mode == 'anchors':
        # только подписи этажей по кадрам, без рендера
        n = int(os.environ.get('MK_FRAMES', 80))
        meta.setdefault('seq', {'n': n, 'w': 1440, 'h': 810, 'floors': FLOORS})
        meta['seq']['anchors'] = run_seq(n, 1440, 810, 44, {}, os.path.join(outdir, 'seq'), frames=[])
        json.dump(meta, open(meta_path, 'w'))
    if mode in ('seq', 'all'):
        n = int(os.environ.get('MK_FRAMES', 80))
        anchors = run_seq(n, 1440, 810, 44, {}, os.path.join(outdir, 'seq'))
        meta['seq'] = {'n': n, 'w': 1440, 'h': 810, 'floors': FLOORS, 'anchors': anchors}
        json.dump(meta, open(meta_path, 'w'))
    if mode == 'scene':
        save_scene(outdir)
    print('done', mode)
