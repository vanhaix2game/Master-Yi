---
name: games-2d
description: Game 2D với Phaser 3 — player, enemy, bullet pool, tilemap, HUD, animation. 60 FPS, object pool cho đạn/enemy.
---

# games-2d — Game 2D

Tham khảm genre: `skills/_shared/game-genre-reference.md` — chọn architecture + tránh anti-patterns theo thể loại.
Xem file chi tiết:
- `game-h5-2d.md` — Implementation (Phaser 3 scenes, player, enemy, collision, HUD, audio, optimization)
- `game-design-h5-2d.md` — Game design (core loop, difficulty curve, level design, color palette, touch controls, feedback systems)

## Color Palettes
5 game palettes (VIBRANT/PASTEL/DARK/NEON/RETRO) → `templates/color-palettes.ts` — dùng `import { palettes } from './color-palettes'`. CSS design tokens → `_shared/design-system/design-tokens.css`.

## Bắt đầu nhanh

```bash
npm install phaser
```

```typescript
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800, height: 600,
  physics: { default: "arcade", arcade: { gravity: { y: 300 } } },
  scene: [BootScene, GameScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
```

## Testing
`npx vitest run` | `npx vitest --coverage` (≥ 80%)
Helper: `skills/games-testing/templates/phaser-test-helper.ts` — createHeadlessGame, advanceTime, simulatePointer

## Mẫu chính (chống lag)
- **Object pool**: Cho đạn, particle, enemy — dùng `Phaser.Group.maxSize`
- **Sprite sheet**: Gộp texture vào atlas, giảm draw calls
- **Tilemap**: Dùng Tiled JSON, không vẽ từng tile riêng
- **Disable off-screen**: Kiểm tra `sprite.y > camera.height + margin` trước khi update

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Object pool không cần cho indie game" | 30 enemy + 20 bullet = GC spike, giật |
| "Tilemap tay nhanh hơn Tiled" | Sửa map = sửa code, không scale |
| "Sprite sheet sau, dùng ảnh rời" | 100 draw call = 10 FPS thay vì 60 |

## Red Flags
- Object pool thiếu cho bullet/enemy
- Texture atlas không dùng
- Sprite không disable khi off-screen

## Verification
- [ ] Object pool cho đạn + enemy
- [ ] Sprite sheet atlas, không ảnh rời
- [ ] `npx vitest run` pass, coverage ≥ 80%
