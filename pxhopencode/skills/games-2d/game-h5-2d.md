# Game H5 2D — Implementation

## Tổng quan
Skill phát triển game 2D HTML5 sử dụng **Phaser 3** (ưu tiên) hoặc Canvas API thuần. Phù hợp cho: platformer, top-down RPG, shoot 'em up, puzzle, card game.

> **Bước 0: Download assets** — Chạy script ở `skills/games-assets/SKILL.md` trước. Dùng asset thật từ Kenney/OpenGameArt, fallback procedural nếu không có mạng.

## Setup Phaser 3

Xem: `templates/setup.sh`
Xem: `templates/main.ts`

## Scenes

Xem: `templates/BootScene.ts`
Xem: `templates/MenuScene.ts`

## Entity State Machine (dùng chung player + enemy)

Xem: `templates/EntityStateMachine.ts`

## Player (FSM + animations)

Xem: `templates/Player.ts`

## Enemy (FSM + patrol/chase)

Xem: `templates/Enemy.ts`

## Collision & Physics (GameScene)

Xem: `templates/GameScene.ts`

## UI (HUD)

Xem: `templates/HealthBar.ts`

## Audio (Web Audio API + procedural fallback)

Xem: `templates/SoundManager.ts`

### Gắn vào GameScene
Trong `create()`:
- `const audio = new SoundManager(); audio.loadAll().then(() => audio.playBGM());`
- Khi player jump → `audio.playSFX("jump")`
- Khi player shoot → `audio.playSFX("shoot")`
- Khi player hurt → `audio.playSFX("hurt")`
- Khi enemy die → `audio.playSFX("die")`
- Khi collect item → `audio.playSFX("collect")`

## Optimization cho 2D
- **Sprite sheet**: gộp nhiều frame vào 1 file, dùng `Phaser.Loader.spritesheet`
- **Tilemap**: Dùng tilemap JSON (Tiled editor) thay vì nhiều sprite riêng cho map
- **Atlas**: Dùng texture atlas (TexturePacker) để giảm draw calls
- **Object pool**: Cho đạn, particle, enemy (tránh tạo/destroy liên tục)
- **Disable off-screen**: Tắt update/render cho object ngoài camera

## Build & Deploy

Xem: `templates/build.sh`

### Tham khảo
- Assets: `skills/games-assets/SKILL.md`
- Design: `game-design-h5-2d.md`
- Main game skill: `skills/games-core/SKILL.md`
