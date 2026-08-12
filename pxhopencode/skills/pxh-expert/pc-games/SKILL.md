---
name: pc-games
description: PC/Console game principles — engine selection, Steam integration, controller, optimization
---

# PC/Console Game Principles

> Tham khảo từ [agent-skills-hub/game-development/pc-games](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/pc-games).

## 1. Engine Selection

```
2D, open source → Godot
2D, large team → Unity
3D AAA → Unreal
3D cross-platform → Unity
3D indie → Godot 4
```

| Factor | Unity 6 | Godot 4 | Unreal 5 |
|--------|---------|---------|----------|
| 2D | Good | Excellent | Limited |
| 3D | Good | Good | Excellent |
| Learning | Medium | Easy | Hard |
| Cost | Revenue share | Free | 5% after $1M |

## 2. Steam Features

- Achievements — Player goals
- Cloud Saves — Cross-device progress
- Leaderboards — Competition
- Workshop — User mods
- Rich Presence — Show in-game status

## 3. Controller Input

Map ACTIONS, not buttons:
- "confirm" → A (Xbox), Cross (PS), B (Nintendo)
- "cancel" → B (Xbox), Circle (PS), A (Nintendo)

## 4. Performance Optimization

| Bottleneck | Solution |
|------------|----------|
| Draw calls | Batching, atlases |
| GC spikes | Object pooling |
| Physics | Simpler colliders |
| Shaders | LOD shaders |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Chọn engine theo trend" | Chọn theo project requirements |
| "Hardcode input buttons" | Không rebind → UX kém |
| "Skip profiling" | Không biết bottleneck ở đâu |

## Red Flags
- Engine chọn sai cho project type
- Input hardcoded (WASD, Space)
- Không profiler data

## Verification
- [ ] Engine phù hợp với game type
- [ ] Input abstraction (actions, not keys)
- [ ] Profiling trước optimize
