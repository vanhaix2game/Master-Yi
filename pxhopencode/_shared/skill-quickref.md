# Skill Quick Reference — Consolidated Index

Dùng để chọn skill NHANH mà không cần đọc SKILL.md. Mỗi skill 1 dòng.

## Tổng quan: Process(8) + Web(8) + Game(12+7+1) + AI(5) + Tool(5) + UI/UX(1) + 3D Web(1) + PromptCompiler(1) + Vibe Memory(1) = 50 skills

## Process Skills (8) — Meta-Cognition & Workflow
| Skill | Use when | Path |
|-------|----------|------|
| `process-driven-development` | Execute plan với subagent mới cho mỗi task, isolated context | skills/process-driven-development/ |
| `process-parallel-agents` | 2+ task độc lập, chạy song song | skills/process-parallel-agents/ |
| `process-systematic-debugging` | Any bug/test failure — root cause FIRST, no symptom fix | skills/process-systematic-debugging/ |
| `process-writing-plans` | Multi-step task — viết plan bite-sized trước khi code | skills/process-writing-plans/ |
| `process-tdd` | Feature/bugfix — test TRƯỚC, code SAU | skills/process-tdd/ |
| `process-verification` | Trước khi claim done — evidence before claims | skills/process-verification/ |
| `process-code-review` | Request/receive review — structured process, both sides | skills/process-code-review/ |
| `process-finishing-branch` | Complete branch — verify, clean history, report | skills/process-finishing-branch/ |

> **Rule:** Process skills là meta-skills — dùng TRƯỚC khi làm bất kỳ task technical nào. Load process skill → apply Iron Law → execute.

## Web Skills (8)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `webs-auth` | Auth, OAuth, JWT, RBAC, CSRF | Auth.js, next-auth | skills/webs-auth/ |
| `webs-backend` | API, middleware, error handling, validation | Express, FastAPI | skills/webs-backend/ |
| `webs-database` | Prisma, PostgreSQL, query optimization, migration | Prisma | skills/webs-database/ |
| `webs-deployment` | Docker, CI/CD, Vercel, monitoring, canary | Docker | skills/webs-deployment/ |
| `webs-frontend` | React, components, hooks, data fetching, bundle | React, TanStack Query | skills/webs-frontend/ |
| `webs-security` | Web security checklist — auth, XSS, CSRF, SQLi, rate limit, secure headers | — | skills/webs-security/ |
| `webs-styling` | Tailwind, design system, responsive, dark mode | Tailwind | skills/webs-styling/ |
| `webs-testing` | Vitest, Playwright, MSW, unit/integration/e2e | Vitest | skills/webs-testing/ |

## 3D Web Experience (1)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `3d-web-experience` | 3D website, Three.js, React Three Fiber, Spline, WebGL, 3D product configurator, interactive 3D scene | Three.js, R3F | skills/3d-web-experience/ |

## UI/UX Design (1)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `ui-ux` | UI/UX design — web (React/Tailwind), game HUD (Phaser/Three.js), tool (CLI output). Priority categories (1-10), design system workflow | Tailwind | skills/ui-ux/ |

## Vibe Memory Engine (1)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `vibe-memory` | Tra cứu/lưu knowledge project. Query, update, snapshot, reflection. Startup pipeline + memory injection | — | skills/vibe-memory/ |

## Game Skills — Implementation (12)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `games-2d` | 2D game, platformer, top-down, Phaser 3 | Phaser 3 | skills/games-2d/ |
| `games-3d` | 3D game, FPS, Three.js, lighting, LOD | Three.js | skills/games-3d/ |
| `games-assets` | Free assets download, sprite sheets, animation | — | skills/games-assets/ |
| `games-audio` | Web Audio API, spatial 3D, pool, format fallback | — | skills/games-audio/ |
| `games-core` | Game loop, scene manager, input, asset loader | — | skills/games-core/ |
| `games-deploy` | GitHub Pages, Itch.io Butler, Vercel deploy | — | skills/games-deploy/ |
| `games-isometric` | 2.5D isometric, tile engine, fog of war, A* | Phaser 3 | skills/games-isometric/ |
| `games-optimization` | Object pool, instancing, LOD, profiling, GC | — | skills/games-optimization/ |
| `games-physics` | AABB, spatial hash, raycast, collision response | — | skills/games-physics/ |
| `games-pwa` | Manifest, service worker, offline, install prompt | — | skills/games-pwa/ |
| `games-preview` | Live preview real-time, Vite HMR, hot-reload, browser auto-open | Vite | skills/games-preview/ |
| `games-testing` | Vitest, headless Phaser/Three.js, benchmark | Vitest | skills/games-testing/ |

## Game Skills — Orchestrator + Principles (8)
| Skill | Use when | Path |
|-------|----------|------|
| `game-development` | Orchestrator — route implementation + principle sub-skills | skills/game-development/ |
| `game-design` | GDD, core loop, difficulty balancing, progression | skills/game-design/ |
| `game-art` | Art style, color theory, animation principles, asset pipeline | skills/game-art/ |
| `web-games` | Web browser game principles — framework, WebGPU, PWA, audio | skills/web-games/ |
| `mobile-games` | Mobile — touch input, battery, thermal, app stores | skills/mobile-games/ |
| `pc-games` | PC/Console — engine, Steam, controller, optimization | skills/pc-games/ |
| `multiplayer` | Networking, sync, security, matchmaking | skills/multiplayer/ |
| `vr-ar` | VR/AR — comfort, interaction, performance, spatial | skills/vr-ar/ |

## Prompt Compiler (1)
| Skill | Use when | Path |
|-------|----------|------|
| `prompt-compiler` | Tối ưu prompt, phân tích intent, extract constraints, sinh IR, compile prompt cho LLM | skills/prompt-compiler/ |

> **Game dev**: trước khi code, đọc `workflows/game.workflow.md` → `skills/_shared/game-genre-reference.md` (Decision Tree + anti-patterns). Orchestrator: `skills/game-development/SKILL.md`.

## AI Skills (5)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `ais-agents` | AI agent framework, tool registry, multi-step | LangChain | skills/ais-agents/ |
| `ais-llm` | LLM chat, streaming SSE, function calling, cost track | OpenAI SDK | skills/ais-llm/ |
| `ais-production` | Caching, rate limit, fallback, monitoring, degradation | Redis | skills/ais-production/ |
| `ais-prompts` | Prompt templates, versioning, A/B test, injection defense | — | skills/ais-prompts/ |
| `ais-rag` | RAG pipeline, chunking, embedding, hybrid search | pgvector | skills/ais-rag/ |

## Tool Skills (5)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `tools-automation` | File watcher, batch processor, pipeline, retry | chokidar | skills/tools-automation/ |
| `tools-cli` | CLI app, commander/clap/click, spinner, progress | commander | skills/tools-cli/ |
| `tools-codegen` | Code scaffold, component generator, Plop.js | Plop | skills/tools-codegen/ |
| `tools-extensions` | VS Code extension, commands, views, providers | VS Code API | skills/tools-extensions/ |
| `tools-packaging` | npm/Cargo/PyPI/Docker/Homebrew packaging | — | skills/tools-packaging/ |

## Templates per Skill
Chi tiết template trong `skills/<skill>/templates/`. Chỉ đọc khi cần code feature cụ thể — lazy load.
