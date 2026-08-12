from functools import lru_cache
import json, time, hashlib

class AIResponseCache:
    def __init__(self, ttl_seconds: int = 300, max_size: int = 1000):
        self.ttl = ttl_seconds
        self.cache: dict[str, tuple[float, str]] = {}
        self.max_size = max_size

    def _key(self, messages: list[dict], model: str) -> str:
        raw = json.dumps({"m": messages, "md": model}, sort_keys=True)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, messages: list[dict], model: str) -> str | None:
        key = self._key(messages, model)
        entry = self.cache.get(key)
        if entry and (time.time() - entry[0]) < self.ttl:
            return entry[1]
        if entry:
            del self.cache[key]
        return None

    def set(self, messages: list[dict], model: str, response: str):
        key = self._key(messages, model)
        if len(self.cache) >= self.max_size:
            oldest = min(self.cache.keys(), key=lambda k: self.cache[k][0])
            del self.cache[oldest]
        self.cache[key] = (time.time(), response)

ai_cache = AIResponseCache()

async def cached_chat(messages: list[dict], **kwargs) -> str:
    cached = ai_cache.get(messages, kwargs.get("model", "gpt-4o"))
    if cached:
        return cached
    response = await chat(messages, **kwargs)
    ai_cache.set(messages, kwargs.get("model", "gpt-4o"), response.content)
    return response.content
