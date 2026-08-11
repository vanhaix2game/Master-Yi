# Company Workflow — Master Orchestration

> **LUẬT:** UI text = tiếng Việt. Code = tiếng Anh.
> **ENFORCEMENT GATE:** Mỗi phase BẮT BUỘC chạy `enforce run <phase>` TRƯỚC, `enforce pass/fail <phase>` SAU. Bỏ qua = violation.

## 11 bước (T1→T2→T3→T4→T2→T1) + ENFORCEMENT

| # | Phase | Agent | ENFORCE PRE | ENFORCE POST |
|---|-------|-------|-------------|-------------|
| 1 | NHẬN | T1→T2 | — | — |
| 2 | PHÂN TÍCH | T2 | `enforce run analyze` | `enforce pass analyze` |
| 3 | HỌP | T2→@meeting | `enforce run meeting` | `enforce pass meeting` |
| 4 | KẾ HOẠCH | T2 | `enforce run analyze` | `enforce pass analyze` |
| 5 | THIẾT KẾ | @pxh-architect | `enforce run architect` | `enforce pass architect` |
| 6 | CODE | @pxh-expert/@pxh-ui-ux | `enforce run code` | `enforce pass code` |
| 7 | KIỂM TRA | @pxh-qa | `enforce run test` | `enforce pass test` |
| 8 | SỬA | @pxh-fix-bugs | `enforce run fix` | `enforce pass fix` |
| 9 | RÀ SOÁT | @pxh-review-code | `enforce run review` | `enforce pass review` |
| 10 | PHÁT HÀNH | @pxh-devops | `enforce run build` | `enforce pass build` |
| 11 | LƯU | @pxh-save-history | `enforce run persist` | `enforce pass persist` |

### ENFORCEMENT GATE — imperative (không được skip)

```
TRƯỚC mỗi phase:
  BẮT BUỘC chạy: node .opencode/runtime/bin/enforce.mjs run <phase>
  → Nếu FAILED (pre-hook lỗi): KHÔNG ĐƯỢC proceed. Fix lỗi trước.
  → Nếu OK: proceed.

SAU mỗi phase (thành công):
  BẮT BUỘC chạy: node .opencode/runtime/bin/enforce.mjs pass <phase>

SAU mỗi phase (thất bại):
  BẮT BUỘC chạy: node .opencode/runtime/bin/enforce.mjs fail <phase>
  → Nếu loop còn lượt: quay lại phase.
  → Nếu hết loop: escalate user.
```

### Pre-hook tự động (enforce run <phase>)
1. `validate.mjs all` — kiểm tra engine contracts integrity
2. `context.mjs export` — inject recent prompts vào context
3. `pipeline.mjs start <phase>` — đánh dấu phase đang chạy
4. `detect.mjs --json` — phát hiện project framework

### Post-hook tự động (enforce pass/fail <phase>)
1. `pipeline.mjs pass/fail <phase>` — cập nhật pipeline state
2. `context.mjs add "<phase> <status>"` — ghi context

### Loop mechanism
- Code→Test→Fix: nếu test fail → quay lại Bước 6 (max 3 lần)
- Review→Fix→Test: nếu critical issue → quay lại Bước 8 (max 3 lần)
- Build fail → quay lại Bước 6 (max 3 lần)
- Quá 3 lần → báo user

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Skip enforce để nhanh" | Pipeline sai → không biết đang ở phase nào. **Bỏ qua = violation.** |
| "Validate tốn thời gian" | Contract sai → worker nhận task hỏng → mất thời gian gấp 10x |
| "Không cần context, tôi nhớ" | Worker không có context → code sai hướng → rewrite |
| "Code trước, thiết kế sau" | Thiếu architect → N+1 queries, wrong schema, rewrite |
| "Test chạy thủ công, không cần unit" | Mỗi bug manual = 10x cost so với automated |
| "Review chỉ hình thức" | Security hole không review = production incident |
| "Skip build, deploy thẳng" | Lint/typecheck fails ở CI = mất thời gian hơn |
| "ADR không cần, sau này viết" | 2 tuần sau không ai nhớ tại sao chọn tech đó |

## Red Flags

- Phase bị skip không enforce pre/post
- `enforce run` báo FAILED nhưng vẫn proceed
- Test pass nhưng coverage < 60%
- Build warning bị ignore
- Bug tái phát > 2 lần (thiếu root cause)

## Verification
- [ ] Task contract đủ fields: phase, target, context, skills
- [ ] ENFORCEMENT GATE applied (pre + post) cho mỗi phase
- [ ] Loop mechanism applied (max 3 retries per phase)
- [ ] pipeline.mjs status cho thấy đúng thứ tự phase
- [ ] context.mjs export có ít nhất 1 entry

## XỬ LÝ NGOẠI LỆ
| Tình huống | Xử lý |
|-----------|-------|
| enforce run FAILED | KHÔNG proceed. Báo T2, fix lỗi, chạy lại. |
| Thiếu thông tin | T1 hỏi user |
| Bug 3 lần không fix | T2 escalate → báo user |
| Build fail | T2 log → T4 persist → báo user |
| User cancel | T2 lưu state, resume sau |
| Conflict agents | T2 phân xử, user cuối cùng |
