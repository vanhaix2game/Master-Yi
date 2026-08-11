---
name: process-tdd
description: Dùng khi implement feature hoặc bugfix — VIẾT TEST TRƯỚC, coi nó fail, rồi mới code
---

# Test-Driven Development (TDD)

## Core Principle

**If you didn't watch the test fail, you don't know if it tests the right thing.**

## Luật sắt

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
Viết code trước test? Xoá đi. Bắt đầu lại.
```

Không exceptions: không giữ làm reference, không adapt, không nhìn lại. Delete rồi implement fresh từ tests.

## Red-Green-Refactor

🔴 **RED**: Viết failing test → run → thấy nó fail
🟢 **GREEN**: Viết minimal code → run → thấy nó pass
🔧 **REFACTOR**: Clean code → run → vẫn pass

## Khi nào dùng

**Luôn luôn:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (hỏi user trước):**
- Throwaway prototypes
- Generated code
- Configuration files

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Feature nhỏ, test sau cũng được" | "Sau" = không bao giờ |
| "Tôi biết code này đúng mà" | Biết != chứng minh được |
| "Không có thời gian viết test" | Không test = 3x thời gian debug |
| "Test đơn giản, không cần run" | Test không run = test không tồn tại |

## Red Flags

- Viết code trước test → không có RED phase
- Test luôn pass ngay từ lần đầu → test weak hoặc không test đúng behavior
- Không run test, chỉ nhìn code "cũng đúng"
- Test không cover edge cases (empty, null, error)
- Refactor xong không run lại test

## Verification

- [ ] RED phase: test fail với expected message
- [ ] GREEN phase: minimal code pass test
- [ ] REFACTOR phase: clean code, test vẫn pass
- [ ] Edge cases covered: empty/null/error states
- [ ] No production code without failing test first
