---
name: process-driven-development
description: Dùng khi thực thi implementation plan với nhiều task độc lập trong cùng session — dispatch subagent mới cho mỗi task
---

# Subagent-Driven Development

Triển khai plan bằng cách dispatch một subagent implementer mới cho mỗi task, review spec compliance + code quality sau mỗi task, và một broad review toàn bộ branch cuối cùng.

## Core Principle

**Fresh subagent per task + task review + broad final review = high quality, fast iteration**

Subagent nhận context được craft chính xác — không kế thừa history session của bạn.

## Khi nào dùng

- Có implementation plan với tasks rõ ràng
- Tasks độc lập, không share state
- Cùng session (không cần context switch)

**Không dùng khi:** Tasks tightly coupled, cần brainstorm trước, plan chưa rõ.

## Luật sắt

```
KHÔNG BAO GIỜ dispatch subagent mà không có task spec rõ ràng + expected output
```

## Quy trình

### Bước 1: Load & Review Plan
1. Đọc plan file
2. Xác định task list, đánh giá independence
3. Nếu có concerns → hỏi user trước

### Bước 2: Dispatch từng task
Mỗi task = 1 subagent mới:
- Craft context tối thiểu: spec + files cần sửa + expected behavior
- KHÔNG kế thừa session history
- Set expected output rõ ràng

### Bước 3: Review sau mỗi task
Kiểm tra: spec compliance, code quality, test pass
- FAIL → dispatch lại với bug report
- PASS → next task

### Bước 4: Broad final review
- Toàn bộ diff, integration test, lint/typecheck
- Báo cáo kết quả cho user

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Task nhỏ quá, không cần subagent" | Task nhỏ + không review = bug tiềm ẩn |
| "Tiết kiệm context, dispatch chung" | Context pollution → sai logic, mất thời gian debug |
| "Review sau, làm nhanh đã" | Không review = không biết quality |

## Red Flags

- Dispatch subagent không có expected output rõ ràng
- Skip review sau mỗi task vì "đơn giản"
- Gộp nhiều task vào một subagent
- Không kiểm tra test pass trước khi merge
- Plan chưa rõ nhưng vẫn dispatch

## Verification

- [ ] Mỗi task có spec + expected output trước khi dispatch
- [ ] Review spec compliance + code quality sau mỗi task
- [ ] Integration test + lint/typecheck pass ở final review
- [ ] Không task nào được dispatch với context không đầy đủ
- [ ] Subagent output matches expected output
