#!/bin/bash
# Локальный сервер для сайта. Двойной клик — откроется в браузере.
cd "$(dirname "$0")" || exit 1
PORT=8811
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
open "http://127.0.0.1:$PORT/index.html"
echo "Сайт открыт: http://127.0.0.1:$PORT/index.html"
echo "Чтобы остановить сервер — закройте это окно."
trap 'kill $SRV 2>/dev/null' EXIT
wait $SRV
