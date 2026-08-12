async def hybrid_search(query: str, k: int = 10, alpha: float = 0.7):
    query_emb = (await embed_batch([query]))[0]

    rows = await conn.fetch("""
        WITH vector_scores AS (
            SELECT id, content, metadata,
                   1 - (embedding <=> $1::vector) as vs_score
            FROM documents
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        ),
        keyword_scores AS (
            SELECT id, ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) as kw_score
            FROM documents
            WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $2)
        )
        SELECT v.id, v.content, v.metadata,
               $4 * v.vs_score + (1 - $4) * COALESCE(k.kw_score, 0) as combined
        FROM vector_scores v
        LEFT JOIN keyword_scores k ON v.id = k.id
        ORDER BY combined DESC
        LIMIT $5
    """, query_emb, query, 50, alpha, k)

    return rows
