# Runtime Engine — Agent Reference

> Agents: dùng các CLI scripts này để validate, track pipeline, quản lý context.

## Available scripts (run từ project root)

| Script | Command | Purpose |
|--------|---------|---------|
| **validate** | `node .opencode/runtime/bin/validate.mjs` | Validate contracts, pipeline, router |
| **pipeline** | `node .opencode/runtime/bin/pipeline.mjs` | Track phases, mark pass/fail, watch live |
| **diff** | `node .opencode/runtime/bin/diff.mjs` | Show git diff, rollback files |
| **secret** | `node .opencode/runtime/bin/secret.mjs` | Get/set secrets from `.opencode/.env` |
| **detect** | `node .opencode/runtime/bin/detect.mjs` | Auto-detect project framework |
| **context** | `node .opencode/runtime/bin/context.mjs` | Read/write session context |

## Contract validation flow

```
Task contract → validate.mjs check → nếu valid → execute
                                  → nếu invalid → báo T2, không execute
```

## Pipeline flow

```
Pipeline start → mỗi phase: pipeline.mjs start <phase>
              → execute → success: pipeline.mjs pass <phase>
                                  → fail: pipeline.mjs fail <phase> → retry
```

## Context injection

Trước mỗi Task contract, inject recent prompts:

```
node .opencode/runtime/bin/context.mjs export
→ inject output vào Task{context.recent_prompts}
```
