---
name: process-finishing-branch
description: Dùng khi hoàn thành development branch — verify tests, clean history, tạo PR/report
---

# Finishing a Development Branch

## Core Principle

**A branch is not done until tests pass, history is clean, and PR is ready.**

## Quy trình

### Bước 1: Verify
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `npm run test` — 100% pass
- `npm run build` — exit 0

### Bước 2: Clean History
- Commits logical, messages rõ ràng
- Không có WIP / debug / temp commits
- Feature branch → rebase clean

### Bước 3: Final Diff Review
- Self-review toàn bộ diff
- Kiểm tra không có secrets, console.log, commented code

### Bước 4: Report
Tạo summary:
- **Files changed**: ...
- **Key changes**: bullet points
- **Test results**: pass/fail counts
- **Pending**: known issues, future todos

## Luật sắt

```
KHÔNG BAO GIỜ report "done" khi chưa chạy verify suite đầy đủ
```

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Chỉ cần test thôi, không cần typecheck" | Typecheck catch 70% bugs mà test bỏ sót |
| "Clean history sau cũng được" | Merge xong mới clean = không ai clean |
| "Branch nhỏ, không cần report" | Không report = người sau không hiểu context |
| "Linter chỉ là style, không quan trọng" | Linter catch potential bugs, không chỉ style |

## Red Flags

- Skip typecheck vì "mất thời gian"
- Commit history có WIP/debug/temp commits
- Không self-review diff trước khi merge
- Report "done" nhưng không kèm evidence
- Build chạy trên máy local nhưng chưa chạy CI

## Verification

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 warnings
- [ ] `npm run test` — 100% pass
- [ ] `npm run build` — exit 0
- [ ] Commit history clean: logical commits, clear messages
- [ ] Diff self-review: không secrets, console.log, commented code
- [ ] Report generated với files changed + key changes + test results
