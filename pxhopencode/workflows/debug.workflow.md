# Workflow Gỡ lỗi — Sửa lỗi & Tối ưu

> **LUẬT NGÔN NGỮ**: UI text = **tiếng Việt**. Code, log, debug messages = **tiếng Anh**. Debug game: headless test (`skills/games-testing/`).
> Eval: `skills/games-testing/templates/game-eval-schema.ts`.
> **ENFORCEMENT GATE:** Mỗi phase BẮT BUỘC chạy `enforce run <phase>` TRƯỚC, `enforce pass/fail <phase>` SAU. Bỏ qua = violation.

## Quy trình (8 bước)
| # | Bước | Làm | Verify Gate |
|---|------|-----|-------------|
| 0 | Bình tĩnh | Đọc lỗi kỹ, đừng vội fix | Xác định loại lỗi |
| 1 | Phân loại | Xác định loại (bảng dưới) | Chọn đúng workflow phụ |
| 2 | Tái hiện | Minimal reproduction + log | Reproduce 100% |
| 3 | Khoanh vùng | Error→File→Stack→Input→Logic | Tìm đúng function |
| 4 | Root cause | Rubber duck / Binary search / Hypothesis | Giải thích "tại sao" |
| 5 | Fix ngắn nhất | Sửa + verify (test, typecheck) | Test pass, không break |
| 6 | Polish | Visual, animation, UX, performance (game: xem game.workflow.md) | Game chuyên nghiệp |
| 7 | Prevent | Unit test, error boundary, validation | Bug không tái phát |

## Phân loại lỗi
| Loại | Cách debug | Công cụ/Skill |
|------|-----------|--------------|
| Runtime/Logic | Stack trace từ dưới lên, step-by-step | Error log, Unit test |
| Build | Đọc dòng báo lỗi | Compiler output |
| Performance | Profiling, benchmark | console.time, games-optimization |
| UX | Responsive, dark mode, a11y | DevTools |
| Game Physics | Log collision pairs | games-physics, assertPhysicsStable |
| Game FSM | Log state transitions | games-2d, assertFSM |
| Game Pool | Count acquire/release | games-optimization |
| Game Scene | Hook lifecycle, check cleanup | games-core |
| Game Rendering | Frustum, LOD, draw calls | games-3d |

## Debug frontend (headless)
| Loại | Cách debug |
|------|-----------|
| DOM/UI | Log output + console.log injection |
| Logic | Unit test → `npx vitest run --reporter=verbose` |
| Network | Mock API (MSW / vi.fn()) |
| Game | Headless: Phaser.HEADLESS / Three.js headless renderer |

## Quality Standard (game)
| Metric | 2D | 3D |
|--------|-----|-----|
| FPS | ≥58 desktop / ≥30 mobile | ≥55 / ≥25 |
| Memory leak | <300KB/5min | <500KB/5min |
| Eval threshold | ≥0.9 | ≥0.85 |
| Animation | FSM 6-8 state mượt | Blend tree |

Chi tiết polish: `workflows/game.workflow.md` Bước 5.
Eval assertions: `node skills/games-testing/templates/game-eval-schema.ts` → `node _shared/scripts/game-gen/eval-grader.js --threshold 0.85`

## Post-code: route qua company workflow phase 9-11
Sau step 7 (Prevent) → route qua `workflows/company.workflow.md` phase 9-11 (Review→Build→Persist).

## Loop/Failover
- Reproduce fail → thay đổi approach debug, max 3 attempts
- Fix không pass test → rollback, tìm root cause khác, max 3 lần
- Regression xuất hiện → ghi bug mới, không gộp với bug hiện tại
- Quá 3 lần → báo user + snapshot state

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Warning nhỏ, không sao" | Warning → crash edge case |
| "Log đủ, không cần repro" | Không reproduce → guess fix |
| "Bỏ qua typecheck" | Typecheck catch 70% bugs |
| "Game 2D không cần polish" | Game xấu = user không chơi |
| "FPS thấp nhưng chơi được" | <30 FPS = user bỏ |

## Red Flags
- Lỗi runtime không đọc stack trace
- Fix không verify (test/typecheck)
- Bug tái phát → thiếu root cause
- Game: FPS < threshold, eval <0.85, bỏ qua polish

## Verification
- [ ] Bug loại đã xác định, reproduction step-by-step
- [ ] Root cause doc + fix ngắn nhất
- [ ] Test confirm fix, không regression
- [ ] Game: polish pipeline đã chạy + eval ≥0.85