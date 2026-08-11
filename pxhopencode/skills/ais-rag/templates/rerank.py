RERANK_PROMPT = """Given the query and passages, rank by relevance.
Output only numbers 1-{n} in order, one per line.

Query: {query}

Passages:
{passages}

Ranking:"""

async def rerank(query: str, passages: list[str], top_k: int = 3) -> list[int]:
    ranked = await chat([{"role": "user", "content": RERANK_PROMPT.format(
        query=query,
        passages="\n".join(f"[{i}] {p[:200]}" for i, p in enumerate(passages)),
        n=len(passages)
    )}])
    lines = [l.strip() for l in ranked.content.split("\n") if l.strip().isdigit()]
    indices = [int(l) for l in lines if 0 <= int(l) < len(passages)]
    return indices[:top_k]
