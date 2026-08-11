"""Flow Factory license activation, signed cache, and offline access policy."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import platform
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("FLOWFACTORY_DATA_DIR", ROOT)).expanduser().resolve()
CONFIG_FILE = ROOT / "license_config.json"
LICENSE_FILE = DATA_DIR / "license.json"
DEVICE_FILE = DATA_DIR / "device_id"
P = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
A = P - 3
B = 0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B
N = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
GX = 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296
GY = 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5


def _system_proxy_url():
    """讀取 macOS 系統代理設定（scutil --proxy）或環境變數代理；沒有回 None。"""
    env_url = os.environ.get('https_proxy') or os.environ.get('HTTPS_PROXY')
    if env_url:
        return env_url
    if sys.platform != 'darwin':
        return None
    try:
        raw = subprocess.run(['scutil', '--proxy'], capture_output=True, text=True, timeout=5).stdout
        for line in raw.splitlines():
            line = line.strip()
            if line.startswith('HTTPSProxy :'):
                host = line.split(':', 1)[1].strip()
            elif line.startswith('HTTPSPort :'):
                port = line.split(':', 1)[1].strip()
            elif line.startswith('HTTPSEnable :'):
                enabled = '1' in line.split(':', 1)[1].strip()
        if enabled and host and port:
            return f'http://{host}:{port}'
    except Exception:
        pass
    return None


def _https_context():
    """建立帶 CA 憑證的 SSL context（certifi 優先；Homebrew Python 常缺系統憑證）。"""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        pass
    # macOS / Linux 系統憑證檔案（CommandLineTools Python 缺 certifi 時用）
    for cafile in ('/etc/ssl/cert.pem', '/etc/ssl/certs/ca-certificates.crt'):
        if os.path.exists(cafile):
            return ssl.create_default_context(cafile=cafile)
    return ssl.create_default_context()


def _config() -> dict:
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _inverse(value: int, modulus: int) -> int:
    return pow(value, -1, modulus)


def _add(left, right):
    if left is None:
        return right
    if right is None:
        return left
    x1, y1 = left
    x2, y2 = right
    if x1 == x2 and (y1 + y2) % P == 0:
        return None
    slope = ((3 * x1 * x1 + A) * _inverse(2 * y1, P)) % P if left == right else ((y2 - y1) * _inverse(x2 - x1, P)) % P
    x3 = (slope * slope - x1 - x2) % P
    return x3, (slope * (x1 - x3) - y1) % P


def _multiply(scalar: int, point):
    result = None
    addend = point
    while scalar:
        if scalar & 1:
            result = _add(result, addend)
        addend = _add(addend, addend)
        scalar >>= 1
    return result


def verify_signature(payload: bytes, signature: bytes, public_key_hex: str) -> bool:
    try:
        key = bytes.fromhex(public_key_hex)
        if len(key) != 65 or key[0] != 4 or len(signature) != 64:
            return False
        point = (int.from_bytes(key[1:33], "big"), int.from_bytes(key[33:], "big"))
        if (point[1] * point[1] - (point[0] ** 3 + A * point[0] + B)) % P:
            return False
        r, s = int.from_bytes(signature[:32], "big"), int.from_bytes(signature[32:], "big")
        if not (1 <= r < N and 1 <= s < N):
            return False
        digest = int.from_bytes(hashlib.sha256(payload).digest(), "big")
        inverse = _inverse(s, N)
        calculated = _add(_multiply((digest * inverse) % N, (GX, GY)), _multiply((r * inverse) % N, point))
        return calculated is not None and calculated[0] % N == r
    except Exception:
        return False


def device_id() -> str:
    if DEVICE_FILE.is_file():
        value = DEVICE_FILE.read_text(encoding="utf-8").strip()
        if value:
            return value
    seed = f"{platform.node()}:{uuid.getnode()}:{uuid.uuid4()}"
    value = hashlib.sha256(seed.encode()).hexdigest()
    DEVICE_FILE.parent.mkdir(parents=True, exist_ok=True)
    DEVICE_FILE.write_text(value + "\n", encoding="utf-8")
    DEVICE_FILE.chmod(0o600)
    return value


def _free(message="尚未啟用授權") -> dict:
    return {"licensed": False, "plan": "free", "plan_name": "免費版", "expires_at": None, "offline_until": None, "message": message}


def _read_cache() -> dict:
    try:
        return json.loads(LICENSE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _validate_envelope(envelope: dict, now: int | None = None) -> dict:
    config = _config()
    payload_raw = _b64url_decode(str(envelope.get("payload", "")))
    signature = _b64url_decode(str(envelope.get("signature", "")))
    if not verify_signature(payload_raw, signature, str(config.get("public_key", ""))):
        return _free("本機授權簽章無效")
    payload = json.loads(payload_raw.decode("utf-8"))
    if payload.get("device_id") != device_id():
        return _free("授權不屬於這台裝置")
    current = int(now or time.time())
    plan = payload.get("plan")
    expires_at = payload.get("expires_at")
    offline_until = payload.get("offline_until")
    if plan == "lifetime":
        valid = payload.get("active") is True
    else:
        valid = payload.get("active") is True and isinstance(expires_at, int) and current <= expires_at and isinstance(offline_until, int) and current <= offline_until
    if not valid:
        return _free("授權已到期或離線寬限期已結束")
    return {
        "licensed": True,
        "plan": plan,
        "plan_name": "終身版" if plan == "lifetime" else "月費版",
        "expires_at": expires_at,
        "offline_until": offline_until,
        "message": "授權有效",
    }


def status(refresh: bool = True) -> dict:
    if os.environ.get('FLOWFACTORY_DEV_LICENSE') == '1':
        return {"licensed": True, "plan": "lifetime", "plan_name": "終身版", "expires_at": None, "offline_until": None, "message": "開發版授權（bypass）"}
    cached = _read_cache()
    if not cached:
        return _free("目前使用免費版")
    if refresh and cached.get("license_key"):
        try:
            return activate(cached["license_key"])
        except Exception:
            pass
    return _validate_envelope(cached)


def activate(license_key: str) -> dict:
    license_key = str(license_key or "").strip().upper()
    if not license_key or len(license_key) > 128:
        raise ValueError("請輸入有效的授權碼")
    endpoint = str(_config().get("api_url", "")).rstrip("/")
    if not endpoint.startswith("https://"):
        raise RuntimeError("授權服務尚未配置")
    body = json.dumps({"license_key": license_key, "device_id": device_id()}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(endpoint + "/v1/activate", data=body, headers={"Content-Type": "application/json", "User-Agent": "FlowFactory-License/1.0"}, method="POST")
    # 直連優先（帶 CA 憑證），失敗自動改用系統代理（Clash/Surge 等）重試
    ctx = _https_context()
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPSHandler(context=ctx))
        with opener.open(request, timeout=8) as response:
            envelope = json.loads(response.read(128 * 1024).decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # HTTP 錯誤（403/400 等）是伺服器有回應，不是連線問題 → 直接回報
        try:
            message = json.loads(exc.read().decode("utf-8")).get("error")
        except Exception:
            message = None
        raise RuntimeError(message or f"授權服務回應 HTTP {exc.code}") from exc
    except urllib.error.URLError:
        # 連線失敗（DNS/逾時/被擋）→ 改用系統代理重試
        try:
            proxy_url = _system_proxy_url()
            if proxy_url:
                opener = urllib.request.build_opener(
                    urllib.request.ProxyHandler({'http': proxy_url, 'https': proxy_url}),
                    urllib.request.HTTPSHandler(context=ctx))
            else:
                opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx))
            with opener.open(request, timeout=15) as response:
                envelope = json.loads(response.read(128 * 1024).decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # 代理連上但伺服器回應錯誤（403/400 等）→ 讀取伺服器訊息
            try:
                message = json.loads(exc.read().decode("utf-8")).get("error")
            except Exception:
                message = None
            raise RuntimeError(message or f"授權服務回應 HTTP {exc.code}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError("目前無法連線授權服務，將沿用有效的離線授權") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError("目前無法連線授權服務，將沿用有效的離線授權") from exc
    state = _validate_envelope(envelope)
    if not state["licensed"]:
        raise RuntimeError(state["message"])
    envelope["license_key"] = license_key
    LICENSE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp = LICENSE_FILE.with_suffix(".tmp")
    temp.write_text(json.dumps(envelope, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.chmod(0o600)
    os.replace(temp, LICENSE_FILE)
    return state


def deactivate() -> dict:
    LICENSE_FILE.unlink(missing_ok=True)
    return _free("已移除本機授權")


def store_request(path: str, method: str = "GET", payload: dict | None = None, authenticated: bool = False) -> dict:
    endpoint = str(_config().get("api_url", "")).rstrip("/")
    if not endpoint.startswith("https://"):
        raise RuntimeError("工廠商店服務尚未配置")
    body = dict(payload or {})
    if authenticated:
        cached = _read_cache()
        license_key = str(cached.get("license_key", "")).strip()
        if not license_key or not status(refresh=False).get("licensed"):
            raise PermissionError("此操作需要有效授權碼")
        body["license_key"] = license_key
        body["device_id"] = device_id()
    data = None if method == "GET" else json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        endpoint + path,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "FlowFactory-Store/1.0"},
        method=method,
    )
    try:
        # 公開商店先尊重系統代理；部分電腦會遺留無效代理設定，
        # 因此匿名瀏覽失敗時自動改走直連，避免把公開功能誤顯示為無法連線。
        openers = [urllib.request.build_opener()]
        if not authenticated and method == "GET":
            openers.append(urllib.request.build_opener(urllib.request.ProxyHandler({})))
        timeout = 8 if not authenticated and method == "GET" else 20
        last_error = None
        for opener in openers:
            try:
                with opener.open(request, timeout=timeout) as response:
                    return json.loads(response.read(1024 * 1024).decode("utf-8"))
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
                last_error = exc
        if last_error:
            raise last_error
        raise RuntimeError("目前無法連接工廠商店")
    except urllib.error.HTTPError as exc:
        try:
            message = json.loads(exc.read().decode("utf-8")).get("error")
        except Exception:
            message = None
        error = PermissionError(message or "授權驗證失敗") if exc.code in {401, 403} else RuntimeError(message or f"工廠商店回應 HTTP {exc.code}")
        error.status = exc.code
        raise error from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RuntimeError("目前無法連接工廠商店") from exc


def limit_workflows(config: dict, license_state: dict | None = None) -> dict:
    if (license_state or status(refresh=False)).get("licensed"):
        return config
    result = dict(config)
    workflows = result.get("workflows")
    result["workflows"] = workflows[:1] if isinstance(workflows, list) else []
    return result
