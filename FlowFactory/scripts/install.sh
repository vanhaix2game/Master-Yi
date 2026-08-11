#!/bin/sh
# Flow Factory installer from Cloudflare Pages for macOS and Linux.
set -eu

UPDATE_BASE_URL="${FLOWFACTORY_UPDATE_BASE_URL:-https://flowfactory-updates.pages.dev}"
TELEMETRY_URL="${FLOWFACTORY_TELEMETRY_URL:-https://flowfactory-license.gavinlo3692.workers.dev/v1/telemetry/install}"
INSTALL_ROOT="${FLOWFACTORY_INSTALL_ROOT:-$HOME/.flowfactory}"
BIN_DIR="${FLOWFACTORY_BIN_DIR:-$HOME/.local/bin}"
REQUESTED_VERSION="${FLOWFACTORY_VERSION:-latest}"
AUTOSTART_PLIST="$HOME/Library/LaunchAgents/com.gda.flowfactory.plist"
AUTOSTART_WAS_ENABLED=0
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/flowfactory.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT HUP INT TERM

if [ -L "$INSTALL_ROOT/current" ] || [ -d "$INSTALL_ROOT/current" ]; then
  INSTALL_EVENT="update"
else
  INSTALL_EVENT="install"
fi

report_install_success() {
  [ "${FLOWFACTORY_DISABLE_TELEMETRY:-0}" = "1" ] && return 0
  id_file="$INSTALL_ROOT/data/install_id"
  if [ ! -s "$id_file" ]; then
    python3 -c 'import secrets,sys; open(sys.argv[1],"w",encoding="utf-8").write(secrets.token_hex(24)+"\n")' "$id_file" || return 0
    chmod 600 "$id_file" 2>/dev/null || true
  fi
  event_id="$(python3 -c 'import secrets; print(secrets.token_hex(24))')" || return 0
  payload="$TMP_DIR/telemetry.json"
  python3 -c '
import json,platform,sys
installation_id=open(sys.argv[1],encoding="utf-8").read().strip()
json.dump({
  "event":sys.argv[2],
  "installation_id":installation_id,
  "event_id":sys.argv[3],
  "version":sys.argv[4],
  "platform":platform.system() or "unknown",
  "architecture":platform.machine() or "unknown",
},open(sys.argv[5],"w",encoding="utf-8"))
' "$id_file" "$INSTALL_EVENT" "$event_id" "$VERSION" "$payload" || return 0
  curl -fsS --max-time 5 -H "Content-Type: application/json" --data-binary "@$payload" "$TELEMETRY_URL" >/dev/null 2>&1 || true
}

stop_running_service() {
  URL="http://127.0.0.1:8765/"
  if [ -x "$INSTALL_ROOT/current/stop.command" ]; then
    "$INSTALL_ROOT/current/stop.command" >/dev/null 2>&1 || true
  fi
  if curl --noproxy '*' -fsS --max-time 2 "$URL" >/dev/null 2>&1 && command -v lsof >/dev/null 2>&1; then
    for pid in $(lsof -t -iTCP:8765 -sTCP:LISTEN 2>/dev/null || true); do
      command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"
      case "$command_line" in
        *"$INSTALL_ROOT/"*server.py*) kill "$pid" 2>/dev/null || true ;;
      esac
    done
  fi
  if command -v lsof >/dev/null 2>&1; then
    for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
      [ -z "$(lsof -t -iTCP:8765 -sTCP:LISTEN 2>/dev/null || true)" ] && return 0
      sleep 0.2
    done
  else
    for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
      curl --noproxy '*' -fsS --max-time 1 "$URL" >/dev/null 2>&1 || { sleep 0.5; return 0; }
      sleep 0.2
    done
  fi
  remaining=""
  if command -v lsof >/dev/null 2>&1; then
    remaining="$(lsof -t -iTCP:8765 -sTCP:LISTEN 2>/dev/null || true)"
  elif curl --noproxy '*' -fsS --max-time 1 "$URL" >/dev/null 2>&1; then
    remaining="unknown"
  fi
  [ -n "$remaining" ] && {
    echo "错误：8765 端口仍被其他程序占用，无法启动新版本。" >&2
    return 1
  }
}

suspend_autostart() {
  if [ "$(uname -s)" = "Darwin" ] && [ -f "$AUTOSTART_PLIST" ]; then
    AUTOSTART_WAS_ENABLED=1
    launchctl bootout "gui/$(id -u)/com.gda.flowfactory" >/dev/null 2>&1 || true
  fi
}

enable_autostart_for_target() {
  target="$1"
  FLOWFACTORY_INSTALL_ROOT="$INSTALL_ROOT" python3 -c '
import sys
sys.path.insert(0, sys.argv[1])
import autostart
autostart._enable(8765)
' "$target"
}

wait_for_version() {
  expected="$1"
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
    actual="$(curl --noproxy '*' -fsS --max-time 2 http://127.0.0.1:8765/api/config 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("version", ""))' 2>/dev/null || true)"
    [ "$actual" = "$expected" ] && return 0
    sleep 0.5
  done
  return 1
}

command -v python3 >/dev/null 2>&1 || { echo "错误：需要 Python 3。" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "错误：需要 curl。" >&2; exit 1; }
case "$UPDATE_BASE_URL" in https://*) ;; *) echo "错误：尚未配置 Cloudflare HTTPS 更新地址。" >&2; exit 1 ;; esac
UPDATE_BASE_URL="${UPDATE_BASE_URL%/}"

if [ "$REQUESTED_VERSION" = "latest" ]; then
  MANIFEST_URL="$UPDATE_BASE_URL/latest.json"
else
  VERSION="${REQUESTED_VERSION#v}"
  MANIFEST_URL="$UPDATE_BASE_URL/releases/$VERSION/manifest.json"
fi
MANIFEST="$TMP_DIR/manifest.json"
curl -fsSL "$MANIFEST_URL" -o "$MANIFEST"

METADATA="$(python3 -c '
import json,sys,urllib.parse
m=json.load(open(sys.argv[1],encoding="utf-8")); base=sys.argv[2].rstrip("/")+"/"
v=str(m["version"]).removeprefix("v"); a=m["archive"]
print(v); print(urllib.parse.urljoin(base,str(a["url"]))); print(str(a["sha256"]).lower())
' "$MANIFEST" "$UPDATE_BASE_URL/")"
VERSION="$(printf '%s\n' "$METADATA" | sed -n '1p')"
ARCHIVE_URL="$(printf '%s\n' "$METADATA" | sed -n '2p')"
EXPECTED_SHA="$(printf '%s\n' "$METADATA" | sed -n '3p')"
ARCHIVE="$TMP_DIR/flowfactory-$VERSION.tar.gz"
curl -fsSL "$ARCHIVE_URL" -o "$ARCHIVE"

ACTUAL_SHA="$(python3 -c 'import hashlib,sys; print(hashlib.sha256(open(sys.argv[1],"rb").read()).hexdigest())' "$ARCHIVE")"
[ "$ACTUAL_SHA" = "$EXPECTED_SHA" ] || { echo "错误：SHA-256 校验失败。" >&2; exit 1; }

mkdir -p "$INSTALL_ROOT/versions" "$INSTALL_ROOT/data" "$INSTALL_ROOT/run" "$BIN_DIR"
STAGE="$TMP_DIR/package"
mkdir -p "$STAGE"
tar -xzf "$ARCHIVE" -C "$STAGE"
chmod +x "$STAGE/factory_flow_start.command" "$STAGE/stop.command" "$STAGE/scripts/install.sh" "$STAGE/scripts/uninstall.sh" "$STAGE/scripts/autostart.command"
chmod +x "$STAGE/scripts/create_browser_launcher.sh" 2>/dev/null || true

TARGET="$INSTALL_ROOT/versions/$VERSION"
if [ ! -e "$TARGET" ]; then mv "$STAGE" "$TARGET"; fi
PREVIOUS_TARGET="$(readlink "$INSTALL_ROOT/current" 2>/dev/null || true)"
if [ "${FLOWFACTORY_INSTALL_NO_START:-0}" != "1" ]; then suspend_autostart; stop_running_service; fi
ln -sfn "$TARGET" "$INSTALL_ROOT/current"
if [ "$(uname -s)" = "Darwin" ]; then
  "$TARGET/scripts/create_browser_launcher.sh" || echo "提示：桌面快捷方式建立失敗，可稍後手動執行 Flow Factory。" >&2
fi

cat > "$BIN_DIR/flowfactory" <<EOF
#!/bin/sh
set -eu
ROOT="$INSTALL_ROOT"
case "\${1:-start}" in
  start) exec "\$ROOT/current/factory_flow_start.command" ;;
  stop) exec "\$ROOT/current/stop.command" ;;
  update) export FLOWFACTORY_INSTALL_OPEN_BROWSER=0; exec "\$ROOT/current/scripts/install.sh" ;;
  uninstall) exec "\$ROOT/current/scripts/uninstall.sh" "\${2:-}" ;;
  version) cat "\$ROOT/current/VERSION" ;;
  *) echo "用法：flowfactory [start|stop|update|uninstall|version]" >&2; exit 2 ;;
esac
EOF
chmod +x "$BIN_DIR/flowfactory"

echo "Flow Factory $VERSION 安装完成。"
echo "操作面板：http://127.0.0.1:8765/"
echo "以后启动：$BIN_DIR/flowfactory start"
case ":$PATH:" in *":$BIN_DIR:"*) ;; *) echo "提示：请将 $BIN_DIR 加入 PATH。" ;; esac

if [ "${FLOWFACTORY_INSTALL_NO_START:-0}" != "1" ]; then
  if [ "${FLOWFACTORY_INSTALL_OPEN_BROWSER:-1}" = "0" ]; then
    echo "正在重启 Flow Factory…"
  else
    echo "正在启动 Flow Factory 并打开浏览器…"
  fi
  # 預設啟用開機自動啟動（升級保留原設定；全新安裝也預設啟用）
  if [ "$AUTOSTART_WAS_ENABLED" -eq 1 ] || [ "$(uname -s)" = "Darwin" ]; then
    if ! enable_autostart_for_target "$TARGET" || ! wait_for_version "$VERSION"; then
      launchctl bootout "gui/$(id -u)/com.gda.flowfactory" >/dev/null 2>&1 || true
      if [ -n "$PREVIOUS_TARGET" ] && [ -d "$PREVIOUS_TARGET" ]; then
        ln -sfn "$PREVIOUS_TARGET" "$INSTALL_ROOT/current"
        enable_autostart_for_target "$PREVIOUS_TARGET" || true
      fi
      echo "新版健康检查失败，已自动回退上一版本。" >&2
      exit 1
    fi
  elif ! FLOWFACTORY_NO_OPEN_BROWSER=1 "$BIN_DIR/flowfactory" start; then
    echo "自动启动失败，请手动打开终端执行：$BIN_DIR/flowfactory start" >&2
    echo "启动成功后访问：http://127.0.0.1:8765/" >&2
    exit 1
  fi
  if [ "${FLOWFACTORY_INSTALL_OPEN_BROWSER:-1}" != "0" ] && command -v open >/dev/null 2>&1; then open http://127.0.0.1:8765/; fi
fi

report_install_success
