FALLBACK_CHAIN = [
    {"model": "gpt-4o", "max_tokens": 4096},
    {"model": "gpt-4o-mini", "max_tokens": 8192},
    {"model": "claude-3-haiku", "max_tokens": 8192},
]

async def chat_with_fallback(messages: list[dict]) -> str:
    last_error = None
    for config in FALLBACK_CHAIN:
        try:
            response = await chat(messages, **config)
            return response.content
        except Exception as e:
            last_error = e
            print(f"Fallback: {config['model']} failed: {e}")
            continue
    return f"⚠️ All models unavailable. Last error: {last_error}"
