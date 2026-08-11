---
name: webs-styling
description: Styling production — Tailwind, design system, responsive, dark mode, animation. Không FOUC, không layout shift.
---

# webs-styling — Styling

## Cài đặt Tailwind
Dark mode class-based. OKLCH colors, custom keyframes. `content` trỏ đúng src.
→ `templates/tailwind.config.ts`

## Design System Tokens
Spacing, radius, shadow, fontSize, breakpoint — dùng JS object để đồng bộ design system.
→ `templates/design-tokens.ts`
Shared CSS design system → `_shared/design-system/design-tokens.css` (OKLCH brand scale 50-950, surface colors, text tokens, glow shadows, animations, light/dark mode).

## Mẫu Responsive
Grid responsive + Container Query + Aspect Ratio component.
→ `templates/responsive-patterns.tsx`

## Dark Mode (không FOUC)
`useTheme` hook: localStorage → system preference fallback. Inject inline script trong `<head>` để chống FOUC: `<script>document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))</script>`
→ `templates/use-theme.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Dark mode thêm sau" | Refactor toàn bộ color tokens |
| "Container query chưa cần" | Layout vỡ trên mọi màn hình không phải mobile/tablet |
| "Design token sau" | Mỗi component tự đặt spacing → không đồng nhất |

## Red Flags
- Color hardcode, không dùng token
- Dark mode flash khi load
- Layout vỡ ở 375px hoặc 1440px

## Verification
- [ ] Dark mode inject script blocking trong `<head>`
- [ ] Design token cho spacing/radius/color
- [ ] Test responsive 375/768/1024/1440
