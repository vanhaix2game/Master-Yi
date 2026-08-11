#!/usr/bin/env python3
"""Flow Factory Webhook for Hermes Agent.

Receives task prompts from Flow Factory (same machine) and executes them with the
Hermes Agent CLI (`hermes chat --cli -q`). Connection tests answered inline;
long tasks return 202 + result_url which Flow Factory polls via GET /tasks/<id>.

Contract (matches FlowFactory server.py):
  POST /webhooks/flow-factory
    {"prompt": "...", "source": "flow-factory", "event_type": "connection_test"}
      -> 200 {"ok": true, "message": "connection successful"}
    {"prompt": "...", "source": "flow-factory"}
      -> 200 {status: completed, task_id, result, result_url}  (finished <=55s)
      -> 202 {status: accepted, task_id, result_url}           (still running)
  GET /tasks/<id> -> task JSON {status: running|completed|failed, result, error}
  GET /health -> {"ok": true}
"""

import json
import os
import re
import subprocess
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("WEBHOOK_HOST", "127.0.0.1")
PORT = int(os.environ.get("WEBHOOK_PORT", "8646"))
ROUTE = "/webhooks/flow-factory"
TASKS_DIR = ROOT / "tasks"
TASKS_DIR.mkdir(exist_ok=True)

HERMES = str(Path.home() / ".local" / "bin" / "hermes")
MAX_BODY = 1024 * 1024
MAX_RESULT = 20_000
HERMES_TIMEOUT = 600
REQUEST_WAIT = 55

ANSI_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
TASKS = {}
TASKS_LOCK = threading.Lock()
SEMAPHORE = threading.BoundedSemaphore(2)


def task_path(task_id):
    return TASKS_DIR / "{}.json".format(task_id)


def write_disk(task):
    task_path(task["id"]).write_text(
        json.dumps(task, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def load_disk(task_id):
    try:
        return json.loads(task_path(task_id).read_text(encoding="utf-8"))
    except Exception:
        return None


def run_hermes_task(task_id, prompt):
    with SEMAPHORE:
        with TASKS_LOCK:
            task = TASKS[task_id]
            task["status"] = "running"
            task["started_at"] = time.time()
            write_disk(task)
        try:
            proc = subprocess.run(
                [HERMES, "chat", "--cli", "-q", prompt, "-Q"],
                capture_output=True,
                timeout=HERMES_TIMEOUT,
                cwd=str(Path.home()),
                env=os.environ.copy(),
            )
            stdout = ANSI_RE.sub("", proc.stdout.decode("utf-8", errors="replace")).strip()
            stderr = ANSI_RE.sub("", proc.stderr.decode("utf-8", errors="replace")).strip()
            if proc.returncode != 0:
                raise RuntimeError(stderr[-4000:] or "hermes exited with {}".format(proc.returncode))
            result = (stdout or stderr)[-MAX_RESULT:]
            with TASKS_LOCK:
                task = TASKS[task_id]
                task["status"] = "completed"
                task["finished_at"] = time.time()
                task["result"] = result
                write_disk(task)
        except subprocess.TimeoutExpired:
            with TASKS_LOCK:
                task = TASKS[task_id]
                task["status"] = "failed"
                task["finished_at"] = time.time()
                task["error"] = "hermes timed out after {}s".format(HERMES_TIMEOUT)
                write_disk(task)
        except Exception as exc:
            with TASKS_LOCK:
                task = TASKS[task_id]
                task["status"] = "failed"
                task["finished_at"] = time.time()
                task["error"] = str(exc)[-4000:]
                write_disk(task)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            return self._json(200, {"ok": True})
        if self.path.startswith("/tasks/"):
            task_id = self.path.split("/")[-1].strip()
            with TASKS_LOCK:
                task = TASKS.get(task_id)
            task = task or load_disk(task_id)
            if not task:
                return self._json(404, {"ok": False, "error": "task not found"})
            return self._json(200, task)
        return self._json(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        if self.path.rstrip("/") != ROUTE.rstrip("/"):
            return self._json(404, {"ok": False, "error": "not found"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            return self._json(400, {"ok": False, "error": "invalid body size"})
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return self._json(400, {"ok": False, "error": "invalid JSON"})
        if payload.get("event_type") == "connection_test":
            return self._json(200, {"ok": True, "message": "connection successful"})

        prompt = str(payload.get("prompt") or "").strip()
        if not prompt:
            return self._json(400, {"ok": False, "error": "prompt is required"})

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
        write_disk(task)
        threading.Thread(target=run_hermes_task, args=(task_id, prompt), daemon=True).start()

        deadline = time.time() + REQUEST_WAIT
        while time.time() < deadline:
            with TASKS_LOCK:
                task = TASKS[task_id]
                status = task["status"]
            if status in ("completed", "failed"):
                break
            time.sleep(0.5)

        result_url = "http://{}:{}/tasks/{}".format(HOST, PORT, task_id)
        if status == "completed":
            return self._json(200, {
                "status": "completed",
                "task_id": task_id,
                "result": task["result"],
                "result_url": result_url,
            })
        if status == "failed":
            return self._json(200, {
                "status": "failed",
                "task_id": task_id,
                "error": task["error"],
                "result_url": result_url,
            })
        return self._json(202, {
            "status": "accepted",
            "task_id": task_id,
            "result_url": result_url,
        })


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("Flow Factory webhook (Hermes) listening on http://{}:{}{}".format(HOST, PORT, ROUTE), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

