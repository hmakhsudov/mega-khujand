#!/usr/bin/env python3
"""Карта места: Худжанд вокруг дома (ул. Сырдарьинская, 14) из OpenStreetMap.

    python tools/map-build.py <папка-кэша>            # скачать недостающие куски и собрать
    python tools/map-build.py <папка-кэша> --preview  # плюс <папка-кэша>/preview.html для проверки

Куски карты (~20 МБ XML) качаются с api.openstreetmap.org в папку кэша
(держать вне репозитория). На выходе:
  media/map/khujand.svg — подложка без подписей: река, зелень, дома, улицы, мосты;
  на stdout — координаты меток для index.html (доли u/v кадра, расстояния, углы подписей).
  В index.html (#place) эти числа вписаны руками: номера мест (--u/--v, data-xy), подписи,
  кольца, путь Сырдарьинской (d) и точка дома (1750 850). Подпись улицы сдвинута ближе к дому
  (--u:.565), чтобы оставаться в кадре на телефоне; номер пляжа не ставится — пляж у самого дома,
  его роль играет метка дома.

Данные © участники OpenStreetMap, ODbL — подпись «© OpenStreetMap» на сайте обязательна.
Точка дома — по Google Картам (40.2931909, 69.622398); дом на чётной, южной стороне
улицы (нечётные номера в OSM — на северной), поэтому метка чуть южнее оси улицы.
Нужен shapely (есть в .venv проекта)."""
import json, math, os, sys, time, urllib.request
import xml.etree.ElementTree as ET
from shapely.geometry import LineString, Point, Polygon, MultiLineString, box
from shapely.ops import polygonize, unary_union, linemerge

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAT0, LON0 = 40.2931909, 69.622398           # ул. Сырдарьинская, 14 (Google Карты)
HOUSE = (0, 30)                               # метка дома в метрах от точки: чуть южнее оси улицы
# кадр в метрах, y — на юг; дом в верхней трети, старый город с крепостью и Панджшанбе — внизу
X0, X1, Y0, Y1 = -1750, 2250, -820, 1880
TILES_LON = [69.597, 69.612, 69.627, 69.642]
TILES_LAT = [40.275, 40.285, 40.295]
UA = 'mega-khujand-site-map/1.0 (+https://www.openstreetmap.org/copyright)'

COS = math.cos(math.radians(LAT0))
def xy(la, lo): return ((lo - LON0) * COS * 111320.0, -(la - LAT0) * 110574.0)

def fetch(cache):
    os.makedirs(cache, exist_ok=True)
    for lo in TILES_LON:
        for la in TILES_LAT:
            f = os.path.join(cache, '%.3f-%.3f.osm' % (lo, la))
            if os.path.exists(f) and os.path.getsize(f) > 1000: continue
            url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.3f,%.3f,%.3f,%.3f' % (lo, la, lo + .015, la + .01)
            print('скачиваю', url, file=sys.stderr)
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=120) as r, open(f, 'wb') as o: o.write(r.read())
            time.sleep(1)

def load(cache):
    N, W, R = {}, {}, {}
    for f in sorted(os.listdir(cache)):
        if not f.endswith('.osm'): continue
        r = ET.parse(os.path.join(cache, f)).getroot()
        for n in r.iter('node'):
            N[n.get('id')] = (float(n.get('lat')), float(n.get('lon')), {x.get('k'): x.get('v') for x in n.iter('tag')})
        for w in r.iter('way'):
            W[w.get('id')] = ([x.get('ref') for x in w.iter('nd')], {x.get('k'): x.get('v') for x in w.iter('tag')})
        for rl in r.iter('relation'):
            R[rl.get('id')] = ([(m.get('type'), m.get('ref'), m.get('role')) for m in rl.iter('member')], {x.get('k'): x.get('v') for x in rl.iter('tag')})
    return N, W, R

FRAME = box(X0, Y0, X1, Y1)

def pts(N, nd): return [xy(*N[r][:2]) for r in nd if r in N]

def d_path(geoms, closed):
    """Одна строка d для набора линий или полигонов, целые метры, относительные шаги."""
    out = []
    def ring(cs):
        cs = [(round(x - X0), round(y - Y0)) for x, y in cs]
        dd = []
        for i, (x, y) in enumerate(cs):
            if i == 0: dd.append('M%d %d' % (x, y)); px, py = x, y; continue
            dx, dy = x - px, y - py
            if dx == 0 and dy == 0: continue
            dd.append('l%d %d' % (dx, dy) if i == 1 or not dd[-1].startswith(('l', ' ')) else ' %d %d' % (dx, dy))
            px, py = x, y
        s = ''.join(dd).replace(' -', '-')
        if closed: s += 'z'
        return s
    for g in geoms:
        if g.is_empty: continue
        parts = getattr(g, 'geoms', [g])
        for p in parts:
            if closed:
                if p.geom_type != 'Polygon' or p.area < 4: continue
                out.append(ring(p.exterior.coords))
                for h in p.interiors: out.append(ring(h.coords))
            else:
                if p.geom_type != 'LineString' or p.length < 2: continue
                out.append(ring(p.coords))
    return ''.join(out)

def clipped(g, tol):
    g = g.intersection(FRAME)
    return g.simplify(tol, preserve_topology=True) if not g.is_empty else g

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    cache = sys.argv[1]
    fetch(cache)
    N, W, R = load(cache)

    # ── река: внешние контуры мультиполигона воды + рамка → полигоны; вода — те, где ось реки
    # (ось реки в OSM грубая и местами заходит на берег, поэтому вода — полигоны,
    #  которые в основном лежат в полосе вокруг оси, а острова вычитаются)
    river_lines, islands = [], []
    for rid, (mem, t) in R.items():
        if t.get('natural') == 'water' and t.get('water') == 'river':
            for ty, ref, role in mem:
                if ty != 'way' or ref not in W: continue
                p = pts(N, W[ref][0])
                if role == 'inner' and len(p) > 3: islands.append(Polygon(p).buffer(0))
                elif role == 'outer': river_lines.append(LineString(p))
    axis = [LineString(pts(N, nd)) for nd, t in W.values() if t.get('waterway') == 'river' and len(nd) > 1]
    ext = box(X0 - 400, Y0 - 400, X1 + 400, Y1 + 400)
    polys = list(polygonize(unary_union(river_lines + [ext.exterior])))
    band = unary_union(axis).buffer(220)
    water = [p for p in polys if p.intersection(band).area > .3 * p.area]
    water = unary_union(water).difference(unary_union(islands)) if islands else unary_union(water)
    water = clipped(water, 2.5)

    green, sand, pitch, bld, roads, bridges = [], [], [], [], {}, []
    RW = {'trunk': 'a', 'primary': 'a', 'trunk_link': 'b', 'primary_link': 'b', 'secondary': 'b', 'secondary_link': 'b',
          'tertiary': 'c', 'tertiary_link': 'c', 'unclassified': 'c', 'residential': 'd', 'living_street': 'e',
          'service': 'e', 'pedestrian': 'f', 'footway': 'f', 'path': 'f', 'steps': 'f'}
    syr = []
    for wid, (nd, t) in W.items():
        p = pts(N, nd)
        if len(p) < 2: continue
        closed = nd[0] == nd[-1] and len(p) > 3
        if closed and (t.get('leisure') in ('park', 'garden') or t.get('landuse') in ('grass', 'forest', 'recreation_ground', 'cemetery')
                       or t.get('natural') in ('wood', 'scrub', 'grassland')):
            green.append(Polygon(p).buffer(0))
        elif closed and (t.get('natural') in ('beach', 'sand') or t.get('leisure') == 'beach_resort'):
            sand.append(Polygon(p).buffer(0))
        elif closed and t.get('leisure') in ('pitch', 'stadium'):
            pitch.append(Polygon(p).buffer(0))
        elif closed and 'building' in t:
            q = Polygon(p).buffer(0)
            if q.distance(Point(*HOUSE)) < 1400: bld.append(q)
        hw = t.get('highway')
        if hw in RW and t.get('area') != 'yes':
            L = LineString(p)
            if t.get('bridge') == 'yes' and RW[hw] in 'abc': bridges.append(L)
            roads.setdefault(RW[hw], []).append(L)
            if 'Сирдарё' in (t.get('name') or '') and RW[hw] in 'abc' and L.distance(Point(0, 0)) < 2500: syr.append(L)

    def U(gs, tol): return clipped(unary_union(gs), tol) if gs else None
    layers = {
        'green': U(green, 2), 'sand': U(sand, 2), 'pitch': U(pitch, 2), 'water': water,
        'bld': U([b.simplify(1.2) for b in bld], 1.2),
    }
    road = {k: clipped(linemerge(unary_union(v)) if len(v) > 1 else v[0], 2) for k, v in roads.items()}
    br = clipped(unary_union(bridges), 2) if bridges else None
    # Сырдарьинская в OSM — несколько отрезков с разрывом у перекрёстка: сшиваем с запада на восток
    segs = list(getattr(linemerge(unary_union(syr)), 'geoms', [linemerge(unary_union(syr))]))
    segs = [s if s.coords[0][0] < s.coords[-1][0] else LineString(list(s.coords)[::-1]) for s in segs]
    segs.sort(key=lambda s: s.coords[0][0])
    chain = list(segs[0].coords)
    for s in segs[1:]:
        if Point(chain[-1]).distance(Point(s.coords[0])) < 150: chain += list(s.coords)
    syr_line = clipped(LineString(chain), 1.5)

    Wd, Hd = X1 - X0, Y1 - Y0
    # ширина линий — в метрах кадра
    svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (Wd, Hd, Wd, Hd),
           '<!-- MEGA KHUJAND: Худжанд вокруг ул. Сырдарьинской. Данные © участники OpenStreetMap (ODbL); tools/map-build.py -->',
           '<defs>'
           '<pattern id="g" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2" fill="#353B3F"/><circle cx="10.5" cy="10.5" r="2" fill="#353B3F"/></pattern>'
           '<pattern id="s" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r=".9" fill="#4A5155"/></pattern>'
           '<pattern id="w" width="40" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)"><path d="M0 6h40" stroke="#3A4246" stroke-width="2"/></pattern>'
           '</defs>']
    if layers['green']: svg.append('<path fill="url(#g)" d="%s"/>' % d_path([layers['green']], True))
    if layers['sand']: svg.append('<path fill="url(#s)" d="%s"/>' % d_path([layers['sand']], True))
    if layers['water']:
        dw = d_path([layers['water']], True)
        svg.append('<path fill="#252A2D" d="%s"/><path fill="url(#w)" d="%s"/>' % (dw, dw))
        svg.append('<path fill="none" stroke="#6B7479" stroke-width="3" d="%s"/>' % dw)
    if layers['pitch']: svg.append('<path fill="none" stroke="#2A2F33" stroke-width="2" d="%s"/>' % d_path([layers['pitch']], True))
    if layers['bld']: svg.append('<path fill="#1C2023" d="%s"/>' % d_path([layers['bld']], True))
    svg.append('<g fill="none" stroke-linecap="round" stroke-linejoin="round">')
    style = {'f': ('#22272A', 2.2), 'e': ('#262B2E', 4), 'd': ('#2B3034', 6), 'c': ('#353B3F', 9), 'b': ('#40474C', 12), 'a': ('#4B5358', 16)}
    for k in 'fedcba':
        if k in road and not road[k].is_empty:
            c, w = style[k]
            svg.append('<path stroke="%s" stroke-width="%g" d="%s"/>' % (c, w, d_path([road[k]], False)))
    if br is not None and not br.is_empty:
        svg.append('<path stroke="#121416" stroke-width="26" d="%s"/>' % d_path([br], False))
        svg.append('<path stroke="#6A7378" stroke-width="16" d="%s"/>' % d_path([br], False))
    svg.append('</g></svg>')
    os.makedirs(os.path.join(ROOT, 'media/map'), exist_ok=True)
    out = os.path.join(ROOT, 'media/map/khujand.svg')
    open(out, 'w').write(''.join(svg))
    print('svg', out, os.path.getsize(out), 'байт', file=sys.stderr)

    # ── метки для index.html
    H = Point(*HOUSE)
    def uv(x, y): return round((x - X0) / Wd, 4), round((y - Y0) / Hd, 4)
    def dist(g):
        d = g.distance(H)
        return ('%d м' % (max(50, round(d / 50) * 50))) if d < 950 else ('%s км' % ('%.1f' % (d / 1000)).replace('.', ','))
    def way(name_part, key=None):
        gs = []
        for nd, t in W.values():
            nm = (t.get('name:ru') or '') + '|' + (t.get('name') or '') + '|' + (t.get('name:en') or '')
            if name_part in nm and (key is None or key(t)):
                p = pts(N, nd)
                if len(p) > 2 and nd[0] == nd[-1]: gs.append(Polygon(p).buffer(0))
                elif len(p) > 1: gs.append(LineString(p))
        return unary_union(gs) if gs else None
    fort = way('Худжандская крепость', lambda t: t.get('historic') == 'fort')
    kamol = way('Центральный парк культуры и отдыха имени Камола Худжанди')
    marks = [
        ('l1', 'Городской пляж и набережная', way('Khujand Central Public Beach')),
        ('l2', 'Старый мост', way('«Старый» мост')),
        ('l3', 'Парк имени Рудаки', way('Парк имени Рудаки')),
        ('l4', 'Крепость и парк Камола Худжанди', unary_union([fort, kamol]) if fort and kamol else None),
        ('l5', 'Ботанический сад', way('Ботанический сад')),
        ('l6', 'Рынок Панджшанбе', way('Бозори Панҷшанбе', lambda t: t.get('building'))),
    ]
    res = {'house': uv(*HOUSE), 'ar': round(Wd / Hd, 4), 'marks': [], 'labels': []}
    shore = water.boundary if water is not None and not water.is_empty else None
    for k, name, g in marks:
        if g is None: print('нет в данных:', name, file=sys.stderr); continue
        if k == 'l1' and shore is not None:
            # пляж начинается у самого дома: номер — на кромке воды напротив дома
            from shapely.ops import nearest_points
            c = nearest_points(H, shore)[1]
        elif k == 'l4':
            c = fort.representative_point()
        else:
            c = g.representative_point() if g.geom_type.endswith('Polygon') else g.interpolate(.5, normalized=True)
        res['marks'].append({'k': k, 'name': name, 'uv': uv(c.x, c.y), 'dist': dist(g)})
    if shore is not None: res['water'] = dist(shore)
    # подписи вдоль улиц и реки: средняя точка и угол самого прямого участка в кадре
    def label(text, g, at=.5, flip=False):
        if g is None or g.is_empty: return
        g = g.intersection(box(X0 + 250, Y0 + 150, X1 - 250, Y1 - 150))
        if g.geom_type.startswith('Multi'): g = max(g.geoms, key=lambda s: s.length)
        if g.geom_type == 'Polygon': g = g.exterior
        p = g.interpolate(at, normalized=True)
        a = g.interpolate(max(0, at - .04), normalized=True); b = g.interpolate(min(1, at + .04), normalized=True)
        ang = math.degrees(math.atan2(b.y - a.y, b.x - a.x))
        if ang > 90: ang -= 180
        if ang < -90: ang += 180
        res['labels'].append({'text': text, 'uv': uv(p.x, p.y), 'deg': round(ang, 1)})
    label('ул. Сырдарьинская', syr_line, .62)
    label('Сырдарья', unary_union(axis), .2)
    label('Сырдарья', unary_union(axis), .86)
    label('просп. Исмоила Сомони', way('проспект Исмоила Сомони'), .5)
    res['syr'] = d_path([syr_line], False)
    # кольца расстояний вокруг дома (в единицах кадра) и места для их подписей — на юго-восток
    res['rings'] = [{'r': r, 'text': ('%d м' % r) if r < 1000 else ('%s км' % ('%g' % (r / 1000)).replace('.', ',')),
                     'uv': uv(HOUSE[0] + r * math.cos(math.radians(35)), HOUSE[1] + r * math.sin(math.radians(35)))}
                    for r in (500, 1000, 1500)]
    res['home_xy'] = [HOUSE[0] - X0, HOUSE[1] - Y0]
    for m in res['marks']: m['xy'] = [round(m['uv'][0] * Wd), round(m['uv'][1] * Hd)]
    print(json.dumps(res, ensure_ascii=False, indent=1))

    if '--preview' in sys.argv:
        prev = os.path.join(cache, 'preview.html')
        dots = ''.join('<circle cx="%d" cy="%d" r="26" fill="#EEF0EE"/><text x="%d" y="%d" font-size="30" text-anchor="middle">%s</text>' % (
            m['xy'][0], m['xy'][1], m['xy'][0], m['xy'][1] + 10, m['k'][1:]) for m in res['marks'])
        open(prev, 'w').write(
            '<body style="margin:0;background:#121416"><div style="position:relative">'
            '<img src="file://%s" style="width:100%%;display:block">'
            '<svg viewBox="0 0 %d %d" style="position:absolute;inset:0;width:100%%;height:100%%">'
            '<path d="%s" fill="none" stroke="#EEF0EE" stroke-width="7"/><circle cx="%d" cy="%d" r="20" fill="#EEF0EE"/>%s</svg></div></body>'
            % (out, Wd, Hd, res['syr'], res['home_xy'][0], res['home_xy'][1], dots))
        print('превью', prev, file=sys.stderr)


if __name__ == '__main__':
    main()
