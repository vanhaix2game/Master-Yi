"""Manage Flow Factory startup at macOS login."""

from __future__ import annotations

import os
import platform
import plistlib
import subprocess
import sys
import tempfile
from pathlib import Path


LABEL = "com.gda.flowfactory"
INSTALL_ROOT = Path(os.environ.get("FLOWFACTORY_INSTALL_ROOT", Path.home() / ".flowfactory")).expanduser().resolve()
PLIST_FILE = Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"
LOG_DIR = Path.home() / "Library" / "Logs" / "FlowFactory"


def is_managed_install(running_root: Path) -> bool:
    return INSTALL_ROOT.resolve() in running_root.resolve().parents or running_root.resolve() == INSTALL_ROOT.resolve()


def status(running_root: Path) -> dict:
    supported = platform.system() == "Darwin"
    managed = is_managed_install(running_root)
    return {
        "supported": supported,
        "managed_install": managed,
        "enabled": supported and managed and PLIST_FILE.is_file(),
        "message": "" if supported else "目前仅支持 macOS 登录自启",
    }


def set_enabled(enabled: bool, running_root: Path, port: int) -> dict:
    state = status(running_root)
    if not state["supported"]:
        raise RuntimeError(state["message"])
    if not state["managed_install"]:
        raise RuntimeError("自启功能仅适用于通过安装脚本安装的正式版本")
    if enabled:
        _enable(port)
    else:
        _disable()
    return status(running_root)


def _enable(port: int) -> None:
    logs = LOG_DIR
    logs.mkdir(parents=True, exist_ok=True)
    PLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "Label": LABEL,
        "ProgramArguments": [str(INSTALL_ROOT / "current" / "scripts" / "autostart.command")],
        "RunAtLoad": True,
        "KeepAlive": True,
        "ThrottleInterval": 5,
        "ProcessType": "Background",
        "EnvironmentVariables": {
            "FLOWFACTORY_INSTALL_ROOT": str(INSTALL_ROOT),
            "FLOWFACTORY_DATA_DIR": str(INSTALL_ROOT / "data"),
            "FLOWFACTORY_PORT": str(port),
            "FLOWFACTORY_PYTHON": sys.executable,
            "AUTOMONEY_NO_BROWSER": "1",
        },
        "StandardOutPath": str(logs / "autostart.log"),
        "StandardErrorPath": str(logs / "autostart.log"),
    }
    with tempfile.NamedTemporaryFile(dir=PLIST_FILE.parent, prefix=f".{LABEL}.", delete=False) as temp:
        plistlib.dump(payload, temp)
        temporary = Path(temp.name)
    temporary.chmod(0o644)
    os.replace(temporary, PLIST_FILE)
    domain = f"gui/{os.getuid()}"
    subprocess.run(["launchctl", "bootout", f"{domain}/{LABEL}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    result = subprocess.run(["launchctl", "bootstrap", domain, str(PLIST_FILE)], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"无法启用登录自启：{result.stderr.strip() or 'launchctl bootstrap 失败'}")


def _disable() -> None:
    if PLIST_FILE.exists():
        domain = f"gui/{os.getuid()}"
        subprocess.run(["launchctl", "bootout", f"{domain}/{LABEL}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        PLIST_FILE.unlink(missing_ok=True)
