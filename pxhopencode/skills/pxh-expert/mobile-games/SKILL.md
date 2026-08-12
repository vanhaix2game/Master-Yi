---
name: mobile-games
description: Mobile game principles — touch input, battery, thermal, app stores, monetization
---

# Mobile Game Principles

> Tham khảo từ [agent-skills-hub/game-development/mobile-games](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/mobile-games).

## 1. Platform Constraints

| Constraint | Strategy |
|------------|----------|
| **Touch input** | Large hit areas, gestures |
| **Battery** | Limit CPU/GPU usage |
| **Thermal** | Throttle when hot |
| **Screen size** | Responsive UI |
| **Interruptions** | Pause on background |

## 2. Touch Input

- Min touch target: 44x44 points
- Visual feedback on touch
- Avoid precise timing requirements
- Support portrait + landscape

## 3. Thermal Management

| Action | Trigger |
|--------|---------|
| Reduce quality | Device warm |
| Limit FPS | Device hot |
| Pause effects | Critical temp |

## 4. App Stores

### iOS
- Privacy labels
- Account deletion
- Screenshots for all sizes

### Android
- Target latest SDK
- 64-bit required
- App bundles recommended

## 5. Monetization

| Model | Best For |
|-------|----------|
| **Premium** | Quality games, loyal audience |
| **Free + IAP** | Casual, progression-based |
| **Ads** | Hyper-casual, high volume |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Desktop controls fine on mobile" | Touch != mouse → sai UI, user thoát |
| "30 FPS là đủ, không cần tối ưu" | Thiết bị nóng → throttle → < 20 FPS |
| "Battery không phải vấn đề" | 15 phút hết pin → uninstall |

## Red Flags
- Touch target < 44px
- Không responsive UI (mobile/tablet/desktop)
- Không pause on background

## Verification
- [ ] Touch hit areas ≥ 44x44
- [ ] Thermal throttle: reduce quality when hot
- [ ] Responsive: mobile portrait + landscape
