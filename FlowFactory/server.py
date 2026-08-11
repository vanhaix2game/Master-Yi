#!/usr/bin/env python3
import hashlib
import hmac
import ipaddress
import json
import os
import queue
import re
import secrets
import signal
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
import uuid
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, quote

import updater
import autostart
import licensing
from scheduler import ScheduleManager, ScheduleRunCancelled

ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get('FLOWFACTORY_DATA_DIR', ROOT)).expanduser().resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
WORKFLOWS_FILE = DATA_DIR / 'workflows.json'
APP_SETTINGS_FILE = DATA_DIR / 'app_settings.json'
AGENT_SETTINGS_FILE = DATA_DIR / 'agent_settings.json'
SCHEDULES_FILE = DATA_DIR / 'schedules.json'
STORE_PREVIEW_FILE = DATA_DIR / 'store_preview.json'
STORE_PREVIEW_MODE = os.environ.get('FLOWFACTORY_STORE_PREVIEW') == '1'
PORT = int(os.environ.get('FLOWFACTORY_PORT', '8765'))
HERMES_WEBHOOK_ROUTE = 'automoney-task'
HERMES_WEBHOOK_URL = f'http://127.0.0.1:8644/webhooks/{HERMES_WEBHOOK_ROUTE}'
HERMES_SUBSCRIPTIONS_FILE = Path.home() / '.hermes' / 'webhook_subscriptions.json'
HERMES_BIN = shutil.which('hermes') or str(Path.home() / '.local' / 'bin' / 'hermes')
HERMES_TASKS = {}
HERMES_PROCESSES = {}
HERMES_TASKS_LOCK = threading.Lock()
SCHEDULE_RUNS = {}
SCHEDULE_RUNS_LOCK = threading.Lock()
ANSI_ESCAPE_RE = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
SETTINGS_FILES = {
    'workflows': WORKFLOWS_FILE,
    'app': APP_SETTINGS_FILE,
}

SAFE_CONTENT_ROOT = DATA_DIR / 'outputs'
LEGACY_CONTENT_ROOT = Path.home() / 'Desktop' / 'FlowFactory'
DEFAULT_APP_SETTINGS = {
    'content_root': str(SAFE_CONTENT_ROOT),
    'lan_enabled': False,
    'lan_password_salt': '',
    'lan_password_hash': '',
}
DEFAULT_AGENT_SETTINGS = {'mode': 'disabled', 'name': 'Agent', 'webhook_url': '', 'token': '', 'verified': False}
LAN_SESSION_SECRET = secrets.token_bytes(32)
LAN_LOGIN_ATTEMPTS = {}
LAN_LOGIN_LOCK = threading.Lock()
WORKFLOWS_BACKUP_COUNT = 5
WORKFLOWS_WRITE_LOCK = threading.Lock()

if not WORKFLOWS_FILE.exists() and DATA_DIR != ROOT:
    shutil.copy2(ROOT / 'workflows.json', WORKFLOWS_FILE)

if not APP_SETTINGS_FILE.exists():
    APP_SETTINGS_FILE.write_text(json.dumps(DEFAULT_APP_SETTINGS, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

OUTPUTS_DIR = ROOT / 'outputs'
VERSION = (ROOT / 'VERSION').read_text(encoding='utf-8').strip()
CHANGELOG_FILE = ROOT / 'CHANGELOG.md'


def load_recent_changelog(limit=10):
    """Return the latest release notes for the settings update log."""
    if not CHANGELOG_FILE.is_file():
        return []
    text = CHANGELOG_FILE.read_text(encoding='utf-8')
    entries = []
    matches = list(re.finditer(r'^##\s+(v[^\s（(]+)[（(]([^）)]+)[）)]\s*$([\s\S]*?)(?=^##\s+|\Z)', text, re.MULTILINE))
    for match in matches[:limit]:
        bullets = [line.strip()[2:].strip() for line in match.group(3).splitlines() if line.strip().startswith('- ')]
        entries.append({'version': match.group(1), 'date': match.group(2).strip(), 'items': bullets})
    return entries


def _require_workflows_write_license():
    """Allow writes for all users; display limits are enforced by the frontend."""
    return licensing.status(refresh=False)


def _rotate_workflows_backups():
    """Keep the five most recent pre-write snapshots beside workflows.json."""
    if not WORKFLOWS_FILE.is_file():
        return
    for index in range(WORKFLOWS_BACKUP_COUNT - 1, 0, -1):
        source = WORKFLOWS_FILE.with_name(
            WORKFLOWS_FILE.name + ('.bak' if index == 1 else f'.bak.{index - 1}')
        )
        destination = WORKFLOWS_FILE.with_name(WORKFLOWS_FILE.name + f'.bak.{index}')
        if source.is_file():
            shutil.copy2(source, destination)
    shutil.copy2(WORKFLOWS_FILE, WORKFLOWS_FILE.with_name(WORKFLOWS_FILE.name + '.bak'))


def _write_workflows(config, temp_suffix='.tmp'):
    workflows = config.get('workflows') if isinstance(config, dict) else None
    if not isinstance(workflows, list):
        raise ValueError('workflows.json 必須包含 workflows 陣列')
    formatted = json.dumps(config, ensure_ascii=False, indent=2) + '\n'
    with WORKFLOWS_WRITE_LOCK:
        _require_workflows_write_license()
        WORKFLOWS_FILE.parent.mkdir(parents=True, exist_ok=True)
        _rotate_workflows_backups()
        temp_file = WORKFLOWS_FILE.with_name(WORKFLOWS_FILE.name + temp_suffix)
        temp_file.write_text(formatted, encoding='utf-8')
        os.replace(temp_file, WORKFLOWS_FILE)
    return formatted


def _merge_limited_workflow_view(existing, submitted):
    """Apply the visible free-tier factory without discarding hidden factories."""
    original = existing.get('workflows') if isinstance(existing.get('workflows'), list) else []
    visible = submitted.get('workflows') if isinstance(submitted.get('workflows'), list) else None
    if visible is None:
        raise ValueError('workflows.json 必須包含 workflows 陣列')
    if original and len(visible) != 1:
        raise PermissionError('免費版顯示模式只能修改第一個工作流；請先匯入完整 JSON 再調整其他工作流')
    merged = dict(existing)
    merged.update({key: value for key, value in submitted.items() if key != 'workflows'})
    merged['workflows'] = visible if not original else visible + original[1:]
    return merged


def _employee_revision(factory):
    canonical = json.dumps(factory, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def _replace_employee_workflow(employee_id, employee, expected_revision):
    if not isinstance(employee, dict):
        raise ValueError('員工 JSON 必須是物件')
    if str(employee.get('id', '')).strip() != str(employee_id).strip():
        raise ValueError('員工 JSON 的 ID 與目標員工不一致')
    if not isinstance(employee.get('steps'), list):
        raise ValueError('員工 JSON 必須包含 steps 陣列')
    with WORKFLOWS_WRITE_LOCK:
        _require_workflows_write_license()
        config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
        workflows = config.get('workflows') if isinstance(config.get('workflows'), list) else []
        index = next((index for index, item in enumerate(workflows)
                      if isinstance(item, dict) and str(item.get('id')) == str(employee_id)), -1)
        if index < 0:
            raise ValueError('找不到指定員工')
        current = workflows[index]
        current_revision = _employee_revision(current)
        if not expected_revision or expected_revision != current_revision:
            raise RuntimeError('員工資料已在對話期間變更，請重新載入後再生成修改方案')
        next_employee = json.loads(json.dumps(employee, ensure_ascii=False))
        workflows[index] = next_employee
        formatted = json.dumps(config, ensure_ascii=False, indent=2) + '\n'
        WORKFLOWS_FILE.parent.mkdir(parents=True, exist_ok=True)
        _rotate_workflows_backups()
        temp_file = WORKFLOWS_FILE.with_name(WORKFLOWS_FILE.name + '.employee.tmp')
        temp_file.write_text(formatted, encoding='utf-8')
        os.replace(temp_file, WORKFLOWS_FILE)
    return next_employee, _employee_revision(next_employee)


def restart_into(target):
    time.sleep(1)
    target = Path(target).resolve()
    os.chdir(target)
    os.execve(sys.executable, [sys.executable, str(target / 'server.py')], os.environ.copy())

def load_app_settings():
    try:
        data = json.loads(APP_SETTINGS_FILE.read_text(encoding='utf-8'))
    except Exception:
        data = DEFAULT_APP_SETTINGS.copy()
    root = str(data.get('content_root', '')).strip() or DEFAULT_APP_SETTINGS['content_root']
    return {
        'content_root': root,
        'theme': data.get('theme') if data.get('theme') in {'light', 'dark'} else 'light',
        'lan_enabled': data.get('lan_enabled') is True,
        'lan_password_salt': str(data.get('lan_password_salt', '')),
        'lan_password_hash': str(data.get('lan_password_hash', '')),
    }

def write_app_settings(settings):
    temp_file = APP_SETTINGS_FILE.with_suffix('.json.tmp')
    temp_file.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp_file, APP_SETTINGS_FILE)

def resolve_output_path(value):
    """Resolve relative flow paths against the stable content storage root."""
    raw = str(value or '').strip()
    if not raw:
        raise ValueError('輸出路徑不可為空')
    path = Path(raw).expanduser()
    if path.is_absolute():
        return path.resolve(strict=False)
    root = Path(load_app_settings()['content_root']).expanduser().resolve(strict=False)
    resolved = (root / path).resolve(strict=False)
    try:
        resolved.relative_to(root)
    except ValueError:
        raise ValueError('相對輸出路徑不可離開內容儲存根目錄')
    return resolved

def _migrated_output_path(value, old_root, new_root):
    if not isinstance(value, str) or not value.strip():
        return value
    candidate = Path(value).expanduser()
    try:
        relative = candidate.resolve(strict=False).relative_to(old_root.resolve(strict=False))
    except (OSError, ValueError):
        return value
    return str(new_root / relative)

def migrate_legacy_content_root(copy_existing=True):
    """Move the old protected Desktop default into FlowFactory-managed storage."""
    settings = load_app_settings()
    old_root = LEGACY_CONTENT_ROOT
    new_root = SAFE_CONTENT_ROOT
    try:
        configured = Path(settings['content_root']).expanduser().resolve(strict=False)
    except OSError:
        return False
    if configured != old_root.resolve(strict=False):
        return False
    new_root.mkdir(parents=True, exist_ok=True)
    if copy_existing and old_root.is_dir():
        try:
            shutil.copytree(old_root, new_root, dirs_exist_ok=True)
        except OSError:
            # A background LaunchAgent may not be allowed to read Desktop. Paths
            # are still migrated so future outputs no longer require TCC access.
            pass
    config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8')) if WORKFLOWS_FILE.is_file() else {'workflows': []}
    for factory in config.get('workflows', []):
        if not isinstance(factory, dict):
            continue
        for step in factory.get('steps', []):
            if not isinstance(step, dict):
                continue
            step['outputPath'] = _migrated_output_path(step.get('outputPath'), old_root, new_root)
            for output in step.get('outputs', []):
                if isinstance(output, dict) and 'path' in output:
                    output['path'] = _migrated_output_path(output.get('path'), old_root, new_root)
    _write_workflows(config, temp_suffix='.migration.tmp')
    write_app_settings({**settings, 'content_root': str(new_root)})
    return True

def check_output_path_access(value):
    """Verify the background service can create, read, and remove a file here."""
    raw = str(value or '').strip()
    if not raw:
        raise ValueError('輸出路徑不可為空')
    target = resolve_output_path(raw)
    probe = target / f'.flowfactory-access-{uuid.uuid4().hex}.tmp'
    try:
        target.mkdir(parents=True, exist_ok=True)
        probe.write_text('FlowFactory path access test', encoding='utf-8')
        if probe.read_text(encoding='utf-8') != 'FlowFactory path access test':
            raise OSError('測試檔案內容無法驗證')
        probe.unlink()
        return {'accessible': True, 'path': str(target)}
    except OSError as exc:
        try:
            probe.unlink(missing_ok=True)
        except OSError:
            pass
        return {'accessible': False, 'path': str(target), 'error': str(exc)}

def _apple_script_quote(value):
    return str(value).replace('\\', '\\\\').replace('"', '\\"')

def _nearest_existing_directory(value):
    path = resolve_output_path(value)
    while path != path.parent and not path.is_dir():
        path = path.parent
    return path if path.is_dir() else None

def choose_output_folder(default_location=''):
    if sys.platform != 'darwin':
        raise ValueError('目前僅支援 macOS 原生資料夾選擇器，請手動輸入路徑')
    script = 'POSIX path of (choose folder with prompt "選擇流程輸出資料夾"'
    if default_location:
        start = _nearest_existing_directory(default_location)
        if start:
            script += f' default location POSIX file "{_apple_script_quote(str(start))}"'
    script += ')'
    result = subprocess.run(
        ['/usr/bin/osascript', '-e', script],
        capture_output=True, text=True, timeout=120, check=False,
    )
    if result.returncode:
        if '-128' in result.stderr:
            return None
        raise RuntimeError(result.stderr.strip() or '無法開啟資料夾選擇器')
    return result.stdout.strip().rstrip('/')

if DATA_DIR != ROOT:
    migrate_legacy_content_root()

def lan_ip_address():
    if sys.platform == 'darwin':
        for interface in ('en0', 'en1', 'en2', 'en3', 'en4', 'en5'):
            try:
                result = subprocess.run(
                    ['/usr/sbin/ipconfig', 'getifaddr', interface],
                    capture_output=True, text=True, timeout=1, check=False,
                )
                candidate = result.stdout.strip()
                address = ipaddress.ip_address(candidate)
                if address.version == 4 and address.is_private and not address.is_loopback:
                    return candidate
            except (OSError, ValueError, subprocess.TimeoutExpired):
                continue
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(('8.8.8.8', 80))
            candidate = probe.getsockname()[0]
            if not ipaddress.ip_address(candidate) in ipaddress.ip_network('198.18.0.0/15'):
                return candidate
    except OSError:
        pass
    try:
        candidate = socket.gethostbyname(socket.gethostname())
        return '' if ipaddress.ip_address(candidate).is_loopback else candidate
    except (OSError, ValueError):
        return ''

def password_digest(password, salt_hex):
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt_hex), 240000).hex()

def lan_session_token():
    return hmac.new(LAN_SESSION_SECRET, b'flow-factory-lan-session', hashlib.sha256).hexdigest()

def restart_current():
    time.sleep(1)
    os.execve(sys.executable, [sys.executable, str(ROOT / 'server.py')], os.environ.copy())

LAN_LOGIN_HTML = '''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factory Flow 登入</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f1f3f6;color:#151922;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(420px,calc(100vw - 32px));padding:28px;border:1px solid #dfe3e8;border-radius:20px;background:#fff;box-shadow:0 18px 55px rgba(17,24,39,.12)}h1{margin:0 0 8px;font-size:24px}p{margin:0 0 20px;color:#6b7280;line-height:1.6}input,button{width:100%;height:48px;border-radius:11px;font:inherit}input{padding:0 13px;border:1px solid #d5dae1}button{margin-top:12px;border:0;background:#111827;color:#fff;font-weight:800}#status{min-height:22px;margin-top:12px;color:#c0392b;font-size:13px}</style></head><body><form class="card" id="login"><h1>流程工廠</h1><p>這是 Mac 上的 Factory Flow。請輸入局域網存取密碼。</p><input id="password" type="password" autocomplete="current-password" placeholder="存取密碼" required autofocus><button id="submit">登入</button><div id="status"></div></form><script>const form=document.getElementById('login'),passwordInput=document.getElementById('password'),submitButton=document.getElementById('submit'),statusBox=document.getElementById('status');form.onsubmit=async e=>{e.preventDefault();submitButton.disabled=true;statusBox.textContent='正在驗證…';try{const r=await fetch('/api/lan/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:passwordInput.value})}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'登入失敗');location.reload()}catch(e){statusBox.textContent=e.message;submitButton.disabled=false}}</script></body></html>'''


def uninstall_flowfactory():
    """執行一般卸載（保留用戶資料）。回傳 stdout/stderr。"""
    script = Path(__file__).resolve().parent / 'scripts' / 'uninstall.sh'
    if not script.exists():
        script = Path.home() / '.flowfactory' / 'current' / 'scripts' / 'uninstall.sh'
    if not script.exists():
        raise RuntimeError('找不到 uninstall.sh')
    proc = subprocess.run(
        ['/bin/sh', str(script)],
        capture_output=True, text=True, timeout=120, input='\n',
    )
    return proc.returncode, proc.stdout, proc.stderr

def load_agent_settings():
    try:
        data = json.loads(AGENT_SETTINGS_FILE.read_text(encoding='utf-8'))
    except Exception:
        data = DEFAULT_AGENT_SETTINGS.copy()
    return {
        'mode': str(data.get('mode', 'disabled')).strip(),
        'name': str(data.get('name', 'Agent')).strip() or 'Agent',
        'webhook_url': str(data.get('webhook_url', '')).strip(),
        'token': str(data.get('token', '')).strip(),
        'verified': data.get('verified') is True,
    }

def write_agent_settings(settings):
    temp_file = AGENT_SETTINGS_FILE.with_suffix('.json.tmp')
    temp_file.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp_file, AGENT_SETTINGS_FILE)

def public_agent_settings():
    settings = load_agent_settings()
    return {
        'mode': settings['mode'],
        'name': settings['name'] or 'Agent',
        'webhook_url': settings['webhook_url'],
        'token_present': bool(settings['token']),
        'connected': settings['mode'] == 'hermes' or (settings['mode'] == 'webhook' and bool(settings['webhook_url']) and settings['verified']),
    }

def build_webhook_headers(settings, body):
    headers = {'Content-Type': 'application/json', 'User-Agent': 'FlowFactory/1.0'}
    parsed = urlparse(settings['webhook_url'])
    is_local_hermes = parsed.hostname in {'127.0.0.1', 'localhost'} and parsed.port == 8644 and parsed.path.startswith('/webhooks/')
    if is_local_hermes:
        route = parsed.path.rstrip('/').split('/')[-1]
        try:
            subscriptions = json.loads(HERMES_SUBSCRIPTIONS_FILE.read_text(encoding='utf-8'))
            secret = str(subscriptions[route]['secret'])
        except Exception as exc:
            raise RuntimeError(f'Hermes Webhook route「{route}」沒有可用的簽名密鑰') from exc
        headers.update({
            'X-Hub-Signature-256': 'sha256=' + hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest(),
            'X-GitHub-Event': route,
            'X-Request-ID': f'flow-factory-{time.time_ns()}',
        })
    elif settings['token']:
        headers['Authorization'] = f"Bearer {settings['token']}"
    return headers

def open_webhook(request, webhook_url, timeout):
    parsed = urlparse(webhook_url)
    if parsed.hostname in {'127.0.0.1', 'localhost'}:
        return urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=timeout)
    return urllib.request.urlopen(request, timeout=timeout)

def test_agent_webhook(settings):
    body = json.dumps({'prompt': '這是 Flow Factory 連接測試，請回覆連接成功。', 'source': 'flow-factory', 'event_type': 'connection_test'}, ensure_ascii=False).encode('utf-8')
    headers = build_webhook_headers(settings, body)
    request = urllib.request.Request(settings['webhook_url'], data=body, headers=headers, method='POST')
    with open_webhook(request, settings['webhook_url'], 15) as response:
        response_text = response.read(64 * 1024).decode('utf-8', errors='replace')
        if not 200 <= response.status < 300:
            raise RuntimeError(f'Webhook 回應 HTTP {response.status}')
    # 異步型偵測：status=accepted + result_url/result_location（或 HTTP 202）→ 連線成功，執行時需輪詢結果
    try:
        response_data = json.loads(response_text)
        async_hint = isinstance(response_data, dict) and response_data.get('status') == 'accepted' and bool(response_data.get('result_url') or response_data.get('result_location'))
        is_async = async_hint or response.status == 202
    except Exception:
        is_async = response.status == 202
    if is_async:
        return {'async': True, 'message': 'Webhook 已接受任務（異步型），執行時將自動輪詢結果'}
    return {'async': False}

def safe_segment(value):
    text = str(value or '').strip().replace('/', '_').replace(':', '_')
    return '__' if text in {'.', '..'} else (text or '未命名')

def _portable_output_path(value, factory_name='', step_title=''):
    """Convert a local output path into a portable relative store path."""
    raw = str(value or '').strip().replace('\\', '/')
    if not raw:
        return ''
    try:
        root = Path(load_app_settings()['content_root']).expanduser().resolve(strict=False)
        candidate = Path(raw).expanduser().resolve(strict=False)
        relative = candidate.relative_to(root)
        return '/'.join(part for part in relative.parts if part not in {'.', '..'})
    except (OSError, ValueError):
        pass
    if not (Path(raw).is_absolute() or raw.startswith('~')):
        parts = [part for part in Path(raw).parts if part not in {'.', '..'}]
        if parts and '..' not in Path(raw).parts:
            return '/'.join(parts)
    return f"{safe_segment(factory_name)}/{safe_segment(step_title)}"

def run_hermes_prompt(prompt):
    prompt = str(prompt or '').strip()
    if not prompt:
        raise ValueError('提示詞不可為空')
    if len(prompt.encode('utf-8')) > 1024 * 1024:
        raise ValueError('提示詞不可超過 1 MB')
    try:
        subscriptions = json.loads(HERMES_SUBSCRIPTIONS_FILE.read_text(encoding='utf-8'))
        secret = str(subscriptions[HERMES_WEBHOOK_ROUTE]['secret'])
    except Exception as exc:
        raise RuntimeError('Hermes Webhook 尚未設定，請先建立 automoney-task route') from exc
    body = json.dumps({'prompt': prompt, 'event_type': 'automoney-task'}, ensure_ascii=False).encode('utf-8')
    signature = 'sha256=' + hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest()
    request = urllib.request.Request(
        HERMES_WEBHOOK_URL,
        data=body,
        headers={
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': signature,
            'X-GitHub-Event': 'automoney-task',
            'X-Request-ID': f'automoney-{time.time_ns()}',
        },
        method='POST',
    )
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(request, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            if response.status != 202 or result.get('status') != 'accepted':
                raise RuntimeError(f'Hermes 未接受任務：{result}')
            return result
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'Hermes Webhook 回應 {exc.code}：{detail}') from exc
    except urllib.error.URLError as exc:
        raise RuntimeError('無法連線 Hermes Gateway，請確認 gateway 正在運行') from exc


def _task_event(task_id, message, kind='info'):
    message = ANSI_ESCAPE_RE.sub('', str(message or '')).strip()
    if not message:
        return
    with HERMES_TASKS_LOCK:
        task = HERMES_TASKS.get(task_id)
        if task is None:
            return
        # Agent 回覆可能包含完整 workflow JSON 與腳本本體，不能沿用一般日誌的
        # 8 KB 截斷，否則 JSON 尾端消失後前端無法顯示修改確認。
        message_limit = 512 * 1024 if kind == 'agent' else 8000
        task['events'].append({'at': time.time(), 'kind': kind, 'message': message[:message_limit]})
        task['events'] = task['events'][-300:]


def _run_hermes_task(task_id, prompt, session_id=''):
    with HERMES_TASKS_LOCK:
        task = HERMES_TASKS[task_id]
        task['status'] = 'running'
        task['started_at'] = time.time()
    _task_event(task_id, 'Hermes Agent 已啟動，正在處理任務。', 'status')
    try:
        command = [HERMES_BIN, 'chat', '--quiet', '--cli', '--pass-session-id', '--source', 'automoney-dashboard']
        if session_id:
            command.extend(['--resume', session_id])
        command.extend(['-q', prompt])
        process = subprocess.Popen(
            command,
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            bufsize=1,
            start_new_session=os.name != 'nt',
        )
        with HERMES_TASKS_LOCK:
            task = HERMES_TASKS[task_id]
            task['pid'] = process.pid
            HERMES_PROCESSES[task_id] = process
            cancel_requested = task.get('cancel_requested', False)
        if cancel_requested:
            _terminate_agent_process(process)
        _task_event(task_id, f'Agent process PID {process.pid}，等待執行回應。', 'status')
        # Use a reader thread so a quiet long-running Agent does not block the
        # cancellation check. There is intentionally no wall-clock deadline.
        output_queue = queue.Queue()
        def read_output():
            if not process.stdout:
                output_queue.put(None)
                return
            try:
                for line in process.stdout:
                    output_queue.put(line)
            finally:
                output_queue.put(None)
        reader = threading.Thread(target=read_output, daemon=True)
        reader.start()
        output_done = False
        while True:
            try:
                line = output_queue.get(timeout=0.2)
                if line is None:
                    output_done = True
                else:
                    # Hermes prints the newly-created session ID when a turn ends.
                    # Keep it on the task so the browser can resume it on the next turn.
                    match = re.search(r'(?i)session(?:[_\s-]*id)?\s*[:=]\s*([a-z0-9][a-z0-9_-]{5,})', line)
                    if match:
                        with HERMES_TASKS_LOCK:
                            HERMES_TASKS[task_id]['session_id'] = match.group(1)
                    _task_event(task_id, line, 'agent')
            except queue.Empty:
                pass
            with HERMES_TASKS_LOCK:
                cancel_requested = HERMES_TASKS[task_id].get('cancel_requested', False)
            if cancel_requested:
                _terminate_agent_process(process)
            if process.poll() is not None and output_done:
                return_code = process.returncode
                break
        return_code = process.wait()
        with HERMES_TASKS_LOCK:
            HERMES_PROCESSES.pop(task_id, None)
            task = HERMES_TASKS[task_id]
            task['return_code'] = return_code
            cancelled = task.get('cancel_requested', False)
            task['status'] = 'cancelled' if cancelled else ('completed' if return_code == 0 else 'failed')
            task['finished_at'] = time.time()
        if cancelled:
            _task_event(task_id, '任務已由使用者停止。', 'status')
        elif return_code == 0:
            _task_event(task_id, '任務執行完成。', 'success')
        else:
            _task_event(task_id, f'Hermes 執行失敗（exit {return_code}）。', 'error')
    except Exception as exc:
        with HERMES_TASKS_LOCK:
            HERMES_PROCESSES.pop(task_id, None)
            task = HERMES_TASKS[task_id]
            task['status'] = 'cancelled' if task.get('cancel_requested') else 'failed'
            task['finished_at'] = time.time()
            task['error'] = str(exc)
        _task_event(task_id, f'無法啟動 Hermes：{exc}', 'error')


def _script_command_for_step(factory, step, values):
    """從腳本本體產生執行指令：本體替換變數後寫入暫存檔，回傳 (執行指令, 輸出目錄, 暫存檔路徑)。

    腳本本體存在 step.script（JSON 內），支援 {{參數ID}} 與 ${OUT} 替換；
    執行完畢由呼叫端刪除暫存檔。
    """
    body = str(step.get('script', '')).strip()
    if not body:
        raise ValueError('腳本流程缺少腳本代碼')
    if '\x00' in body or len(body.encode('utf-8')) > 1024 * 1024:
        raise ValueError('腳本代碼格式不正確或超過 1 MB')
    output_dir = resolve_output_path(step.get('outputPath') or _scheduled_output_path(factory, step))
    output_dir.mkdir(parents=True, exist_ok=True)
    body = body.replace('${OUT}', str(output_dir)).replace('{{output_dir}}', str(output_dir))
    fields = step.get('fields') if isinstance(step.get('fields'), list) else []
    for field in fields:
        field_id = str(field.get('id', '')).strip()
        if not field_id:
            continue
        value = values.get(field_id, field.get('default', ''))
        body = body.replace('{{' + field_id + '}}', str(value))
    # 寫入暫存檔（用完即焚）；順手清理 >24h 的舊暫存（server 崩潰/測試殘留防護）
    tmp_dir = Path(tempfile.gettempdir()) / 'flowfactory-scripts'
    tmp_dir.mkdir(parents=True, exist_ok=True)
    try:
        cutoff = time.time() - 86400
        for stale in tmp_dir.iterdir():
            try:
                if stale.stat().st_mtime < cutoff:
                    stale.unlink()
            except OSError:
                pass
    except OSError:
        pass
    fd, tmp_path = tempfile.mkstemp(suffix='.py', dir=str(tmp_dir), prefix='flowscript_')
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(body)
    return f'python3 {tmp_path}', output_dir, tmp_path


def _run_local_script_task(task_id, command, cwd, tmp_script=None):
    with HERMES_TASKS_LOCK:
        task = HERMES_TASKS[task_id]
        task['status'] = 'running'
        task['started_at'] = time.time()
    _task_event(task_id, f'正在本機執行腳本：{command[:600]}', 'status')
    try:
        runner = ['cmd.exe', '/d', '/s', '/c', command] if os.name == 'nt' else ['/bin/zsh', '-lc', command]
        process = subprocess.Popen(
            runner,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            bufsize=1,
            start_new_session=os.name != 'nt',
        )
        with HERMES_TASKS_LOCK:
            task = HERMES_TASKS[task_id]
            task['pid'] = process.pid
            HERMES_PROCESSES[task_id] = process
            cancel_requested = task.get('cancel_requested', False)
        if cancel_requested:
            _terminate_agent_process(process)
        output_queue = queue.Queue()
        def read_output():
            if not process.stdout:
                return
            try:
                for line in process.stdout:
                    output_queue.put(line)
            finally:
                output_queue.put(None)
        reader = threading.Thread(target=read_output, daemon=True)
        reader.start()
        output_done = False
        while True:
            try:
                line = output_queue.get(timeout=0.2)
                if line is None:
                    output_done = True
                else:
                    _task_event(task_id, line, 'script')
            except queue.Empty:
                pass
            if process.poll() is not None and output_done:
                return_code = process.returncode
                break
            with HERMES_TASKS_LOCK:
                cancel_requested = HERMES_TASKS[task_id].get('cancel_requested', False)
            if cancel_requested:
                _terminate_agent_process(process)
        try:
            return_code = process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            _terminate_agent_process(process)
            try:
                return_code = process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                return_code = -9
            with HERMES_TASKS_LOCK:
                HERMES_PROCESSES.pop(task_id, None)
                task = HERMES_TASKS[task_id]
                task['return_code'] = return_code
                cancelled = task.get('cancel_requested', False)
                task['status'] = 'cancelled' if cancelled else 'failed'
                task['finished_at'] = time.time()
                task['error'] = task.get('error') or '腳本程序結束後未能在回收期限內完成清理'
            _task_event(task_id, '腳本程序已結束，但清理程序未能立即完成。', 'error')
            return
        with HERMES_TASKS_LOCK:
            HERMES_PROCESSES.pop(task_id, None)
            task = HERMES_TASKS[task_id]
            task['return_code'] = return_code
            cancelled = task.get('cancel_requested', False)
            task['status'] = 'cancelled' if cancelled else ('completed' if return_code == 0 else 'failed')
            task['finished_at'] = time.time()
        if cancelled:
            _task_event(task_id, '本機腳本已由使用者停止。', 'status')
        elif return_code == 0:
            _task_event(task_id, '本機腳本執行完成。', 'success')
        else:
            _task_event(task_id, f'本機腳本執行失敗（exit {return_code}）。', 'error')
        if tmp_script:
            try:
                os.remove(tmp_script)
            except OSError:
                pass
    except Exception as exc:
        with HERMES_TASKS_LOCK:
            HERMES_PROCESSES.pop(task_id, None)
            task = HERMES_TASKS[task_id]
            task['status'] = 'cancelled' if task.get('cancel_requested') else 'failed'
            task['finished_at'] = time.time()
            task['error'] = str(exc)
        _task_event(task_id, f'無法啟動本機腳本：{exc}', 'error')


def start_script_task(factory, step, values=None):
    values = values if isinstance(values, dict) else {}
    command, output_dir, tmp_script = _script_command_for_step(factory, step, values)
    now = time.time()
    task_id = uuid.uuid4().hex
    with HERMES_TASKS_LOCK:
        stale = [key for key, value in HERMES_TASKS.items()
                 if value.get('finished_at') and now - value['finished_at'] > 86400]
        for key in stale:
            HERMES_TASKS.pop(key, None)
        HERMES_TASKS[task_id] = {
            'task_id': task_id, 'mode': 'script', 'status': 'queued',
            'created_at': now, 'started_at': None, 'finished_at': None,
            'pid': None, 'return_code': None, 'error': '', 'events': [],
        }
    _task_event(task_id, f'腳本任務已建立，工作目錄：{output_dir}', 'status')
    threading.Thread(target=_run_local_script_task, args=(task_id, command, output_dir, tmp_script), daemon=True).start()
    return task_id


def _terminate_agent_process(process):
    if process.poll() is not None:
        return
    if os.name == 'nt':
        process.terminate()
    else:
        os.killpg(process.pid, signal.SIGTERM)


def cancel_agent_task(task_id):
    with HERMES_TASKS_LOCK:
        task = HERMES_TASKS.get(task_id)
        if task is None:
            raise KeyError('找不到執行任務')
        if task['status'] in {'completed', 'failed', 'cancelled'}:
            process = None
            already_finished = True
        else:
            task['cancel_requested'] = True
            task['status'] = 'cancelled'
            task['finished_at'] = time.time()
            process = HERMES_PROCESSES.get(task_id) if task.get('mode') in {'hermes', 'script'} else None
            already_finished = False
        webhook_task = task.get('mode') == 'webhook'
    if already_finished:
        return hermes_task_snapshot(task_id)
    if process is not None:
        _terminate_agent_process(process)
    if webhook_task:
        _task_event(task_id, 'Flow Factory 已停止此 Webhook 步驟與後續流程；外部 Agent 若沒有取消 API，已送出的工作可能仍會繼續。', 'status')
    elif task.get('mode') == 'script':
        _task_event(task_id, '正在停止本機腳本任務。', 'status')
    else:
        _task_event(task_id, '正在停止 Hermes Agent 任務。', 'status')
    return hermes_task_snapshot(task_id)


def start_hermes_task(prompt, session_id=''):
    prompt = str(prompt or '').strip()
    if not prompt:
        raise ValueError('提示詞不可為空')
    if len(prompt.encode('utf-8')) > 1024 * 1024:
        raise ValueError('提示詞不可超過 1 MB')
    session_id = str(session_id or '').strip()
    if session_id and not re.fullmatch(r'[A-Za-z0-9_-]{6,200}', session_id):
        raise ValueError('session_id 格式不正確')
    if not Path(HERMES_BIN).exists():
        raise RuntimeError(f'找不到 Hermes CLI：{HERMES_BIN}')
    now = time.time()
    task_id = uuid.uuid4().hex
    with HERMES_TASKS_LOCK:
        stale = [key for key, value in HERMES_TASKS.items()
                 if value.get('finished_at') and now - value['finished_at'] > 86400]
        for key in stale:
            HERMES_TASKS.pop(key, None)
        HERMES_TASKS[task_id] = {
            'task_id': task_id,
            'mode': 'hermes',
            'status': 'queued',
            'created_at': now,
            'started_at': None,
            'finished_at': None,
            'pid': None,
            'return_code': None,
            'error': '',
            'session_id': session_id,
            'events': [],
        }
    _task_event(task_id, '任務已建立，準備啟動 Hermes Agent。', 'status')
    threading.Thread(target=_run_hermes_task, args=(task_id, prompt, session_id), daemon=True).start()
    return task_id

def _run_webhook_task(task_id, prompt, settings):
    with HERMES_TASKS_LOCK:
        task = HERMES_TASKS[task_id]
        if task.get('cancel_requested'):
            return
        task['status'] = 'running'
        task['started_at'] = time.time()
    name = settings['name'] or 'Agent'
    _task_event(task_id, f'正在將任務傳送給 {name} Webhook。', 'status')
    body = json.dumps({'prompt': prompt, 'source': 'flow-factory'}, ensure_ascii=False).encode('utf-8')
    headers = build_webhook_headers(settings, body)
    request = urllib.request.Request(settings['webhook_url'], data=body, headers=headers, method='POST')
    try:
        with open_webhook(request, settings['webhook_url'], 60) as response:
            response_text = response.read(1024 * 1024).decode('utf-8', errors='replace')
        try:
            response_data = json.loads(response_text)
        except Exception:
            response_data = None
        result_text = response_text
        async_url = ''
        if isinstance(response_data, dict) and response_data.get('status') == 'accepted':
            async_url = str(response_data.get('result_url') or response_data.get('result_location') or '')
        if not async_url and response.status == 202:
            # HTTP 202：優先取 body 的 result_location/result_url，其次取 Location header
            async_url = str(response_data.get('result_location') or response_data.get('result_url') or '') if isinstance(response_data, dict) else ''
            if not async_url:
                async_url = str(response.headers.get('Location') or '') or str(response.headers.get('result_location') or '')
        if async_url:
            # Webhook 異步執行：先接受任務（result_url / result_location / HTTP 202），需輪詢拿最終結果
            result_url = async_url
            _task_event(task_id, f'{name} 已接受任務，正在等待執行結果…', 'status')
            # Keep polling until the remote task completes or the user cancels it.
            # There is intentionally no wall-clock deadline here.
            while True:
                with HERMES_TASKS_LOCK:
                    if HERMES_TASKS[task_id].get('cancel_requested'):
                        break
                try:
                    with open_webhook(urllib.request.Request(result_url, method='GET'), result_url, 20) as result_response:
                        result_payload = json.loads(result_response.read(1024 * 1024).decode('utf-8', errors='replace'))
                    status = result_payload.get('status')
                    if status == 'completed':
                        result_text = str(result_payload.get('result') or '')
                        if not result_text:
                            result_text = json.dumps(result_payload, ensure_ascii=False)
                        _task_event(task_id, result_text, 'agent')
                        break
                    if status == 'failed':
                        result_text = str(result_payload.get('error') or 'Webhook 執行失敗')
                        _task_event(task_id, result_text, 'error')
                        break
                except Exception as poll_exc:
                    _task_event(task_id, f'等待 Webhook 結果時發生錯誤：{poll_exc}', 'status')
                time.sleep(2)
        else:
            _task_event(task_id, result_text or f'{name} 已接受任務。', 'agent')
        with HERMES_TASKS_LOCK:
            task = HERMES_TASKS[task_id]
            cancelled = task.get('cancel_requested', False)
            if not cancelled:
                task['status'] = 'completed'
                task['finished_at'] = time.time()
        if cancelled:
            _task_event(task_id, f'Flow Factory 已停止等待；{name} 若沒有取消 API，外部任務可能仍會繼續。', 'status')
        else:
            _task_event(task_id, f'{name} Webhook 執行完成。', 'success')
    except Exception as exc:
        with HERMES_TASKS_LOCK:
            task = HERMES_TASKS[task_id]
            cancelled = task.get('cancel_requested', False)
            if not cancelled:
                task['status'] = 'failed'
                task['finished_at'] = time.time()
                task['error'] = str(exc)
        if not cancelled:
            _task_event(task_id, f'{name} Webhook 執行失敗：{exc}', 'error')

def start_agent_task(prompt, session_id=''):
    settings = load_agent_settings()
    mode = settings['mode']
    if mode == 'hermes':
        return start_hermes_task(prompt, session_id)
    if mode != 'webhook' or not settings['webhook_url'] or not settings['verified']:
        raise RuntimeError('尚未連接 Agent，請先到工作台設定完成連接')
    parsed = urlparse(settings['webhook_url'])
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise ValueError('Webhook URL 必須是有效的 http 或 https 網址')
    prompt = str(prompt or '').strip()
    if not prompt:
        raise ValueError('提示詞不可為空')
    if len(prompt.encode('utf-8')) > 1024 * 1024:
        raise ValueError('提示詞不可超過 1 MB')
    now = time.time()
    task_id = uuid.uuid4().hex
    with HERMES_TASKS_LOCK:
        HERMES_TASKS[task_id] = {'task_id': task_id, 'mode': 'webhook', 'status': 'queued', 'created_at': now, 'started_at': None, 'finished_at': None, 'pid': None, 'return_code': None, 'error': '', 'events': []}
    _task_event(task_id, '任務已建立，準備連接 Agent。', 'status')
    threading.Thread(target=_run_webhook_task, args=(task_id, prompt, settings), daemon=True).start()
    return task_id


def hermes_task_snapshot(task_id):
    with HERMES_TASKS_LOCK:
        task = HERMES_TASKS.get(task_id)
        if task is None:
            return None
        snapshot = dict(task)
        snapshot['events'] = [dict(event) for event in task['events']]
    start = snapshot.get('started_at') or snapshot['created_at']
    end = snapshot.get('finished_at') or time.time()
    snapshot['elapsed_seconds'] = max(0, round(end - start, 1))
    return snapshot


def _scheduled_output_path(factory, step):
    configured_root = Path(load_app_settings()['content_root']).expanduser()
    return str(configured_root / safe_segment(factory.get('name')) / safe_segment(step.get('title')))

def declared_output_paths():
    try:
        config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
        declared = set()
        for factory in (config.get('workflows') if isinstance(config.get('workflows'), list) else []):
            if not isinstance(factory, dict):
                continue
            for step in (factory.get('steps') if isinstance(factory.get('steps'), list) else []):
                if not isinstance(step, dict):
                    continue
                try:
                    output_dir = resolve_output_path(step.get('outputPath') or _scheduled_output_path(factory, step))
                    for output in (step.get('outputs') if isinstance(step.get('outputs'), list) else []):
                        item = {'filename': output} if isinstance(output, str) else output
                        filename = str(item.get('filename', '')).strip()
                        if filename and Path(filename).name == filename:
                            declared.add((output_dir / filename).resolve())
                except Exception:
                    continue
        return declared
    except Exception:
        return set()

def ai_flow_context(factory_id):
    """Return the selected employee, flow cards, and safe output-file excerpts."""
    config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
    factory = next((item for item in config.get('workflows', []) if isinstance(item, dict) and str(item.get('id')) == str(factory_id)), None)
    if factory is None:
        raise ValueError('找不到指定員工')
    context = {'employee_id': str(factory.get('id', '')), 'revision': _employee_revision(factory), 'employee_json': factory, 'flows': []}
    remaining = 120 * 1024
    for step in factory.get('steps', []) if isinstance(factory.get('steps'), list) else []:
        if not isinstance(step, dict):
            continue
        flow = {'step_id': str(step.get('id', '')), 'outputs': []}
        output_dir = resolve_output_path(step.get('outputPath') or _scheduled_output_path(factory, step))
        for output in step.get('outputs', []) if isinstance(step.get('outputs'), list) else []:
            item = {'filename': output} if isinstance(output, str) else output
            filename = str(item.get('filename', '')).strip()
            if not filename or Path(filename).name != filename:
                continue
            target = output_dir / filename
            record = {'filename': filename, 'path': str(target), 'exists': target.is_file()}
            if record['exists']:
                try:
                    stat = target.stat()
                    record.update({'size': stat.st_size, 'mtime': stat.st_mtime})
                    if target.suffix.lower() in {'.md', '.json', '.txt', '.csv', '.html'} and remaining > 0:
                        text = target.read_text(encoding='utf-8')
                        excerpt = text[:min(24 * 1024, remaining)]
                        record['content'] = excerpt
                        record['truncated'] = len(excerpt) < len(text)
                        remaining -= len(excerpt.encode('utf-8'))
                except (OSError, UnicodeDecodeError) as exc:
                    record['read_error'] = str(exc)
            flow['outputs'].append(record)
        context['flows'].append(flow)
    return context


def _scheduled_prompt(factory, step, values):
    output_dir = str(resolve_output_path(step.get('outputPath') or _scheduled_output_path(factory, step)))
    prompt = str(step.get('prompt', '')).replace('${OUT}', output_dir).replace('{{output_dir}}', output_dir)
    fields = step.get('fields') if isinstance(step.get('fields'), list) else []
    for field in fields:
        field_id = str(field.get('id', ''))
        value = values.get(field_id, field.get('default', ''))
        prompt = prompt.replace('{{' + field_id + '}}', str(value))
    outputs = step.get('outputs') if isinstance(step.get('outputs'), list) else []
    output_lines = []
    for output in outputs:
        item = {'filename': output} if isinstance(output, str) else output
        filename = str(item.get('filename', ''))
        output_lines.append(f"- {item.get('label') or filename}：{output_dir}/{filename}")
    return (
        "你是任務執行 Agent，請執行以下工作流任務。\n\n"
        f"【工廠】\n{factory.get('name', factory.get('id', '工作流工廠'))}\n\n"
        f"【任務名稱】\n{step.get('title', '未命名任務')}\n\n"
        f"【執行提示詞】\n{prompt}\n\n"
        "【輸出格式與路徑】\n"
        + ('\n'.join(output_lines) if output_lines else '此步驟沒有指定輸出檔案。')
        + "\n\n【完成要求】\n實際執行任務並驗證輸出；完成後回報結果與完整路徑。"
    )


def run_scheduled_factory(factory_id, schedule):
    config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
    factories = config.get('workflows') if isinstance(config.get('workflows'), list) else []
    factory = next((item for item in factories if str(item.get('id')) == str(factory_id)), None)
    if factory is None:
        raise RuntimeError('排程對應的工廠已不存在')
    if not licensing.status(refresh=False)['licensed']:
        first_id = str((factories or [{}])[0].get('id', ''))
        if str(factory_id) != first_id:
            raise RuntimeError('免費版只能自動執行第一個工作流工廠')
    steps = factory.get('steps') if isinstance(factory.get('steps'), list) else []
    if not steps:
        raise RuntimeError('工廠沒有可執行的流程')
    values = schedule.get('values') if isinstance(schedule.get('values'), dict) else {}
    missing = []
    for step in steps:
        for field in step.get('fields') or []:
            value = values.get(str(field.get('id')), field.get('default', ''))
            if field.get('required') is not False and not str(value).strip():
                missing.append(f"{step.get('title')}／{field.get('label') or field.get('id')}")
    if missing:
        raise RuntimeError('缺少排程輸入參數：' + '、'.join(missing[:3]))
    ordered_steps = sorted(steps, key=lambda item: item.get('order', 0))
    with SCHEDULE_RUNS_LOCK:
        SCHEDULE_RUNS[str(factory_id)] = {
            'factory_id': str(factory_id), 'cancel_requested': False,
            'current_task_id': '', 'current_step_id': '', 'current_step_title': '',
            'current_step_index': 0, 'total_steps': len(ordered_steps),
        }
    try:
        for index, step in enumerate(ordered_steps):
            with SCHEDULE_RUNS_LOCK:
                run = SCHEDULE_RUNS[str(factory_id)]
                if run['cancel_requested']:
                    raise ScheduleRunCancelled()
                run.update({
                    'current_step_id': str(step.get('id', '')),
                    'current_step_title': str(step.get('title', '未命名任務')),
                    'current_step_index': index,
                })
            task_id = (start_script_task(factory, step, values)
                       if str(step.get('type', 'prompt')) == 'script'
                       else start_agent_task(_scheduled_prompt(factory, step, values)) )
            with SCHEDULE_RUNS_LOCK:
                run = SCHEDULE_RUNS[str(factory_id)]
                run['current_task_id'] = task_id
                cancel_requested = run['cancel_requested']
            if cancel_requested:
                cancel_agent_task(task_id)
                raise ScheduleRunCancelled()
            while True:
                task = hermes_task_snapshot(task_id)
                if task is None:
                    raise RuntimeError('無法讀取 Agent 任務狀態')
                with SCHEDULE_RUNS_LOCK:
                    cancel_requested = SCHEDULE_RUNS[str(factory_id)]['cancel_requested']
                if cancel_requested:
                    if task['status'] not in {'completed', 'failed', 'cancelled'}:
                        cancel_agent_task(task_id)
                    raise ScheduleRunCancelled()
                if task['status'] == 'completed':
                    break
                if task['status'] in {'failed', 'cancelled'}:
                    raise RuntimeError(task.get('error') or f"{step.get('title')} 執行失敗")
                time.sleep(1)
            with SCHEDULE_RUNS_LOCK:
                SCHEDULE_RUNS[str(factory_id)]['current_task_id'] = ''
    finally:
        with SCHEDULE_RUNS_LOCK:
            SCHEDULE_RUNS.pop(str(factory_id), None)


def scheduled_run_snapshot(factory_id):
    with SCHEDULE_RUNS_LOCK:
        run = SCHEDULE_RUNS.get(str(factory_id))
        return dict(run) if run else None


def cancel_scheduled_factory(factory_id):
    with SCHEDULE_RUNS_LOCK:
        run = SCHEDULE_RUNS.get(str(factory_id))
        if run is None:
            raise KeyError('目前沒有正在執行的自動化流程')
        run['cancel_requested'] = True
        task_id = run.get('current_task_id', '')
        snapshot = dict(run)
    if task_id:
        try:
            cancel_agent_task(task_id)
        except KeyError:
            pass
    return snapshot


SCHEDULE_MANAGER = ScheduleManager(SCHEDULES_FILE, run_scheduled_factory)

def _store_safe_factory(factory, keep_legacy_source=False):
    if not isinstance(factory, dict):
        raise ValueError('工廠配置格式不正確')
    name = str(factory.get('name', '')).strip()[:80]
    description = str(factory.get('description', '')).strip()[:300]
    steps = factory.get('steps')
    if not name or not description or not isinstance(steps, list):
        raise ValueError('工廠必須包含名稱、簡介與流程列表')
    if len(steps) > 100:
        raise ValueError('單一工廠最多包含 100 個流程')
    cleaned = json.loads(json.dumps(factory, ensure_ascii=False))
    cleaned['name'] = name
    cleaned['description'] = description
    cleaned.pop('schedule', None)
    for step in cleaned.get('steps') or []:
        if not isinstance(step, dict):
            continue
        step_title = str(step.get('title') or '').strip()
        step['outputPath'] = _portable_output_path(step.get('outputPath'), name, step_title)
        outputs = step.get('outputs')
        if isinstance(outputs, list):
            for output in outputs:
                if isinstance(output, dict) and 'path' in output:
                    output['path'] = _portable_output_path(output.get('path'), name, step_title)
        # 腳本模式卡片：v1.50 起 step.script 就是腳本本體（JSON 內）。
        # 舊卡片若是執行指令格式（python3 <path> ...），自動讀檔回填成本體（遷移）。
        if str(step.get('type') or '') == 'script':
            script = str(step.get('script') or '').strip()
            match = re.match(r'^(python3?|bash|zsh|sh)\s+(\S+\.(?:py|sh))(?:\s+(.*))?$', script)
            if match:
                script_path = Path(match.group(2)).expanduser()
                if script_path.is_file():
                    try:
                        step['script'] = script_path.read_text(encoding='utf-8')
                    except Exception:
                        pass
            if not keep_legacy_source:
                step.pop('script_source', None)
                step.pop('script_name', None)
                step.pop('script_args', None)
    return cleaned

def _install_store_factory(factory):
    imported = _store_safe_factory(factory, keep_legacy_source=True)
    config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8')) if WORKFLOWS_FILE.is_file() else {'workflows': []}
    workflows = config.get('workflows')
    if not isinstance(workflows, list):
        raise ValueError('本機 workflows.json 格式不正確')
    existing_ids = {str(item.get('id', '')).casefold() for item in workflows}
    existing_names = {str(item.get('name', '')).casefold() for item in workflows}
    base_id = str(imported.get('id', '')).strip() or f'factory-{int(time.time() * 1000)}'
    base_name = imported['name']
    candidate_id = base_id
    candidate_name = base_name
    copy_number = 1
    while candidate_id.casefold() in existing_ids:
        copy_number += 1
        marker = 'copy' if copy_number == 2 else f'copy-{copy_number}'
        candidate_id = f'{base_id}-{marker}'
    copy_number = 1
    while candidate_name.casefold() in existing_names:
        copy_number += 1
        marker = 'Copy' if copy_number == 2 else f'Copy {copy_number}'
        candidate_name = f'{base_name} {marker}'
    imported['id'] = candidate_id
    imported['name'] = candidate_name
    imported['status'] = 'ready'
    content_root = Path(load_app_settings()['content_root']).expanduser()
    for index, step in enumerate(imported['steps']):
        if not isinstance(step, dict):
            raise ValueError('流程配置格式不正確')
        step['id'] = f'step-{int(time.time() * 1000)}-{index + 1}-{secrets.token_hex(2)}'
        step['order'] = index + 1
        step['status'] = 'pending'
        output_path = content_root / safe_segment(candidate_name) / safe_segment(step.get('title') or step['id'])
        step['outputPath'] = str(output_path)
        for output in step.get('outputs', []):
            if isinstance(output, dict):
                output['path'] = str(output_path)
        # 腳本模式卡片：v1.50 起 step.script 已是本體（上傳端已遷移）。
        # 若收到舊版（帶 script_source）→ 直接回填成本體，不落地檔案。
        if str(step.get('type') or '') == 'script':
            if step.get('script_source') and not str(step.get('script') or '').strip().startswith(('#!', 'import ', 'from ')):
                step['script'] = str(step.get('script_source') or '')
            step.pop('script_source', None)
            step.pop('script_name', None)
            step.pop('script_args', None)
    workflows.append(imported)
    config['workflows'] = workflows
    _write_workflows(config, temp_suffix='.store.tmp')
    return imported

def _preview_store():
    if not STORE_PREVIEW_FILE.is_file():
        return {'factories': []}
    try:
        data = json.loads(STORE_PREVIEW_FILE.read_text(encoding='utf-8'))
        if not isinstance(data.get('factories'), list):
            return {'factories': []}
        for item in data['factories']:
            item.setdefault('status', 'pending')
            item.setdefault('review_note', None)
        return data
    except Exception:
        return {'factories': []}

def _write_preview_store(data):
    temp = STORE_PREVIEW_FILE.with_suffix('.json.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, STORE_PREVIEW_FILE)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        if urlparse(self.path).path in {'/', '/index.html'}:
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def _json(self, payload, status=200):
        raw = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _is_local_client(self):
        return self.client_address[0] in {'127.0.0.1', '::1'}

    def _lan_authorized(self):
        if self._is_local_client() or not load_app_settings()['lan_enabled']:
            return True
        cookies = self.headers.get('Cookie', '').split(';')
        token = next((item.split('=', 1)[1].strip() for item in cookies if item.strip().startswith('flowfactory_lan=')), '')
        return hmac.compare_digest(token, lan_session_token())

    def _require_lan_auth(self, path):
        if self._lan_authorized() or path in {'/api/lan/login', '/webhook'}:
            return False
        if path in {'/', '/index.html'}:
            raw = LAN_LOGIN_HTML.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        else:
            self._json({'ok': False, 'error': '請先輸入局域網存取密碼'}, 401)
        return True

    def _settings_payload(self, key):
        target = SETTINGS_FILES.get(key)
        if target is None:
            raise KeyError('不支援的設定檔')
        content = target.read_text(encoding='utf-8')
        parsed = json.loads(content)
        limited = False
        if key == 'workflows':
            license_state = licensing.status(refresh=False)
            limited = not license_state.get('licensed')
            parsed = licensing.limit_workflows(parsed, license_state)
            content = json.dumps(parsed, ensure_ascii=False, indent=2) + '\n'
        elif key == 'app':
            settings = load_app_settings()
            content = json.dumps({'content_root': settings['content_root'], 'theme': settings['theme']}, ensure_ascii=False, indent=2) + '\n'
        return {'ok': True, 'key': key, 'path': str(target), 'content': content, 'limited': limited}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if self._require_lan_auth(path):
            return
        if path == '/api/agent/status':
            task_id = parse_qs(parsed.query).get('id', [''])[0]
            task = hermes_task_snapshot(task_id)
            if task is None:
                self._json({'ok': False, 'error': '找不到執行任務'}, 404)
            else:
                self._json({'ok': True, 'task': task})
            return
        if path == '/api/schedule':
            factory_id = str(parse_qs(parsed.query).get('factory_id', [''])[0]).strip()
            if not factory_id:
                self._json({'ok': False, 'error': '缺少工廠 ID'}, 400)
            else:
                schedule = SCHEDULE_MANAGER.status(factory_id)
                schedule['running'] = factory_id in SCHEDULE_MANAGER.running_factories
                run = scheduled_run_snapshot(factory_id)
                if run:
                    schedule.update({key: value for key, value in run.items() if key != 'cancel_requested'})
                    schedule['stopping'] = bool(run.get('cancel_requested'))
                self._json({'ok': True, 'schedule': schedule})
            return
        if path == '/api/config':
            app_settings = load_app_settings()
            agent_settings = public_agent_settings()
            lan_ip = lan_ip_address()
            self._json({
                'workflows_path': str(WORKFLOWS_FILE),
                'content_root': app_settings['content_root'],
                'agent': agent_settings,
                'version': VERSION,
                'managed_install': updater.INSTALL_ROOT / 'versions' in ROOT.parents,
                'network': {
                    'lan_enabled': app_settings['lan_enabled'],
                    'password_configured': bool(app_settings['lan_password_hash']),
                    'lan_ip': lan_ip,
                    'lan_url': f"http://{lan_ip}:{PORT}/" if lan_ip else '',
                },
            })
            return
        if path == '/api/changelog':
            self._json({'ok': True, 'entries': load_recent_changelog(10)})
            return
        if path == '/api/network':
            settings = load_app_settings()
            ip = lan_ip_address()
            self._json({'ok': True, 'lan_enabled': settings['lan_enabled'], 'password_configured': bool(settings['lan_password_hash']), 'lan_ip': ip, 'lan_url': f'http://{ip}:{PORT}/' if ip else ''})
            return
        if path == '/api/agent/settings':
            self._json({'ok': True, 'settings': public_agent_settings()})
            return
        if path == '/api/autostart':
            self._json({'ok': True, **autostart.status(ROOT)})
            return
        if path == '/api/license':
            refresh = parse_qs(parsed.query).get('refresh', ['1'])[0] != '0'
            self._json({'ok': True, **licensing.status(refresh=refresh)})
            return
        if path == '/api/store/factories':
            query = parse_qs(parsed.query).get('q', [''])[0]
            try:
                if STORE_PREVIEW_MODE:
                    items = [item for item in _preview_store()['factories'] if item.get('status') == 'published']
                    needle = query.casefold().strip()
                    if needle:
                        items = [item for item in items if needle in str(item.get('name', '')).casefold() or needle in str(item.get('description', '')).casefold()]
                    self._json({'ok': True, 'factories': [{'id': item['id'], 'name': item['name'], 'description': item['description']} for item in items]})
                    return
                suffix = f'?q={quote(query)}' if query else ''
                data = licensing.store_request('/v1/store/factories' + suffix)
                self._json({'ok': True, **data})
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 502)
            return
        store_detail = re.fullmatch(r'/api/store/factories/(\d+)', path)
        if store_detail:
            try:
                if STORE_PREVIEW_MODE:
                    item = next((item for item in _preview_store()['factories'] if str(item.get('id')) == store_detail.group(1) and item.get('status') == 'published'), None)
                    if item is None:
                        self._json({'ok': False, 'error': '找不到商店工廠'}, 404)
                    else:
                        self._json({'ok': True, 'factory': {'id': item['id'], 'name': item['name'], 'description': item['description'], 'steps': [{'title': step.get('title', step.get('id', '流程'))} for step in item['factory'].get('steps', [])]}})
                    return
                data = licensing.store_request(f'/v1/store/factories/{store_detail.group(1)}')
                self._json({'ok': True, **data})
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 502)
            return
        if path == '/api/settings':
            key = parse_qs(parsed.query).get('file', [''])[0]
            try:
                self._json(self._settings_payload(key))
            except KeyError as exc:
                self._json({'ok': False, 'error': str(exc)}, 404)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if path == '/api/open-file':
            qs = parse_qs(parsed.query)
            filepath = qs.get('path', [''])[0]
            if not filepath: self._json({'ok': False, 'error': '缺少 path 參數'}, 400); return
            p = Path(filepath).expanduser().resolve()
            if not p.exists(): self._json({'ok': False, 'error': f'檔案不存在：{p}'}, 404); return
            subprocess.run(['open', str(p)])
            self._json({'ok': True, 'path': str(p)})
            return
        if path == '/api/open-folder':
            qs = parse_qs(parsed.query)
            folder = qs.get('path', [''])[0]
            if not folder: self._json({'ok': False, 'error': '缺少 path 參數'}, 400); return
            p = Path(folder).expanduser().resolve()
            if not p.exists() and not p.is_dir():
                if p.parent.exists(): p = p.parent
                else: self._json({'ok': False, 'error': f'目錄不存在：{folder}'}, 404); return
            subprocess.run(['open', str(p)])
            self._json({'ok': True, 'path': str(p)})
            return
        if path == '/api/outputs':
            qs = parse_qs(parsed.query)
            fnames = qs.get('files', [''])[0].split(',')
            factory = safe_segment(qs.get('factory', [''])[0])
            flow = safe_segment(qs.get('flow', [''])[0])
            configured_root = Path(load_app_settings()['content_root']).expanduser()
            output_dir = configured_root / factory / flow
            files = {}
            for fn in fnames:
                fn = fn.strip()
                if not fn: continue
                if Path(fn).name != fn:
                    files[fn] = {'exists': False, 'error': '檔名不合法'}
                    continue
                fp = output_dir / fn
                try:
                    st = fp.stat()
                    files[fn] = {'exists': True, 'mtime': st.st_mtime, 'size': st.st_size,
                                 'content': fp.read_text(encoding='utf-8')}
                except Exception:
                    files[fn] = {'exists': False}
            self._json({'ok': True, 'files': files, 'directory': str(output_dir)})
            return
        if path == '/api/ai-flow/context':
            try:
                factory_id = parse_qs(parsed.query).get('factory_id', [''])[0]
                if not factory_id:
                    raise ValueError('缺少員工 ID')
                self._json({'ok': True, 'context': ai_flow_context(factory_id)})
            except ValueError as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': f'讀取員工對話內容失敗：{exc}'}, 500)
            return
        if path == '/api/output-preview':
            try:
                filepath = parse_qs(parsed.query).get('path', [''])[0]
                if not filepath:
                    self._json({'ok': False, 'error': '缺少 path 參數'}, 400)
                    return
                target = Path(filepath).expanduser().resolve()
                if target not in declared_output_paths():
                    self._json({'ok': False, 'error': '此路徑不屬於已設定的輸出文件'}, 403)
                    return
                if target.suffix.lower() not in {'.md', '.json'}:
                    self._json({'ok': False, 'error': '目前只支援預覽 Markdown 與 JSON 文件'}, 415)
                    return
                if not target.is_file():
                    self._json({'ok': True, 'exists': False, 'path': str(target)})
                    return
                stat = target.stat()
                if stat.st_size > 2 * 1024 * 1024:
                    self._json({'ok': False, 'error': '文件超過 2 MB，請使用打開文件按鈕查看'}, 413)
                    return
                try:
                    t = target.read_text(encoding='utf-8')
                except UnicodeDecodeError:
                    self._json({'ok': False, 'error': '文件不是 UTF-8 編碼，無法預覽'}, 415)
                    return
                self._json({
                    'ok': True, 'exists': True, 'path': str(target),
                    'mtime': stat.st_mtime, 'size': stat.st_size, 'content': t,
                })
            except Exception as e:
                self._json({'ok': False, 'error': f'讀取輸出文件時發生錯誤：{e}'}, 500)
            return
        if path == '/':
            self.path = '/index.html'
        return super().do_GET()

    # ── 公開 Webhook ──────────────────────────────────────────────
    WEBHOOK_API_KEY = os.environ.get('FLOW_FACTORY_WEBHOOK_KEY', '')
    WEBHOOK_REQUIRE_KEY = bool(WEBHOOK_API_KEY)

    def _webhook_auth(self):
        if not self.WEBHOOK_REQUIRE_KEY:
            return True
        auth = self.headers.get('Authorization', '')
        expected = f'Bearer {self.WEBHOOK_API_KEY}'
        return auth == expected

    def _do_public_webhook(self, payload):
        prompt   = payload.get('prompt', '')
        source   = payload.get('source', 'unknown')
        event_type = payload.get('event_type', '')
        if event_type == 'connection_test':
            self._json({
                'ok': True,
                'message': '連接成功',
                'received': {'source': source, 'event_type': event_type}
            }, 200)
            return
        # 一般任務：轉交 Hermes 執行
        try:
            task_id = start_hermes_task(prompt)
            self._json({
                'ok': True,
                'status': 'queued',
                'task_id': task_id,
                'message': '任務已接收，正在執行'
            }, 202)
        except Exception as exc:
            self._json({'ok': False, 'error': str(exc)}, 502)

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == '/api/lan/login':
            ip = self.client_address[0]
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 4096:
                    raise ValueError('請輸入存取密碼')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                password = str(payload.get('password', ''))
                settings = load_app_settings()
                now = time.time()
                with LAN_LOGIN_LOCK:
                    attempts = [stamp for stamp in LAN_LOGIN_ATTEMPTS.get(ip, []) if now - stamp < 60]
                    if len(attempts) >= 5:
                        raise PermissionError('嘗試次數過多，請一分鐘後再試')
                valid = bool(settings['lan_enabled'] and settings['lan_password_salt'] and settings['lan_password_hash']) and hmac.compare_digest(password_digest(password, settings['lan_password_salt']), settings['lan_password_hash'])
                if not valid:
                    with LAN_LOGIN_LOCK:
                        LAN_LOGIN_ATTEMPTS[ip] = attempts + [now]
                    raise PermissionError('存取密碼不正確')
                with LAN_LOGIN_LOCK:
                    LAN_LOGIN_ATTEMPTS.pop(ip, None)
                raw = json.dumps({'ok': True}, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Set-Cookie', f'flowfactory_lan={lan_session_token()}; Path=/; HttpOnly; SameSite=Strict')
                self.send_header('Content-Length', str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, 429 if '次數過多' in str(exc) else 401)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            return

        if self._require_lan_auth(parsed.path):
            return

        if parsed.path == '/api/network':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 4096:
                    raise ValueError('請提供局域網設定')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                enabled = payload.get('lan_enabled')
                password = str(payload.get('password', ''))
                if not isinstance(enabled, bool):
                    raise ValueError('lan_enabled 必須是布林值')
                settings = load_app_settings()
                if enabled and not password and not settings['lan_password_hash']:
                    raise ValueError('首次開啟局域網存取時，必須設定至少 8 個字元的密碼')
                if password:
                    if len(password) < 8 or len(password) > 128:
                        raise ValueError('存取密碼長度必須介於 8 至 128 個字元')
                    salt = secrets.token_hex(16)
                    settings['lan_password_salt'] = salt
                    settings['lan_password_hash'] = password_digest(password, salt)
                settings['lan_enabled'] = enabled
                write_app_settings(settings)
                ip = lan_ip_address()
                self._json({'ok': True, 'lan_enabled': enabled, 'password_configured': bool(settings['lan_password_hash']), 'lan_ip': ip, 'lan_url': f'http://{ip}:{PORT}/' if ip else '', 'message': '局域網設定已儲存，服務正在重新啟動'})
                threading.Thread(target=restart_current, daemon=True).start()
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return

        if parsed.path == '/api/restart':
            try:
                if not self._is_local_client():
                    raise PermissionError('重啟服務只能在本機操作')
                self._json({'ok': True, 'message': '服務正在重新啟動，頁面將自動重新連線'})
                threading.Thread(target=restart_current, daemon=True).start()
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, 403)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if parsed.path == '/api/uninstall':
            try:
                if not self._is_local_client():
                    raise PermissionError('卸載只能在本機操作')
                body_len = int(self.headers.get('Content-Length', '0') or 0)
                confirm = ''
                if body_len:
                    confirm = str(json.loads(self.rfile.read(body_len).decode('utf-8') or '{}').get('confirm', ''))
                if confirm != '確認卸載':
                    raise ValueError('請輸入「確認卸載」以執行卸載')
                self._json({'ok': True, 'message': '正在卸載 Flow Factory…'})
                # detach 執行：uninstall.sh 由獨立進程執行，不隨 server 終止
                uninstall_cmd = (
                    '#!/bin/sh\n'
                    'sleep 1\n'
                    'U="$HOME/.flowfactory/current/scripts/uninstall.sh"\n'
                    'if [ -x "$U" ]; then "$U"; else "$HOME/.local/bin/flowfactory" uninstall; fi\n'
                    'rm -f "$HOME/.flowfactory/uninstall-last.log"\n'
                )
                marker = Path.home() / '.flowfactory' / 'uninstall-pending.sh'
                marker.write_text(uninstall_cmd, encoding='utf-8')
                marker.chmod(0o755)
                subprocess.Popen(
                    ['/bin/sh', str(marker)],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, 403)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if parsed.path == '/api/output-path/check':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 8192:
                    raise ValueError('請求大小必須介於 1 byte 到 8 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                result = check_output_path_access(payload.get('path'))
                self._json({'ok': True, **result})
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': f'輸出路徑檢查失敗：{exc}'}, 500)
            return

        if parsed.path == '/api/output-path/select':
            try:
                if not self._is_local_client():
                    raise PermissionError('請在執行 FlowFactory 的本機選擇資料夾')
                length = int(self.headers.get('Content-Length', '0'))
                default_path = ''
                if length > 0:
                    if length > 8192:
                        raise ValueError('請求大小必須介於 1 byte 到 8 KB')
                    payload = json.loads(self.rfile.read(length).decode('utf-8'))
                    default_path = str(payload.get('path') or '').strip()
                folder = choose_output_folder(default_path)
                self._json({'ok': True, 'cancelled': folder is None, 'path': folder or ''})
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, 403)
            except (ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            return

        # ── 公開 Webhook endpoint ─────────────────────────────────
        if parsed.path == '/webhook':
            try:
                length = int(self.headers.get('Content-Length', 0))
                if length <= 0 or length > 1024 * 1024:
                    raise ValueError('請求大小必須介於 1 byte 到 1 MB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
            except json.JSONDecodeError:
                self._json({'ok': False, 'error': '不是合法 JSON'}, 400)
                return
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
                return
            if not self._webhook_auth():
                self._json({'ok': False, 'error': '未授權'}, 401)
                return
            self._do_public_webhook(payload)
            return
        # ── 原有 Agent API ────────────────────────────────────────
        if parsed.path == '/api/ai-flow/apply':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 2 * 1024 * 1024:
                    raise ValueError('請求大小必須介於 1 byte 到 2 MB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                employee_id = str(payload.get('employee_id', '')).strip()
                revision = str(payload.get('revision', '')).strip()
                if not employee_id:
                    raise ValueError('缺少員工 ID')
                employee, next_revision = _replace_employee_workflow(
                    employee_id, payload.get('employee'), revision
                )
                self._json({'ok': True, 'employee': employee, 'revision': next_revision})
            except RuntimeError as exc:
                self._json({'ok': False, 'error': str(exc)}, 409)
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': f'套用員工流程失敗：{exc}'}, 500)
            return
        if parsed.path == '/api/agent/run':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 1024 * 1024:
                    raise ValueError('請求大小必須介於 1 byte 到 1 MB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                factory_id = str(payload.get('factory_id', '')).strip()
                if not licensing.status(refresh=False)['licensed']:
                    stored = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
                    first_id = str((stored.get('workflows') or [{}])[0].get('id', ''))
                    if not factory_id or factory_id != first_id:
                        raise PermissionError('免費版只能執行第一個工作流工廠，請升級授權')
                task_id = start_agent_task(payload.get('prompt'), payload.get('session_id'))
                agent = public_agent_settings()
                self._json({
                    'ok': True,
                    'status': 'queued',
                    'task_id': task_id,
                    'message': f"{agent['name']} 已接收任務並開始執行",
                }, 202)
            except json.JSONDecodeError:
                self._json({'ok': False, 'error': '請求不是合法 JSON'}, 400)
            except (ValueError, PermissionError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 502)
            return
        if parsed.path == '/api/script/run':
            try:
                if not self._is_local_client():
                    raise PermissionError('本機腳本只能在執行 FlowFactory 的電腦啟動')
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 128 * 1024:
                    raise ValueError('請求大小必須介於 1 byte 到 128 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                factory_id = str(payload.get('factory_id', '')).strip()
                step_id = str(payload.get('step_id', '')).strip()
                values = payload.get('values') if isinstance(payload.get('values'), dict) else {}
                config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
                factories = config.get('workflows') if isinstance(config.get('workflows'), list) else []
                factory = next((item for item in factories if str(item.get('id')) == factory_id), None)
                if factory is None:
                    raise ValueError('找不到指定的工作流工廠')
                if not licensing.status(refresh=False)['licensed']:
                    first_id = str((factories or [{}])[0].get('id', ''))
                    if factory_id != first_id:
                        raise PermissionError('免費版只能執行第一個工作流工廠，請升級授權')
                step = next((item for item in (factory.get('steps') or []) if str(item.get('id')) == step_id), None)
                if not isinstance(step, dict) or str(step.get('type', 'prompt')) != 'script':
                    raise ValueError('找不到可執行的腳本流程')
                task_id = start_script_task(factory, step, values)
                self._json({'ok': True, 'status': 'queued', 'task_id': task_id, 'message': '本機腳本已開始執行'}, 202)
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, 403)
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if parsed.path == '/api/schedule':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 128 * 1024:
                    raise ValueError('排程設定大小必須介於 1 byte 到 128 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                factory_id = str(payload.get('factory_id', '')).strip()
                config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
                factories = config.get('workflows') if isinstance(config.get('workflows'), list) else []
                if not any(str(item.get('id')) == factory_id for item in factories):
                    raise ValueError('找不到指定的工作流工廠')
                needs_agent = any(str(step.get('type', 'prompt')) != 'script' for step in (next((item.get('steps', []) for item in factories if str(item.get('id')) == factory_id), []) or []))
                if payload.get('enabled') is True and needs_agent and not public_agent_settings()['connected']:
                    raise ValueError('啟用自動化前，請先連接 Agent')
                if payload.get('enabled') is True and not licensing.status(refresh=False)['licensed']:
                    first_id = str((factories or [{}])[0].get('id', ''))
                    if factory_id != first_id:
                        raise PermissionError('免費版只能為第一個工作流工廠設定自動化')
                schedule = SCHEDULE_MANAGER.save(factory_id, payload)
                self._json({'ok': True, 'schedule': schedule, 'message': '自動化排程已儲存'})
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, 403)
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if parsed.path == '/api/schedule/cancel':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 4096:
                    raise ValueError('請求大小必須介於 1 byte 到 4 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                factory_id = str(payload.get('factory_id', '')).strip()
                if not factory_id:
                    raise ValueError('缺少工廠 ID')
                run = cancel_scheduled_factory(factory_id)
                self._json({'ok': True, 'run': run, 'message': '目前步驟與後續自動化流程正在停止'})
            except KeyError as exc:
                self._json({'ok': False, 'error': str(exc).strip("'")}, 404)
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': f'停止自動化流程失敗：{exc}'}, 500)
            return
        if parsed.path == '/api/agent/cancel':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 4096:
                    raise ValueError('請求大小必須介於 1 byte 到 4 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                task = cancel_agent_task(str(payload.get('task_id', '')).strip())
                self._json({'ok': True, 'task': task, 'message': 'Agent 任務已停止'})
            except KeyError as exc:
                self._json({'ok': False, 'error': str(exc).strip("'")}, 404)
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': f'停止 Agent 任務失敗：{exc}'}, 500)
            return
        if parsed.path == '/api/agent/settings':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                existing = load_agent_settings()
                mode = str(payload.get('mode', 'disabled')).strip()
                if mode not in {'disabled', 'webhook', 'hermes'}:
                    raise ValueError('不支援的 Agent 連接方式')
                webhook_url = str(payload.get('webhook_url', '')).strip()
                if mode == 'webhook':
                    parsed_url = urlparse(webhook_url)
                    if parsed_url.scheme not in {'http', 'https'} or not parsed_url.netloc:
                        raise ValueError('請輸入有效的 Webhook URL')
                token = str(payload.get('token', '')).strip() or existing.get('token', '')
                settings = {'mode': mode, 'name': str(payload.get('name', '')).strip() or 'Agent', 'webhook_url': webhook_url, 'token': token, 'verified': existing.get('verified', False) and webhook_url == existing.get('webhook_url', '')}
                if payload.get('clear_token'):
                    settings['token'] = ''
                write_agent_settings(settings)
                self._json({'ok': True, 'settings': public_agent_settings()})
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if parsed.path == '/api/agent/test':
            try:
                settings = load_agent_settings()
                if settings['mode'] != 'webhook' or not settings['webhook_url']:
                    raise ValueError('請先填寫並儲存 Agent Webhook URL')
                test_result = test_agent_webhook(settings)
                settings['verified'] = True
                settings['async'] = bool(test_result.get('async'))
                write_agent_settings(settings)
                message = 'Agent 連接測試成功'
                if settings['async']:
                    message += '（異步型 Webhook，執行時將自動輪詢結果）'
                self._json({'ok': True, 'settings': public_agent_settings(), 'message': message})
            except ValueError as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                settings = load_agent_settings()
                settings['verified'] = False
                write_agent_settings(settings)
                self._json({'ok': False, 'error': f'Agent 連接失敗：{exc}'}, 502)
            return
        if parsed.path == '/api/agent/disconnect':
            write_agent_settings(DEFAULT_AGENT_SETTINGS.copy())
            self._json({'ok': True, 'settings': public_agent_settings(), 'message': 'Agent 已斷開'})
            return
        if parsed.path in {'/api/license/activate', '/api/license/deactivate'}:
            try:
                if parsed.path.endswith('/deactivate'):
                    self._json({'ok': True, **licensing.deactivate()})
                    return
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 4096:
                    raise ValueError('請求大小必須介於 1 byte 到 4 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                self._json({'ok': True, **licensing.activate(payload.get('license_key', ''))})
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 502)
            return
        if parsed.path in {'/api/store/install', '/api/store/upload', '/api/store/mine', '/api/store/unpublish'}:
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 1024 * 1024:
                    raise ValueError('商店請求大小不正確')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                if parsed.path.endswith('/mine'):
                    if STORE_PREVIEW_MODE:
                        if not licensing.status(refresh=False).get('licensed'):
                            raise PermissionError('查看我的上傳需要有效授權碼')
                        items = [{key: item.get(key) for key in ('id', 'name', 'description', 'status', 'review_note')} for item in _preview_store()['factories']]
                        self._json({'ok': True, 'factories': items})
                    else:
                        data = licensing.store_request('/v1/store/mine', 'POST', {}, authenticated=True)
                        self._json({'ok': True, **data})
                    return
                if parsed.path.endswith('/unpublish'):
                    store_id = int(payload.get('store_factory_id', 0))
                    if STORE_PREVIEW_MODE:
                        if not licensing.status(refresh=False).get('licensed'):
                            raise PermissionError('下架工廠需要有效授權碼')
                        store = _preview_store()
                        item = next((item for item in store['factories'] if int(item.get('id', 0)) == store_id), None)
                        if item is None:
                            raise ValueError('找不到商店工廠')
                        item['status'] = 'withdrawn'
                        _write_preview_store(store)
                        self._json({'ok': True, 'status': 'withdrawn'})
                    else:
                        data = licensing.store_request(f'/v1/store/factories/{store_id}/withdraw', 'POST', {}, authenticated=True)
                        self._json({'ok': True, **data})
                    return
                if parsed.path.endswith('/install'):
                    store_id = int(payload.get('store_factory_id', 0))
                    if STORE_PREVIEW_MODE:
                        if not licensing.status(refresh=False).get('licensed'):
                            raise PermissionError('安裝商店工廠需要有效授權碼')
                        item = next((item for item in _preview_store()['factories'] if int(item.get('id', 0)) == store_id), None)
                        if item is None:
                            raise ValueError('找不到商店工廠')
                        data = {'factory': item['factory']}
                    else:
                        data = licensing.store_request(f'/v1/store/factories/{store_id}/download', 'POST', {}, authenticated=True)
                    factory = _install_store_factory(data.get('factory'))
                    self._json({'ok': True, 'factory_id': factory['id'], 'message': '工廠已安裝'})
                else:
                    factory_id = str(payload.get('factory_id', '')).strip()
                    config = json.loads(WORKFLOWS_FILE.read_text(encoding='utf-8'))
                    factory = next((item for item in config.get('workflows', []) if str(item.get('id')) == factory_id), None)
                    if factory is None:
                        raise ValueError('找不到要上傳的工廠')
                    safe_factory = _store_safe_factory(factory)
                    if STORE_PREVIEW_MODE:
                        if not licensing.status(refresh=False).get('licensed'):
                            raise PermissionError('上傳工廠需要有效授權碼')
                        store = _preview_store()
                        next_id = max([int(item.get('id', 0)) for item in store['factories']] or [0]) + 1
                        item = {'id': next_id, 'name': safe_factory['name'], 'description': safe_factory['description'], 'status': 'pending', 'review_note': None, 'factory': safe_factory}
                        store['factories'].insert(0, item)
                        _write_preview_store(store)
                        data = {'factory': {'id': next_id, 'name': item['name'], 'description': item['description'], 'status': 'pending'}, 'message': '已送交管理員審核'}
                    else:
                        data = licensing.store_request('/v1/store/factories', 'POST', {'factory': safe_factory}, authenticated=True)
                    self._json({'ok': True, **data})
            except PermissionError as exc:
                self._json({'ok': False, 'error': str(exc)}, getattr(exc, 'status', 403))
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 502)
            return
        if parsed.path == '/api/autostart':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 4096:
                    raise ValueError('请求大小必须介于 1 byte 到 4 KB')
                payload = json.loads(self.rfile.read(length).decode('utf-8'))
                if not isinstance(payload.get('enabled'), bool):
                    raise ValueError('enabled 必须是布尔值')
                state = autostart.set_enabled(payload['enabled'], ROOT, PORT)
                self._json({'ok': True, **state, 'message': '已启用登录后自动启动' if state['enabled'] else '已关闭登录后自动启动'})
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 500)
            return
        if parsed.path in {'/api/update/check', '/api/update/install'}:
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length < 0 or length > 4096:
                    raise ValueError('请求大小不可超过 4 KB')
                if length:
                    json.loads(self.rfile.read(length).decode('utf-8'))
                info = updater.release_info(VERSION)
                if parsed.path == '/api/update/check':
                    self._json({'ok': True, **{key: value for key, value in info.items() if not key.endswith('_api_url')}})
                    return
                if not info['update_available']:
                    self._json({'ok': True, 'updated': False, 'message': '目前已经是最新版本', 'version': VERSION})
                    return
                target = updater.install_release(info, ROOT)
                self._json({'ok': True, 'updated': True, 'version': info['latest_version'], 'message': '更新已安装，正在重新启动'})
                threading.Thread(target=restart_into, args=(target,), daemon=True).start()
            except (ValueError, json.JSONDecodeError) as exc:
                self._json({'ok': False, 'error': str(exc)}, 400)
            except Exception as exc:
                self._json({'ok': False, 'error': str(exc)}, 502)
            return
        if parsed.path != '/api/settings':
            self._json({'ok': False, 'error': '找不到 API'}, 404)
            return
        key = parse_qs(parsed.query).get('file', [''])[0]
        target = SETTINGS_FILES.get(key)
        if target is None:
            self._json({'ok': False, 'error': '不支援的設定檔'}, 404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 2 * 1024 * 1024:
                raise ValueError('內容大小必須介於 1 byte 到 2 MB')
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            content = payload.get('content', '')
            parsed_json = json.loads(content)
            if key == 'app':
                content_root = str(parsed_json.get('content_root', '')).strip()
                if not content_root:
                    raise ValueError('內容儲存根目錄不可為空')
                root_path = Path(content_root).expanduser()
                if not root_path.is_absolute():
                    raise ValueError('內容儲存根目錄必須是絕對路徑')
                root_path.mkdir(parents=True, exist_ok=True)
                existing_app = load_app_settings()
                theme = parsed_json.get('theme', existing_app.get('theme', 'light'))
                if theme not in {'light', 'dark'}:
                    raise ValueError('不支援的主題設定')
                parsed_json = {**existing_app, 'content_root': str(root_path), 'theme': theme}
            if key == 'workflows' and payload.get('limited_view') is True and not licensing.status(refresh=False).get('licensed'):
                existing = json.loads(target.read_text(encoding='utf-8')) if target.is_file() else {'workflows': []}
                parsed_json = _merge_limited_workflow_view(existing, parsed_json)
            if key == 'workflows':
                formatted = _write_workflows(parsed_json)
            else:
                formatted = json.dumps(parsed_json, ensure_ascii=False, indent=2) + '\n'
                target.parent.mkdir(parents=True, exist_ok=True)
                temp_file = target.with_name(target.name + '.tmp')
                temp_file.write_text(formatted, encoding='utf-8')
                os.replace(temp_file, target)
            response_content = formatted
            if key == 'workflows':
                license_state = licensing.status(refresh=False)
                response_content = json.dumps(licensing.limit_workflows(parsed_json, license_state), ensure_ascii=False, indent=2) + '\n'
            elif key == 'app':
                response_content = json.dumps({'content_root': parsed_json['content_root']}, ensure_ascii=False, indent=2) + '\n'
            self._json({
                'ok': True,
                'key': key,
                'path': str(target),
                'content': response_content,
                'limited': key == 'workflows' and not licensing.status(refresh=False).get('licensed'),
                'message': 'JSON 已儲存',
            })
        except json.JSONDecodeError as exc:
            self._json({
                'ok': False,
                'error': f'JSON 格式錯誤：第 {exc.lineno} 行，第 {exc.colno} 欄：{exc.msg}',
            }, 400)
        except PermissionError as exc:
            self._json({'ok': False, 'error': str(exc)}, 403)
        except Exception as exc:
            self._json({'ok': False, 'error': str(exc)}, 400)

if __name__ == '__main__':
    os.chdir(ROOT)
    app_settings = load_app_settings()
    bind_host = '0.0.0.0' if app_settings['lan_enabled'] and app_settings['lan_password_hash'] else '127.0.0.1'
    url = f'http://127.0.0.1:{PORT}'
    print(f'AutoMoney 工作台：{url}')
    if bind_host == '0.0.0.0':
        ip = lan_ip_address()
        print(f'局域網存取：http://{ip}:{PORT}/' if ip else '局域網存取：已開啟')
    if os.environ.get('AUTOMONEY_NO_BROWSER') != '1':
        try:
            webbrowser.open(url)
        except Exception:
            pass
    SCHEDULE_MANAGER.start()
    ThreadingHTTPServer((bind_host, PORT), Handler).serve_forever()
