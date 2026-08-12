# Ước lượng token trước khi gửi
def estimate_tokens(text: str) -> int:
    return len(text) // 4  # rough: ~4 chars/token

def optimize_prompt(messages: list[dict], max_tokens: int = 4000) -> list[dict]:
    total = sum(estimate_tokens(m["content"]) for m in messages)
    if total <= max_tokens:
        return messages

    # System prompt giữ nguyên, user prompt cắt bớt
    system = [m for m in messages if m["role"] == "system"]
    user = [m for m in messages if m["role"] == "user"]
    remaining = max_tokens - sum(estimate_tokens(m["content"]) for m in system)

    for msg in user:
        if estimate_tokens(msg["content"]) > remaining:
            msg["content"] = msg["content"][:remaining * 4] + "...[truncated]"
            remaining = 0
        else:
            remaining -= estimate_tokens(msg["content"])

    return system + user
