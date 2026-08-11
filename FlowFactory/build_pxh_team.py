#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_pxh_team.py - Sinh 10 nhan vien PXH vao workflows.json (MASTER).

Moi nhan vien = 1 workflow/factory voi 1 script step goi opencode_bridge.py
voi --agent dung voi agent code. Giu field pxh_agent de UI lien ket.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get('FLOWFACTORY_DATA_DIR', ROOT)
WORKFLOWS = os.path.join(DATA_DIR, 'workflows.json')

BRIDGE = os.path.join(ROOT, 'opencode_bridge.py').replace('\\', '\\\\')
PROJECT_DIR = r'D:\Project\LV\MASTER\pxhopencode'
OUT_BASE = os.path.join(DATA_DIR, 'outputs')

TEAM = [
    {
        'agent': 'pxh-pm', 'name': 'Project Manager (pxh-pm)',
        'role': 'PM - Điều phối dự án',
        'desc': 'CEO / Project Manager. Phân tích yêu cầu, triệu tập họp, chọn workflow + skill, route task, enforce policy.',
        'resume': 'Tầng 2 - Điều phối. Default agent của pxhopencode. Phân tích yêu cầu, triệu tập meeting, chọn workflow + skill, route Task contracts, enforce retry/recovery/reflection. Là đầu mối giao việc.',
        'icon': 'assistant_a', 'tier': 'T2', 'color': '#3b82f6',
    },
    {
        'agent': 'pxh-architect', 'name': 'Kiến trúc sư (pxh-architect)',
        'role': 'Architect - Thiết kế hệ thống',
        'desc': 'Thiết kế kiến trúc, chọn tech stack, database, API design, data flow, deployment.',
        'resume': 'Tầng 3 - Nhân công. Kiến trúc sư hệ thống: thiết kế kiến trúc, chọn tech stack, database, API design, data flow, deployment. Triệu tập bởi PM.',
        'icon': 'assistant_b', 'tier': 'T3', 'color': '#8b5cf6',
    },
    {
        'agent': 'pxh-expert', 'name': 'Lập trình viên (pxh-expert)',
        'role': 'Vibe Coder - Code tự động',
        'desc': 'Vibe coding: phân tích yêu cầu, chọn workflow + skill, code tự động. "Viết giúp code này".',
        'resume': 'Tầng 3 - Nhân công. Agent vibe coding: phân tích yêu cầu, chọn workflow + skill, code tự động. Read → Code → Run → Iterate. Không hỏi - LÀM.',
        'icon': 'assistant_c', 'tier': 'T3', 'color': '#10b981',
    },
    {
        'agent': 'pxh-qa', 'name': 'Kỹ sư QA (pxh-qa)',
        'role': 'QA - Kiểm thử chất lượng',
        'desc': 'Tự động chạy test, kiểm tra chất lượng, validate tính năng, phát hiện bug, xác nhận fix.',
        'resume': 'Tầng 3 - Nhân công / Kiểm thử. QA Engineer. Tự động chạy test, kiểm tra chất lượng, validate tính năng, phát hiện bug, xác nhận fix. Không release nếu chưa pass QA.',
        'icon': 'assistant_d', 'tier': 'T3', 'color': '#f59e0b',
    },
    {
        'agent': 'pxh-devops', 'name': 'Kỹ sư Build (pxh-devops)',
        'role': 'DevOps - Build & Deploy',
        'desc': 'Build Engineer: lint → typecheck → test → build. Không build nếu chưa pass QA và review.',
        'resume': 'Tầng 3 - Nhân công / Xây dựng. Build Engineer. Chịu trách nhiệm build: lint → typecheck → test → build. Không build nếu chưa pass QA và code review. User tự deploy.',
        'icon': 'assistant_e', 'tier': 'T3', 'color': '#ef4444',
    },
    {
        'agent': 'pxh-ui-ux', 'name': 'Nhà thiết kế UI/UX (pxh-ui-ux)',
        'role': 'UI/UX Designer',
        'desc': 'Thiết kế giao diện & trải nghiệm: Web (React/Tailwind), Game (Phaser HUD), Tool (CLI output).',
        'resume': 'Tầng 3 - Nhân công / UI/UX. Thiết kế giao diện & trải nghiệm người dùng. Web (React/Tailwind), Game (Phaser HUD), Tool (CLI output). Responsive, dark mode, animation, accessibility.',
        'icon': 'assistant_d', 'tier': 'T3', 'color': '#ec4899',
    },
    {
        'agent': 'pxh-fix-bugs', 'name': 'Thợ săn bug (pxh-fix-bugs)',
        'role': 'Bug Hunter - Sửa lỗi',
        'desc': 'Chuyên gia săn lỗi: phân tích stack trace, tìm root cause, sửa chính xác.',
        'resume': 'Tầng 3 - Nhân công. Chuyên gia săn lỗi: phân tích stack trace, tìm root cause, sửa chính xác. Một lỗi - một fix. Hiểu trước khi sửa. Không refactor.',
        'icon': 'assistant_g', 'tier': 'T3', 'color': '#e11d48',
    },
    {
        'agent': 'pxh-review-code', 'name': 'Chuyên gia Review (pxh-review-code)',
        'role': 'Code Reviewer',
        'desc': 'Review code: chất lượng, bảo mật, hiệu năng, maintainability, conventions, testing.',
        'resume': 'Tầng 3 - Nhân công / Rà soát. Chuyên gia review code. Kiểm tra chất lượng, bảo mật, hiệu năng, maintainability, coding conventions, testing. Security > Performance > Quality > Convention.',
        'icon': 'assistant_h', 'tier': 'T3', 'color': '#06b6d4',
    },
    {
        'agent': 'pxh-help', 'name': 'Hướng dẫn viên (pxh-help)',
        'role': 'Help - Tư vấn workflow',
        'desc': 'Tư vấn chọn workflow, validate input, chuyển thành Request contract. KHÔNG code.',
        'resume': 'Tầng 1 - Giao diện. Tư vấn chọn workflow, validate input, chuyển thành Request contract cho Orchestration. KHÔNG code.',
        'icon': 'assistant_i', 'tier': 'T1', 'color': '#14b8a6',
    },
    {
        'agent': 'pxh-save-history', 'name': 'Thư ký lịch sử (pxh-save-history)',
        'role': 'Historian - Ghi nhật ký',
        'desc': 'Thu ký ghi lại lịch sử quyết định kỹ thuật, tóm tắt phiên, persist state, checkpoint.',
        'resume': 'Tầng 4 - Hệ tầng. Thu ký ghi lại lịch sử quyết định kỹ thuật. Tóm tắt phiên, rationale, hướng đi đã thử, kết quả. Persist state, logging, checkpoint, recovery.',
        'icon': 'assistant_g', 'tier': 'T4', 'color': '#a855f7',
    },
]

EMPLOYEE_TEMPLATE = """#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, subprocess, sys

OUT = r"${OUT}"
os.makedirs(OUT, exist_ok=True)

task = \"\"\"{{task}}\"\"\"
project_dir = r"{{project_dir}}" or r"__PROJECT_DIR__"
model = r"{{model}}".strip()

task_file = os.path.join(OUT, "_task.txt")
try:
    with open(task_file, "w", encoding="utf-8") as f:
        f.write(task)
except OSError as exc:
    print("ERR: khong ghi duoc task_file:", exc)
    sys.exit(1)

cmd = [sys.executable, r"__BRIDGE__",
       "--agent", "__AGENT__", "--task-file", task_file,
       "--dir", project_dir, "--out", OUT]
if model:
    cmd += ["--model", model]

print("Dang goi __AGENT__ (opencode CLI)...")
proc = subprocess.run(cmd, capture_output=True, text=True,
                      encoding="utf-8", errors="replace", timeout=1800)
if proc.stdout:
    print(proc.stdout, end="")
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
"""


def clean(name):
    return name.replace('/', '_').replace('\\', '_').strip()


def build_step(member, output_dir):
    title = 'Giao viec ' + member['agent']
    script = (EMPLOYEE_TEMPLATE
              .replace('__BRIDGE__', BRIDGE)
              .replace('__AGENT__', member['agent'])
              .replace('__PROJECT_DIR__', PROJECT_DIR))
    out_abs = os.path.join(output_dir, title).replace('\\', '/')
    return {
        'id': 'step-%s-%d' % (member['agent'], 1),
        'title': title,
        'desc': 'Nhap mo ta cong viec -> agent %s phan tich/thuc hien. Output: result.md + result.json + log.' % member['agent'],
        'type': 'script',
        'fields': [
            {'id': 'task', 'label': 'Yeu cau / mo ta cong viec', 'type': 'textarea',
             'placeholder': 'VD: Phan tich kien truc ung dung hien tai, de xuat tach module.', 'required': True},
            {'id': 'project_dir', 'label': 'Thu muc du an (chua opencode.json cua pxhopencode)',
             'type': 'text', 'default': PROJECT_DIR, 'required': False},
            {'id': 'model', 'label': 'Model tuy chon (de trong de dung mac dinh)',
             'type': 'text', 'required': False},
        ],
        'outputs': [
            {'label': 'Ket qua Markdown', 'filename': 'result.md', 'type': 'Markdown', 'path': out_abs},
            {'label': 'Ket qua JSON', 'filename': 'result.json', 'type': 'JSON', 'path': out_abs},
            {'label': 'Log OpenCode tho', 'filename': 'opencode_raw.log', 'type': 'Text', 'path': out_abs},
        ],
        'outputPath': out_abs,
        'dependsOn': [],
        'actions': [{'type': 'run_script', 'label': 'Chay yeu cau'}],
        'script': script,
        'order': 1,
    }


def build_workflow(member, ts):
    name = member['name']
    out_dir = os.path.join(OUT_BASE, clean(name)).replace('\\', '/')
    return {
        'id': 'factory-%s-%d' % (member['agent'], ts),
        'name': name,
        'description': member['desc'],
        'resume': member['resume'],
        'status': 'ready',
        'employee_icon': member['icon'],
        'pxh_agent': member['agent'],
        'pxh_role': member['role'],
        'pxh_tier': member['tier'],
        'pxh_color': member.get('color', '#2563eb'),
        'steps': [build_step(member, out_dir)],
    }


def main():
    with open(WORKFLOWS, encoding='utf-8') as f:
        data = json.load(f)
    ts = int(__import__('time').time() * 1000)
    workflows = [build_workflow(m, ts) for m in TEAM]
    data['workflows'] = workflows
    with open(WORKFLOWS, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print('Ghi %d nhan vien PXH vao %s' % (len(workflows), WORKFLOWS))
    for w in workflows:
        print(' - %s [%s]' % (w['name'], w['pxh_agent']))


if __name__ == '__main__':
    main()
