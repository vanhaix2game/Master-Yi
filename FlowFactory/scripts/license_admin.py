#!/usr/bin/env python3
"""Local-only browser dashboard for Flow Factory license administration."""
import json, os, secrets, signal, subprocess, threading, time, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = int(os.environ.get("FLOWFACTORY_LICENSE_ADMIN_PORT", "18766"))
SERVICE = "FlowFactory License Admin Token"
API = "https://flowfactory-license.gavinlo3692.workers.dev"
HTML = Path(__file__).with_name("license_admin.html").read_bytes()
SESSION = secrets.token_urlsafe(24)

def stop_previous_instance():
    found = subprocess.run(["lsof", "-t", f"-iTCP:{PORT}", "-sTCP:LISTEN"], capture_output=True, text=True)
    for value in found.stdout.split():
        if not value.isdigit() or int(value) == os.getpid(): continue
        pid = int(value)
        command = subprocess.run(["ps", "-p", str(pid), "-o", "command="], capture_output=True, text=True).stdout
        if "license_admin.py" not in command:
            raise SystemExit(f"端口 {PORT} 已被其他程序占用，请先关闭该程序。")
        os.kill(pid, signal.SIGTERM)
        for _ in range(30):
            try: os.kill(pid, 0)
            except ProcessLookupError: break
            time.sleep(0.1)

stop_previous_instance()

def admin_token():
    found = subprocess.run(["security", "find-generic-password", "-a", subprocess.getoutput("id -un"), "-s", SERVICE, "-w"], capture_output=True, text=True)
    if found.returncode == 0 and found.stdout.strip(): return found.stdout.strip()
    token = input("第一次使用，请输入授权服务 ADMIN_TOKEN：").strip()
    if not token: raise SystemExit("ADMIN_TOKEN 不可为空")
    subprocess.run(["security", "add-generic-password", "-U", "-a", subprocess.getoutput("id -un"), "-s", SERVICE, "-w", token], check=True, stdout=subprocess.DEVNULL)
    return token

TOKEN = admin_token()

def remote(method, path, body=None):
    marker = "\n__FLOWFACTORY_HTTP_STATUS__:"
    command = [
        "curl", "--noproxy", "*", "--ipv4", "--silent", "--show-error",
        "--connect-timeout", "5", "--max-time", "15",
        "--request", method,
        "--header", "Content-Type: application/json",
        "--header", "User-Agent: FlowFactory-Admin/1.0",
        "--write-out", marker + "%{http_code}",
        API + path, "--config", "-",
    ]
    if body is not None:
        command.extend(["--data-binary", json.dumps(body, ensure_ascii=False, separators=(",", ":"))])
    # 通过 stdin 传递授权头，避免 ADMIN_TOKEN 出现在 curl 命令列与进程列表中。
    escaped_token = TOKEN.replace("\\", "\\\\").replace('"', '\\"').replace("\r", "").replace("\n", "")
    try:
        result = subprocess.run(
            command,
            input=f'header = "Authorization: Bearer {escaped_token}"\n',
            capture_output=True,
            text=True,
            timeout=18,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"error":f"无法连接云端授权服务：{exc}"}, 502
    if marker not in result.stdout:
        detail = result.stderr.strip() or f"curl 退出码 {result.returncode}"
        return {"error":f"无法连接云端授权服务：{detail}"}, 502
    raw, status_text = result.stdout.rsplit(marker, 1)
    try:
        status = int(status_text.strip())
    except ValueError:
        return {"error":"云端授权服务返回了无效状态码"}, 502
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = {"error":f"云端授权服务返回了非 JSON 内容（HTTP {status}）"}
    return payload, status

class Handler(BaseHTTPRequestHandler):
    def reply(self, payload, status=200):
        raw=json.dumps(payload, ensure_ascii=False).encode(); self.send_response(status); self.send_header("Content-Type","application/json; charset=utf-8"); self.send_header("Cache-Control","no-store"); self.end_headers(); self.wfile.write(raw)
    def allowed(self): return self.headers.get("X-Admin-Session")==SESSION
    def body(self): return json.loads(self.rfile.read(int(self.headers.get("Content-Length","0"))) or b"{}")
    def do_GET(self):
        if self.path.startswith("/?session="):
            self.send_response(200); self.send_header("Content-Type","text/html; charset=utf-8"); self.send_header("Cache-Control","no-store"); self.end_headers(); self.wfile.write(HTML); return
        parsed = urlparse(self.path)
        if parsed.path=="/api/licenses" and self.allowed(): payload,status=remote("GET","/v1/admin/licenses"+(("?"+parsed.query) if parsed.query else "")); self.reply(payload,status); return
        if parsed.path=="/api/install-stats" and self.allowed(): payload,status=remote("GET","/v1/admin/install-stats"); self.reply(payload,status); return
        if parsed.path=="/api/install-events" and self.allowed(): payload,status=remote("GET","/v1/admin/install-events"+(("?"+parsed.query) if parsed.query else "")); self.reply(payload,status); return
        if parsed.path=="/api/store" and self.allowed(): payload,status=remote("GET","/v1/admin/store"+(("?"+parsed.query) if parsed.query else "")); self.reply(payload,status); return
        self.reply({"error":"未授权"},403)
    def do_POST(self):
        if not self.allowed(): self.reply({"error":"未授权"},403); return
        parsed=urlparse(self.path)
        if parsed.path=="/api/licenses":
            body=self.body(); body["count"]=max(1,min(100,int(body.get("count",1))))
            result,status=remote("POST","/v1/admin/licenses",body)
            self.reply(result,status); return
        if parsed.path.endswith("/reset-activations"):
            ident=parsed.path.split("/")[3]; payload,status=remote("POST",f"/v1/admin/licenses/{ident}/reset-activations",{}); self.reply(payload,status); return
        self.reply({"error":"找不到 API"},404)
    def do_PATCH(self):
        if not self.allowed(): self.reply({"error":"未授权"},403); return
        parsed=urlparse(self.path)
        ident=parsed.path.split("/")[-1]
        endpoint=f"/v1/admin/store/{ident}" if parsed.path.startswith("/api/store/") else f"/v1/admin/licenses/{ident}"
        payload,status=remote("PATCH",endpoint,self.body()); self.reply(payload,status)
    def log_message(self, *_): pass

server=ThreadingHTTPServer((HOST,PORT),Handler)
url=f"http://{HOST}:{PORT}/?session={SESSION}"
print(f"授权管理后台：{url}\n关闭此窗口即可停止后台。")
threading.Timer(.5,lambda:webbrowser.open(url)).start()
def stop_server(*_): raise KeyboardInterrupt
signal.signal(signal.SIGTERM, stop_server)
signal.signal(signal.SIGHUP, stop_server)
try: server.serve_forever()
except KeyboardInterrupt: pass
finally: server.server_close()
