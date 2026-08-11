# Contracts — Inter-Agent Communication Protocol

> All inter-agent communication uses Zod-validated contracts defined in `runtime/engine/src/contracts/`.

## Contract Types

| Contract | Flow | Validator | Purpose |
|----------|------|-----------|---------|
| **Request** | T1 → T2 | `RequestSchema` | User prompt → Orchestrator |
| **Task** | T2 → T3 | `TaskSchema` | Orchestrator → Worker |
| **Result** | T3 → T2 | `ResultSchema` | Worker → Orchestrator |
| **Response** | T2 → T1 | `ResponseSchema` | Orchestrator → Interface |
| **Event** | any → T4 | `EventSchema` | Any tier → Infrastructure |
| **State** | T4 → T2 | `StateSchema` | Infrastructure → Orchestrator |

## Field Reference

### Request (T1→T2)
```
version: "1.0"
type:    "web" | "game" | "ai" | "tool" | "debug" | "vibe" | "ui-ux" | "meeting" | "release" | "compile" | "preview" | "unknown"
target:  string (min 1)
context: Record<string, unknown> (default {})
```

### Task (T2→T3)
```
version:  "1.0"
phase:    "analyze" | "meeting" | "architect" | "code" | "fix" | "test" | "review" | "build" | "ui-ux" | "persist"
target:   string (min 1)
skills:   string[] (default [])
workflow: string (min 1)
context:  Record<string, unknown> (default {})
```

### Result (T3→T2)
```
version:   "1.0"
status:    "pass" | "fail" | "partial"
artifacts: Array<{path: string, summary: string}> (default [])
message?:  string
```

### Response (T2→T1)
```
version: "1.0"
status:  "ok" | "error"
summary: string
```

### Event (any→T4)
```
version:    "1.0"
type:       "phase_start" | "phase_end" | "error" | "decision" | "checkpoint" | "reflection" | "retry" | "loop" | "alert" | "feedback"
phase:      string (min 1)
reflection?: Record<string, unknown>
```

### State (T4→T2)
```
version:    "1.0"
checkpoint: Record<string, unknown>
session_id: string (min 1)
```

## Validation Rules

1. All contracts must pass their Zod schema before transmission.
2. Invalid contracts are rejected at the receiving tier boundary.
3. `version` must always be `"1.0"` — mismatched versions are dropped.
4. Unknown enum values cause validation failure.
5. Optional fields use `undefined` (not `null`) when absent.

## Source Files

All Zod schemas and TypeScript types:
- `runtime/engine/src/contracts/request.ts`
- `runtime/engine/src/contracts/task.ts`
- `runtime/engine/src/contracts/result.ts`
- `runtime/engine/src/contracts/response.ts`
- `runtime/engine/src/contracts/event.ts`
- `runtime/engine/src/contracts/state.ts`
- `runtime/engine/src/contracts/index.ts` (re-exports)
