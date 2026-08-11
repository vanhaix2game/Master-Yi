---
name: games-assets
description: Free game assets + auto-download. 2D sprites, 3D models, 2.5D tiles, sounds, fonts. Animation-ready — idle/run/jump/attack/hurt/death states.
---

# games-assets — Free Game Assets & Auto-Download

Skill này cung cấp nguồn assets free hợp pháp và script tự động download, setup animation states cho game 2D/2.5D/3D.

> ⚖ **License Check**: Script `download-games-assets.ps1` tự động kiểm tra bản quyền trước khi download.
> - **CC0 / Public Domain**: Tự động cho phép download
> - **CC BY**: Cảnh báo cần ghi credit, vẫn cho download
> - **Không xác định / hạn chế**: Hỏi người dùng hoặc từ chối
> - Dùng flag `-SkipLicenseCheck` để bỏ qua (không khuyến khích)

## Nguồn Asset
Xem danh sách đầy đủ: `templates/asset-sources.md`

Nguồn chính: **Kenney** (CC0, sprites/audio/3D), **OpenGameArt** (CC0), **Poly Pizza** (CC0, 3D), **Quaternius** (CC0, 3D), **Sketchfab** (CC0/CC-BY), **Mixamo** (free animations), **Freesound** (audio).

## Script Tự động Tải xuống
```
# Luôn dùng -ExecutionPolicy Bypass để tránh lỗi policy Windows
#
# 2D — mặc định platformer
powershell.exe -ExecutionPolicy Bypass -File "_shared/scripts/download-games-assets.ps1" -AssetType "2d" -GameStyle "platformer"

# Các style khác: rpg, shooter, racing, puzzle, horror, shmup, strategy, adventure
powershell.exe -ExecutionPolicy Bypass -File "_shared/scripts/download-games-assets.ps1" -AssetType "2d" -GameStyle "horror"

# 3D: platformer-kit, fps-kit, racing-kit, fantasy-kit, horror-kit
powershell.exe -ExecutionPolicy Bypass -File "_shared/scripts/download-games-assets.ps1" -AssetType "3d" -GameStyle "shooter"

# 2.5D: isometric (strategy, rpg, shooter)
powershell.exe -ExecutionPolicy Bypass -File "_shared/scripts/download-games-assets.ps1" -AssetType "2.5d" -GameStyle "rpg"
```
Priority: **Kenney** (primary) → **OpenGameArt** (fallback) → **procedural** (last resort).
Script tự động thử primary → fallback packs → OpenGameArt URL → báo manual nếu all fail.

## Animation States
Mọi entity: `idle`, `run`, `jump`, `attack`, `hurt`, `die`.

### 2D Spritesheet
```
player.png: idle(0-3) → run(4-9) → jump(10-12) → attack(13-17) → hurt(18-19) → die(20-23)
```
Xem: `templates/animation-config.ts`, `templates/entity-fsm.ts`

### 3D
| State | Clip | Looping |
|-------|------|---------|
| idle | Idle | Yes |
| run | Running/Walk | Yes |
| jump | Jump | No |
| attack | Punch/Slash | No |
| hurt | Hit/Hurt | No |
| die | Death/Dying | No |

Xem: `templates/animation-controller.ts`

## Templates
- `templates/sound-manager.ts` — SoundManager load + fallback procedural
- `templates/sound-integration.ts` — Gắn vào game loop
- `templates/entity-fsm.ts` — FSM + SFX auto-play theo state transition
- `templates/placeholders.ts` — Procedural fallback khi không có assets

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Download assets tay cho chắc" | Script auto-download + license check = nhanh hơn |
| "Asset từ Google Images" | Copyright violation, DMCA |
| "Procedural fallback không cần" | Link die → không có asset → game lỗi |

## Red Flags
- Asset không có license (CC0/CC BY)
- Download script không chạy
- Thiếu animation state idle/run/jump/attack/hurt/die

## Verification
- [ ] Chạy download script trước khi code game
- [ ] Asset có license rõ ràng
- [ ] Entity có đủ 6 animation states
