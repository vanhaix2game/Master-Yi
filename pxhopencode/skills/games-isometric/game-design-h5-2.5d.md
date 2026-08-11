# Game Design 2.5D H5 (Isometric)

## Tổng quan
Skill design cho game 2.5D isometric HTML5. Phù hợp cho: RPG, strategy, city builder, simulation, tactical games.

## 1. Isometric trong game design

### Ưu điểm
- ✅ Chiều sâu 3D ảo mà không cần 3D modeling
- ✅ Dễ sản xuất asset (chỉ cần vẽ tile 2D)
- ✅ Performance tốt hơn 3D thật
- ✅ Góc nhìn đẹp cho strategy / RPG

### Nhược điểm
- ❌ Click detection phức tạp (cần convert coordinate)
- ❌ Sorting (z-order) khó khi có nhiều entity chồng lên
- ❌ Góc nhìn cố định, không xoay được
- ❌ Tileset cần được vẽ đúng perspective

## 2. Tile Types

| Tile | Mô tả | Màu gợi ý | Chiều cao |
|------|-------|-----------|-----------|
| Grass | Đất bằng, đi được | #4CAF50 | 0 |
| Dirt | Đường đất | #8D6E63 | 0 |
| Water | Nước, không đi được | #2196F3 | -0.5 |
| Wall | Tường, chắn | #795548 | 1-3 |
| Building | Nhà, có mái | #FF5722 | 2-5 |
| Tree | Cây, che tầm nhìn | #228B22 | 2-4 |

## 3. Visual Hierarchy trong Isometric

### Depth ordering (Quan trọng nhất)
```
Vẽ theo thứ tự:
1. Ground tiles (xa → gần)
2. Objects thấp (cỏ, đá nhỏ)
3. Player / NPC / Entity
4. Objects cao (cây, cột đèn)
5. Objects trên không (mây, hiệu ứng)
6. UI (luôn trên cùng)
```

### Tile size guidelines
```
Desktop:    TILE_WIDTH=80,  TILE_HEIGHT=40   (2:1 ratio)
Mobile:     TILE_WIDTH=56,  TILE_HEIGHT=28   (2:1 ratio)
Tablet:     TILE_WIDTH=64,  TILE_HEIGHT=32   (2:1 ratio)
```

## 4. Camera & Viewport

### Isometric camera constraints

Xem: `templates/iso-camera.ts`

## 5. Fog of War (cho strategy)

Xem: `templates/FogOfWar.ts`

## 6. UX Considerations

### Click target size
- Tile clickable area = toàn bộ tile isometric (hình thoi)
- Minimum touch target: 44×44px (mobile)
- Nếu tile quá nhỏ → dùng magnifier / snap-to-grid

### Selection feedback

Xem: `templates/iso-selection.ts`

## 7. Pathfinding (A* trên grid isometric)

Xem: `templates/pathfinding.ts`

## 8. Testing Checklist

- [ ] Click detection chính xác trên mọi tile
- [ ] Depth sorting đúng (entity không bị "lệch" so với tile)
- [ ] Fog of war hoạt động
- [ ] Pathfinding tìm được đường, không đi xuyên tường
- [ ] Performance ổn định với map lớn (> 50×50 tiles)
- [ ] Camera pan/zoom mượt
- [ ] Touch input hoạt động (mobile)

### Tham khảo
- Implementation: `game-h5-2.5d.md`
- Main game skill: `skills/games-core/SKILL.md`
