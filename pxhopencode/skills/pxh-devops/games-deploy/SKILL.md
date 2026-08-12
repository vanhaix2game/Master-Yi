---
name: games-deploy
description: Game deploy pipeline — GitHub Pages, Itch.io Butler, Vercel. CI/CD tự động, zero-downtime, PWA-ready.
---

# games-deploy — Game Deploy Pipeline

## Templates

| File | Mô tả |
|------|-------|
| `.github/workflows/deploy-pages.yml` | CI/CD → test → build → GitHub Pages |
| `.github/workflows/deploy-itch.yml` | CI/CD → build → Itch.io (Butler) |
| `itch-butler-setup.sh` | Cài đặt and configure Butler CLI |
| `deploy-checklist.md` | Pre-deploy checklist |

## Deploy targets

| Target | Free? | PWA? | Domain tùy chỉnh | Ghi chú |
|--------|-------|------|-----------------|---------|
| GitHub Pages | ✅ Free | ✅ Có | ✅ Custom domain | game chỉnh trong repo |
| Itch.io | ✅ Free | ❌ | ❌ | butler CLI push |
| Vercel | ✅ Free tier | ✅ Có | ✅ | `vercel --prod` |
| Netlify | ✅ Free tier | ✅ Có | ✅ | `netlify deploy` |

## Pipeline

```
Push → GitHub Actions → Lint → Test → Build → Deploy
```

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Deploy tay lên GitHub Pages nhanh hơn" | CI/CD = zero human error, tự động build |
| "Itch.io Butler không cần" | Upload manual mỗi bản = mất thời gian |
| "Checklist deploy không cần" | Quên compress, source maps bật → game chậm |

## Red Flags
- Build không chạy CI/CD
- Deploy manual không qua GitHub Actions
- Pre-deploy checklist không review

## Verification
- [ ] CI/CD pipeline: test → build → deploy
- [ ] Pre-deploy checklist executed
- [ ] Build output < 10MB, source maps tắt
```
