# Workflow AI — Phát triển ứng dụng AI

> **LUẬT NGÔN NGỮ**: UI text (chat message, label, thông báo) = **tiếng Việt**. Code, variable, comments = **tiếng Anh**.
> **ENFORCEMENT GATE:** Mỗi phase BẮT BUỘC chạy `enforce run <phase>` TRƯỚC, `enforce pass/fail <phase>` SAU. Bỏ qua = violation.

## Bước 1: Stack
**Backend**: FastAPI + LangChain (mặc định), FastAPI + LlamaIndex, Django + Celery
**LLM**: OpenAI GPT-4o (mặc định), Claude 3.5, Gemini, Local (Ollama)
**DB/Vector**: PostgreSQL + pgvector (mặc định), ChromaDB, Pinecone, Redis

## Bước 2: Setup
```bash
python -m venv .venv && pip install fastapi uvicorn langchain openai pydantic
pip install psycopg2-binary sqlalchemy pgvector
```
`.gitignore`: `.opencode/`, `.github/`, `.gitignore`, `__pycache__/`, `*.pyc`, `.venv/`, `.env`

## Bước 3: Cấu trúc
`api/` → `core/` → `models/` → `services/` (llm, rag, embedding, agent) → `vector_store/` → `prompts/` → `utils/`

## Bước 4: Flow code
`Setup LLM → API → RAG Pipeline → Agent/Tools → Frontend Chat → Deploy`

Chi tiết: LLM Setup → API Routes (streaming) → RAG (Load→Chunk→Embed→Store→Retrieve→Generate) → Agent/Tools (function calling, multi-step) → Frontend Chat → Deploy

## Bước 5: Patterns
Chat đơn giản / RAG với PDF / AI Agent / Multi-modal / Streaming SSE / Function Calling

## Bước 6: Security
Rate limiting, input sanitization (prompt injection defense), auth, token limits + cost monitoring, logging LLM calls

## Loop/Failover
- LLM call fail → retry max 3 (exponential backoff 1s→2s→4s)
- RAG pipeline error → rebuild index từ chunk cache
- Security gate fail → fix → retest (max 3)
- Quá 3 lần → báo user + snapshot state

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "LLM output không cần validate" | JSON parse fail, injection, hallucination |
| "RAG chunking sau" | Embedding sai → search sai → user nhận kết quả rác |
| "Streaming optional" | Chat không streaming → user thấy chậm, bỏ cuộc |

## Red Flags
- LLM call không retry + fallback
- RAG pipeline không dedup
- Không cost monitoring

## Verification
- [ ] Streaming SSE cho chat UX
- [ ] RAG: chunk → embed → hybrid search → rerank
- [ ] Rate limit + cost tracking active

## Post-code: chạy company workflow phase 7-11
Code xong → route qua `workflows/company.workflow.md` phase 7-11 (Test→Fix→Review→Build→Persist)
