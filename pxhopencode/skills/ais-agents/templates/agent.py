import asyncio

class Agent:
    def __init__(self, tools: ToolRegistry, system_prompt: str = ""):
        self.tools = tools
        self.messages = [{"role": "system", "content": system_prompt}] if system_prompt else []
        self.max_steps = 15
        self.timeout = 30.0

    async def run(self, task: str) -> str:
        self.messages.append({"role": "user", "content": task})

        for step in range(self.max_steps):
            try:
                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model="gpt-4o",
                        messages=self.messages,
                        tools=self.tools.all_openai(),
                        tool_choice="auto",
                    ),
                    timeout=self.timeout
                )
            except asyncio.TimeoutError:
                return "⏱ Agent timeout — vui lòng thử lại với câu hỏi đơn giản hơn."

            msg = response.choices[0].message

            if not msg.tool_calls:
                self.messages.append({"role": "assistant", "content": msg.content})
                return msg.content

            self.messages.append(msg)
            for tc in msg.tool_calls:
                result = await self.tools.call(tc.function.name, json.loads(tc.function.arguments))
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result[:2000],  # truncate để tránh token explosion
                })

        return "⚠️ Agent reached max steps — kết quả có thể chưa hoàn chỉnh."
