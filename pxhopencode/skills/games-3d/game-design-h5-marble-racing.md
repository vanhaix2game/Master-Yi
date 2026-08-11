# Marble Racing 3D — Game Design

## Core Loop
Start (countdown 3-2-1) → Play (steer ball on track) → Checkpoint (save progress) → Fall (respawn) → Finish (time + unlock)

## Controls
| Platform | Input |
|----------|-------|
| Desktop | WASD / Arrows (camera-relative force) |
| Mobile | Touch tilt |
| UI | Pause (ESC), Restart (R), Camera toggle (C) |

## Physics (Cannon-es)
| Property | Value | Purpose |
|----------|-------|---------|
| Mass | 1 | Weight feel |
| Radius | 0.5 | Standard size |
| Damping | 0.05/0.1 | Natural slowdown |
| Friction/Restitution | 0.3/0.2 | Track grip/bounce |
| Max speed | 15 | Speed cap |
| Force | 0-20 | Input scale |

**Anti-bounce**: Lock Y velocity when grounded & Y vel ≈ 0.

## Camera
| Mode | Behavior |
|------|----------|
| Follow | Behind+above (offset 3,6), lerp 0.05 |
| Look-ahead | Toward velocity direction |
| Respawn | Teleport to ball |
| Finish | Orbit around ball |

## Track Design
| Segment | Description |
|---------|-------------|
| Straight | Accelerate |
| Curve | Brake + drift |
| Ramp | Jump |
| Loop | 360° (need speed) |
| Obstacle | Barrel, cone |
| Tunnel | Dark + lighting |
| Off-road | Low friction |

Spline-based: CatmullRomCurve3 → mesh floor+wall dọc tangent+normal. Width 4, wall height 1.5.

## Country Theming
| Country | Palette | Decorations |
|---------|---------|-------------|
| VN | Đỏ+Vàng | Flag, nón lá |
| JP | Đỏ+Trắng | Lantern, cherry blossom |
| FR | Xanh+Trắng+Đỏ | Eiffel mini |
| EG | Vàng+Nâu | Pyramid |
| BR | Xanh+Vàng | Christ statue |
| Arctic | Trắng+Xanh | Snow, aurora |

## UI/HUD
Timer (top-center), Speed (bottom-right), Checkpoint (top-right), Progress bar (top), Countdown (center)

## Level Progression
| Level | Difficulty | New features |
|-------|-----------|-------------|
| 1-1 VN | Tutorial | Straight + gentle curve |
| 1-2 VN | Easy | Curve + ramp |
| 2-1 JP | Medium | Obstacle + tighter curve |
| 3-1 FR | Hard | Narrow + off-road |
| 4 EG | Expert | Long, all mechanics |
| 5 BR | Master | Marathon, no checkpoint |

## Technical Constraints
FPS: 60/30+ (desktop/mobile), Draw calls <100, Physics 60Hz, Ball <500 tris, Track ≤200 segments, Load <3s

## References
- Implementation: `game-h5-3d-marble-racing.md`
- 3D base: `game-h5-3d.md`
- Testing: `skills/games-testing/SKILL.md`