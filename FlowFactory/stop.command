#!/bin/bash
set -u

PID_FILE="${FLOWFACTORY_STATE_DIR:-$HOME/.flowfactory/run}/server.pid"
if [ ! -f "$PID_FILE" ]; then
  echo "Flow Factory 目前没有执行。"
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"
if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Flow Factory 已停止。"
else
  echo "Flow Factory 目前没有执行。"
fi
rm -f "$PID_FILE"
