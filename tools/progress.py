#!/usr/bin/env python3
"""Ход строительства: фото из папок media/progress/<ГГГГ-ММ-ДД>/ → сайт.

Как добавить съёмку (код править не нужно):
  1. создать папку с датой съёмки: media/progress/2026-11-15/
  2. положить туда фото (JPG/PNG/WebP, любое число);
  3. по желанию — файл stage.txt одной строкой: текущий этап
     («Монолитные работы на 12-м этаже блока А»);
  4. запустить .venv/bin/python tools/progress.py (его же запускает
     tools/build-dist.sh перед публикацией).
Скрипт уменьшает фото (media/progress/web/) и пишет js/progress-data.js;
блок «Ход строительства» на главной появляется сам, свежая съёмка — первой.
"""
import glob
import json
import os
import re

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'media/progress')
WEB = os.path.join(SRC, 'web')
JS = os.path.join(ROOT, 'js/progress-data.js')


def main():
    sets = []
    for d in sorted(glob.glob(os.path.join(SRC, '*')), reverse=True):
        date = os.path.basename(d)
        if not os.path.isdir(d) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
            continue
        stage = ''
        if os.path.exists(os.path.join(d, 'stage.txt')):
            stage = open(os.path.join(d, 'stage.txt'), encoding='utf-8').read().strip()
        photos = []
        for f in sorted(glob.glob(os.path.join(d, '*'))):
            if not re.search(r'\.(jpe?g|png|webp)$', f, re.I):
                continue
            im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
            base = '%s-%s' % (date, re.sub(r'[^\w-]+', '-', os.path.splitext(os.path.basename(f))[0]))
            os.makedirs(WEB, exist_ok=True)
            out = {}
            for w in (640, 1600):
                r = im.copy()
                r.thumbnail((w, w * 2), Image.LANCZOS)
                fn = os.path.join(WEB, '%s-%d.webp' % (base, w))
                r.save(fn, 'WEBP', quality=78, method=6)
                out[w] = (os.path.relpath(fn, ROOT), r.size)
            photos.append({'src': out[640][0], 'full': out[1600][0], 'w': out[640][1][0], 'h': out[640][1][1]})
        if photos:
            sets.append({'date': date, 'stage': stage, 'photos': photos})
    with open(JS, 'w', encoding='utf-8') as fh:
        fh.write('/* Сгенерировано tools/progress.py из media/progress/<дата>/ — не править вручную. */\n')
        fh.write('window.MK_PROGRESS = ' + json.dumps(sets, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('съёмок:', len(sets), '· фото:', sum(len(s['photos']) for s in sets))


if __name__ == '__main__':
    main()
