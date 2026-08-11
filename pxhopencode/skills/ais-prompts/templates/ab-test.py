import random

async def ab_test_prompt(
    messages: list[dict],
    variants: list[dict],
    track_name: str,
    tracker: CostTracker,
) -> str:
    variant = random.choice(variants)
    test_messages = [
        {"role": "system", "content": variant["system"]},
        *messages,
    ]
    response = await chat(test_messages, model=variant.get("model", "gpt-4o"))
    tracker.track(response.model, response.input_tokens, response.output_tokens)
    return response.content

# Log kết quả để phân tích sau
prompt_log = []

def log_result(name: str, variant_id: str, success: bool, latency_ms: int):
    prompt_log.append({
        "name": name,
        "variant": variant_id,
        "success": success,
        "latency_ms": latency_ms,
        "timestamp": time.time(),
    })
