# Game Design 3D H5

> Design guidelines cho game 3D HTML5 (Three.js) — camera, level, lighting, UI.

## 1. Camera Systems

| Type | Setup |
|------|-------|
| Third-Person | Distance 5-8, height 2-4, lerp 0.05-0.1, raycast wall collision |
| First-Person | FOV 70-90, sensitivity 0.001-0.003, head bob sin(wave) ±0.02 |
| Top-down/Isometric | Orthographic for strategy, perspective for 3D, angle 45-60° |

## 2. Level Design 3D
Modular pieces: Floor(4×4/8×8/16×16), Wall(4×2/8×2/4×4), Corner, Doorway, Stair, Pillar
Layout: Spawn → Corridor (tutorial) → Open Area (combat) → Boss Arena (challenge)
Terrain: `templates/terrain-generator.ts`

## 3. Lighting Design
| Mood | Setup | Use |
|------|-------|-----|
| Bright | Sun high, ambient 0.5, soft shadow | Outdoor |
| Dark/Horror | Sun low, ambient 0.1, fog thick | Dungeon |
| Warm | Point light yellow, ambient 0.3 | Indoor |
| Neon | Multiple point lights colored | Cyberpunk |
| Fantasy | Hemisphere + rim light | Magical |

Xem: `templates/time-of-day.ts`

## 4. UI & Sound
- World-space UI (billboard): `templates/ui-billboard.ts`
- Positional audio 3D: `templates/PositionalAudio3D.ts`

## 5. Performance Targets (WebGL)
| Metric | Desktop | Mobile |
|--------|---------|--------|
| FPS | 60 | 30+ |
| Draw calls | < 500 | < 200 |
| Triangles | < 200K | < 50K |
| Lights | < 4 dynamic | < 2 dynamic |

**Optimization**: Instancing, texture atlas, Draco compression, LOD 3 levels, occlusion culling.

## Testing Checklist
- [ ] FPS stable, Camera không xuyên wall, Collision chính xác
- [ ] Lighting + shadows đẹp, Audio 3D hoạt động
- [ ] UI billboard hướng camera, Resize mượt, Touch mobile

## Tham khảo
- Implementation: `game-h5-3d.md`
- Core: `skills/games-core/SKILL.md`