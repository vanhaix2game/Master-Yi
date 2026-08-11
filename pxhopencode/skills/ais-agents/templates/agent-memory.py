from collections import deque

class AgentMemory:
    def __init__(self, max_short_term: int = 20):
        self.short_term: deque[dict] = deque(maxlen=max_short_term)
        self.long_term: dict[str, str] = {}

    def add(self, role: str, content: str):
        self.short_term.append({"role": role, "content": content})

    def recall(self, key: str) -> str | None:
        return self.long_term.get(key)

    def remember(self, key: str, value: str):
        self.long_term[key] = value

    def summarize(self) -> str:
        """Tạo summary ngắn cho context window"""
        recent = list(self.short_term)[-6:]
        return "\n".join(f"[{m['role']}] {m['content'][:100]}" for m in recent)

    def get_context(self) -> list[dict]:
        return list(self.short_term)
