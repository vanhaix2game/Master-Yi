import asyncio
import time
from openai import AsyncOpenAI, APIError, RateLimitError
from dataclasses import dataclass

client = AsyncOpenAI()

@dataclass
class LLMResponse:
    content: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: int

async def chat(
    messages: list[dict],
    model: str = "gpt-4o",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    retry: int = 2,
) -> LLMResponse:
    last_error = None
    for attempt in range(retry + 1):
        try:
            start = time.monotonic()
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            latency = int((time.monotonic() - start) * 1000)
            choice = response.choices[0]
            return LLMResponse(
                content=choice.message.content or "",
                model=response.model,
                input_tokens=response.usage.prompt_tokens,
                output_tokens=response.usage.completion_tokens,
                latency_ms=latency,
            )
        except RateLimitError:
            wait = 2 ** attempt
            await asyncio.sleep(wait)
        except APIError as e:
            last_error = e
            if attempt < retry:
                await asyncio.sleep(1)
    raise last_error or Exception("LLM call failed")
