#!/bin/sh
set -eu

[ "$(uname -s)" = "Darwin" ] || exit 0
command -v osacompile >/dev/null 2>&1 || exit 0
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DESKTOP="${HOME}/Desktop"
[ -d "$DESKTOP" ] || exit 0
APP="$DESKTOP/Flow Factory.app"
rm -rf "$APP"
osacompile -o "$APP" "$ROOT/scripts/flowfactory-browser-launcher.applescript"

if command -v sips >/dev/null 2>&1 && [ -f "$ROOT/factory-flow-logo.png" ]; then
  ICON="$APP/Contents/Resources/applet.icns"
  sips -s format icns "$ROOT/factory-flow-logo.png" --out "$ICON" >/dev/null 2>&1 || true
fi
touch "$APP"
echo "已建立桌面快捷方式：$APP"
