#!/usr/bin/env bash
# Собирает dist/ — только то, что нужно сайту (без заметок, исходников и рендеров).
# Использование: bash tools/build-dist.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Ход строительства: фото из media/progress/<дата>/ → js/progress-data.js
if [ -x .venv/bin/python ]; then .venv/bin/python tools/progress.py; else python3 tools/progress.py || echo "progress.py не запустился — ход строительства без новых фото" >&2; fi

rm -rf dist
mkdir -p dist/media

# Файлы из корня: страницы и служебные файлы
cp ./*.html dist/
for f in favicon.svg favicon-32.png apple-touch-icon.png robots.txt _headers; do
  [ -f "$f" ] || { echo "Нет обязательного файла: $f" >&2; exit 1; }
  cp "$f" dist/
done
[ -f sitemap.xml ] && cp sitemap.xml dist/ || true
[ -f _redirects ] && cp _redirects dist/ || true

# Папки целиком
RS=(rsync -a --exclude='.DS_Store')
for d in css js fonts; do
  "${RS[@]}" "$d/" "dist/$d/"
done
for d in opt light plans map; do
  "${RS[@]}" "media/$d/" "dist/media/$d/"
done
# Гипсовый макет — без сырых рендеров
"${RS[@]}" --exclude='/raw/' media/model/ dist/media/model/

# Фото хода строительства и документы застройщика (если есть)
[ -d media/progress/web ] && "${RS[@]}" media/progress/web/ dist/media/progress/web/ || true
[ -d media/docs ] && "${RS[@]}" media/docs/ dist/media/docs/ || true

# Картинка для превью ссылок
cp media/og.jpg dist/media/og.jpg

echo "dist готов: $(find dist -type f | wc -l | tr -d ' ') файлов, $(du -sh dist | cut -f1)"
