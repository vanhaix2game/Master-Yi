# Game Design 2D H5

> Skill design cho game 2D HTML5 — gameplay, level, UI/UX, visual.

## 1. Gameplay Design

### Core Loop
```
Player Action → Feedback → Reward → Progression
```

### Difficulty Curve
Level 1: Tutorial → Level 2-3: Tăng dần → Level 4: Peak → Level 5: Nghỉ

### Game Modes
| Mode | Description | Example |
|------|-------------|---------|
| Classic | Play through | Super Mario |
| Endless | Infinite scoring | Flappy Bird |
| Time Attack | Speedrun | — |
| Puzzle | Solve levels | Cut the Rope |
| Survival | Stay alive | Vampire Survivors |

## 2. Level Design

### Grid-based level
```
W W W W W W W W
W . P . E . G . W
W W W W W W W W
```

### Platformer sections: Introduction → Practice → Challenge → Punishment → Reward

## 3. Visual & Resolution

| Device | Resolution | Aspect |
|--------|-----------|--------|
| Desktop | 1280×720 | 16:9 |
| Tablet | 1024×768 | 4:3 |
| Mobile | 414×896 | portrait |
| Universal | 800×600 | 4:3 (safest) |

Dùng `Phaser.Scale.FIT`. Xem templates: `color-palettes.ts`

## 4. UI/UX & Touch Controls
- HUD: HP top-left, score top-right, controls bottom
- Touch D-pad bottom-left, action buttons bottom-right
- Menu flow: Main→Play/Setting/Shop/About → Pause overlay (Continue/Restart/Quit)

## 5. Feedback Systems
| Event | Visual | Audio |
|-------|--------|-------|
| Shoot | Muzzle flash, shake | Laser |
| Hit enemy | Hit flash, particle, score popup | Impact |
| Death | Red screen, slow-mo, fade | Explosion |
| Pickup | Scale+glow, particle | Ding |
| Jump | — | Woosh |

## 6. Monetization (nếu cần)
- Ads: Rewarded video (continue, double score)
- IAP: Remove ads, skins, power-ups
- Battle Pass: Tiered rewards

## Testing Checklist
- [ ] 60 FPS stable, Touch controls work, No collision bug
- [ ] Audio play/stop/restart, Restart clean (no memory leak)
- [ ] Pause/Resume, Loading progress, Screen resize

## Tham khảo
- Implementation: `game-h5-2d.md`
- Main: `skills/games-core/SKILL.md`