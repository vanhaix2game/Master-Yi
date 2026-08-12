---
name: webs-backend
description: Backend web production — Next.js App Router, Express, FastAPI, middleware, error handling, validation, rate limit.
---

# webs-backend — Backend

## Core Principle

**Every endpoint must validate input, handle errors gracefully, and never leak stack traces.**

## Luật sắt

```
KHÔNG BAO GIỜ trust user input — validate EVERYTHING
Mọi error response phải parse được, không raw stack trace
```

## Next.js API Routes (App Router)
Zod validation, pagination (skip/take), proper error responses.
→ `templates/api-routes.ts`

## Xử lý lỗi Middleware
`AppError` class (statusCode + message + details). `handleError` phân loại AppError / ZodError / lỗi không xử lý → response JSON.
→ `templates/error-handler.ts`

## Giới hạn tốc độ (in-memory)
Sliding window, tự cleanup khi > 10000 keys. Không cần Redis, phù hợp serverless. Dùng `rateLimiter.check(key)` → `{ allowed, remaining, resetIn }`.
→ `templates/rate-limiter.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Không cần validate input" | ZodError = 400, lỗi không validate = 500 |
| "Error handling sau" | Crash không bắt = production outage |
| "Rate limit cho production sau" | Bị spam → API chết |

## Red Flags
- API route không có Zod validation
- Error response format không đồng nhất
- Rate limiter không set trên production

## Verification
- [ ] Mọi API route có Zod validate body/query/params
- [ ] AppError class xử lý mọi lỗi
- [ ] Rate limiter active trên route công cộng
