# Workflow Tool — CLI, Automation, Extension, Package

> **LUẬT NGÔN NGỮ**: UI text = tiếng Việt. Code = tiếng Anh.
> **ENFORCEMENT GATE:** Mỗi phase BẮT BUỘC chạy `enforce run <phase>` TRƯỚC, `enforce pass/fail <phase>` SAU. Bỏ qua = violation.

## Bước 1: Xác định loại tool

| Loại | Ngôn ngữ | Build | Publish | Skill |
|------|----------|-------|---------|-------|
| CLI (Node) | TypeScript | npm | npm | `tools-cli` |
| CLI (Rust) | Rust | cargo | cargo | `tools-cli` |
| CLI (Python) | Python | pip | PyPI | `tools-cli` |
| Automation | TypeScript/Python | — | npm/PyPI | `tools-automation` |
| VS Code Extension | TypeScript | vsce | Marketplace | `tools-extensions` |
| Code Generator | TypeScript | npm | npm | `tools-codegen` |
| Docker Package | Dockerfile | docker | Docker Hub | `tools-packaging` |

## Bước 2: Setup & Structure
- Node CLI: `npm init && npm install commander`
- Rust CLI: `cargo init && cargo add clap`
- Python CLI: `pip install click`
- VS Code: dùng template trong `skills/tools-extensions/templates/` hoặc `npm create @vscode/extension`
- Sau setup: tạo `.gitignore` trong TARGET với `.opencode/` và `.github/` (xem `_shared/templates/gitignore-template.md`)

## Bước 3: Flow code
```
CLI: Parse args → Validate → Core logic → Output → Error handling
Extension: Command → View/Webview → Provider → Config → Activation
Automation: Watcher → Pipeline → Retry → Log
Codegen: Template → Scaffold → Generate
```

## Loop/Failover
- CLI arg parse fail → sửa validation → retest, max 3 lần
- Extension activation fail → kiểm tra activationEvents → fix, max 3 lần
- Build/Package fail → fix dependency → rebuild, max 3 lần
- Quá 3 lần → báo user + snapshot state

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "CLI không cần test" | Parse sai arg → crash, user mất dữ liệu |
| "Extension manifest.json auto-gen" | Thiếu activation event → extension không chạy |
| "Package publish CI/CD tốn thời gian" | Publish tay quên build → package hỏng |

## Red Flags
- CLI không parse error handling
- VS Code extension missing activationEvents
- Build script không có trong CI

## Verification
- [ ] CLI: arg parse validate + error handling
- [ ] Extension: activationEvents, contributes, commands
- [ ] CI/CD: build → test → publish

## Bước 4: Post-code — chạy company workflow phase 7-11
Code xong → route qua `workflows/company.workflow.md` phase 7-11 (Test→Fix→Review→Build→Persist)
