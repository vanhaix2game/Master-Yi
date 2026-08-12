---
name: webs-deployment
description: Deployment web — Vercel, Docker, CI/CD, monitoring, canary, rollback. Zero-downtime, tự động scale.
---

# webs-deployment — Deployment

## Triển khai Vercel
Multi-region (sin1, iad1), security headers + immutable cache cho static assets.
→ `templates/vercel.json`

## Docker (Next.js)
Multi-stage build: deps → builder → runner. Non-root user, healthcheck.
→ `templates/docker/Dockerfile`
→ `templates/docker/docker-compose.yml`

## CI/CD (GitHub Actions)
Lint → typecheck → test → deploy Vercel (amondnet/vercel-action).
→ `templates/.github/deploy.yml`

## Health Check Endpoint
`GET /api/health` — status, uptime, memory, db check → 503 nếu DB down.
→ `templates/health-check.ts`

## Giám sát (Sentry)
0.1 tracesSampleRate, filter `NavigationAbort` errors.
→ `templates/sentry-setup.ts`

## Triển khai Canary
Feature flag dựa trên userId hash (mod 100). 10% newCheckout, 5% newDashboard.
→ `templates/feature-flags.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "CI/CD thêm sau" | Deploy tay = human error, downtime |
| "Health check không cần" | Không biết app chết đến khi user report |
| "Docker cho dev thôi" | Môi trường khác nhau = bug khác nhau |

## Red Flags
- Deploy manual không qua CI
- Không health check endpoint
- Sentry/Datadog không setup

## Verification
- [ ] CI/CD pipeline chạy lint→typecheck→test→deploy
- [ ] Health check endpoint trả status
- [ ] Sentry/Datadog active, tracesSampleRate ≥ 0.1
