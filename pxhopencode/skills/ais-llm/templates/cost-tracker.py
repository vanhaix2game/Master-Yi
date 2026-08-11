@dataclass
class CostEntry:
    model: str
    input_tokens: int
    output_tokens: int
    cost: float
    timestamp: float

RATES = {
    "gpt-4o":        {"input": 2.50/1e6, "output": 10.00/1e6},
    "gpt-4o-mini":   {"input": 0.15/1e6, "output": 0.60/1e6},
    "claude-3-5-sonnet": {"input": 3.00/1e6, "output": 15.00/1e6},
}

class CostTracker:
    def __init__(self, daily_budget: float = 5.0):
        self.entries: list[CostEntry] = []
        self.daily_budget = daily_budget

    def track(self, model: str, input_t: int, output_t: int):
        rate = RATES.get(model, RATES["gpt-4o-mini"])
        cost = input_t * rate["input"] + output_t * rate["output"]
        self.entries.append(CostEntry(model, input_t, output_t, cost, time.time()))

    def today_cost(self) -> float:
        today = time.time() - 86400
        return sum(e.cost for e in self.entries if e.timestamp > today)

    def can_call(self) -> bool:
        return self.today_cost() < self.daily_budget
