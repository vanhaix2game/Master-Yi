---
name: ais-llm
description: Tích hợp LLM production — chat, streaming SSE, function calling, cost tracking, retry, fallback. Không memory leak, tự động reconnect.
---

# ais-llm — LLM Integration

## Core Principle

**Every LLM call must have retry, fallback, and cost guard. No naked API calls.**

## Luật sắt

```
KHÔNG BAO GIỜ gọi LLM mà KHÔNG có retry + cost guard
Streaming là mặc định cho mọi chat UX
```

## Files

| File | Mục đích |
|------|----------|
| `templates/chat.py` | `chat()` with retry (exp backoff 1→2→4s), `LLMResponse` dataclass |
| `templates/streaming.py` | SSE streaming endpoint (FastAPI `StreamingResponse`) |
| `templates/function-calling.py` | Tool call parsing with Pydantic validation, `parse_tool_call()` |
| `templates/cost-tracker.py` | `CostTracker` with daily budget, `can_call()` guard |

## Usage

```python
from templates.chat import chat, LLMResponse
resp = await chat([{"role": "user", "content": "hello"}])
```

**Security:**
- Never log `client.api_key`
- Set `OPENAI_API_KEY` via env, never hardcode
- Validate tool call args with Pydantic before execution
- Set `daily_budget` in CostTracker to prevent bill shock

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Retry không cần, API luôn ổn" | OpenAI rate limit 429, network timeout thường xuyên |
| "Streaming phức tạp, dùng chat luôn" | UX chậm, user thấy loading lâu |
| "Cost tracker sau" | Bill $1000 bất ngờ vì infinite retry loop |

## Red Flags
- API call không retry
- LLM response không parse error
- Cost tracker không setup

## Verification
- [ ] Retry: exp backoff 1→2→4s, max 3
- [ ] Streaming endpoint cho chat UX
- [ ] CostTracker with daily budget
