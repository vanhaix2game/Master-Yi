from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

async def stream_chat(messages: list[dict]):
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta
        if delta.content:
            yield f"data: {json.dumps({'text': delta.content})}\n\n"
    yield "data: [DONE]\n\n"

@app.post("/chat")
async def chat_endpoint(body: dict):
    return StreamingResponse(
        stream_chat(body["messages"]),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
