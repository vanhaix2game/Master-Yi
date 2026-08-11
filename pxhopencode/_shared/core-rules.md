# pxhopencode Core Rules

- Read `STATUS.md` before changes. Preserve working code; use minimal, scoped edits.
- For natural-language tasks, run `node .opencode/runtime/bin/session.mjs prepare --stdin` once. Send its Markdown `prompt` to the worker and use compact JSON `route` only for routing; never pass full IR unless debugging the compiler.
- Load `_shared/skill-quickref.md`, workflows, skills, templates, memory, and runtime docs only when the task needs them. Never preload them.
- Default to ECONOMY path: PM classifies from compiler IR and routes directly to one worker. Do not call `pxh-help`, meetings, QA, reviewer, or historian for low-risk tasks.
- Add agents only when risk or task independence justifies another model request. Batch reads/tools and do not repeat successful checks.
- Verify proportionally: focused test first; expand only after failure or for high-risk/release work.
- Persist only durable decisions, confirmed bugs, or release milestones; do not reflect routine tasks.
- Update `STATUS.md` after source changes with changes, files, verification, and remaining issues.
