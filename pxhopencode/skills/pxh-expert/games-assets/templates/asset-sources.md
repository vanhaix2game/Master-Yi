# Nguồn Asset Miễn phí

> ⚖ **License Check**: Script `download-games-assets.ps1` tự động kiểm tra bản quyền trước khi download.
> Dùng `-SkipLicenseCheck` để bỏ qua (không khuyến khích).
> - **CC0 / Public Domain**: Tự động cho phép
> - **CC BY**: Cảnh báo cần ghi credit, vẫn cho download
> - **Không xác định / hạn chế**: Hỏi người dùng hoặc từ chối

## Auto-download mapping (script: `_shared/scripts/download-games-assets.ps1`)

Script tự động chọn asset theo `AssetType` + `GameStyle`. Ưu tiên: Kenney → OpenGameArt → procedural fallback.

| GameStyle | 2D (Kenney) | 3D (Kenney) | 2.5D (Kenney) |
|-----------|-------------|-------------|---------------|
| **platformer** | new-platformer-pack | platformer-kit | — |
| **rpg** | tiny-dungeon | fantasy-kit | isometric-buildings-pack |
| **shooter** | top-down-shooter | fps-kit | isometric-tactical-pack |
| **racing** | racing-pack | racing-kit | — |
| **puzzle** | puzzle-pack | — | — |
| **horror** | halloween-pack | horror-kit | — |
| **shmup** (space) | space-shooter-redux | — | — |
| **strategy** | strategy-pack | — | isometric-forest-pack |
| **adventure** | adventure-pack | — | — |

## 2D Sprites & Tilesets
| Nguồn | License | Ghi chú |
|-------|---------|---------|
| Kenney | ✅ **CC0** | Auto-download được |
| OpenGameArt | ✅ CC0 / ⚠ CC BY / ❌ GPL | Script kiểm tra license tự động |
| Itch.io | 🔍 Không đồng nhất | Kiểm tra thủ công từng asset |
| Sprite Database | 🔍 Không đồng nhất | — |
| Lospec Palette | ✅ **CC0** | — |

## 2.5D / Isometric Tiles
| Nguồn | License | Ghi chú |
|-------|---------|---------|
| Kenney Isometric | ✅ **CC0** | Auto-download được |
| OpenGameArt Isometric | ✅ CC0 / ⚠ CC BY / ❌ GPL | Script kiểm tra license tự động |
| CrusenDho | 🔍 Không rõ | Kiểm tra thủ công |

## 3D Models (GLB/GLTF)
| Nguồn | License | Ghi chú |
|-------|---------|---------|
| Sketchfab | ✅ CC0 / ⚠ CC BY | Lọc `downloadable` |
| Quaternius | ✅ **CC0** | Auto-download được |
| Poly Pizza | ✅ **CC0** | Auto-download được |
| AmbientCG | ✅ **CC0** | PBR textures |
| Mixamo | ✅ **Free (Adobe)** | Cần tài khoản Adobe, miễn phí |

## Audio & SFX
| Nguồn | License | Ghi chú |
|-------|---------|---------|
| Freesound | ✅ CC0 / ⚠ CC BY | Script kiểm tra license tự động |
| Kenney Audio | ✅ **CC0** | Auto-download được |
| Pixabay Music | ✅ **Pixabay License** | Free cho hầu hết mục đích |
| Zapsplat | ⚠ **Cần attribution** | Ghi credit bắt buộc |
| Mixkit | ✅ **Mixkit License** | Free, không cần credit |
| jsfxr | ✅ **CC0** | 8-bit SFX generator, không cần download asset |
| Chiptone | ✅ **CC0** | Chiptune generator |
| BFXR | ✅ **CC0** | Retro SFX generator |
| MusicGen (Meta) | ✅ **MIT (code)** / ⚠ **Research (model)** | Sinh BGM tự động, kiểm tra terms |

## BGM gợi ý

## BGM gợi ý
| Thể loại game | Nguồn gợi ý |
|--------------|------------|
| Platformer/Action | Kenney "Platformer Audio", Pixabay "Electronic" |
| RPG/Adventure | Freesound "Fantasy", Mixkit "Cinematic" |
| Puzzle/Casual | Pixabay "Lo-fi", Mixkit "Relax" |
| Horror | Freesound "Horror", Zapsplat "Dark" |
| Racing/Sports | Pixabay "Rock", Mixkit "Sport" |
| Shmup/Arcade | jsfxr/BFXR sinh 8-bit SFX tự động |
| Strategy | Mixkit "Cinematic", Pixabay "Corporate" |

## Fonts
- Google Fonts `https://fonts.google.com`
- Kenney Fonts `https://kenney.nl/assets/kenney-fonts`

## Khi không có asset phù hợp
Procedural fallback trong `templates/placeholders.ts`:
- **2D**: Canvas `fillRect` + `strokeRect` tạo sprite hình học
- **3D**: Three.js `CapsuleGeometry` + `SphereGeometry` tạo nhân vật
- **SFX**: Web Audio API sinh shoot/jump/hurt/coin/die tự động
- **BGM**: Melody loop 8 note (C D E F G F E D) — 8 giây loop
