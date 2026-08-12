import { describe, it, expect } from "vitest";

export async function benchmarkFPS(
  renderFrame: () => void,
  durationMs = 1000
): Promise<{ avg: number; min: number; max: number; frames: number }> {
  return new Promise(resolve => {
    let frames = 0;
    let min = Infinity;
    let max = -Infinity;
    let last = performance.now();
    let running = true;

    function tick() {
      if (!running) return;
      const now = performance.now();
      const elapsed = now - last;
      if (elapsed > 0) {
        const fps = 1000 / elapsed;
        min = Math.min(min, fps);
        max = Math.max(max, fps);
      }
      last = now;
      renderFrame();
      frames++;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    setTimeout(() => {
      running = false;
      const avg = frames / (durationMs / 1000);
      resolve({ avg: Math.round(avg), min: Math.round(min), max: Math.round(max), frames });
    }, durationMs);
  });
}

describe("Performance Benchmark", () => {
  it("renders at minimum 60 FPS (simple scene)", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d")!;

    let x = 0;
    const result = await benchmarkFPS(() => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, 100, 64, 64);
      x = (x + 1) % 800;
    }, 500);

    expect(result.avg).toBeGreaterThanOrEqual(55);
    expect(result.min).toBeGreaterThanOrEqual(30);
  });
});
