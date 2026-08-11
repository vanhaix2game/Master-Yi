# Workflow Phát hành — Build Pipeline

> **LUẬT NGÔN NGỮ**: UI text (thông báo user) = **tiếng Việt**. Script code, commit messages, tags = **tiếng Anh**.
> **ENFORCEMENT GATE:** Phase build BẮT BUỘC `enforce run build` TRƯỚC, `enforce pass/fail build` SAU.

Pipeline: lint → typecheck → test → build/tag → báo user.

## Điều kiện (Gate Check)
```
☐ QA passed — @pxh-qa Result{status: pass}
☐ Code reviewed — @pxh-review-code Result{approved: true}
☐ Git status clean
```
Không thỏa → **TỪ CHỐI**, Event{reject} → T4 + báo user.

## Steps
1. **Lint + TypeCheck**: `powershell.exe -ExecutionPolicy Bypass -File "_shared/build-scripts.ps1" -Step lint`
2. **Test Suite**: `powershell.exe -ExecutionPolicy Bypass -File "_shared/build-scripts.ps1" -Step test`
3. **Build**: `powershell.exe -ExecutionPolicy Bypass -File "_shared/build-scripts.ps1" -Step build`
4. **Tag version**: `git tag v$(node -e "console.log(require('./package.json').version)")`
5. **Báo user**:
   - **Meta-project** (pxhopencode): `✅ Release v50 sẵn sàng! 📦 Extension .vsix nếu có. 👉 git push --tags && publish extension.`
   - **User project**: `✅ Build thành công! 📁 Output: dist/ (hoặc .next/) 👉 Bạn deploy tuỳ ý.`

Sau build → Event{phase: release, status: success, data: {version, size, date}} → @pxh-save-history.

## XỬ LÝ SỰ CỐ
| Vấn đề | Hành động |
|--------|----------|
| Lint lỗi | Fix → commit → chạy lại pipeline |
| Test fail | Báo QA, không release |
| Build fail | Kiểm tra log, fix dependency |
| Tag conflict | `git tag -d vX` → bump version → tag lại |

## Loop/Failover
- Lint error → fix → rerun lint, max 3 lần
- Test fail → báo QA, không bypass, max 3 lần
- Build fail → fix dep → rebuild, max 3 lần
- Tag conflict → `git tag -d vX` → bump → tag lại, max 2 lần
- Quá 3 lần → báo user + abort release

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Lint warning nhỏ, release vẫn được" | Warning hôm nay = error ngày mai |
| "Typecheck chậm, skip đi" | Runtime error type-related lúc nào cũng xảy ra |
| "Test flaky, chạy lại là pass" | Flaky test bỏ qua bug → regression |
| "Meta-project không có build, skip hết" | VSCE extension vẫn cần package → verify |

## Red Flags
- Build success nhưng có warning
- Gate check chưa pass (QA/review)
- Output file không tồn tại hoặc size 0
- Tag version không khớp STATUS.md

## Verification
- [ ] Gate: QA pass + Review pass + Git clean
- [ ] Lint 0 error, typecheck pass, test all green
- [ ] Build output exists + size hợp lý (hoặc meta-project: tag tồn tại)
- [ ] Tag version phù hợp STATUS.md

## NGUYÊN TẮC
1. **Fail fast**: lỗi → dừng ngay
2. Mỗi bước phải pass — không skip
