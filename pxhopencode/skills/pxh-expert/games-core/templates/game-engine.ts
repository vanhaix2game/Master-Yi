class GameEngine {
  private lastTime = 0;
  private accumulator = 0;
  private readonly TICK_RATE = 1000 / 60;
  private running = false;
  private frameId = 0;

  start() {
    this.hideLoading();
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private hideLoading() {
    const el = document.getElementById("loading");
    if (el) el.classList.add("hide");
  }

  private loop(now: number) {
    if (!this.running) return;
    this.frameId = requestAnimationFrame(this.loop.bind(this));

    const dt = now - this.lastTime;
    this.lastTime = now;

    // Clamp dt để tránh spiral of death
    this.accumulator += Math.min(dt, 100);

    while (this.accumulator >= this.TICK_RATE) {
      this.fixedUpdate(this.TICK_RATE / 1000);
      this.accumulator -= this.TICK_RATE;
    }

    const alpha = this.accumulator / this.TICK_RATE;
    this.render(alpha);
  }

  protected fixedUpdate(dt: number) {
    // Physics, AI, movement — override
  }

  protected render(alpha: number) {
    // Interpolate + draw — override
  }
}
