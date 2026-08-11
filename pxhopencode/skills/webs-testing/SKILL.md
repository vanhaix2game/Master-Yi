---
name: webs-testing
description: Testing web — Vitest unit test, integration test, Playwright E2E, MSW mock. Coverage > 80%, chạy song song, không flaky.
---

# webs-testing — Testing

## Core Principle

**If you didn't watch the test fail, you don't know if it tests the right thing.**

## Luật sắt

```
KHÔNG BAO GIỜ viết production code TRƯỚC test
Coverage < 80% là chưa xong
```

## Cài đặt Vitest
> jsdom, globals, forks pool, timeout 10s, coverage > 80%.
→ `templates/vitest.config.ts`

## Unit Test
Button component — render, click, loading state, variant classes. Dùng `userEvent` (không fireEvent) cho click.
→ `templates/unit-tests.ts`

## Hook Test
`useLocalStorage` — initial value, store/retrieve, invalid JSON recovery. Dùng `renderHook` + `act`.
→ `templates/hook-tests.ts`

## MSW Mock (API)
HTTP handlers GET + POST cho `/api/todos`. Dùng `HttpResponse.json`.
→ `templates/msw-handlers.ts`

## Integration Test
`setupServer` từ MSW, listen/reset/close lifecycle. Test TodoPage load + create.
→ `templates/integration-tests.ts`

## E2E với Playwright
Todo App: empty state, add + complete, persist after reload.
→ `templates/e2e-todo.spec.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Test chạy thủ công đủ" | Manual bỏ sót edge case, regression không phát hiện |
| "Coverage 50% là ổn" | < 80% = code không test = bug tiềm ẩn |
| "E2E flaky, không cần" | Flaky = setup sai, không phải lý do bỏ |

## Red Flags
- Test mock quá nhiều, không test real integration
- Coverage < 80%
- E2E test flaky không debug

## Verification
- [ ] Unit test cho component + hook
- [ ] MSW mock cho API test
- [ ] Coverage ≥ 80%
