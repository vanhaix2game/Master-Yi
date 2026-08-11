#!/bin/sh
set -eu

INSTALL_ROOT="${FLOWFACTORY_INSTALL_ROOT:-$HOME/.flowfactory}"
BIN_DIR="${FLOWFACTORY_BIN_DIR:-$HOME/.local/bin}"
PURGE=0
if [ "${1:-}" = "--purge" ]; then PURGE=1; fi

case "$INSTALL_ROOT" in ""|/|"$HOME") echo "拒绝卸载不安全的安装目录：$INSTALL_ROOT" >&2; exit 1 ;; esac

if [ -x "$INSTALL_ROOT/current/stop.command" ]; then
  "$INSTALL_ROOT/current/stop.command" || true
fi

AUTOSTART_PLIST="$HOME/Library/LaunchAgents/com.gda.flowfactory.plist"
if [ -f "$AUTOSTART_PLIST" ]; then
  launchctl bootout "gui/$(id -u)/com.gda.flowfactory" >/dev/null 2>&1 || true
  rm -f "$AUTOSTART_PLIST"
fi

if [ "$PURGE" -eq 1 ]; then
  printf '这会删除程序、设置、工作流和 Token。输入 DELETE 确认：'
  read -r answer
  [ "$answer" = "DELETE" ] || { echo "已取消。"; exit 0; }
  rm -rf "$INSTALL_ROOT"
  echo "Flow Factory 程序与用户数据已删除。"
else
  rm -rf "$INSTALL_ROOT/versions" "$INSTALL_ROOT/current" "$INSTALL_ROOT/run"
  echo "Flow Factory 程序已删除，用户数据保留在：$INSTALL_ROOT/data"
fi
rm -f "$BIN_DIR/flowfactory"
