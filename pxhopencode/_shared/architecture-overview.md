# Enterprise AI Runtime — 4 Tầng

| Tầng | Tên | Trách nhiệm | Agent |
|------|-----|-------------|-------|
| 1 | Giao diện | Xác thực đầu vào, trình bày output | pxh-help, user prompt |
| 2 | Điều phối | Route tasks, theo dõi state, thi hành policy | pxh-pm |
| 3 | Nhân công | Thiết kế, code, fix, test, review, build, ui-ux | architect, expert, fix-bugs, qa, review-code, devops, ui-ux |
| 4 | Hạ tầng | Lưu state, checkpoint, log | pxh-save-history |

**Contract giao tiếp:** Request (T1→T2), Task (T2→T3), Result (T3→T2), Response (T2→T1), Event (any→T4), State (T4→T2)

**Policies:** Retry (exponential backoff, max 3), Recovery (checkpoint-based), Reflection (4 levels)
