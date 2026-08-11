#!/usr/bin/env python3
"""Codex CLI webhook adapter for Flow Factory.

POST /webhook accepts a Flow Factory prompt and immediately returns HTTP 202
with ``status=accepted`` and a ``result_url``. Flow Factory polls
GET /tasks/<id> until Codex completes.
"""

import json
import os
import subprocess
import tempfile
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


HOST = os.environ.get("CODEX_WEBHOOK_HOST", "127.0.0.1")
PORT = int(os.environ.get("CODEX_WEBHOOK_PORT", "8647"))
ROUTE = os.environ.get("CODEX_WEBHOOK_ROUTE", "/webhook")
CODEX_BIN = os.environ.get("CODEX_BIN", str(Path.home() / ".local" / "bin" / "codex"))
WORKDIR = Path(os.environ.get("CODEX_WEBHOOK_WORKDIR", str(Path.home()))).expanduser().resolve()
DATA_DIR = Path(
    os.environ.get(
        "CODEX_WEBHOOK_DATA_DIR",
        str(Path.home() / ".codex" / "flow-factory-webhook"),
    )
).expanduser()
TASKS_DIR = DATA_DIR / "tasks"
TASKS_DIR.mkdir(parents=True, exist_ok=True)

MAX_BODY = 1024 * 1024
MAX_RESULT = 512 * 1024
MAX_CONCURRENT = max(1, int(os.environ.get("CODEX_WEBHOOK_CONCURRENCY", "2")))
SEMAPHORE = threading.BoundedSemaphore(MAX_CONCURRENT)
TASKS = {}
TASKS_LOCK = threading.Lock()


def task_path(task_id):
    return TASKS_DIR / f"{task_id}.json"


def write_task(task):
    path = task_path(task["id"])
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(task, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def load_task(task_id):
    try:
        return json.loads(task_path(task_id).read_text(encoding="utf-8"))
    except Exception:
        return None


def update_task(task_id, **changes):
    with TASKS_LOCK:
        task = TASKS[task_id]
        task.update(changes)
        write_task(task)
        return dict(task)


def run_codex_task(task_id, prompt):
    with SEMAPHORE:
        update_task(task_id, status="running", started_at=time.time())
        result_file = None
        try:
            fd, result_name = tempfile.mkstemp(prefix="flowfactory-codex-", suffix=".txt")
            os.close(fd)
            result_file = Path(result_name)
            command = [
                CODEX_BIN,
                "--ask-for-approval",
                "never",
                "exec",
                "--ephemeral",
                "--skip-git-repo-check",
                "--sandbox",
                "workspace-write",
                "--color",
                "never",
                "--cd",
                str(WORKDIR),
                "--output-last-message",
                str(result_file),
                "-",
            ]
            process = subprocess.run(
                command,
                input=prompt.encode("utf-8"),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=str(WORKDIR),
                env=os.environ.copy(),
            )
            result = result_file.read_text(encoding="utf-8", errors="replace").strip()
            stderr = process.stderr.decode("utf-8", errors="replace").strip()
            if process.returncode != 0:
                raise RuntimeError(stderr[-8000:] or f"codex exited with {process.returncode}")
            update_task(
                task_id,
                status="completed",
                finished_at=time.time(),
                result=(result or "Codex 沒有返回內容。")[-MAX_RESULT:],
            )
        except Exception as exc:
            update_task(
                task_id,
                status="failed",
                finished_at=time.time(),
                error=str(exc)[-8000:],
            )
        finally:
            if result_file:
                try:
                    result_file.unlink()
                except OSError:
                    pass


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def result_url(self, task_id):
        host = self.headers.get("Host") or f"{HOST}:{PORT}"
        return f"http://{host}/tasks/{task_id}"

    def do_GET(self):
        path = urlsplit(self.path).path.rstrip("/") or "/"
        if path == "/health":
            return self.send_json(200, {"ok": True, "service": "codex-flow-factory-webhook"})
        if path.startswith("/tasks/"):
            task_id = path.rsplit("/", 1)[-1].strip()
            with TASKS_LOCK:
                task = TASKS.get(task_id)
            task = dict(task) if task else load_task(task_id)
            if not task:
                return self.send_json(404, {"ok": False, "error": "task not found"})
            return self.send_json(200, task)
        return self.send_json(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        path = urlsplit(self.path).path.rstrip("/") or "/"
        if path != ROUTE.rstrip("/"):
            return self.send_json(404, {"ok": False, "error": "not found"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            return self.send_json(400, {"ok": False, "error": "invalid body size"})
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return self.send_json(400, {"ok": False, "error": "invalid JSON"})
        if payload.get("event_type") == "connection_test":
            return self.send_json(200, {
                "ok": True,
                "message": "connection successful",
                "agent_name": "Codex",
            })
        prompt = str(payload.get("prompt") or "").strip()
        if not prompt:
            return self.send_json(400, {"ok": False, "error": "prompt is required"})

        task_id = uuid.uuid4().hex
        task = {
            "id": task_id,
            "status": "queued",
            "created_at": time.time(),
            "started_at": None,
            "finished_at": None,
            "result": "",
            "error": "",
        }
        with TASKS_LOCK:
            TASKS[task_id] = task
            write_task(task)
        threading.Thread(target=run_codex_task, args=(task_id, prompt), daemon=True).start()

        result_url = self.result_url(task_id)
        return self.send_json(
            202,
            {
                "ok": True,
                "status": "accepted",
                "task_id": task_id,
                "result_url": result_url,
            },
            {"Location": result_url},
        )


def main():
    if not Path(CODEX_BIN).is_file():
        raise SystemExit(f"Codex CLI 不存在：{CODEX_BIN}")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Flow Factory webhook (Codex) listening on http://{HOST}:{PORT}{ROUTE}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
