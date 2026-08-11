#!/usr/bin/env python3
"""Build the static Cloudflare Pages directory for one Flow Factory release."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tarfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def excluded(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    parts = relative.parts
    if not parts:
        return False
    if parts[0] in {".git", ".github", ".flowfactory-test", ".flowfactory-ui-test", "outputs"}:
        return True
    if relative.name == "agent_settings.json":
        return True
    return len(parts) >= 3 and parts[0] == "workflows" and "outputs" in parts[2:]


def build(output: Path) -> dict:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    output.mkdir(parents=True, exist_ok=True)
    release_dir = output / "releases" / version
    release_dir.mkdir(parents=True, exist_ok=True)
    archive_name = f"flowfactory-{version}.tar.gz"
    archive = release_dir / archive_name
    with tarfile.open(archive, "w:gz") as bundle:
        for child in sorted(ROOT.iterdir()):
            if not excluded(child):
                bundle.add(child, arcname=child.name, filter=lambda member: None if excluded(ROOT / member.name) else member)
        # 讓 v1.11.0 以前的安裝器仍能驗證並接收這次檔名遷移；
        # 新版安裝器與使用者入口一律使用 factory_flow_start.command。
        bundle.add(ROOT / "factory_flow_start.command", arcname="start.command")
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    checksum = release_dir / f"{archive_name}.sha256"
    checksum.write_text(f"{digest}  {archive_name}\n", encoding="utf-8")
    manifest = {
        "schema_version": 1,
        "version": version,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "release_notes": f"Flow Factory {version}",
        "archive": {
            "url": f"releases/{version}/{archive_name}",
            "sha256": digest,
            "size": archive.stat().st_size,
        },
    }
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (release_dir / "manifest.json").write_text(text, encoding="utf-8")
    (output / "latest.json").write_text(text, encoding="utf-8")
    shutil.copy2(ROOT / "scripts" / "install.sh", output / "install.sh")
    (output / "_headers").write_text(
        "/latest.json\n  Cache-Control: no-store\n"
        "/install.sh\n  Cache-Control: no-cache\n"
        "/releases/*\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    manifest = build(args.output.resolve())
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
