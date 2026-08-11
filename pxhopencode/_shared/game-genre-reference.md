# Game Genre Reference

> Load trước khi code game. Chọn category → dùng kiến trúc phù hợp.

| Category | Engine | Skill | Core Mechanic | Anti-patterns |
|----------|--------|-------|---------------|---------------|
| Platformer | Phaser 3 | games-2d | Jump & run, grid-based | Level quá dài, checkpoint ít |
| Shooter 2D | Phaser 3 | games-2d | Bullet pool, wave spawn | Object pool thiếu, FPS drop |
| RPG/Top-down | Phaser 3 | games-2d | Quest, dialog, inventory | State machine phức tạp |
| Strategy 2.5D | Isometric | games-isometric | Tile map, fog of war, A* | Depth sort sai, pathfinding thiếu |
| FPS 3D | Three.js | games-3d | Raycast shoot, enemy AI | Draw calls > 200, LOD thiếu |
| Racing 3D | Three.js | games-3d | Physics ball, spline track | CCD thiếu, camera clip |

Xem chi tiết: `skills/games-2d/`, `skills/games-3d/`, `skills/games-isometric/`
