#!/bin/bash
set -u

REPO="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PORT="${FLOWFACTORY_PORT:-8765}"
URL="http://127.0.0.1:$PORT/"
DATA_DIR="${FLOWFACTORY_DATA_DIR:-$HOME/.flowfactory/data}"
PYTHON="${FLOWFACTORY_PYTHON:-$(command -v python3 || true)}"

if [ -z "$PYTHON" ]; then
  echo "找不到 Python 3。" >&2
  exit 1
fi
# 啟用保活時，若目前已有手動啟動的服務，先作為監看程序等待；
# 服務一旦離線便由 launchd 接管，避免更新或異常退出後無人重啟。
while curl --noproxy '*' -fsS --max-time 3 "$URL" >/dev/null 2>&1; do
  sleep 2
done
cd "$REPO" || exit 1
exec env FLOWFACTORY_DATA_DIR="$DATA_DIR" FLOWFACTORY_PORT="$PORT" AUTOMONEY_NO_BROWSER=1 "$PYTHON" "$REPO/server.py"
