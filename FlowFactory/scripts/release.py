#!/usr/bin/env python3
"""更新 VERSION 與中文 CHANGELOG；提交、標籤和推送由發布者確認後執行。"""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "VERSION"
CHANGELOG_FILE = ROOT / "CHANGELOG.md"
VERSION_RE = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def fail(message: str) -> None:
    print(f"錯誤：{message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) < 3:
        fail("用法：python3 scripts/release.py <版本號> <中文摘要> [中文細節...]")

    version = sys.argv[1].removeprefix("v")
    summary = sys.argv[2].strip()
    details = [item.strip() for item in sys.argv[3:] if item.strip()]

    if not VERSION_RE.fullmatch(version):
        fail("版本號必須符合 MAJOR.MINOR.PATCH，例如 1.2.3")
    if not summary:
        fail("中文摘要不可留空")

    current = VERSION_FILE.read_text(encoding="utf-8").strip() if VERSION_FILE.exists() else ""
    if current and tuple(map(int, version.split("."))) <= tuple(map(int, current.split("."))):
        fail(f"新版本 {version} 必須高於目前版本 {current}")

    VERSION_FILE.write_text(f"{version}\n", encoding="utf-8")

    heading = "# 更新紀錄\n\n本專案採用[語意化版本](https://semver.org/lang/zh-TW/)；所有版本說明與 Git 提交訊息皆使用繁體中文。\n\n"
    existing = CHANGELOG_FILE.read_text(encoding="utf-8") if CHANGELOG_FILE.exists() else heading
    body = existing[len(heading):] if existing.startswith(heading) else existing
    bullets = details or [summary]
    entry = f"## v{version}（{date.today().isoformat()}）\n\n### 更新\n\n" + "".join(f"- {item}\n" for item in bullets) + "\n"
    CHANGELOG_FILE.write_text(heading + entry + body, encoding="utf-8")
    print(f"已準備 v{version}：{summary}")
    print("下一步：檢查差異與測試後，以中文提交並建立同版本 Git 標籤。")


if __name__ == "__main__":
    main()
