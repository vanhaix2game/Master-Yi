# Vibe Coding Memory Engine — DETERMINISTIC

> ***BẮT BUỘC. Đọc và thực thi ngay đầu session. Bỏ qua = violation.***
> **MEMORY PATH:** standalone → `{workspace_root}/.memory/` · embedded → `{workspace_root}/.opencode/.memory/`

## STARTUP PIPELINE (execute in order — DO NOT SKIP)

> ⚠️ **pxh-pm chạy bước này tự động đầu mỗi session.**
> Nếu bạn là agent khác và thấy `.memory/` chưa có → chạy ngay lệnh bên dưới.

```
Step 1: workspace_root = dir containing .opencode/ (hoặc CWD nếu standalone)
Step 2: Check .memory/ (tại workspace_root hoặc .opencode/.memory/ tuỳ mode)
  EXISTS → read index.json → check memory_count + confidence
  MISSING → chạy lệnh dưới đây (luôn chạy được — script tự detect mode)
Step 3: Parse user prompt intent (dùng Prompt Compiler → IR → intent map bên dưới)
Step 4: Lookup intent→categories (bảng bên dưới) → max 3 categories
Step 5: Read selected .memory/ files → produce compact injection (định dạng bên dưới)
Step 6: Inject compact string vào context → thực thi task
Step 7: SAU task → reflection → ghi .memory/ (xem ## MEMORY REFLECTION trong agent file)
```

**Guard token:** Sau Step 6, output `[MEMORY_INIT_DONE]` — nếu chưa output token này, user prompt KHÔNG được xử lý.

### LỆNH AUTO-INIT (copy-paste — chạy 1 lần)

Script tự detect standalone vs embedded dựa trên vị trí của nó:

| Mode | Lệnh | `.memory/` tạo ở |
|------|------|-----------------|
| Standalone | `powershell.exe -ExecutionPolicy Bypass -File "_shared/scripts/init-memory.ps1"` | `{CWD}/.memory/` |
| Embedded | `powershell.exe -ExecutionPolicy Bypass -File ".opencode/_shared/scripts/init-memory.ps1"` | `{CWD}/.opencode/.memory/` |

Script tự động:
- Tìm `runtime/memory/init.json` dựa trên vị trí của script
- Đọc template → tạo 13 file JSON trong `.memory/`
- Detect project type từ `package.json` / `Cargo.toml` / `pyproject.toml`
- Điền `project_id`, `project_name`, `framework`, `language`, `runtime`, `folder_structure`, `build_tools`
- Kiểm tra `.gitignore` ở workspace root — nếu chưa có `.opencode/` entry → thêm vào
- Idempotent: chạy lại không sao

### Nếu script lỗi (fallback)

Init thủ công từng file theo `init.json`:
- Standalone: `{workspace_root}/runtime/memory/init.json`
- Embedded: `{workspace_root}/.opencode/runtime/memory/init.json`

Copy từng file object trong `init.json.files` vào thư mục `.memory/` tương ứng.

## INTENT → CATEGORIES MAP

| Intent | Load .memory/ |
|--------|---------------|
| fix_bug, debug, find_root_cause | bugs.json + patterns.json |
| generate_feature, generate_game, generate_api, generate_ui | patterns.json + decisions.json + project.json |
| architecture_design | architecture.json + decisions.json + project.json |
| write_tests | bugs.json + patterns.json |
| review_code, security_audit | patterns.json + decisions.json |
| performance_optimization | patterns.json + bugs.json |
| deployment, release, packaging | project.json + decisions.json |
| explain, read_codebase, search, analyze_project | index.json + project.json |
| enhance_ui, rapid_prototype, integrate_systems, refactor_vibe | patterns.json + decisions.json + project.json |
| unknown (no match) | index.json + project.json (minimal) |

## COMPACT INJECTION FORMAT

1 dòng/category, tối đa 3 categories. Skip category nếu confidence < 60 hoặc data rỗng.
`MEMORY [{cat}] {key}={val} {key}={val}`

```
MEMORY [project] lang=TS fw=opencode tools=npm,powershell | [patterns] naming=snake_case err=2 | [bugs] count=0
MEMORY empty   ← khi memory_count = 0
```

## ANTI-RATIONALIZATION

| Excuse | Reality |
|--------|---------|
| "Memory empty, không cần inject" | Vẫn inject "empty" → agent biết không có memory |
| "Load hết categories cho chắc" | Token waste, tràn context |
| "Inject verbose cho rõ" | 1 dòng/category. Dài hơn = mất focus |
| "Không cần parse intent, biết ngay" | Intent sai → load sai memory → context sai |
| "Skip reflection, task nhỏ mà" | Không ghi → session sau mất context |

## RED FLAGS

- memory_count = 0 nhưng không inject "MEMORY empty"
- Load > 3 categories
- Inject > 1 dòng/category
- Confidence < 60 nhưng vẫn inject
- Quên Step 7 (reflection) sau task
- **Chưa output "[MEMORY_INIT_DONE]" nhưng đã xử lý user prompt**

## VERIFICATION

- [ ] Intent matched ≥ 1 category (fallback: unknown)
- [ ] Injected ≤ 3 categories, ≤ 1 dòng/category
- [ ] Confidence filter applied (skip < 60)
- [ ] .memory/ updated sau task
- [ ] Guard token `[MEMORY_INIT_DONE]` output trước khi xử lý prompt
