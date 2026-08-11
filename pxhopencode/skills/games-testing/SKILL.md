---
name: games-testing
description: Game testing production — Vitest config, headless Phaser/Three.js test helpers, E2E game test patterns, performance benchmark, memory leak detection.
---

# games-testing — Game Testing Pipeline

> Dùng khi cần test tự động cho game. Coverage target: > 80% game logic.

## Setup

```bash
npm install -D vitest @testing-library/dom happy-dom
# Cho Phaser: npm install -D @phaserjs/phaser-testing
# Cho Three.js: npm install -D three (đã có)
```

## Templates

| File | Mô tả |
|------|-------|
| `vitest.config.ts` | Vitest config với happy-dom + coverage |
| `game-test-utils.ts` | Helper: mock game loop, assert FSM state, simulate input |
| `phaser-test-helper.ts` | Headless Phaser scene test |
| `three-test-helper.ts` | Headless Three.js render test |
| `performance-benchmark.ts` | FPS + memory benchmark test |
| `game-logic.test.ts` | Mẫu test: FSM, collision, scoring, spawn |
| `memory-leak.test.ts` | Phát hiện memory leak trong game loop |
| `game-eval-schema.ts` | **Eval assertions**: assertGameInit, assertPhysicsStable, assertCheckpointTrigger, assertFPS, assertMemoryLeak, assertFSM, assertAudioPlay, assertInputResponsive |

## Eval assertions (kiểm tra chất lượng)

Dùng `game-eval-schema.ts` để verify game không bị "cùi":

```typescript
import { assertPhysicsStable, assertCheckpointTrigger, assertFPS, generateReport } from "./game-eval-schema";

it("physics stable", () => {
  const result = assertPhysicsStable(ball.body, world);
  expect(result.pass).toBe(true);
});

it("FPS target", () => {
  const result = assertFPS(fps, 55);
  expect(result.pass).toBe(true);
});
```

Chạy grader để có summary:
```bash
# Sau khi chạy vitest → xuất JSON report
node _shared/scripts/game-gen/eval-grader.js --input eval-report.json --threshold 0.8
```

## Chạy test

```bash
npx vitest run              # Một lần
npx vitest --coverage       # Có coverage
npx vitest                  # Watch mode
```

## Integration với CI/CD

Test tự động chạy trong GitHub Actions (xem CI/CD templates).

## Checklist test coverage

- [ ] FSM state transitions (mọi state → mọi state)
- [ ] Collision detection AABB edge cases
- [ ] Bullet/enemy pool acquire/release
- [ ] Scoring system (0, max, overflow)
- [ ] Player health (damage, heal, death, invincibility)
- [ ] Enemy spawn timing
- [ ] Audio play/stop/restart không throw
- [ ] Scene lifecycle (create → update → destroy)
- [ ] Touch input simulation
- [ ] FPS benchmark ≥ 55 desktop / ≥ 30 mobile

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Game logic test không cần, chơi tay là đủ" | Bug vào production vì không test FSM/collision |
| "Headless test khó setup" | Template có sẵn, copy → chạy |
| "Coverage game thấp cũng được" | Logic không test = bug không phát hiện |

## Red Flags
- FSM transition không được test
- Performance benchmark không chạy
- Memory leak test missing

## Verification
- [ ] FSM state transitions test
- [ ] Performance + memory benchmark pass
- [ ] eval-grader threshold ≥ 0.8
