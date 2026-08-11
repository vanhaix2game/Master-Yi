#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Insert pxh-architect employee at index 0 of data/workflows.json."""
import json
import time
import uuid

WF = r"D:\Project\LV\FLOW FACTORY\data\workflows.json"

script_body = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, subprocess, sys

OUT = r"${OUT}"
os.makedirs(OUT, exist_ok=True)

task = """{{task}}"""
project_dir = r"{{project_dir}}" or r"D:\Project\LV\pxhopencode-master"
model = r"{{model}}".strip()

task_file = os.path.join(OUT, "_task.txt")
try:
    with open(task_file, "w", encoding="utf-8") as f:
        f.write(task)
except OSError as exc:
    print("ERR: khong ghi duoc task_file:", exc)
    sys.exit(1)

cmd = [sys.executable, r"D:\Project\LV\FLOW FACTORY\opencode_bridge.py",
       "--agent", "pxh-architect", "--task-file", task_file,
       "--dir", project_dir, "--out", OUT]
if model:
    cmd += ["--model", model]

print("Dang goi pxh-architect (opencode CLI)...")
proc = subprocess.run(cmd, capture_output=True, text=True,
                      encoding="utf-8", errors="replace", timeout=1800)
if proc.stdout:
    print(proc.stdout, end="")
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
'''

now_ms = int(time.time() * 1000)
output_dir = r"D:/Project/LV/FLOW FACTORY/data/outputs/Kien truc su/Yeu cau kien truc"

employee = {
    "id": f"factory-pxh-architect-{now_ms}",
    "name": "Kien truc su (pxh-architect)",
    "description": "Chuyen gia tich hop tu pxhopencode: phan tich va thiet ke kien truc phan mem, review giai phap ky thuat, de xuat mo hinh. Goi OpenCode CLI tai cho, khong ton token cua Flow Factory Agent.",
    "resume": "T3 Architect - thiet ke giai phap, phan ra module, danh gia rui ro kien truc, de xuat stack. Nhan yeu cau tu trac nghiem cua ban, goi agent pxh-architect trong du an pxhopencode, tra ket qua ve day.",
    "status": "ready",
    "employee_icon": "assistant_a",
    "steps": [
        {
            "id": f"step-pxh-architect-{now_ms}-1",
            "title": "Yeu cau kien truc",
            "desc": "Nhap mot ta cong viec -> agent pxh-architect phan tich/thiet ke. Output: result.md + result.json + log.",
            "type": "script",
            "fields": [
                {
                    "id": "task",
                    "label": "Yeu cau / mo ta cong viec",
                    "type": "textarea",
                    "placeholder": "VD: Phan tich kien truc ung dung quan ly du an Streamlit hien tai, de xuat tach module va quy trinh hoi quy.",
                    "required": True
                },
                {
                    "id": "project_dir",
                    "label": "Thu muc du an (mo duoc opencode.json cua pxhopencode)",
                    "type": "text",
                    "default": r"D:\Project\LV\pxhopencode-master",
                    "required": False
                },
                {
                    "id": "model",
                    "label": "Model tuy chon (vd provider/model; de trong de dung mac dinh)",
                    "type": "text",
                    "required": False
                }
            ],
            "outputs": [
                {"label": "Ket qua Markdown", "filename": "result.md", "type": "Markdown", "path": output_dir},
                {"label": "Ket qua JSON", "filename": "result.json", "type": "JSON", "path": output_dir},
                {"label": "Log OpenCode tho", "filename": "opencode_raw.log", "type": "Text", "path": output_dir}
            ],
            "outputPath": output_dir,
            "dependsOn": [],
            "actions": [{"type": "run_script", "label": "Chay yeu cau"}],
            "script": script_body,
            "order": 1
        }
    ]
}

with open(WF, "r", encoding="utf-8") as f:
    data = json.load(f)
if not isinstance(data.get("workflows"), list):
    raise SystemExit("workflows khong phai list")

# Xoa neu da ton tai employee id cu cung ten (de chay lai an toan)
data["workflows"] = [w for w in data["workflows"] if w.get("name") != "Kien truc su (pxh-architect)"]
data["workflows"].insert(0, employee)

with open(WF, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("OK - insert employee index 0:")
print("  id:", employee["id"])
print("  name:", employee["name"])
print("  steps:", len(employee["steps"]))