---
name: ui-ux
description: UI/UX design production — web (React/Tailwind), game HUD (Phaser/Three.js), tool (CLI). Priority-based categories (1-10), design system workflow, design tokens, pro-rules checklist.
---

# ui-ux — UI/UX Design (Pro Max Pattern)

**Khi dùng:** Yêu cầu UI/UX → load skill này. Agent tự chọn platform (web/game/tool) dựa trên project type.

## Priority-Based Rule Categories

*Follow priority 1→10; focus on higher priorities first. Each rule applies to all platforms unless marked.*

| Pri | Category | Impact | Key Checks | Anti-Patterns |
|-----|----------|--------|------------|---------------|
| 1 | **Accessibility** | CRITICAL | Contrast ≥4.5:1, Alt text, Keyboard nav, Aria-labels, Focus rings | Removing focus rings, Icon-only without labels, Color-only indicators |
| 2 | **Touch & Interaction** | CRITICAL | Min 44×44px touch, 8px+ spacing, Loading feedback, Press feedback (80-150ms) | Hover-only, Instant 0ms transitions, No disabled state |
| 3 | **Performance** | HIGH | WebP/AVIF, Lazy load, Reserve space (CLS<0.1), font-display:swap | Layout thrashing, No image dimensions, FOIT |
| 4 | **Layout & Responsive** | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll, Safe areas | Fixed px containers, Disable zoom, Content behind notch |
| 5 | **Typography & Color** | HIGH | Base 16px, Line-height 1.5, Semantic tokens, 8dp spacing rhythm | Text <12px body, Gray-on-gray, Raw hex in components |
| 6 | **Style Selection** | MEDIUM | Match product type, Consistent style, SVG icons (no emoji) | Mixing flat/skeuomorphic, Emoji as icons, Raster PNGs |
| 7 | **Animation** | MEDIUM | Duration 150-300ms, Conveys meaning, prefers-reduced-motion | Decorative-only, Animating width/height, No reduced-motion |
| 8 | **Forms & Feedback** | MEDIUM | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | **Navigation** | HIGH | Predictable back, Bottom nav ≤5, Deep linking, Tab order matches visual | Broken back, No deep links, Overloaded nav |
| 10 | **Charts & Data** | LOW | Legends, Tooltips, Accessible colors, Loading/empty/error states | Color-only meaning, No fallback for missing data |

## Shared Design System
pxhopencode có sẵn design system tại `_shared/design-system/`:
- `design-tokens.css` — OKLCH colors, light/dark mode, spacing, shadow, animation
- `game-tokens.css` — game HUD tokens (HP, score, combo, shield, glow)
- `design-tokens.ts` — typed tokens cho JS/TS projects

Web templates → `skills/webs-styling/templates/` (Tailwind config + design tokens + component patterns)
Game templates → `skills/games-2d/templates/color-palettes.ts` (5 palettes: VIBRANT/PASTEL/DARK/NEON/RETRO)

Always reference these before generating new tokens to avoid duplication.

## Design System Workflow (3 steps)

### Step 1: Analyze
- **Product type**: SaaS, e-commerce, dashboard, game, tool/CLI
- **Platform**: web (React/Tailwind), game (Phaser/Three.js), tool (CLI)
- **Keywords**: playful, minimal, dark mode, content-first, immersive, data-dense
- **Constraints**: mobile-first?, dark mode?, FOUC?, a11y?, offline?

### Step 2: Generate Design Tokens
Define token set before coding components:

```ts
// Tailwind convention
colors: { brand: { 50..900 }, surface: { primary, secondary }, text: { primary, secondary, disabled } }
spacing: { xs:4, sm:8, md:16, lg:24, xl:32, 2xl:48 }
fonts: { body: 'Inter, sans-serif', heading: 'Inter, sans-serif', mono: 'JetBrains Mono' }
radius: { sm:4, md:8, lg:12, xl:16 }
```

For CLI, tokens map to ANSI: `colors: { info:cyan, success:green, warning:yellow, error:red, meta:dim }`.

### Step 3: Supplement + Stack
- Deep-dive any category: a11y, animation, form UX, dark mode
- Stack guidelines: React server components, Next.js App Router streaming, Phaser Scene state, CLI `NO_COLOR`

## Design Dials (optional tuning)

| Dial | Low (1-3) | Mid (4-7) | High (8-10) |
|------|-----------|-----------|-------------|
| Variance | Centered / minimal | Balanced / modern | Bold / asymmetric |
| Motion | Subtle micro-interactions | Standard scroll/stagger | Complex choreography |
| Density | Spacious (24-96px) | Standard (16-64px) | Dense (8-32px) |

## Web — Layout & Components

- Mobile-first: sm(640) md(768) lg(1024) xl(1280), Flexbox/Grid, container padding
- Dark mode: `class="dark"` on html, `dark:` variant
- FOUC-free: `<style>` blocking hoặc `next/dynamic` ssr:false
- A11y: `role` `aria-label` `tabIndex` `focus:ring`, keyboard nav, contrast ≥ 4.5:1

```tsx
<div className="p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm" />
```

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Layout shift | Missing img w/h | `w-full h-auto` + aspect ratio |
| FOUC | CSS after DOM | Inline critical CSS |
| Dark flash | localStorage race | `<script>` blocking in `<head>` |

## Game — Phaser HUD

- DOM overlay cho UX phức tạp, Canvas text cho perf
- Touch zone ≥ 48×48, `pointer` event, joystick fixed bottom-left
- FSM sync: `idle→playing→paused→gameover` show/hide components

```ts
const hud = createRoot(document.getElementById('hud')!)
hud.render(<HealthBar hp={player.hp} maxHp={100} />)
const score = this.add.text(16, 16, 'Score: 0', { fontSize:'24px', color:'#fff', stroke:'#000', strokeThickness:4 }).setScrollFactor(0).setDepth(100)
```

| Bug | Fix |
|-----|-----|
| UI lệch viewport | `Phaser.Scale.FIT` + resize handler |
| Touch không phản hồi | `pointer-events:none` on overlay |
| Text nhòe | Font size chẵn (16,18,20...) |
| UI giật camera | `setScrollFactor(0)` |

## Tool / CLI

- Spinner + status icon (✓✗), NO_COLOR fallback
- Progress bar: `[#####-----] 50%`, update ≤ 5Hz
- Error: message + suggestion + retry hint, no stacktrace unless `--verbose`

| Color | Use |
|-------|-----|
| Cyan | Info, title |
| Green | Success |
| Yellow | Warning |
| Red | Error |
| Dim | Meta, timestamp |

### CLI Design System — pxhopencode Runtime

> CLI output format cho hệ thống 4 tầng. Dùng cho mọi agent output.

**1. Symbol Set (ASCII, không emoji)**

| Ý nghĩa | Symbol | Code |
|---------|--------|------|
| Success | `✓` | `\u2713` |
| Fail | `✗` | `\u2717` |
| Running | `⏳` | `\u23F3` |
| Arrow | `→` | `\u2192` |
| Box T | `┌──┐` | `\u250C\u2500\u2510` |
| Box B | `└──┘` | `\u2514\u2500\u2518` |

Fallback (`$env:NO_COLOR`): `[>]`, `[x]`, `[ ]`.

**2. Layout — 4 tầng**

```
┌─ T1 ──────────────────────────────────────────┐
│ pxh-help  Validate input                        │
│   → Request {type, target, context}             │
└────────────────────────────────────────────────┘
    ↓
┌─ T2 ──────────────────────────────────────────┐
│ pxh-pm   Phase: code→test→fix  Retry: 2/3 ⏳    │
└────────────────────────────────────────────────┘
    ↓
┌─ T3 ──────────────────────────────────────────┐
│ pxh-expert  ✓ Code generated  ✓ Tests pass      │
└────────────────────────────────────────────────┘
    ↓
┌─ T4 ──────────────────────────────────────────┐
│ pxh-save-history  ✓ Session saved               │
└────────────────────────────────────────────────┘
```

Mỗi tầng = 1 box. Prefix `[T1]`, `[T2]`, `[T3]`, `[T4]`.

**3. Contract Format**

```
Request  {version|type|target|context}           → 1 dòng
Task     {version|phase|target|skills|workflow}  → ≤2 dòng
Result   {version|status|artifacts[]}            → status + summary
Response {version|status|summary}                → 1 dòng cuối
```

Không in raw JSON — tóm tắt 1-2 dòng.

**4. Anti-Patterns**

| Anti-pattern | Thay bằng |
|-------------|-----------|
| Emoji trong output | ASCII symbols |
| Raw JSON contract | Tóm tắt 1-2 dòng |
| Spam > 10Hz | Update ≤ 5 lần/s |
| Không prefix tầng | `[T1]`, `[T2]`, ... |
| Màu tuỳ tiện | NO_COLOR fallback |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Sẽ fix responsive sau" | Mobile-first không thể patch sau — thiết kế lại toàn bộ layout |
| "Dark mode là optional" | 30% user dùng dark mode — thiếu là UX fail |
| "Accessibility sau" | WCAG violations = legal risk, phải refactor cả component |
| "CLI màu không cần fallback" | Terminal không màu = output vô dụng |
| "Game UI trên canvas là đủ" | DOM overlay cho UX phức tạp dễ hơn 10x |
| "FOUC không đáng lo" | FOUC = perception app chậm, user thoát ngay |

## Red Flags

- Layout không test trên mobile < 375px
- Game HUD không setScrollFactor(0)
- CLI output không có NO_COLOR fallback
- Keyboard navigation không hoạt động
- Thiếu loading/error/empty states
- Emoji used as structural icons (use SVG)
- No pressed/disabled state feedback on interactive elements
- Mixing filled and outline icons at same hierarchy

## Verification
- [ ] Platform: web/game/tool category applied
- [ ] Priority rules (1-10) checked
- [ ] Design tokens consistent
- [ ] Accessibility (a11y) basics covered
- [ ] Responsive / adaptive layout verified

## Pre-Delivery Checklist — Compact

| Platform | Checks |
|----------|--------|
| **All** | Priority 1-3 pass (a11y/touch/perf), 375px mobile, dark mode contrast, touch ≥44pt, safe areas |
| **Web** | Dark toggle no flash, Tab/Enter/Escape, contrast ≥4.5:1, prefers-reduced-motion, loading/error/empty states |
| **Game** | Touch ≥48×48, setScrollFactor(0) HUD, FSM idle→playing→paused→gameover, font size even |
| **CLI** | NO_COLOR fallback, [Tn] prefix, ┌─┐ box for multi-line, contract summary (no raw JSON), progress ≤5Hz |
| **Visual** | SVG icons (no emoji), consistent family/stroke, pressed state no shift, semantic tokens, icons text-aligned |
