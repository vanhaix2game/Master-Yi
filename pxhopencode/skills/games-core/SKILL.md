---
name: games-core
description: Game engine core — fixed-timestep loop, scene manager, asset loader, input handling. Nền tảng cho mọi thể loại game H5.
---

# games-core — Game Engine Core

## Design System
UX template → `_shared/design-system/design-tokens.css` (OKLCH colors, light/dark mode). Game HUD → `_shared/design-system/game-tokens.css`. Typed tokens → `_shared/design-system/design-tokens.ts`. 5 game palettes (VIBRANT/PASTEL/DARK/NEON/RETRO) → `skills/games-2d/templates/color-palettes.ts`.

## Fixed-Timestep Game Loop (không lag, không giật)
Fixed-timestep 60 FPS loop với accumulator, clamp dt chống spiral of death, cho phép fixedUpdate + render riêng.
Xem: `templates/game-engine.ts`

## Scene Manager (zero memory leak)
Quản lý scene lifecycle: add, switch (destroy cũ → init mới), update, destroyAll.
Xem: `templates/scene-manager.ts`

## Asset Loader (parallel + retry)
Load image/audio/json/glb với cache + retry 2 lần + preload với progress callback.
Xem: `templates/asset-loader.ts`

## Entity State Machine (chống bug state)
FSM với 6 state (idle/run/jump/attack/hurt/die), transition rules, auto timeout, lock mechanism.
Xem: `templates/fsm.ts`

## Input Manager (unified keyboard + touch)
Unified keyboard + mouse + touch, justPressed tracking, clearFrame() gọi cuối mỗi frame.
Xem: `templates/input-manager.ts`

### Kết hợp
```typescript
const engine = new GameEngine();
const scenes = new SceneManager();
const input = new InputManager();
const assets = new AssetLoader();
const fsm = new FSM();

engine.fixedUpdate = (dt) => {
  scenes.update(dt, 0);
  fsm.update(dt);
};
engine.start();
```

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Fixed timestep không cần, requestAnimationFrame đủ" | FPS khác nhau → physics không đồng nhất |
| "Scene manager viết tay" | Memory leak khi switch scene không destroy |
| "FSM over-engineering" | State bug = animation sai, input sai |

## Red Flags
- dt không clamp → spiral of death
- Scene switch không destroy cũ
- FSM không có transition guard

## Verification
- [ ] Fixed timestep loop với accumulator + clamp
- [ ] Scene lifecycle destroy → init
- [ ] FSM transition rules cho mọi state
