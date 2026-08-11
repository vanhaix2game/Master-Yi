import { describe, it, expect } from "vitest";
import { Pipeline, PIPELINE_ORDER, AGENT_MAP } from "../src/pipeline.js";

describe("Pipeline", () => {
  it("has correct phase order", () => {
    expect(PIPELINE_ORDER).toContain("architect");
    expect(PIPELINE_ORDER).toContain("code");
    expect(PIPELINE_ORDER).toContain("test");
    expect(PIPELINE_ORDER).toContain("build");
    expect(PIPELINE_ORDER).toContain("persist");
  });

  it("maps every phase to an agent", () => {
    for (const phase of PIPELINE_ORDER) {
      expect(AGENT_MAP[phase]).toBeDefined();
      expect(AGENT_MAP[phase]).toMatch(/^pxh-/);
    }
  });

  it("starts with analyze phase", () => {
    expect(PIPELINE_ORDER[0]).toBe("analyze");
  });

  it("ends with persist phase", () => {
    expect(PIPELINE_ORDER[PIPELINE_ORDER.length - 1]).toBe("persist");
  });

  it("has exactly 10 phases", () => {
    expect(PIPELINE_ORDER).toHaveLength(10);
  });

  it("has no duplicate phases", () => {
    expect(new Set(PIPELINE_ORDER).size).toBe(PIPELINE_ORDER.length);
  });
});
