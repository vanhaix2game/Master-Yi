---
name: webs-auth
description: Authentication production — Auth.js, OAuth, JWT, RBAC, session, CSRF. Không lỗ hổng bảo mật, HTTP-only cookie.
---

# webs-auth — Authentication

## Cài đặt Auth.js (NextAuth)
Google + Credentials provider. JWT strategy 30 ngày. HTTP-only cookie, sameSite lax, secure production.
→ `templates/auth-setup.ts`

## RBAC Middleware
3 roles (admin/editor/user) với quyền tương ứng. Dùng `auth()` middleware, redirect nếu chưa login.
→ `templates/rbac-middleware.ts`

## JWT (thủ công)
Sign/verify với `jose` (HS256, 7d expiry). Dùng khi không cần Auth.js full.
→ `templates/jwt-utils.ts`

## Bảo vệ CSRF
So sánh `csrf-token` cookie với `x-csrf-token` header. Ném `AppError(403)` nếu không khớp.
→ `templates/csrf-protection.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "JWT trong localStorage cũng được" | XSS → mất token, HTTP-only cookie an toàn hơn |
| "CSRF chỉ cần cho POST" | GET cũng có thể mutate nếu API không chuẩn |
| "RBAC thêm sau" | Ai cũng admin = security hole |

## Red Flags
- JWT storage trong localStorage
- CSRF token không validated
- API endpoint không kiểm tra role

## Verification
- [ ] HTTP-only cookie, sameSite=Lax/Strict, secure
- [ ] CSRF token check trên mutation request
- [ ] RBAC middleware trên protected routes
