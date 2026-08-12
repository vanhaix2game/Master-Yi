---
name: games-pwa
description: PWA for game — manifest, service worker, offline support, app icons, install prompt. Game load < 3s trên 3G.
---

# games-pwa — Progressive Web App cho Game

Biến game HTML5 thành app có thể cài đặt trên mobile/desktop.

## Templates

| File | Mô tả |
|------|-------|
| `manifest.json` | Web App Manifest với game colors + icons |
| `service-worker.ts` | Cache-first cho assets, network-first cho API |
| `icons.ts` | SVG favicon / app icon generator (SVG → PNG fallback) |
| `pwa-setup.ts` | Register SW + beforeinstallprompt handler |
| `offline-fallback.ts` | Offline page khi không có mạng |

## Checklist PWA

- [ ] Manifest đúng `start_url`, `display: fullscreen`
- [ ] Service worker cached toàn bộ game assets
- [ ] Icon 192×192 + 512×512 (SVG inline hoặc base64)
- [ ] `beforeinstallprompt` handler
- [ ] Offline fallback page
- [ ] Game load < 3s trên 3G (dùng Chrome DevTools emulate Slow 3G)
- [ ] Lighthouse PWA badge ≥ 90

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "PWA cho web app, game không cần" | Game mobile = user muốn install, offline |
| "Service worker phức tạp" | Template có sẵn, copy → register |
| "Icon 192x192 là đủ" | 512x512 cần cho splash screen Android |

## Red Flags
- Manifest missing start_url hoặc display fullscreen
- Service worker không cache game assets
- beforeinstallprompt không handle

## Verification
- [ ] Manifest: start_url, display=fullscreen, icons 192+512
- [ ] SW cache-first cho assets, network-first cho API
- [ ] Lighthouse PWA ≥ 90
