#!/usr/bin/env bash
# Выкладка сайта на хостинг reg.ru (u3728646, server27.hosting.reg.ru) по SSH.
# Пароль — reg.ru → Хостинг «Хост-0» u3728646 → «Доступы» → «Доступ в панель управления, SSH, SFTP».
# Использование: bash tools/deploy-regru.sh
set -euo pipefail
cd "$(dirname "$0")/.."

bash tools/build-dist.sh
echo
echo "Загружаю на reg.ru. Когда спросит password — вставьте пароль SSH (при вводе он не виден) и нажмите Enter."
rsync -rlvz -e "ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password,keyboard-interactive" \
  dist/ u3728646@server27.hosting.reg.ru:www/mega-khujand.tj/
echo
echo "Готово: http://mega-khujand.tj"
