#!/usr/bin/env python3
"""Свет в окнах на вечернем рендере корпуса 2.

Каждая плоскость фасада (калибровка FACADE в js/data.js) выпрямляется
в прямоугольник. В нём окна стоят ровной сеткой: колонки окон размечены
вручную по выпрямленным плоскостям (COLUMNS ниже — по одной на стояк),
а ряды по этажам подбираются по картинке для каждой колонки отдельно.
Из этой сетки собираются:

  media/opt/facade-night-dark-{640,1280,1920}.{avif,webp} + -1280.jpg
      рендер, где окна, горевшие на картинке, выключены: в начале
      сцены дом тёмный, свет потом зажигается только в свободных квартирах;
  media/light/dusk-plate-{1200,2400}.webp
      прозрачный слой с тёплым светом во всех окнах сетки: рамы —
      тёмным силуэтом, у каждой квартиры своя температура и яркость,
      вокруг стекла — лёгкий ореол;
  js/facade-light.js
      четырёхугольник окна для каждой ячейки «секция:этаж:стояк»
      и полоса каждого этажа — в координатах рендера 2400×1339.

Запуск из корня репозитория:
  pip install pillow numpy scipy && python3 tools/facade-light.py
"""
import json
import os
import random
import re

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'media/renders/facade-night-dusk-elevation.jpg')
OPT = os.path.join(ROOT, 'media/opt')
LIGHT = os.path.join(ROOT, 'media/light')
DATA = os.path.join(ROOT, 'js/data.js')
OUT_JS = os.path.join(ROOT, 'js/facade-light.js')
STAMP = '2026-10-01T00:00:00.000Z'

# Выпрямленная плоскость: ширина × высота в пикселях и колонки окон слева
# направо (x0, x1 в этих пикселях; p — окно в простенке, s — витраж).
# Колонок столько же, сколько стояков в секции (js/data.js).
PLANES = {
    1: {'size': (700, 2000), 'cols': [(35, 65, 'p'), (108, 145, 'p'), (225, 262, 'p'), (300, 355, 's'),
                                      (400, 455, 's'), (488, 528, 'p'), (627, 660, 'p')]},
    2: {'size': (800, 2200), 'cols': [(0, 22, 'p'), (30, 105, 's'), (175, 220, 'p'), (265, 335, 's'),
                                      (380, 452, 's'), (488, 530, 'p'), (638, 682, 'p'), (765, 800, 's')]},
    3: {'size': (600, 2000), 'cols': [(170, 198, 'p'), (280, 315, 'p'), (340, 390, 's'), (425, 475, 's'),
                                      (515, 545, 'p'), (585, 600, 'p')]},
}

# Стекло, которое видно в плоскости, но не принадлежит её стоякам (угол
# соседней грани): огни рендера там только гасим, свет не зажигаем.
OFF_ONLY = {3: [(36, 108)]}

# тёплый свет за шторами: от лампы накаливания до тёплой белой
PALETTE = [(1.0, 0.80, 0.56), (1.0, 0.84, 0.62), (1.0, 0.77, 0.50), (1.0, 0.87, 0.68), (1.0, 0.82, 0.60)]


def read_facade():
    """Плоскости вечернего ракурса и этажи секций — из js/data.js."""
    src = open(DATA, encoding='utf-8').read()
    m = re.search(r"k: 'dusk'.*?corp: (\d+), planes: \[(.*?)\n\s*\] \}", src, re.S)
    corp = int(m.group(1))
    planes = {}
    for pm in re.finditer(r"sect: (\d+), padU: [\d.]+, padV: [\d.]+, q: (\[\[.*?\]\])", m.group(2)):
        planes[int(pm.group(1))] = json.loads(pm.group(2))
    bm = re.search(r"\{ k: %d, name: 'Корпус %d', sec: \[(.*?)\n\s*\] \}" % (corp, corp), src, re.S)
    secs = {}
    for sm in re.finditer(r"\{ i: (\d+), from: (\d+), to: (\d+), st: \[(.*?)\] \}", bm.group(1)):
        secs[int(sm.group(1))] = {'from': int(sm.group(2)), 'to': int(sm.group(3)),
                                  'cols': len(re.findall(r"'(\w)'", sm.group(4)))}
    return planes, secs


def persp(dst, src):
    """Коэффициенты перспективы: точка dst → точка src (как ждёт PIL)."""
    A, B = [], []
    for (x, y), (X, Y) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); B.append(X)
        A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); B.append(Y)
    return np.linalg.solve(np.array(A, float), np.array(B, float))


def apply(c, x, y):
    a, b, cc, d, e, f, g, h = c
    w = g * x + h * y + 1
    return ((a * x + b * y + cc) / w, (d * x + e * y + f) / w)


def lattice(prof, pd):
    """Шаг, высота и сдвиг окон в колонке: окна отличаются от стены локальным контрастом."""
    best = None
    n = len(prof)
    mean = prof.mean()
    for p in np.arange(pd * 0.95, pd * 1.05, 0.5):
        for hf in (0.5, 0.55, 0.6, 0.65):
            h = p * hf
            for ph in np.arange(0, p, 1.0):
                ins = [prof[int(ph + k * p):int(min(n, ph + k * p + h))].mean()
                       for k in range(int((n - ph) // p) + 1) if min(n, ph + k * p + h) - (ph + k * p) > 5]
                sc = np.mean(ins) - mean
                if best is None or sc > best[0]:
                    best = (sc, p, h, ph)
    return best[1:]


def main():
    quads, secs = read_facade()
    src = Image.open(SRC).convert('RGB')
    W, H = src.size
    plate = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    off = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cells, floors = {}, {}

    for s, spec in PLANES.items():
        sc = secs[s]
        assert len(spec['cols']) == sc['cols'], 'секция %d: колонок окон %d, стояков %d' % (s, len(spec['cols']), sc['cols'])
        RW, RH = spec['size']
        rect = [(0, 0), (RW, 0), (RW, RH), (0, RH)]
        r2i = persp(rect, quads[s])          # выпрямленная → рендер
        i2r = persp(quads[s], rect)          # рендер → выпрямленная
        a = np.asarray(src.transform((RW, RH), Image.PERSPECTIVE, r2i, Image.BICUBIC)).astype(np.float32) / 255
        lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
        rel = lum / (ndi.gaussian_filter(lum, 14) + 1e-3)
        dev = np.abs(rel - 1)
        pd = RH / (sc['to'] - sc['from'] + 1)

        lat = {}
        for j, (x0, x1, kind) in enumerate(spec['cols']):
            if kind == 'p':
                q = (x1 - x0) // 4
                lat[j] = lattice(dev[:, x0 + q:x1 - q].mean(1), pd)

        L = np.zeros((RH, RW, 3), np.float32)
        A = np.zeros((RH, RW), np.float32)
        O = np.zeros((RH, RW, 3), np.float32)
        OA = np.zeros((RH, RW), np.float32)
        gl = np.median(a[(rel < 0.8) & (lum < 0.25)], axis=0)
        bands = {}

        # окна каждой колонки; ряд — по центру окна, общий для всех колонок
        ref = min(lat)
        P = float(np.median([v[0] for v in lat.values()]))
        y_ref = lat[ref][2] + lat[ref][1] / 2
        wins = []
        for j, (x0, x1, kind) in enumerate(spec['cols']):
            if kind == 'p':
                p, h, ph = lat[j]
            else:
                # витраж — по рядам ближайшей колонки с окнами, на высоту этажа без перекрытий
                near = min(lat, key=lambda t: abs(sum(spec['cols'][t][:2]) - x0 - x1))
                p, h0, ph0 = lat[near]
                h = p * 0.82
                ph = ph0 + h0 / 2 - h / 2
            k = -1
            while ph + k * p < RH:
                y0, y1 = ph + k * p, ph + k * p + h
                k += 1
                if y1 <= 0 or y1 > RH + 0.12 * h:
                    continue
                r = int(round(((y0 + y1) / 2 - y_ref) / P))
                core = rel[int(max(0, y0)) + 3:int(min(RH, y1)) - 3, int(x0) + 3:int(x1) - 3]
                dark = float((core < 0.85).mean()) if core.size else 0.0
                wins.append({'j': j, 'kind': kind, 'x0': x0, 'x1': x1, 'y0': y0, 'y1': min(y1, RH), 'p': p, 'r': r, 'dark': dark})
        # ряд — этаж, если в нём заметная доля тёмного стекла (карниз короны — нет)
        rows_ok = {}
        for w in wins:
            if w['kind'] == 'p':
                rows_ok.setdefault(w['r'], []).append(w['dark'] > 0.3)
        valid = {r for r, v in rows_ok.items() if np.mean(v) >= 0.4 and r >= 0}
        r_bot = max(r for r in valid if all(w['y1'] <= RH for w in wins if w['r'] == r and w['kind'] == 'p'))
        for w in wins:
            if w['r'] not in valid or w['r'] > r_bot:
                continue
            f = sc['from'] + (r_bot - w['r'])
            if f >= sc['to']:
                continue                           # верхний этаж — корона с пентхаусами
            j, x0, x1, y0, y1 = w['j'], w['x0'], w['x1'], w['y0'], w['y1']
            key = '%d:%d:%d' % (s, f, j)
            cells[key] = [[round(v, 1) for v in apply(r2i, x, y)] for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
            bands.setdefault(f, []).append(((y0 + y1) / 2, w['p']))
            paint(L, A, O, OA, a, lum, rel, gl, key, int(x0), int(y0), int(round(x1)), int(round(y1)), w['kind'], w['p'])

        for x0, x1 in OFF_ONLY.get(s, []):
            P0 = float(np.median([w['p'] for w in wins]))
            for r in sorted(valid):
                c = y_ref + r * P
                if 0 < c < RH:
                    paint(np.zeros_like(L), np.zeros_like(A), O, OA, a, lum, rel, gl, 'off', x0, int(c - P0 * 0.41), x1, int(c + P0 * 0.41), 's', P0)

        floors[s] = {}
        for f, lst in bands.items():
            yc = float(np.median([v[0] for v in lst]))
            p = float(np.median([v[1] for v in lst]))
            floors[s][f] = [[round(v, 1) for v in apply(r2i, x, y)] for x, y in ((0, yc - p / 2), (RW, yc - p / 2), (RW, yc + p / 2), (0, yc + p / 2))]

        lay = Image.fromarray((np.concatenate([L.clip(0, 1), A[..., None]], -1) * 255).astype(np.uint8), 'RGBA')
        plate.alpha_composite(lay.transform((W, H), Image.PERSPECTIVE, i2r, Image.BICUBIC))
        lay = Image.fromarray((np.concatenate([O.clip(0, 1), OA[..., None]], -1) * 255).astype(np.uint8), 'RGBA')
        off.alpha_composite(lay.transform((W, H), Image.PERSPECTIVE, i2r, Image.BICUBIC))

    # ореол: свет чуть ложится на раму и камень вокруг стекла
    pa = np.asarray(plate).astype(np.float32) / 255
    al = pa[..., 3]
    ga = ndi.gaussian_filter(al, 2.4)
    gc = np.stack([ndi.gaussian_filter(pa[..., i] * al, 2.4) for i in range(3)], -1) / (ga[..., None] + 1e-4)
    out_a = np.maximum(al, np.clip(ga * 0.5, 0, 1))
    out_c = np.where(al[..., None] > 0.5, pa[..., :3], gc).clip(0, 1)
    plate = Image.fromarray((np.concatenate([out_c, out_a[..., None]], -1) * 255).astype(np.uint8), 'RGBA')

    os.makedirs(LIGHT, exist_ok=True)
    for w in (1200, 2400):
        p = plate if w == W else plate.resize((w, round(H * w / W)), Image.LANCZOS)
        fn = os.path.join(LIGHT, 'dusk-plate-%d.webp' % w)
        p.save(fn, 'WEBP', quality=84, method=6)
        prov(fn, 'Origin: computed by tools/facade-light.py from media/renders/facade-night-dusk-elevation.jpg (a pre-existing project render): warm interior light synthesised inside the windows of the render; not generated by Impeccable.')

    dark = Image.alpha_composite(src.convert('RGBA'), off).convert('RGB')
    for w in (640, 1280, 1920):
        p = dark.resize((w, round(H * w / W)), Image.LANCZOS)
        base = os.path.join(OPT, 'facade-night-dark-%d' % w)
        p.save(base + '.avif', 'AVIF', quality=60)
        p.save(base + '.webp', 'WEBP', quality=78, method=6)
        if w == 1280:
            p.save(base + '.jpg', 'JPEG', quality=80, optimize=True, progressive=True)
        for ext in ('.avif', '.webp'):
            prov(base + ext, 'Origin: computed by tools/facade-light.py from media/renders/facade-night-dusk-elevation.jpg (a pre-existing project render): windows lit in the render switched off; not generated by Impeccable.')

    with open(OUT_JS, 'w', encoding='utf-8') as fh:
        fh.write('/* Сгенерировано tools/facade-light.py — не править вручную.\n'
                 '   Вечерний рендер 2400×1339: cells — окно ячейки «секция:этаж:стояк»,\n'
                 '   floors — полоса этажа по секциям; точки tl, tr, br, bl. */\n')
        fh.write('window.MK_LIGHT = ' + json.dumps({'dusk': {
            'w': W, 'h': H, 'base': 'media/opt/facade-night-dark', 'plate': 'media/light/dusk-plate',
            'cells': cells, 'floors': floors}}, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('windows:', len(cells))


def paint(L, A, O, OA, a, lum, rel, gl, key, x0, y0, x1, y1, kind, pitch):
    """Свет в одном окне (выпрямленные координаты) и «выключенное» окно, если на рендере оно горело."""
    R = random.Random(key)
    col = np.array(PALETTE[R.randrange(len(PALETTE))])
    gain = R.uniform(0.62, 0.86)
    curtains = R.random() < 0.55
    phase = R.random() * 6.28
    y0, x0 = max(0, y0), max(0, x0)
    y1, x1 = min(y1, L.shape[0]), min(x1, L.shape[1])
    sl = (slice(y0, y1), slice(x0, x1))
    hh, ww = y1 - y0, x1 - x0
    if hh < 6 or ww < 4:
        return
    yy = (np.arange(hh)[:, None]) / hh
    xx = np.arange(x0, x1)[None, :]
    prof = 1.0 - 0.34 * yy
    # рамы и импосты — прямые линии: берём профили по столбцам и строкам, а не шум отражений
    rl = rel[sl]
    vp = np.median(rl, axis=0)
    hp = np.median(rl, axis=1)
    fv = np.clip((vp - np.median(vp)) / 0.16, 0, 1)
    fh = np.clip((hp - np.median(hp)) / 0.16, 0, 1)
    frame = np.maximum(fv[None, :], fh[:, None])
    sil = 1 - 0.7 * frame
    st = (0.9 + 0.1 * np.sin(xx * 1.7 + phase)) if curtains else 1.0
    edge = np.ones((hh, ww), np.float32)
    m = 2 if kind == 'p' else 1
    edge[:m, :] = 0.35; edge[-m:, :] = 0.5; edge[:, :m] = 0.45; edge[:, -m:] = 0.45
    val = (prof * sil * st * gain * edge)[..., None] * col[None, None, :]
    L[sl] = val
    A[sl] = 1.0

    # горело ли окно на рендере: тогда гасим его в тёмной основе
    if kind == 's':
        # у витража исходный огонь может стоять не ровно по нашему ряду — берём весь этаж
        c = (y0 + y1) / 2
        y0, y1 = int(max(0, c - pitch * 0.46)), int(min(a.shape[0], c + pitch * 0.46))
        sl = (slice(y0, y1), slice(x0, x1))
    px = a[sl]
    warm = (px[..., 0] - px[..., 2] > 0.07) & (lum[sl] > 0.2) & (lum[sl] < 0.8)
    if warm.mean() > (0.06 if kind == 's' else 0.25):
        ln = np.clip((lum[sl] - np.percentile(lum[sl], 10)) / (np.ptp(lum[sl]) + 1e-3), 0, 1)
        dk = gl[None, None, :] * 0.95 + ((1 - ln) ** 2)[..., None] * 0.08
        if kind == 's':
            mk = ndi.binary_dilation(warm, iterations=2)
            blk, blka = O[sl], OA[sl]
            blk[mk] = dk[mk]
            blka[mk] = 1.0
        else:
            O[sl] = dk
            OA[sl] = 1.0


def prov(fn, text):
    with open(fn + '.json', 'w', encoding='utf-8') as fh:
        json.dump({'prompt': text, 'createdAt': STAMP}, fh, ensure_ascii=False, indent=2)
        fh.write('\n')


if __name__ == '__main__':
    main()
