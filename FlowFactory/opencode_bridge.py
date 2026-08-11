#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""opencode_bridge.py — Goi opencode CLI (pxhopencode) tu Flow Factory.

Flow Factory script step chi goi:  python3 opencode_bridge.py --agent <name> --task-file <path> --dir <project> --out <dir> [--model <m>] [--extra "<args>"]

Chay: opencode run --agent <name> [--model] <task> --format json --dir <project>
Doc stdout la NDJSON events (opencode --format json), in cac dong text ra stdout
(Flow Factory bat lam task events -> UI hien "nhan vien dang lam viec" live),
gom ket qua cuoi ghi vao <out>/result.md va <out>/result.json.
Return code 0 = thanh cong.
"""
import argparse
import json
import os
import subprocess
import sys
import time
import uuid

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

OPENCODE_CMD_CANDIDATES = [
    r"C:\Users\CX-PC064\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe",
    r"C:\Users\CX-PC064\AppData\Roaming\npm\opencode.cmd",
    r"C:\Users\CX-PC064\AppData\Roaming\npm\opencode",
    "opencode",
]

# Dung tien to cmd /c khi la .cmd shim de tranh cmd.exe re-encode UTF-8 sang codepage
# he thong (gay mojibake cho output tieng Viet). Exe native chay thang, khong can.
def _wrap_cmd(candidate, base_cmd):
    if candidate.lower().endswith('.cmd') or candidate.lower().endswith('.bat'):
        return ['cmd', '/c', *base_cmd]
    return base_cmd


def find_opencode():
    for cand in OPENCODE_CMD_CANDIDATES:
        try:
            if cand in ("opencode",) or os.path.isfile(cand):
                return cand
        except OSError:
            continue
    return "opencode"


def _strip_ansi(text):
    import re
    return re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", text)


def emit(line, kind="info"):
    if not line:
        return
    line = _strip_ansi(str(line)).strip()
    if not line:
        return
    print(line, flush=True)


def parse_events(stdout):
    """NDJSON events tu 'opencode run --format json'. Tra ve list text cua assistant + tool names."""
    texts = []
    tool_names = []
    for raw in stdout.splitlines():
        raw = raw.strip()
        if not raw:
            continue
        try:
            evt = json.loads(raw)
        except (ValueError, json.JSONDecodeError):
            texts.append(raw)
            continue
        etype = evt.get("type")
        if etype == "text":
            part = evt.get("part") or {}
            text = part.get("text")
            if text:
                texts.append(text)
        elif etype == "tool":
            part = evt.get("part") or {}
            name = part.get("name") or part.get("tool")
            if isinstance(name, dict):
                name = name.get("name")
            if name:
                tool_names.append(str(name))
        elif etype == "message":
            msg = evt.get("message") or {}
            role = msg.get("role")
            content = msg.get("content")
            if isinstance(content, str):
                if role == "assistant":
                    texts.append(content)
            elif isinstance(content, list):
                for part in content:
                    if not isinstance(part, dict):
                        continue
                    ptype = part.get("type")
                    if ptype == "text":
                        text = part.get("text")
                        if role == "assistant" and text:
                            texts.append(text)
                    elif ptype == "tool":
                        name = part.get("name") or (part.get("tool") or {}).get("name")
                        if name:
                            tool_names.append(name)
    return texts, tool_names


def main():
    ap = argparse.ArgumentParser(description="Call opencode agent (pxhopencode) from Flow Factory")
    ap.add_argument("--agent", required=True, help="pxh-* agent name, e.g. pxh-architect")
    ap.add_argument("--task-file", default="", help="path to file containing the task text")
    ap.add_argument("--task", default="", help="inline task text (fallback if no task-file)")
    ap.add_argument("--dir", default="", help="project dir to run opencode in (default: cwd)")
    ap.add_argument("--out", default="", help="output dir; result.md / result.json written here")
    ap.add_argument("--model", default="", help="optional model provider/model")
    ap.add_argument("--timeout", type=int, default=1800, help="max seconds")
    args = ap.parse_args()

    if args.task_file and os.path.isfile(args.task_file):
        with open(args.task_file, "r", encoding="utf-8") as f:
            task = f.read().strip()
    elif args.task:
        task = args.task
    elif not sys.stdin.isatty():
        task = sys.stdin.read().strip()
    else:
        task = ""
    if not task:
        emit("ERR: khong co task (task-file trong, thieu --task, hoac stdin rong)", kind="error")
        return 1

    out_dir = args.out or os.getcwd()
    os.makedirs(out_dir, exist_ok=True)
    project_dir = args.dir or os.getcwd()

    opencode_exe = find_opencode()
    cmd = _wrap_cmd(opencode_exe, [opencode_exe, "run", "--agent", args.agent, "--format", "json", "--dir", project_dir])
    if args.model:
        cmd += ["--model", args.model]
    cmd.append(task)

    emit(f"[opencode] agent={args.agent} dir={project_dir} (bat dau {time.strftime('%H:%M:%S')})")
    start = time.time()
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=args.timeout,
        )
    except subprocess.TimeoutExpired:
        emit(f"ERR: timeout sau {args.timeout}s", kind="error")
        return 1
    except OSError as exc:
        emit(f"ERR: khong goi duoc opencode ({exc})", kind="error")
        return 1

    elapsed = round(time.time() - start, 1)
    stdout = proc.stdout or ""
    stderr = proc.stderr or ""

    texts, tool_names = parse_events(stdout)
    for name in tool_names:
        emit(f"[tool] {name}")
    for text in texts:
        emit(text, kind="agent")
    if stderr.strip():
        for line in stderr.splitlines():
            line = line.strip()
            if line:
                emit(line, kind="error")

    result = {
        "ok": proc.returncode == 0,
        "agent": args.agent,
        "project_dir": project_dir,
        "task": task,
        "elapsed_seconds": elapsed,
        "returncode": proc.returncode,
        "text": "\n\n".join(texts).strip() or (stdout.strip()[-4000:] if stdout.strip() else ""),
        "raw_stdout": stdout[-20000:],
        "raw_stderr": stderr[-5000:],
    }

    md_path = os.path.join(out_dir, "result.md")
    json_path = os.path.join(out_dir, "result.json")
    raw_path = os.path.join(out_dir, "opencode_raw.log")
    try:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(f"# Agent: {args.agent}\n\n")
            f.write(f"> du an: {project_dir} | thoi gian: {elapsed}s | exit {proc.returncode}\n\n")
            f.write(result["text"])
        with open(raw_path, "w", encoding="utf-8") as f:
            f.write(stdout)
            if stderr:
                f.write("\n\n--- STDERR ---\n")
                f.write(stderr)
        emit(f"[opencode] xong trong {elapsed}s, exit={proc.returncode}. Output: {md_path}", kind="success")
    except OSError as exc:
        emit(f"ERR: ghi output that bai ({exc})", kind="error")
        return 1

    return 0 if proc.returncode == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
