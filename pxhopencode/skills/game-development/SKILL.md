---
name: game-development
description: Orchestrator game — route to implementation skill (pxhopencode) + principle-based sub-skill (agent-skills-hub)
---

# game-development — Orchestrator Game

> Bridge skill: kết hợp implementation templates (pxhopencode) với principle-based guidelines (agent-skills-hub).

## Routing

### Platform

| Target | Implementation Skill | Principles Sub-Skill |
|--------|-------------------|---------------------|
| Web browser | `games-2d`, `games-3d` | `web-games` |
| Mobile | `games-2d`, `games-pwa` | `mobile-games` |
| PC / Desktop | `games-3d`, `games-optimization` | `pc-games` |
| VR / AR | (`games-3d`) | `vr-ar` |

### Game Dimension

| Loại | Implementation | Principles |
|------|---------------|------------|
| 2D (sprites, tilemaps) | `games-2d`, `games-isometric` | `game-art` |
| 3D (meshes, shaders) | `games-3d` | `game-art`, `game-design` |

### Specialty

| Need | Implementation | Principles |
|------|---------------|------------|
| Core game loop, scene, input | `games-core` | `game-design` |
| Physics, collision, spatial hash | `games-physics` | — |
| Audio pool, spatial, compression | `games-audio` | `game-art` |
| Assets download, pipeline | `games-assets` | `game-art` |
| Performance optimization | `games-optimization` | — |
| Live preview (HMR) | `games-preview` | — |
| PWA + offline | `games-pwa` | `web-games` |
| Deploy (Pages, Itch, Vercel) | `games-deploy` | — |
| Testing + eval | `games-testing` | — |
| GDD, balancing, psychology | `games-2d/game-design-h5-2d` | `game-design` |
| Multiplayer networking | — | `multiplayer` |
| Art style, color, animation | — | `game-art` |

## Tham khảo

- agent-skills-hub: https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development
- pxhopencode implementation: `skills/games-*`

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Orchestrator không cần, tự biết skill nào" | Agent mới không biết routing → dùng sai skill |
| "Principle vs Implementation trùng nhau" | Principle = WHY, Implementation = HOW — cả 2 đều cần |
| "Chỉ cần implementation templates" | Không hiểu principle → code sai architecture |

## Red Flags
- Agent dùng implementation skill mà không đọc principle sub-skill
- Routing sai platform (VD: dùng `games-2d` cho VR)

## Verification
- [ ] Mọi game skill pxhopencode đều có routing trong orchestrator
- [ ] Mọi sub-skill agent-skills-hub đều có routing
