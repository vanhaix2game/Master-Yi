class Profiler {
  private frames = 0;
  private lastTime = performance.now();
  fps = 0;
  private memory: number[] = [];

  update() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastTime = now;
    }

    // Memory tracking (Chrome only)
    const mem = (performance as any).memory;
    if (mem) {
      this.memory.push(mem.usedJSHeapSize);
      if (this.memory.length > 100) this.memory.shift();
    }
  }

  get avgMemory(): number {
    return this.memory.reduce((a, b) => a + b, 0) / this.memory.length;
  }

  getMemoryTrend(): "stable" | "leak" | "dropping" {
    if (this.memory.length < 10) return "stable";
    const first = this.memory[0];
    const last = this.memory[this.memory.length - 1];
    if (last > first * 1.5) return "leak";
    if (last < first * 0.8) return "dropping";
    return "stable";
  }
}
