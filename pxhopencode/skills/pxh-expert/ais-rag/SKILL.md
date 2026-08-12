---
name: ais-rag
description: RAG pipeline production — ingestion, chunking chiến lược, embedding, hybrid search, rerank. Không index trùng, search dưới 200ms.
---

# ais-rag — RAG Pipeline

## Files

| File | Mục đích |
|------|----------|
| `templates/chunking.py` | `chunk_document()` — markdown/code/text splitters with overlap |
| `templates/embedding.py` | `EmbedCache` (SQLite) + `embed_batch()` with OpenAI |
| `templates/schema.sql` | pgvector DDL — `documents` table, IVFFlat + GIN indexes |
| `templates/hybrid-search.py` | `hybrid_search()` — vector cosine + keyword ts_rank combined |
| `templates/rerank.py` | LLM-based reranking with `RERANK_PROMPT` |

## Usage

```python
from templates.chunking import chunk_document
chunks = chunk_document(text, "markdown")
```

**Performance targets:** search < 200ms, rerank top-3 < 1s.
**Deduplication:** hash content before insert to avoid duplicates.

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Hybrid search không cần, vector đủ" | Keyword miss → 0 results cho thuật ngữ chính xác |
| "Chunk overlap 0 là đủ" | Câu bị cắt giữa chừng → context incomplete |
| "pgvector index sau, data ít" | Full scan khi có 10k+ docs → search > 1s |

## Red Flags
- Chunk overlap = 0
- Chỉ dùng vector search, không hybrid
- pgvector không index IVFFlat

## Verification
- [ ] Chunk overlap 10-20%, split theo cấu trúc
- [ ] Hybrid search: vector + keyword
- [ ] Search latency < 200ms
