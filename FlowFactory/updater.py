"""Flow Factory Cloudflare Pages release checking and managed updates."""

from __future__ import annotations

import hashlib
import json
import os
import platform
import secrets
import shutil
import socket
import subprocess
import tarfile
import tempfile
import time
import urllib.request
from pathlib import Path
from urllib.parse import urljoin


ROOT = Path(__file__).resolve().parent
INSTALL_ROOT = Path(os.environ.get("FLOWFACTORY_INSTALL_ROOT", Path.home() / ".flowfactory")).expanduser().resolve()
CONFIG_FILE = ROOT / "update_config.json"
LICENSE_CONFIG_FILE = ROOT / "license_config.json"
MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024


def _report_update_success(version: str) -> None:
    """Best-effort anonymous update telemetry; failures never block an update."""
    if os.environ.get("FLOWFACTORY_DISABLE_TELEMETRY") == "1":
        return
    try:
        configured = json.loads(LICENSE_CONFIG_FILE.read_text(encoding="utf-8"))
        endpoint = str(configured.get("api_url", "")).rstrip("/") + "/v1/telemetry/install"
        if not endpoint.startswith("https://"):
            return
        data_dir = INSTALL_ROOT / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        id_file = data_dir / "install_id"
        if not id_file.is_file() or not id_file.read_text(encoding="utf-8").strip():
            id_file.write_text(secrets.token_hex(24) + "\n", encoding="utf-8")
            id_file.chmod(0o600)
        payload = json.dumps({
            "event": "update",
            "installation_id": id_file.read_text(encoding="utf-8").strip(),
            "event_id": secrets.token_hex(24),
            "version": version,
            "platform": platform.system() or "unknown",
            "architecture": platform.machine() or "unknown",
        }).encode()
        curl = shutil.which("curl")
        if curl:
            subprocess.run(
                [curl, "-fsS", "--max-time", "5", "--header", "Content-Type: application/json",
                 "--data-binary", "@-", endpoint],
                input=payload, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
            )
    except Exception:
        return


def version_tuple(value: str) -> tuple[int, int, int]:
    parts = value.strip().removeprefix("v").split(".")
    if len(parts) != 3 or not all(part.isdigit() for part in parts):
        raise ValueError(f"无效版本号：{value}")
    return tuple(int(part) for part in parts)


def update_base_url() -> str:
    configured = os.environ.get("FLOWFACTORY_UPDATE_BASE_URL", "").strip()
    if not configured and CONFIG_FILE.is_file():
        try:
            configured = str(json.loads(CONFIG_FILE.read_text(encoding="utf-8")).get("update_base_url", "")).strip()
        except Exception:
            configured = ""
    if not configured or "__FLOWFACTORY_UPDATE_BASE_URL__" in configured:
        raise RuntimeError("尚未配置 Cloudflare 更新地址")
    if not configured.startswith("https://"):
        raise RuntimeError("更新地址必须使用 HTTPS")
    return configured.rstrip("/") + "/"


def _read_limited(url: str, accept: str = "application/octet-stream") -> bytes:
    curl = shutil.which("curl")
    if not curl:
        raise RuntimeError("找不到系统 curl，无法安全连接更新服务器")
    result = subprocess.run(
        [curl, "-fsSL", "--max-time", "30", "--max-filesize", str(MAX_DOWNLOAD_BYTES),
         "--user-agent", "FlowFactory-Updater", "--header", f"Accept: {accept}", url],
        capture_output=True,
    )
    if result.returncode:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"无法连接更新服务器：{detail or f'curl 错误 {result.returncode}'}")
    data = result.stdout
    if len(data) > MAX_DOWNLOAD_BYTES:
        raise RuntimeError("下载文件超过 100 MB 安全限制")
    return data


def release_info(current_version: str) -> dict:
    base_url = update_base_url()
    manifest_url = urljoin(base_url, "latest.json")
    manifest = json.loads(_read_limited(manifest_url, "application/json").decode("utf-8"))
    latest = str(manifest.get("version", "")).removeprefix("v")
    version_tuple(latest)
    archive = manifest.get("archive") or {}
    archive_url = urljoin(base_url, str(archive.get("url", "")))
    expected_sha256 = str(archive.get("sha256", "")).lower()
    if not archive_url.startswith("https://") or len(expected_sha256) != 64:
        raise RuntimeError("Cloudflare 版本清单不完整")
    return {
        "current_version": current_version,
        "latest_version": latest,
        "update_available": version_tuple(latest) > version_tuple(current_version),
        "release_notes": str(manifest.get("release_notes", "")),
        "published_at": str(manifest.get("published_at", "")),
        "archive_url": archive_url,
        "expected_sha256": expected_sha256,
    }


def _safe_extract(archive: Path, destination: Path) -> None:
    destination = destination.resolve()
    with tarfile.open(archive, "r:gz") as bundle:
        members = bundle.getmembers()
        if sum(member.size for member in members) > MAX_DOWNLOAD_BYTES:
            raise RuntimeError("解压内容超过 100 MB 安全限制")
        for member in members:
            target = (destination / member.name).resolve()
            if destination != target and destination not in target.parents:
                raise RuntimeError("安装包包含不安全路径")
            if member.issym() or member.islnk():
                raise RuntimeError("安装包包含不允许的链接")
        bundle.extractall(destination)


def install_release(info: dict, running_root: Path) -> Path:
    versions_dir = INSTALL_ROOT / "versions"
    running_root = running_root.resolve()
    if versions_dir.resolve() not in running_root.parents:
        raise RuntimeError("当前是开发版，页面更新仅适用于通过安装脚本安装的版本")
    version = info["latest_version"]
    target = versions_dir / version
    if target.exists():
        validate_release(target)
        _activate(target)
        _report_update_success(version)
        return target

    with tempfile.TemporaryDirectory(prefix="flowfactory-update-") as temp_name:
        temp = Path(temp_name)
        archive = temp / f"flowfactory-{version}.tar.gz"
        archive.write_bytes(_read_limited(info["archive_url"]))
        actual = hashlib.sha256(archive.read_bytes()).hexdigest()
        if actual != info["expected_sha256"]:
            raise RuntimeError("SHA-256 校验失败，已取消更新")
        stage = temp / "package"
        stage.mkdir()
        _safe_extract(archive, stage)
        if not (stage / "server.py").is_file() or not (stage / "VERSION").is_file():
            raise RuntimeError("安装包结构不完整")
        versions_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(stage), str(target))
    for script in (target / "factory_flow_start.command", target / "stop.command", target / "scripts" / "install.sh", target / "scripts" / "uninstall.sh", target / "scripts" / "autostart.command"):
        if script.exists():
            script.chmod(script.stat().st_mode | 0o100)
    try:
        validate_release(target)
    except Exception:
        shutil.rmtree(target, ignore_errors=True)
        raise
    _activate(target)
    _report_update_success(version)
    return target


def validate_release(target: Path) -> None:
    """在切換正式版本前，用獨立連接埠啟動候選版本並驗證健康狀態。"""
    expected = (target / "VERSION").read_text(encoding="utf-8").strip()
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix="flowfactory-health-") as data_dir:
        env = os.environ.copy()
        env.update({
            "FLOWFACTORY_PORT": str(port),
            "FLOWFACTORY_DATA_DIR": data_dir,
            "AUTOMONEY_NO_BROWSER": "1",
        })
        process = subprocess.Popen(
            [os.environ.get("FLOWFACTORY_PYTHON", os.sys.executable), str(target / "server.py")],
            cwd=target,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        try:
            deadline = time.monotonic() + 12
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    detail = (process.stderr.read() if process.stderr else b"").decode("utf-8", errors="replace").strip()
                    raise RuntimeError(f"新版启动检查失败：{detail or '服务提前退出'}")
                try:
                    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
                    with opener.open(f"http://127.0.0.1:{port}/api/config", timeout=1) as response:
                        payload = json.loads(response.read().decode("utf-8"))
                    if payload.get("version") == expected:
                        return
                except Exception:
                    time.sleep(0.25)
            raise RuntimeError("新版启动检查超时，已保留当前版本")
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()


def _activate(target: Path) -> None:
    current = INSTALL_ROOT / "current"
    temporary = INSTALL_ROOT / ".current-new"
    if temporary.exists() or temporary.is_symlink():
        temporary.unlink()
    temporary.symlink_to(target)
    os.replace(temporary, current)
