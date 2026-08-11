# Changelog

## v82.6 — Release hardening
Strict runtime build fixed; CI now builds/tests runtime engine and prompt compiler and checks release integrity. Runtime state removed from Git tracking. Version, test counts, and MIT license metadata synchronized for GitHub release.

## v80.1 — Embedded mode path fix
init-memory.ps1 now derives pxhopencode root from `$PSScriptRoot` instead of `$WorkspaceRoot`. Works correctly in both standalone mode and when cloned into `.opencode/`. README documents both path variants.

## v80 — 10/10 Audit Cleanup
All 29 issues fixed: pxh-save-history → .memory/ + Event contracts, MEMORY REFLECTION for all 10 agents, quickref tables complete, 11 skills sections added, memory contradictions resolved, workflow loop/failover + post-code routing for all 8 workflows, T1 doc aligned, language rules explicit, T4 storage table complete, init.json consistent. Score: 10/10.

## v79.1 — GitGuard: auto .gitignore for .opencode/
init-memory.ps1 now ensures parent project's `.gitignore` has `.opencode/` entry — creates if missing, appends if present, skips if already covered. AI Company never leaked to GitHub.

## v79 — Architecture Integrity Fix
6 violations detected and fixed: storage consolidation (.opencode/docs/ → .memory/), reflection policy dual-path resolution, STATUS.md path alignment, architecture.json population, Event→T4 added to all T3 agents, cross-reference audit. Future-proof: new agents/skills/workflows add with 0 architectural drift.

## v78 — Release v78
Update all version numbers (v77→v78). README sync (214 commits, 50 skills, 154 templates). STATUS.md release readiness refresh. Chrome DevTools MCP integration documentation refinements, enhanced asset download scripts with license check, build scripts improvements for PowerShell execution policy.

## v76 — Agent Skills Hub Game Upgrade
Tham khảo [agent-skills-hub/game-development](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development). Tạo orchestrator `skills/game-development/SKILL.md` bridge implementation (pxhopencode) + principles (agent-skills-hub). Tạo 7 principle sub-skills mới: `game-art`, `game-design`, `multiplayer`, `vr-ar`, `web-games`, `mobile-games`, `pc-games`. Update `/game` command, `game.workflow.md`, `opencode.json`. Skill count: 39→46.

## v75 — UI/UX Pro Max Upgrade
Tham khảo [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). Nâng cấp `skills/ui-ux/SKILL.md`: priority-based rule categories (1-10, Critical→Low), design system workflow (Analyze → Tokens → Supplement), design dials (variance/motion/density), design tokens section, pre-delivery checklist merge.

## v74 — Superpowers Skill Upgrade
Tham khảo [obra/superpowers](https://github.com/obra/superpowers/tree/main/skills). Tạo 8 process skills mới (driven-development, parallel-agents, systematic-debugging, writing-plans, tdd, verification, code-review, finishing-branch). Nâng cấp 6 existing skills với Iron Law + Core Principle. Update 5 agents reference process skills. Skill count: 33→39.

## v73 — Token Optimization V3.0
Merge `contracts.md` vào README (xóa file), trim `prompt-optimizer.md` 53→35 dòng (-34%), move README changelog → `_shared/changelog.md` (-124 dòng). Tổng savings: ~218 dòng + 1 file read mỗi session.

## v72 — Fix bugs + Clean project
Xoá 23 dev artifact files (11 root .js + 12 _shared/), clear 3 runtime logs (free ~1.5MB), fix `/ui-ux` command bug (đang trỏ sai vào debug workflow), runtime logs thêm vào `.gitignore`.

## v71 — Review + Refactor + Optimize
Fix `pxh-expert.md` QUY_TRÌNH section bị split; sửa STATUS.md agent count (12) + skills count (33); thêm memory reflection step vào T3 worker layer; thêm step load skill vào memory startup.

## v70 — Vibe Coding Memory Engine v1.0
13 file `.memory/` storage, 10 memory categories (project, architecture, patterns, bugs, decisions, preferences, workflow, prompt, vibe, snapshots), timeline + stats, `runtime/memory/` module with README + 5 contracts, `skills/vibe-memory/SKILL.md` for agent integration, Startup-Pipeline, Reflection Engine, Confidence System, Token-Optimierung, auto-project-detection.

## v50 — Release
Arch check 0 errors, tagged release v50.

## v49 — User Guide Rewrite
README repositioned as user guide, 3 cách vibe code front-and-center, commit count sync.

## v48 — Prompt Optimizer
`prompt-optimizer.md` — auto-rewrite prompt mơ hồ, collapsible `<details>` panel, integration vào opencode.json.

## v32–v44 — Foundation & Hardening
- v44: Context compaction, tool output truncation, skill lazy loading, live preview
- v43: AI Studio debug pipeline, Polish Pipeline, game eval assertions
- v42: Godot removal
- v40: Observability & Alerting, Contract versioning, Mermaid diagrams
- v32: Initial foundation — 4-tier architecture, 10 agents, 8 workflows, 28 skills
