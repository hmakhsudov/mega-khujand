#!/bin/sh
# Светлые версии планировок для гипсовых подложек: графитовые стены вместо
# светлых, ореол подписей под цвет гипса. Запуск из корня репозитория.
set -e
mkdir -p media/plans/light
for f in media/plans/*.svg; do
  sed -e 's/#D9DDDA/#2B3033/g' -e 's/stroke="#121416"/stroke="#EEF0EE"/g' \
      -e 's/fill-opacity=".46"/fill-opacity=".86"/g' \
      "$f" > "media/plans/light/$(basename "$f")"
done
echo "готово: $(ls media/plans/light | wc -l) файлов"
