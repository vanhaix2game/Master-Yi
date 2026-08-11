## HARD GATE — MEMORY INIT (execute now, do not skip)

**First action every session.** Stop. Read nothing below until done.

```
GATE: Memory Init
1. Mode: Test-Path ".opencode/opencode.json" → embedded | không → standalone
2. script_path = standalone: "_shared/scripts/init-memory.ps1" | embedded: ".opencode/_shared/scripts/init-memory.ps1"
3. memory_root = standalone: "{CWD}/.memory/" | embedded: "{CWD}/.opencode/.memory/"
4. Check Test-Path "{memory_root}/index.json"
   NO  → CHẠY init script: powershell -ExecutionPolicy Bypass -File "{script_path}"
         Script tự động: xoá .opencode/.git, merge .gitignore entries, tạo 13 files .memory/
   YES → read index.json → note memory_count + confidence
5. Parse user intent → lookup intent→categories (tối đa 3)
6. Read selected .memory/ files → inject 1-line compact string
7. Output "[MEMORY_INIT_DONE]" — only then process user prompt

⚠️ KHÔNG tạo .memory/ thủ công. Luôn chạy script. Script tự detect mode (standalone/embedded) dựa trên path của nó.
```

**Skip gate = violation. Stop. Chạy lại từ đầu.**

## Step 1: Prompt Compiler (deterministic, 0 token)

```

**Bắt buộc dùng một transaction duy nhất trước khi route prompt tự nhiên:**

```

node .opencode/runtime/bin/session.mjs prepare --stdin

```

Lệnh này block nếu chưa init memory; nếu thành công nó compile prompt, ghi final prompt vào `promptLog.txt`, khởi tạo `.pipeline-state.json` và cập nhật context. Dùng JSON output làm IR Context cho Task contract.
Pipeline:
1. Load skill `prompt-compiler` → Pipeline API
2. `new Pipeline({ backend: 'opencode' }).compile(input)`
3. Output IR + compressed prompt
```

## Step 2: Optimize compiled prompt

- Resolve ambiguities → technical requirements
- Add implied constraints from IR
- Multi-part → ordered steps
- ≤30% longer than original
- IR.constraints = hard requirements

## Step 3: Auto-wrap RULE+TARGET

Nếu prompt chưa bắt đầu bằng `RULE:`, wrap:

```
RULE:

- Read STATUS.md if it exists before starting.
- Do not rewrite the project.
- Only modify files inside TARGET scope.
- Prefer minimal changes.
- Preserve existing working code and behavior.
- Do not refactor unless required for the task.
- Analyze root cause before making changes.
- If requirements are unclear, ask before making changes.
- Verify TARGET after modification.
- Update STATUS.md with:
  - What changed
  - Files modified
  - Verification result
  - Remaining issues (if any)

TARGET:
[compiled + optimized prompt]

IR Context:
- Intents: [from compiler]
- Constraints: [from compiler]
- Priority: [from compiler]
- Safety: [from compiler]
```

Nếu prompt đã bắt đầu bằng `RULE:` → giữ nguyên (không wrap lại). Chỉ dùng final prompt này.

## Step 4: Write final prompt to `promptLog.txt`

Sau khi wrap xong, final prompt được `session.mjs prepare` ghi trong cùng một bước chuẩn bị.
**Overwrite** — file luôn chứa đúng 1 prompt cuối cùng.
File ở workspace root, git-ignored. Xem `agents/pxh-help.md` QUY TRÌNH bước 0.
