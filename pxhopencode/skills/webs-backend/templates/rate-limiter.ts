class SlidingWindowRateLimit {
  private windows = new Map<string, number[]>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    let timestamps = this.windows.get(key) || [];
    timestamps = timestamps.filter(t => now - t < this.windowMs);

    const resetIn = timestamps.length > 0 ? this.windowMs - (now - timestamps[0]) : 0;
    const allowed = timestamps.length < this.maxRequests;

    if (allowed) {
      timestamps.push(now);
      this.windows.set(key, timestamps);
    }

    this.cleanup();
    return { allowed, remaining: Math.max(0, this.maxRequests - timestamps.length - 1), resetIn };
  }

  private cleanup() {
    if (this.windows.size > 10000) {
      const now = Date.now();
      for (const [key, timestamps] of this.windows) {
        const valid = timestamps.filter(t => now - t < this.windowMs);
        if (valid.length === 0) this.windows.delete(key);
        else this.windows.set(key, valid);
      }
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimit();
