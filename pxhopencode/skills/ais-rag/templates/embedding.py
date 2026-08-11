import hashlib, json, sqlite3
from openai import AsyncOpenAI

embed_client = AsyncOpenAI()

class EmbedCache:
    def __init__(self, db_path: str = "embed_cache.db"):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, vector TEXT)")

    def _hash(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    def get(self, text: str) -> list[float] | None:
        row = self.conn.execute("SELECT vector FROM cache WHERE hash=?", (self._hash(text),)).fetchone()
        return json.loads(row[0]) if row else None

    def set(self, text: str, vector: list[float]):
        self.conn.execute("INSERT OR REPLACE INTO cache VALUES (?, ?)", (self._hash(text), json.dumps(vector)))
        self.conn.commit()

cache = EmbedCache()

async def embed_batch(texts: list[str], model: str = "text-embedding-3-small") -> list[list[float]]:
    uncached = [(i, t) for i, t in enumerate(texts) if cache.get(t) is None]
    results = [None] * len(texts)

    # Fill cached
    for i, t in enumerate(texts):
        if v := cache.get(t):
            results[i] = v

    # Embed uncached
    if uncached:
        indices, texts_to_embed = zip(*uncached)
        response = await embed_client.embeddings.create(model=model, input=list(texts_to_embed))
        for idx, data in zip(indices, response.data):
            vector = data.embedding
            cache.set(texts[idx], vector)
            results[idx] = vector

    return results
