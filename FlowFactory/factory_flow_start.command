#!/bin/bash
# Flow Factory — 可搬移背景啟動器
set -u

REPO="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PYTHON="${FLOWFACTORY_PYTHON:-$(command -v python3 || true)}"
PORT="${FLOWFACTORY_PORT:-8765}"
URL="http://127.0.0.1:$PORT/"
DATA_DIR="${FLOWFACTORY_DATA_DIR:-$HOME/.flowfactory/data}"
LOG_DIR="${FLOWFACTORY_LOG_DIR:-$HOME/Library/Logs/FlowFactory}"
STATE_DIR="${FLOWFACTORY_STATE_DIR:-$HOME/.flowfactory/run}"
LOG_FILE="$LOG_DIR/server.log"
PID_FILE="$STATE_DIR/server.pid"

if [ -z "$PYTHON" ]; then
  echo "找不到 Python 3，請先安裝 Python 3。" >&2
  exit 1
fi
mkdir -p "$LOG_DIR" "$STATE_DIR" "$DATA_DIR"

if curl --noproxy '*' -fsS --max-time 3 "$URL" >/dev/null 2>&1; then
  if [ "${FLOWFACTORY_NO_OPEN_BROWSER:-0}" != "1" ] && command -v open >/dev/null 2>&1; then open "$URL"; fi
  echo "Flow Factory 已在執行：$URL"
  exit 0
fi

cd "$REPO" || exit 1
printf '\n[%s] Flow Factory 背景啟動\n' "$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
FLOWFACTORY_DATA_DIR="$DATA_DIR" AUTOMONEY_NO_BROWSER=1 nohup "$PYTHON" "$REPO/server.py" >> "$LOG_FILE" 2>&1 < /dev/null &
SERVER_PID=$!
printf '%s\n' "$SERVER_PID" > "$PID_FILE"

for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  if curl --noproxy '*' -fsS --max-time 2 "$URL" >/dev/null 2>&1; then
    if [ "${FLOWFACTORY_NO_OPEN_BROWSER:-0}" != "1" ] && command -v open >/dev/null 2>&1; then open "$URL"; fi
    echo "Flow Factory 已启动：$URL"
    echo "数据：$DATA_DIR"
    echo "日志：$LOG_FILE"
    exit 0
  fi
  kill -0 "$SERVER_PID" 2>/dev/null || break
  sleep 0.5
done

rm -f "$PID_FILE"
echo "Flow Factory 启动失败，请查看：$LOG_FILE" >&2
exit 1
