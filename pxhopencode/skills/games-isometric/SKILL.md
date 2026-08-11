---
name: games-isometric
description: Game 2.5D Isometric — tile engine, coordinate conversion, depth sort, fog of war, pathfinding A*. Tối ưu cho map lớn 100×100.
---

# games-isometric — Game 2.5D Isometric

Tham khảm genre: `skills/_shared/game-genre-reference.md` — chọn architecture + tránh anti-patterns theo thể loại.
Xem file chi tiết:
- `game-h5-2.5d.md` — Implementation (coordinate conversion, tile map, depth sorting, pseudo-3D stacking, click detection)
- `game-design-h5-2.5d.md` — Game design (tile types, fog of war, pathfinding A*, UX, selection)

## Testing
`npx vitest run` | `npx vitest --coverage` (≥ 80%)
Helper: `skills/games-testing/templates/phaser-test-helper.ts` — createHeadlessGame, advanceTime; test coordinate conversion, depth sort, A*

## Mẫu chính (chống lag)
- **Frustum culling**: Chỉ vẽ tile trong viewport — tính tile min/max từ camera bounds
- **Tile LOD**: Tile xa vẽ đơn giản (bỏ border, bỏ detail)
- **Chunk system**: Chia map 100×100 thành chunk 10×10, chỉ update chunk gần player
- **Depth sort cache**: Chỉ sort lại khi entity di chuyển, không sort mỗi frame

## Chuyển đổi tọa độ

```typescript
const TILE_W = 64, TILE_H = 32;

function cartToIso(x: number, y: number, z = 0) {
  return {
    x: (x - y) * TILE_W / 2 + canvas.width / 2,
    y: (x + y) * TILE_H / 2 - z * TILE_H,
  };
}

function isoToCart(sx: number, sy: number) {
  const cx = sx - canvas.width / 2;
  const cy = sy;
  return {
    x: Math.floor((cx / (TILE_W / 2) + cy / (TILE_H / 2)) / 2),
    y: Math.floor((cy / (TILE_H / 2) - cx / (TILE_W / 2)) / 2),
  };
}
```

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Depth sort mỗi frame cũng ổn" | Map 100×100, 100 entity = sort 10k object/frame |
| "Fog of war không cần" | Player thấy cả map = mất chiến thuật |
| "A* không cần, enemy đi thẳng" | Enemy stuck vào tường |

## Red Flags
- Depth sort chạy mỗi frame
- Fog of war missing cho strategy game
- A* pathfinding không implement cho enemy

## Verification
- [ ] Depth sort cache, chỉ sort khi entity move
- [ ] Frustum culling: chỉ vẽ tile trong viewport
- [ ] A* pathfinding cho enemy AI
