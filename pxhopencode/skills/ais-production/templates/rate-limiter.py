import asyncio, time
from collections import deque

class RateLimiter:
    def __init__(self, rpm: int = 60, rpd: int = 10000):
        self.rpm = rpm
        self.rpd = rpd
        self.minute_window: deque[float] = deque()
        self.day_count = 0
        self.day_reset = time.time() + 86400

    async def acquire(self):
        now = time.time()
        # Reset daily
        if now > self.day_reset:
            self.day_count = 0
            self.day_reset = now + 86400

        # Clean minute window
        while self.minute_window and now - self.minute_window[0] > 60:
            self.minute_window.popleft()

        if len(self.minute_window) >= self.rpm:
            wait = 60 - (now - self.minute_window[0])
            await asyncio.sleep(wait)

        if self.day_count >= self.rpd:
            raise Exception("Daily rate limit exceeded")

        self.minute_window.append(time.time())
        self.day_count += 1

rate_limiter = RateLimiter(rpm=30, rpd=5000)
