---
name: game-art
description: Game art principles — art style, color theory, animation principles, asset pipeline
---

# Game Art Principles

> Tham khảo từ [agent-skills-hub/game-development/game-art](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/game-art).

## 1. Art Style Selection

| Style | Production Speed | Skill Floor | Best For |
|-------|-----------------|-------------|----------|
| **Pixel Art** | Medium | Medium | Indie, retro |
| **Vector/Flat** | Fast | Low | Mobile, casual |
| **Hand-painted** | Slow | High | Fantasy, stylized |
| **Low-poly** | Fast | Medium | Indie 3D |
| **Cel-shaded** | Medium | Medium | Anime, cartoon |

## 2. Color Theory

| Goal | Strategy |
|------|----------|
| **Harmony** | Complementary or analogous |
| **Contrast** | High saturation differences |
| **Mood** | Warm/cool temperature |
| **Readability** | Value contrast over hue |

## 3. Animation Principles (12 cho Game)

- Squash & stretch → jump arcs, impacts
- Anticipation → wind-up before attack
- Follow-through → hair, capes
- Slow in/out → easing
- Arcs → natural movement paths
- Exaggeration → readable from distance

| Action | Frames | Feel |
|--------|--------|------|
| Idle | 4-8 | Subtle |
| Walk | 6-12 | Smooth |
| Run | 4-8 | Energetic |
| Attack | 3-6 | Snappy |
| Death | 8-16 | Dramatic |

## 4. Asset Pipeline

### 2D Pipeline
Concept → Creation (Aseprite/Krita) → Atlas (TexturePacker) → Animation (Spine) → Integration

### 3D Pipeline
Concept → Modeling (Blender) → Retopology → UV/Texturing (Substance) → Rigging → Animation → Export (glTF)

### Naming Convention
```
[type]_[object]_[variant]_[state].[ext]
spr_player_idle_01.png
mesh_tree_oak_lod2.fbx
```

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Mix art styles cho độc đáo" | Người chơi thấy lộn xộn, thiếu chuyên nghiệp |
| "Animation 3 state là đủ" | Thiếu anticipation/hurt → game cảm giác rẻ |
| "Color sau, code trước" | Không palette → UI conflicts, khó đọc |

## Red Flags
- Sprite không atlas → draw calls cao
- Animation thiếu hurt/die state
- Color palette không định nghĩa trước

## Verification
- [ ] Art style guide defined
- [ ] Sprite atlas, không ảnh rời
- [ ] Animation đủ 6 state: idle/run/jump/attack/hurt/die
