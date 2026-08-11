# Workflow Game — Phát triển game HTML5 Pro

> **LUẬT NGÔN NGỮ**: UI game = **tiếng Việt**. Code, variable, comments, animation state = **tiếng Anh**.
> Testing: Vitest headless. Orchestrator: `skills/game-development/SKILL.md` → route implementation + principle.
> Genre: `skills/_shared/game-genre-reference.md` (Decision Tree → anti-patterns).
> **ENFORCEMENT GATE:** Mỗi phase BẮT BUỘC chạy `enforce run <phase>` TRƯỚC, `enforce pass/fail <phase>` SAU. Bỏ qua = violation.
> Black-box scripts: `_shared/scripts/game-gen/`. Eval: `skills/games-testing/templates/game-eval-schema.ts`.

## Bước 0: Download assets
```powershell
powershell.exe -ExecutionPolicy Bypass -File "_shared/scripts/download-games-assets.ps1" -AssetType "2d" -GameStyle "platformer"
```

## Bước 1: Chọn engine

| Loại | Engine | Skill | Templates |
|------|--------|-------|-----------|
| 2D | Phaser 3 | games-2d | skills/games-2d/templates/ |
| 2.5D | Isometric + Phaser | games-isometric | skills/games-isometric/templates/ |
| 3D | Three.js | games-3d | skills/games-3d/templates/ |
| 3D Racing | Three.js + Cannon-es | games-3d | Xem game-design-h5-marble-racing.md |

## Bước 2: Scaffold
```bash
npm init -y; npm install -D vite; cp _shared/templates/gitignore-template.md ../.gitignore
npm install phaser  # hoặc three / three+cannon-es
cp -r skills/<engine>/templates/* src/
cp skills/games-testing/templates/vitest.config.ts ./
npm install -D vitest happy-dom
```

## Bước 3: Live Preview
```bash
copy skills\games-preview\templates\vite.config.ts .
copy skills\games-preview\templates\index.html .
npx vite --open --host
```
Sau mỗi feature → nhìn preview → thấy đẹp → qua test.

## Bước 4: Test Headless
| Feature | Test |
|---------|------|
| Scene/Map | `npx vitest run` — scene lifecycle |
| Player | Check x/y after simulate input |
| Animation | FSM transitions idle→run→jump→attack→hurt→die |
| Physics | AABB collision edge cases |

## Bước 5: Polish Pipeline (bắt buộc)

| Category | Requirements |
|----------|-------------|
| Visual | Parallax, particles, screen shake, color scheme, 3-point lighting, shadow 1024² |
| UX | InputManager.justPressed, touch ≥44px, pause menu, HUD, tutorial overlay, loading bar |
| Audio | BGM loop + crossfade, SFX pool 16-32, spatial 3D, ogg/mp3 fallback |
| Animation | FSM 6 state (idle/run/jump/attack/hurt/die), tween, blend tree (3D) |
| Performance | Object pool, texture atlas <2048², LOD 3 levels, draw calls <200, GC <100 alloc/s |

## Bước 6: Quality Gate
```bash
npx vitest run              # Unit tests
npx vitest --coverage       # ≥ 85%
npx vitest src/performance-benchmark.test.ts
node _shared/scripts/game-gen/eval-grader.js --input eval-report.json --threshold 0.9
```

| Metric | Target |
|--------|--------|
| Unit tests | All green |
| Coverage | ≥ 85% |
| FPS desktop/mobile | ≥ 58 / ≥ 30 |
| Memory leak | < 300KB/5min |
| Eval threshold | ≥ 0.9 |

## Bước 7: Build & Deploy
```bash
npm run build
```
Xem: `skills/games-pwa/SKILL.md`, `skills/games-deploy/SKILL.md`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Bỏ qua genre reference" | Core loop không fun |
| "Bỏ qua preview" | Sai layout → mất 30p debug |
| "Polish sau" | Game xấu, user không chơi |
| "Skip eval assertions" | Chất lượng không đo được |
| "Audio sau" | Game thiếu polish = user thoát |

## Red Flags
- Genre reference không đọc
- Asset download chưa chạy
- FPS < 58 hoặc coverage < 85%
- Thiếu audio (BGM + SFX)
- Thiếu pause menu hoặc game over screen
- Animation state thiếu hurt/die
- Pool không dùng (object leak)
- Camera không follow player

## Post-code: route qua company workflow phase 7-11
Sau Bước 7 (Build & Deploy) → route qua `workflows/company.workflow.md` phase 7-11 (Test→Fix→Review→Build→Persist).

## Loop/Failover
- Test fail → fix → rerun test max 3 lần
- Coverage < 85% → bổ sung test, max 3 attempts
- Eval < 0.9 → polish lại, max 3 lần
- Build fail → fix dependency → rebuild, max 3 lần
- Quá 3 lần → báo user + snapshot state

## References
- Orchestrator: `skills/game-development/SKILL.md`
- Genre: `skills/_shared/game-genre-reference.md`
- Principle: game-art, game-design, multiplayer, vr-ar, web-games, mobile-games, pc-games
- Design: skills/games-2d/game-design-h5-2d.md, games-3d/game-design-h5-3d.md, games-3d/game-design-h5-marble-racing.md
- Assets: games-assets, Performance: games-optimization, Testing: games-testing, Audio: games-audio

## Verification
- [ ] Genre đúng category, asset downloaded, animation 6 state
- [ ] Live Preview: `npx vite --open` → browser thấy game
- [ ] Polish đã chạy: visual, UX, audio, animation, performance
- [ ] Quality: unit test, coverage ≥85%, FPS ≥58, memory <300KB
- [ ] Eval ≥0.9, Responsive mobile/tablet/desktop