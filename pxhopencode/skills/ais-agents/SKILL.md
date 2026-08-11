---
name: ais-agents
description: AI Agent framework — tool registry, multi-step reasoning, memory, rate control. Không infinite loop, tự động timeout.
---

# ais-agents — AI Agents

## Core Principle

**Agents must never infinite loop. Every loop must have a hard timeout and max steps.**

## Luật sắt

```
KHÔNG BAO GIỜ chạy agent loop KHÔNG có timeout + max steps
Mọi tool call phải có guard tràn token
```

## Files

| File | Mục đích |
|------|----------|
| `templates/tool-registry.py` | `Tool` + `ToolRegistry` — type-safe tool registration, OpenAI schema |
| `templates/agent.py` | `Agent` — ReAct loop with timeout (30s) and max steps (15), tool execution |
| `templates/agent-memory.py` | `AgentMemory` — deque short-term + dict long-term, `summarize()` for context |

## Usage

```python
from templates.tool-registry import Tool, ToolRegistry
from templates.agent import Agent

registry = ToolRegistry()
registry.register(Tool(name="search", ...))
agent = Agent(registry)
result = await agent.run("find docs about X")
```

**Security:**
- Tool results are truncated to 2000 chars to prevent token explosion
- Agent timeout prevents runaway loops
- Validate all tool arguments before execution

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "ReAct loop 15 steps là an toàn" | Tool call sai → loop tốn token, timeout |
| "Không cần memory summarization" | Context quá dài → LLM mất focus |
| "Tool result truncation 2000 chars thừa" | LLM context bị tràn bởi tool output dài |

## Red Flags
- Agent không có timeout
- Tool args không validate
- Memory không giới hạn → token explosion

## Verification
- [ ] Agent timeout ≤ 30s, max steps ≤ 15
- [ ] Tool result truncated ≤ 2000 chars
- [ ] Tool args validated trước execute
