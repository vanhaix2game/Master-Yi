---
name: vr-ar
description: VR/AR development principles — comfort, interaction, performance, spatial design
---

# VR/AR Development Principles

> Tham khảo từ [agent-skills-hub/game-development/vr-ar](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/vr-ar).

## 1. Platform Selection

| Platform | Use Case |
|----------|----------|
| **Quest** | Standalone, wireless |
| **PCVR** | High fidelity |
| **PSVR2** | Console market |
| **WebXR** | Browser-based VR/AR |

## 2. Comfort — Motion Sickness Prevention

| Cause | Solution |
|-------|----------|
| **Locomotion** | Teleport, snap turn |
| **Low FPS** | Maintain 72-90 FPS |
| **Camera shake** | Avoid or minimize |
| **Rapid acceleration** | Gradual movement |

## 3. Performance Targets

| Platform | FPS | Resolution |
|----------|-----|------------|
| Quest 2 | 72-90 | 1832x1920 |
| Quest 3 | 90-120 | 2064x2208 |
| PCVR | 90 | 2160x2160+ |

## 4. Interaction

| Type | Use |
|------|-----|
| **Point + click** | UI, distant objects |
| **Grab** | Manipulation |
| **Gesture** | Magic, special actions |
| **Physical** | Throwing, swinging |

## 5. Spatial Design

- 1 unit = 1 meter (critical)
- Stereo = primary depth cue
- Motion parallax = secondary
- Shadows = grounding

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Teleport phá immersion, dùng smooth locomotion" | 50% player say xe, không chơi được |
| "Drop FPS xuống 60 cũng ổn" | VR < 90 FPS = nausea ngay lập tức |
| "UI nhỏ cho đẹp" | VR không đọc được chữ nhỏ → khó chịu |

## Red Flags
- FPS < 72 (VR) / < 30 (AR mobile)
- Smooth locomotion không có teleport option
- UI text < 24pt trong VR space

## Verification
- [ ] FPS ≥ 72 (VR) / ≥ 30 (AR)
- [ ] Comfort settings: teleport + snap turn options
- [ ] UI readable: min 24pt effective
