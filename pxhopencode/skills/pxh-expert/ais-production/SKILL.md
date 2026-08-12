---
name: ais-production
description: Production AI — caching, rate limit, fallback model, monitoring, graceful degradation. Không crash khi API down.
---

# ais-production — Production AI

## Core Principle

**The system must never crash when an external API is down. Graceful degradation is not optional.**

## Luật sắt

```
KHÔNG BAO GIỜ deploy AI feature KHÔNG có fallback chain + rate limiter
Cache ALL responses — repeat queries are waste
```

## Files

| File | Mục đích |
|------|----------|
| `templates/response-cache.py` | `AIResponseCache` — TTL-based, LRU eviction, MD5 keyed by messages+model |
| `templates/rate-limiter.py` | `RateLimiter` — sliding window per minute + daily cap, `acquire()` |
| `templates/fallback.py` | `chat_with_fallback()` — chain gpt-4o → gpt-4o-mini → claude-3-haiku |
| `templates/monitoring.py` | Prometheus metrics — calls, latency, tokens, cost, active requests |

## Usage

```python
from templates.fallback import chat_with_fallback
from templates.rate_limiter import rate_limiter
await rate_limiter.acquire()
result = await chat_with_fallback(messages)
```

**Architecture:**
- Cache sits in front of LLM calls (reduces cost/latency)
- Rate limiter wraps all external calls
- Fallback chain ensures graceful degradation
- Metrics exported at `/metrics` for Prometheus

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Cache không cần, LLM response đa dạng" | Câu hỏi giống nhau → cache giảm 50% cost |
| "Fallback model khi main model down = app chết" | Graceful degradation > 500 error |
| "Monitoring thêm sau" | Không biết latency tăng, cost vượt |

## Red Flags
- LLM call không có fallback chain
- Rate limiter missing
- Monitoring/metrics không export

## Verification
- [ ] LRU cache trước LLM call
- [ ] Fallback chain: gpt-4o → gpt-4o-mini → claude-haiku
- [ ] Rate limiter + cost monitoring active
