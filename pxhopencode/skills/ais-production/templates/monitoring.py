# metrics.py
from prometheus_client import Counter, Histogram, Gauge

llm_calls = Counter("llm_calls_total", "Total LLM calls", ["model", "status"])
llm_latency = Histogram("llm_latency_seconds", "LLM latency", ["model"], buckets=[0.1, 0.5, 1, 2, 5, 10])
llm_tokens = Counter("llm_tokens_total", "Total tokens", ["model", "type"])  # type=input/output
llm_cost = Counter("llm_cost_total", "Total cost USD", ["model"])
active_requests = Gauge("llm_active_requests", "Current active LLM requests")

async def monitored_chat(messages, **kwargs):
    model = kwargs.get("model", "gpt-4o")
    active_requests.inc()
    start = time.monotonic()
    try:
        response = await chat(messages, **kwargs)
        llm_calls.labels(model=model, status="success").inc()
        llm_latency.labels(model=model).observe(time.monotonic() - start)
        llm_tokens.labels(model=model, type="input").inc(response.input_tokens)
        llm_tokens.labels(model=model, type="output").inc(response.output_tokens)
        llm_cost.labels(model=model).inc(estimate_cost(model, response.input_tokens, response.output_tokens))
        return response.content
    except Exception as e:
        llm_calls.labels(model=model, status="error").inc()
        raise
    finally:
        active_requests.dec()
