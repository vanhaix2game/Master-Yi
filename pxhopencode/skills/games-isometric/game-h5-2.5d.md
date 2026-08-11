# Game H5 2.5D — Implementation

## Tổng quan
Skill phát triển game 2.5D (isometric / pseudo-3D) HTML5. Phù hợp cho: RPG, strategy, city builder, simulation game với góc nhìn isometric.

> **Bước 0: Download assets** — Chạy script ở `skills/games-assets/SKILL.md`. Dùng isometric tiles từ Kenney/OpenGameArt, fallback vẽ màu thủ công nếu không có.

## Isometric Basics

### Coordinate conversion

Xem: `templates/iso-coords.ts`

### Tile dimensions

Xem: `templates/iso-constants.ts`

## Setup với Phaser + Isometric plugin

Xem: `templates/setup.sh`
Xem: `templates/phaser-iso-config.ts`

## Isometric Map

Xem: `templates/IsoGameScene.ts`

## Entity State + Animation cho Isometric

Xem: `templates/iso-entity.ts`

### Depth sorting (painter's algorithm)

Xem: `templates/iso-depth-sort.ts`

## Pseudo-3D stacking

Xem: `templates/iso-stacking.ts`

## Click detection

Xem: `templates/iso-click.ts`

## Optimization cho Isometric

- **Frustum culling**: Chỉ vẽ tile trong màn hình
- **Tile LOD**: Tile xa vẽ đơn giản hơn
- **Chunk system**: Chia map thành chunk, chỉ update chunk gần player
- **Pre-render**: Render tile tĩnh ra texture, chỉ vẽ lại khi có thay đổi

## Build

Xem: `templates/build.sh`

### Tham khảo
- Design: `game-design-h5-2.5d.md`
- Main game skill: `skills/games-core/SKILL.md`
