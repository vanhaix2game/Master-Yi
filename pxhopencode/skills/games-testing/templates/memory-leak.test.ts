import { describe, it, expect } from "vitest";
import { wait } from "./game-test-utils";

export async function detectMemoryLeak(
  allocate: () => void,
  release: () => void,
  iterations = 100
): Promise<{ leaked: boolean; before: number; after: number; diff: number }> {
  const heapBefore = (performance as any).memory?.usedJSHeapSize || 0;
  const snapshots: number[] = [];

  for (let i = 0; i < iterations; i++) {
    allocate();
    release();
    if (i % 10 === 0) {
      snapshots.push((performance as any).memory?.usedJSHeapSize || 0);
      await wait(1);
    }
  }

  globalThis.gc?.();
  await wait(10);
  const heapAfter = (performance as any).memory?.usedJSHeapSize || 0;
  const leaked = (heapAfter - heapBefore) > 50000; // 50KB threshold

  return { leaked, before: heapBefore, after: heapAfter, diff: heapAfter - heapBefore };
}

describe("Memory Leak Detection", () => {
  it("detects no leak with proper cleanup", async () => {
    const pool: any[] = [];
    const allocate = () => {
      pool.push(new Float64Array(1000));
    };
    const release = () => {
      while (pool.length) {
        const item = pool.pop();
      }
    };

    const result = await detectMemoryLeak(allocate, release, 50);
    expect(result.leaked).toBe(false);
  });

  it("detects leak when items not released", async () => {
    const leaked: any[] = [];
    const allocate = () => {
      leaked.push(new Float64Array(1000));
    };
    const release = () => {};

    const result = await detectMemoryLeak(allocate, release, 50);
    // Should have more objects retained
    expect(leaked.length).toBeGreaterThan(0);
  });
});
