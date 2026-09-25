#!/bin/sh
# Светлые версии планировок для светлого фона: тёмная бронза вместо светлой,
# ореол подписей под цвет подложки. Запуск из корня репозитория.
set -e
mkdir -p media/plans/light
for f in media/plans/*.svg; do
  sed -e 's/#caae87/#5E4829/g' -e 's/stroke="#101012"/stroke="#F2ECE1"/g' \
      -e 's/fill-opacity=".46"/fill-opacity=".8"/g' -e 's/fill-opacity=".86"/fill-opacity="1"/g' \
      "$f" > "media/plans/light/$(basename "$f")"
done
echo "готово: $(ls media/plans/light | wc -l) файлов"
