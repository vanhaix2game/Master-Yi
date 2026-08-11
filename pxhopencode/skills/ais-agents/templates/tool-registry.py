from typing import Any, Callable, Awaitable
from pydantic import BaseModel

class Tool(BaseModel):
    name: str
    description: str
    parameters: dict
    handler: Callable[..., Awaitable[str]]

    def to_openai(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            }
        }

class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def all_openai(self) -> list[dict]:
        return [t.to_openai() for t in self._tools.values()]

    def call(self, name: str, args: dict) -> Awaitable[str]:
        tool = self.get(name)
        if not tool:
            return f"Error: tool '{name}' not found"
        return tool.handler(**args)
