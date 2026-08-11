#!/bin/zsh
set -e
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
python3 "$SCRIPT_DIR/license_admin.py"
printf "\n授權管理頁已關閉，按 Enter 離開…"
read -r
