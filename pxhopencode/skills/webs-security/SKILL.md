---
name: webs-security
description: Web security checklist cho vibe code — auth, XSS, CSRF, SQLi, rate limit, URL bypass, secure headers, dependency audit. Một pass review duy nhất.
---

# webs-security — Security Checklist

## Checklist tích hợp vào `pxh-review-code`

Dùng template `security-checklist.ts` ở cuối phase review. Review chạy tuần tự, ghi kết quả vào `Result{issues[]}`.

### Auth & Session
- [ ] JWT có expiry ≤ 7d, dùng HS256/RS256, secret đủ mạnh?
- [ ] HTTP-only cookie, sameSite=Lax/Strict, secure=true?
- [ ] CSRF token so sánh cookie vs header?
- [ ] Session có invalidation khi logout?
- [ ] RBAC kiểm tra quyền ở API, không chỉ ở UI?
- [ ] Rate limit trên login/reset-password?

### Input & Injection
- [ ] Zod / Joi validate mọi input (body, query, params)?
- [ ] SQL injection: dùng Prisma prepared statements, không raw string?
- [ ] XSS: output escape, React dangerouslySetInnerHTML không dùng?
- [ ] File upload: validate extension, size, content-type?

### URL & Routing
- [ ] Path traversal: không dùng user input làm đường dẫn file?
- [ ] Open redirect: không redirect theo query param nếu không validate?
- [ ] API endpoint được bảo vệ auth, không public trừ khi cố ý?

### Headers & Config
- [ ] CSP, X-Frame-Options, X-Content-Type-Options set?
- [ ] Helmet (Express) / next/headers middleware bật?
- [ ] CORS whitelist domain cụ thể, không dùng `*`?
- [ ] HTTPS forced production?

### Payment & Data
- [ ] Không log credit card / password / token?
- [ ] Payment flow có idempotency key?
- [ ] Webhook signature verified?
- [ ] Số lượng người cùng lúc: rate limiter (xem `webs-backend/templates/rate-limiter.ts`)?

### Dependency
- [ ] `npm audit` / `pnpm audit` không có critical?
- [ ] Không dùng thư viện deprecated / không bảo trì?
- [ ] .env không commit, secrets dùng env, không hardcode?

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Audit sau deploy" | Critical CVE đang public, hacker dùng ngay |
| "CORS * cho nhanh" | Any domain có thể gọi API của bạn |
| "Secret trong env local cũng được" | Commit nhầm → leak luôn |

## Red Flags
- CSP header missing
- npm audit có critical chưa fix
- API endpoint public không auth

## Verification
- [ ] Chạy checklist ở phase review — 1 pass duy nhất
- [ ] Mọi issue critical = block release
- [ ] Secret guard: grep .env, hardcode key
