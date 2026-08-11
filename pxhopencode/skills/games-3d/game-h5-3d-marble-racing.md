# Marble Racing 3D — Implementation Reference

> Stack: Three.js + Cannon-es + Vitest. Chi tiết design: `game-design-h5-marble-racing.md`.

## Architecture Overview
```
MarbleRacingGame
├── CANNON.World (gravity -9.82, fixedStep 1/60)
├── MarbleBall (Sphere radius 0.5, mass 1, maxSpeed 15, camera-relative force)
├── RaceTrack (CatmullRomCurve3 → floor+wall mesh, physics barriers)
├── RacingCamera (behind+above, look-ahead = velocity dir, lerp 0.05)
├── RaceManager (5 checkpoints dọc track, timer, finish detection)
└── Input (WASD/Arrows → camera-relative force)
```

## Key Patterns
| Component | Pattern | Implementation |
|-----------|---------|---------------|
| Physics | Fixed timestep 60Hz + accumulator | `while (acc >= 1/60) { world.step; acc -= 1/60 }` |
| Ball steering | Camera-relative force | `forward = camera.getWorldDirection(); force = forward*z + right*x` |
| Track | Spline mesh generation | CatmullRomCurve3 → floor/wall segments dọc tangent+normal |
| Camera | Smooth follow + look-ahead | `camera.position.lerp(target - forward*6, 0.05)` |
| Fall detection | Y < -5 → respawn | Reset ball to last checkpoint |
| Anti-bounce | Lock Y velocity on ground | Check Y vel ≈ 0 when grounded |

## Anti-Patterns
| Problem | Fix |
|---------|------|
| Ball xuyên wall | CCD (`body.ccdSpeedThreshold = 1`) |
| Camera motion sick | Lerp 0.05 → 0.02 + deadzone |
| Bouncing infinite | Lock Y velocity when grounded |
| Track segments gap | Overlap segments slightly |

## Headless Testing (Vitest)
| Test | Assert |
|------|--------|
| Ball accelerates | `velocity.length() > 0` after force |
| Ball resets on fall | `position = checkpoint` when Y < -5 |
| Checkpoint triggers | `update()` returns `"checkpoint"` near CP |
| Timer accuracy | `elapsed ≈ 1.0` after 1s advance |

## References
- Design: `game-design-h5-marble-racing.md`
- 3D base: `game-h5-3d.md`
- Test helper: `skills/games-testing/templates/three-test-helper.ts`
