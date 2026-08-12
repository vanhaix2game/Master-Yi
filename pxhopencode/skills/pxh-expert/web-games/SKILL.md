---
name: web-games
description: Web browser game principles — framework selection, WebGPU, PWA, audio handling, browser constraints
---

# Web Browser Game Principles

> Tham khảo từ [agent-skills-hub/game-development/web-games](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/web-games).

## 1. Framework Selection

```
2D → Phaser (full engine) or PixiJS (raw rendering)
3D → Three.js (rendering) or Babylon.js (full engine)
Hybrid → Raw Canvas/WebGL
```

| Framework | Type | Best For |
|-----------|------|----------|
| **Phaser 4** | 2D | Full game features |
| **PixiJS 8** | 2D | Rendering, UI |
| **Three.js** | 3D | Visualizations, lightweight |
| **Babylon.js 7** | 3D | Full engine, XR |

## 2. Browser Constraints

| Constraint | Strategy |
|------------|----------|
| Tab throttling | Pause when hidden |
| Mobile data limits | Compress assets |
| Audio autoplay | Require user interaction |

## 3. Performance

1. Asset compression — KTX2, Draco, WebP
2. Lazy loading — Load on demand
3. Object pooling — Avoid GC
4. Draw call batching — Reduce state changes
5. Web Workers — Offload heavy computation

## 4. PWA Requirements

- Service worker for caching
- Web app manifest
- HTTPS

## 5. Audio

- AudioContext requires user interaction
- Create on first click/tap
- Resume context if suspended

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Load tất cả assets lúc start cho nhanh" | User chờ 10s → thoát |
| "Bỏ qua tab visibility" | Browser throttle ở background → physics sai |

## Red Flags
- Audio không resume on interaction
- Service worker không có
- Asset compression không dùng

## Verification
- [ ] Framework chọn đúng (Phaser/Three.js/Babylon)
- [ ] PWA: service worker + manifest + HTTPS
- [ ] Audio: AudioContext resume on interaction
