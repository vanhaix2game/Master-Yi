# Skill Quick Reference — Consolidated Index

Dùng để chọn skill NHANH mà không cần đọc SKILL.md. Mỗi skill 1 dòng.

## Tổng quan: Process(8) + Web(8) + Game(12+7+1) + AI(5) + Tool(5) + UI/UX(1) + 3D Web(1) + PromptCompiler(1) + Vibe Memory(1) = 50 skills

## Process Skills (8) — Meta-Cognition & Workflow
| Skill | Use when | Path |
|-------|----------|------|
| `process-driven-development` | Execute plan với subagent mới cho mỗi task, isolated context | skills/pxh-pm/process-driven-development/ |
| `process-parallel-agents` | 2+ task độc lập, chạy song song | skills/pxh-pm/process-parallel-agents/ |
| `process-systematic-debugging` | Any bug/test failure — root cause FIRST, no symptom fix | skills/pxh-fix-bugs/process-systematic-debugging/ |
| `process-writing-plans` | Multi-step task — viết plan bite-sized trước khi code | skills/pxh-pm/process-writing-plans/ |
| `process-tdd` | Feature/bugfix — test TRƯỚC, code SAU | skills/pxh-qa/process-tdd/ |
| `process-verification` | Trước khi claim done — evidence before claims | skills/pxh-qa/process-verification/ |
| `process-code-review` | Request/receive review — structured process, both sides | skills/pxh-review-code/process-code-review/ |
| `process-finishing-branch` | Complete branch — verify, clean history, report | skills/pxh-devops/process-finishing-branch/ |

> **Rule:** Process skills là meta-skills — dùng TRƯỚC khi làm bất kỳ task technical nào. Load process skill → apply Iron Law → execute.

## Web Skills (8)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `webs-auth` | Auth, OAuth, JWT, RBAC, CSRF | Auth.js, next-auth | skills/pxh-expert/webs-auth/ |
| `webs-backend` | API, middleware, error handling, validation | Express, FastAPI | skills/pxh-expert/webs-backend/ |
| `webs-database` | Prisma, PostgreSQL, query optimization, migration | Prisma | skills/pxh-expert/webs-database/ |
| `webs-deployment` | Docker, CI/CD, Vercel, monitoring, canary | Docker | skills/pxh-devops/webs-deployment/ |
| `webs-frontend` | React, components, hooks, data fetching, bundle | React, TanStack Query | skills/pxh-expert/webs-frontend/ |
| `webs-security` | Web security checklist — auth, XSS, CSRF, SQLi, rate limit, secure headers | — | skills/pxh-expert/webs-security/ |
| `webs-styling` | Tailwind, design system, responsive, dark mode | Tailwind | skills/pxh-ui-ux/webs-styling/ |
| `webs-testing` | Vitest, Playwright, MSW, unit/integration/e2e | Vitest | skills/pxh-qa/webs-testing/ |

## 3D Web Experience (1)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `3d-web-experience` | 3D website, Three.js, React Three Fiber, Spline, WebGL, 3D product configurator, interactive 3D scene | Three.js, R3F | skills/pxh-expert/3d-web-experience/ |

## UI/UX Design (1)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `ui-ux` | UI/UX design — web (React/Tailwind), game HUD (Phaser/Three.js), tool (CLI output). Priority categories (1-10), design system workflow | Tailwind | skills/pxh-ui-ux/ui-ux/ |

## Vibe Memory Engine (1)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `vibe-memory` | Tra cứu/lưu knowledge project. Query, update, snapshot, reflection. Startup pipeline + memory injection | — | skills/pxh-save-history/vibe-memory/ |

## Game Skills — Implementation (12)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `games-2d` | 2D game, platformer, top-down, Phaser 3 | Phaser 3 | skills/pxh-expert/games-2d/ |
| `games-3d` | 3D game, FPS, Three.js, lighting, LOD | Three.js | skills/pxh-expert/games-3d/ |
| `games-assets` | Free assets download, sprite sheets, animation | — | skills/pxh-expert/games-assets/ |
| `games-audio` | Web Audio API, spatial 3D, pool, format fallback | — | skills/pxh-expert/games-audio/ |
| `games-core` | Game loop, scene manager, input, asset loader | — | skills/pxh-expert/games-core/ |
| `games-deploy` | GitHub Pages, Itch.io Butler, Vercel deploy | — | skills/pxh-devops/games-deploy/ |
| `games-isometric` | 2.5D isometric, tile engine, fog of war, A* | Phaser 3 | skills/pxh-expert/games-isometric/ |
| `games-optimization` | Object pool, instancing, LOD, profiling, GC | — | skills/pxh-expert/games-optimization/ |
| `games-physics` | AABB, spatial hash, raycast, collision response | — | skills/pxh-expert/games-physics/ |
| `games-pwa` | Manifest, service worker, offline, install prompt | — | skills/pxh-expert/games-pwa/ |
| `games-preview` | Live preview real-time, Vite HMR, hot-reload, browser auto-open | Vite | skills/pxh-expert/games-preview/ |
| `games-testing` | Vitest, headless Phaser/Three.js, benchmark | Vitest | skills/pxh-qa/games-testing/ |

## Game Skills — Orchestrator + Principles (8)
| Skill | Use when | Path |
|-------|----------|------|
| `game-development` | Orchestrator — route implementation + principle sub-skills | skills/pxh-expert/game-development/ |
| `game-design` | GDD, core loop, difficulty balancing, progression | skills/pxh-expert/game-design/ |
| `game-art` | Art style, color theory, animation principles, asset pipeline | skills/pxh-ui-ux/game-art/ |
| `web-games` | Web browser game principles — framework, WebGPU, PWA, audio | skills/pxh-expert/web-games/ |
| `mobile-games` | Mobile — touch input, battery, thermal, app stores | skills/pxh-expert/mobile-games/ |
| `pc-games` | PC/Console — engine, Steam, controller, optimization | skills/pxh-expert/pc-games/ |
| `multiplayer` | Networking, sync, security, matchmaking | skills/pxh-expert/multiplayer/ |
| `vr-ar` | VR/AR — comfort, interaction, performance, spatial | skills/pxh-expert/vr-ar/ |

## Prompt Compiler (1)
| Skill | Use when | Path |
|-------|----------|------|
| `prompt-compiler` | Tối ưu prompt, phân tích intent, extract constraints, sinh IR, compile prompt cho LLM | skills/pxh-pm/prompt-compiler/ |

> **Game dev**: trước khi code, đọc `workflows/game.workflow.md` → `skills/_shared/game-genre-reference.md` (Decision Tree + anti-patterns). Orchestrator: `skills/pxh-expert/game-development/SKILL.md`.

## AI Skills (5)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `ais-agents` | AI agent framework, tool registry, multi-step | LangChain | skills/pxh-expert/ais-agents/ |
| `ais-llm` | LLM chat, streaming SSE, function calling, cost track | OpenAI SDK | skills/pxh-expert/ais-llm/ |
| `ais-production` | Caching, rate limit, fallback, monitoring, degradation | Redis | skills/pxh-expert/ais-production/ |
| `ais-prompts` | Prompt templates, versioning, A/B test, injection defense | — | skills/pxh-expert/ais-prompts/ |
| `ais-rag` | RAG pipeline, chunking, embedding, hybrid search | pgvector | skills/pxh-expert/ais-rag/ |

## Tool Skills (5)
| Skill | Use when | Deps | Path |
|-------|----------|------|------|
| `tools-automation` | File watcher, batch processor, pipeline, retry | chokidar | skills/pxh-expert/tools-automation/ |
| `tools-cli` | CLI app, commander/clap/click, spinner, progress | commander | skills/pxh-expert/tools-cli/ |
| `tools-codegen` | Code scaffold, component generator, Plop.js | Plop | skills/pxh-expert/tools-codegen/ |
| `tools-extensions` | VS Code extension, commands, views, providers | VS Code API | skills/pxh-expert/tools-extensions/ |
| `tools-packaging` | npm/Cargo/PyPI/Docker/Homebrew packaging | — | skills/pxh-devops/tools-packaging/ |

## Templates per Skill
Chi tiết template trong `skills/<skill>/templates/`. Chỉ đọc khi cần code feature cụ thể — lazy load.
