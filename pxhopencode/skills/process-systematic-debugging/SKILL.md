---
name: process-systematic-debugging
description: Dùng khi gặp bug, test failure, hoặc unexpected behavior — LUÔN tìm root cause trước khi fix
---

# Systematic Debugging

## Core Principle

**ALWAYS find root cause before attempting fixes. Symptom fixes are failure.**

## Luật sắt

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
Chưa hoàn thành Phase 1 → không được propose fix
```

## Khi nào dùng

Mọi technical issue: test failures, production bugs, unexpected behavior, performance problems, build failures.

**ĐẶC BIỆT khi:**
- Under time pressure (emergency dễ guess sai)
- "Chỉ một fix nhanh thôi" — cái bẫy phổ biến nhất
- Đã thử nhiều fix nhưng không được
- Chưa hiểu rõ issue

## 4 Phases

### Phase 1: Root Cause Investigation (bắt buộc trước)
1. **Tái hiện** — minimal reproduction + log, reproduce 100%
2. **Khoanh vùng** — Error → File → Stack → Input → Logic
3. **Rubber duck** — giải thích "tại sao" trước khi sửa

### Phase 2: Fix (chỉ sau Phase 1)
- Fix ngắn nhất, minimal diff
- Verify với test

### Phase 3: Polish
- Chạy polish pipeline (game) / cleanup (web)
- Kiểm tra không regression

### Phase 4: Prevent
- Unit test cho bug
- Error boundary / validation

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Bug đơn giản, nhìn là biết" | Nhìn = guess. Root cause mới là truth |
| "Không có thời gian, fix đại đi" | Fix đại = 3 lần thời gian sau này debug lại |
| "Log là đủ, không cần reproduction" | Không reproduce → không biết fix đúng |
| "Fix 1 dòng, không cần typecheck" | Typecheck catch 70% bugs |

## Red Flags

- Propose fix trước khi hoàn thành root cause investigation
- Không tạo minimal reproduction
- Debug dựa trên assumption, không có evidence
- Fix symptom thay vì root cause
- Skip typecheck/lint vì "fix nhỏ"

## Verification

- [ ] Phase 1 hoàn thành: root cause xác định + reproduction
- [ ] Phase 2: minimal fix, verified với test
- [ ] Phase 3: không regression sau fix
- [ ] Phase 4: unit test cho bug + error boundary
- [ ] Reproduction steps documented hoặc automated
