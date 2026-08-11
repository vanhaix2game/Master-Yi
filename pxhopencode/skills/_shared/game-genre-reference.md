# Game Genre Reference — Quick Reference

> Dùng Decision Tree → chọn genre → đọc anti-patterns. Chi tiết: `workflows/game.workflow.md`.

## Decision Tree
```
Game có camera 3D?
├── Không → 2D: Platformer/SHOOTER, Shmup/SHOOTER, Beat 'em Up/ACTION, P&C/ADVENTURE,
│            Match-3/PUZZLE, RPG top-down/RPG, Tower Defense/STRATEGY, Idle/CASUAL,
│            Farming/SIMULATION, Metroidvania, Fighting 2D/FIGHTING, Card/BOARD,
│            Rhythm/MUSIC, Survivor-like/SHOOTER VARIATIONS
├── Có → 3D
│   ├── Cần physics → Racing/SIMULATION, Sandbox/SANDBOX
│   ├── FPS → Shooter/SHOOTER, Walking Sim/HORROR, Stealth/STEALTH
│   ├── TPS → Shooter/SHOOTER, Soulslike/RPG, Survival/SURVIVAL, Hack&Slash/ACTION, Parkour/PARKOUR
│   └── Top-down/Isometric → MOBA/STRATEGY, Platformer/ACTION, City Builder/STRATEGY
```

## 1-5: ACTION / SHOOTER / ADVENTURE / RPG / STRATEGY

| Genre | Engine | Camera | Core Mechanic | Key Anti-Pattern |
|-------|--------|--------|---------------|-----------------|
| Platformer | Phaser 3 | Side | Jump + gravity + platforms | Jump không gravity arc → arcade physics |
| Run & Gun | Phaser 3 | Side | Run + shoot + dodge | Attack không hit-stop → freeze 50-100ms |
| Beat 'em Up | Phaser 3 | Side | Combo + crowd control | Enemy không anticipation → tell animation |
| Shmup/Twin-stick | Phaser 3 | Top-down | Ship + bullet patterns | Hitbox lớn → 2px hitbox, 16px visual |
| Bullet Hell | Phaser 3 | Top-down | Dense pattern + narrow hitbox | Pattern đều → add variation + gap |
| TPS/FPS | Three.js | 3rd/1st | Cover/shoot/mouselook | Camera xuyên wall → raycast, zoom in |
| Point & Click | Phaser 2D | Fixed | Click hotspot → combine → use | Pixel hunting → hotspot ≥48px |
| Visual Novel | HTML/CSS | Static | Text + choices + branching | Text speed chậm → skip + tap advance |
| RPG (ARPG) | Phaser/Three.js | Top-down/TPS | Stats + loot + combat | Hitbox khớp visual → debug draw adjust |
| RPG (Turn-based) | Phaser 2D | Top-down | Menu combat + turns | Battle dài → auto-battle + speed ×2 |
| RTS/TBS | Phaser/Three.js | Top-down/Isometric | Gather→Build→Attack | Unit move chậm → steering behavior |
| Tower Defense | Phaser 2D | Top-down/Side | Build towers on path | Path không rõ → highlight + arrows |

## 6-10: SIMULATION / RACING / SPORTS / PUZZLE / CASUAL

| Genre | Engine | Camera | Core Mechanic | Key Anti-Pattern |
|-------|--------|--------|---------------|-----------------|
| Farming | Phaser 2D | Top-down | Plant→Grow→Harvest→Sell | Plant stage không rõ → 4-5 visual stages |
| Arcade Racing | Three.js | Chase | Drift + boost | Ball xuyên wall → CCD |
| Marble Racing | Three.js+Cannon-es | Chase | Ball physics + spline track | Bouncing vô hạn → lock Y vel when grounded |
| Football/Sports | Phaser/Three.js | Top-down/Broadcast | Pass→Shoot→Score | Ball physics không thực → arc trajectory + spin |
| Match-3 | Phaser 2D | Fixed | Swap → match 3+ | Swap animation chậm → <200ms |
| Idle/Clicker | Phaser 2D | Fixed | Click→earn→upgrade | Button fatigue → auto-clicker upgrade sớm |
| Endless Runner | Phaser 2D/Three.js | Side/Forward | Auto-run + jump/dodge | Obstacle unfair → visual tell 0.5s |

## 11-16: SURVIVAL / SANDBOX / FIGHTING / CARD / MUSIC / METROIDVANIA

| Genre | Engine | Camera | Core Mechanic | Key Anti-Pattern |
|-------|--------|--------|---------------|-----------------|
| Survival Horror | Three.js | FPS/TPS | Limited resources + atmosphere | Jump scare predictable → random timing + fake-outs |
| Open World Survival | Three.js | TPS/FPS | Gather→Craft→Build→Survive | Starvation death spiral → difficulty floor |
| Sandbox/Creative | Three.js | Free flight | Create/modify freely | No guidance → challenges + prompts |
| 2D Fighter | Phaser 2D | Side fixed | Frame data + combo | Input không responsive → buffer 100ms |
| CCG/Deck Builder | Phaser 2D | Fixed | Collect→Build→Play | Text quá nhỏ → min 14px, card 64×88px |
| Rhythm | Phaser 2D/Canvas | Fixed | Notes fall → hit timing | Timing off → sync audio + visual offset |
| Metroidvania | Phaser 2D | Side-scroll | Gated exploration + abilities | Backtrack xa → teleport + shortcuts |
| Soulslike | Three.js | TPS | Stamina + punish windows | Input reading → startup frames + recovery |

## 17-20: MULTIPLAYER / INCREMENTAL / SHOOTER VARIATIONS / FIGHTING

| Genre | Engine | Network | Core Mechanic | Key Anti-Pattern |
|-------|--------|---------|---------------|-----------------|
| Battle Royale | Phaser/Three.js | WebSocket | 100→last standing | Lag → interpolation + prediction |
| Co-op/PvP | Phaser/Three.js | WebSocket/P2P | Players vs AI/vs | Cheating → authoritative server |
| Factory/Tycoon | Phaser 2D | — | Build→manage→profit | Belt không trực quan → arrow + animation |
| Survivor-like | Phaser 2D | — | Auto-attack + XP + evolve | No direction early → auto-attract XP orbs |
| Extraction | Three.js | WebSocket | Loot→Extract→Keep | Gear fear → base loadout + insurance |
| Arena Fighter | Three.js | — | Lock-on + combo + special | Hitbox sai → debug draw frame-by-frame |

## Engine Mapping

| Engine | Best for | Templates |
|--------|----------|-----------|
| Phaser 3 + Arcade | 2D platformer, shmup, RPG | skills/games-2d/templates/ |
| Phaser 3 + Matter | Physics puzzle, destruction | skills/games-physics/templates/ |
| Three.js | 3D FPS/TPS, racing, open world | skills/games-3d/templates/ |
| Three.js + Cannon-es | Physics 3D, marble racing | skills/games-3d/ |
| Phaser + Isometric | Strategy, city builder | skills/games-isometric/templates/ |

## General Anti-Patterns (mọi game)
| Problem | Fix |
|---------|------|
| Game không "feel" | Juice: particles, screen shake, tween, sound |
| Loading lâu không bar | Preload + progress callback |
| Font xấu | Web font + drop shadow |
| Touch không support | Virtual controls / touch mapping |
| Performance drop | Object pool + LOD + off-screen culling |
| Memory leak | Event listener cleanup + object disposal |
| Code không test | Vitest + phaser-test-helper / three-test-helper |
