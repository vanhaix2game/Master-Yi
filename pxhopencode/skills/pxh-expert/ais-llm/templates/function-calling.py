from pydantic import BaseModel, ValidationError

class WeatherTool(BaseModel):
    location: str
    unit: str = "c"

TOOL_DEF = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get weather for location",
        "parameters": WeatherTool.model_json_schema(),
    }
}

async def parse_tool_call(msg) -> dict | None:
    if not msg.tool_calls:
        return None
    tc = msg.tool_calls[0]
    try:
        args = json.loads(tc.function.arguments)
        WeatherTool(**args)  # validation
        return {"name": tc.function.name, "args": args, "id": tc.id}
    except (json.JSONDecodeError, ValidationError):
        return {"name": tc.function.name, "args": {}, "id": tc.id, "error": "invalid_args"}
