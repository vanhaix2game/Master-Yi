---
name: process-writing-plans
description: Dùng khi có spec/requirements cho multi-step task, trước khi động vào code
---

# Writing Plans

## Core Principle

Viết implementation plan giả định engineer có ZERO context về codebase. Document mọi thứ họ cần: files nào cần touch, code patterns, testing, docs cần check.

## Luật sắt

```
NO CODE WITHOUT A WRITTEN PLAN FIRST
Plan phải có task list bite-sized, mỗi task ≤ 5 phút implement
```

## File Structure

Trước khi define tasks, map files:
- Mỗi file một responsibility rõ ràng
- Files thay đổi cùng nhau → ở cùng chỗ
- Trong codebase cũ → follow established patterns

## Task Right-Sizing

Mỗi task = smallest unit với test cycle riêng:
- "Viết failing test" — 1 step
- "Run để thấy nó fail" — 1 step
- "Implement minimal code" — 1 step
- "Verify pass" — 1 step

**Mỗi step 2-5 phút.** Nếu step > 5 phút → split tiếp.

## Plan Format

```markdown
## Tasks

### Task 1: [tên]
- **Files**: path/to/file.ts
- **Steps**: 
  1. ...
  2. ...
- **Verify**: command to run
- **Expected**: what pass looks like

### Task 2: ...
```

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Plan trong đầu là đủ" | Đầu không share được, không review được |
| "Code xong rồi viết plan" | Plan sau = justification, không phải guide |
| "Dự án nhỏ, không cần plan" | Dự án nhỏ + không plan = bug to |

## Red Flags

- Plan không có file paths cụ thể
- Task size > 5 phút nhưng không split
- Bỏ qua verify step trong task
- Plan viết sau khi code xong
- Không tính đến edge cases hoặc error states

## Verification

- [ ] Plan có task list với file paths cụ thể
- [ ] Mỗi task ≤ 5 phút implement
- [ ] Mỗi task có verify step + expected output
- [ ] Plan review được bởi người khác (hoặc agent)
- [ ] Edge cases và error handling được đề cập trong plan
