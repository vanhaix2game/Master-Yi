import { describe, it, expect } from "vitest";
import { validateContract } from "../src/validator.js";

describe("Contract Validation", () => {
  describe("Request", () => {
    it("passes valid request", () => {
      const r = validateContract("request", { version: "1.0", type: "web", target: "./src" });
      expect(r.valid).toBe(true);
      expect(r.errors).toHaveLength(0);
    });

    it("rejects missing target", () => {
      const r = validateContract("request", { version: "1.0", type: "web" });
      expect(r.valid).toBe(false);
      expect(r.errors.some(e => e.includes("target"))).toBe(true);
    });

    it("rejects bad version", () => {
      const r = validateContract("request", { version: "2.0", type: "web", target: "./src" });
      expect(r.valid).toBe(false);
    });

    it("rejects unknown type", () => {
      const r = validateContract("request", { version: "1.0", type: "nope", target: "./src" });
      expect(r.valid).toBe(false);
    });
  });

  describe("Task", () => {
    it("passes valid task", () => {
      const r = validateContract("task", {
        version: "1.0", phase: "code", target: "./src", workflow: "web.workflow.md",
      });
      expect(r.valid).toBe(true);
    });

    it("rejects missing workflow", () => {
      const r = validateContract("task", { version: "1.0", phase: "code", target: "./src" });
      expect(r.valid).toBe(false);
    });

    it("rejects invalid phase", () => {
      const r = validateContract("task", {
        version: "1.0", phase: "nope", target: "./src", workflow: "x",
      });
      expect(r.valid).toBe(false);
    });
  });

  describe("Result", () => {
    it("passes valid result", () => {
      const r = validateContract("result", { version: "1.0", status: "pass" });
      expect(r.valid).toBe(true);
    });

    it("passes with artifacts", () => {
      const r = validateContract("result", {
        version: "1.0", status: "pass",
        artifacts: [{ path: "src/index.ts", summary: "entry point" }],
      });
      expect(r.valid).toBe(true);
    });
  });

  describe("Response", () => {
    it("passes valid response", () => {
      const r = validateContract("response", { version: "1.0", status: "ok", summary: "done" });
      expect(r.valid).toBe(true);
    });
  });

  describe("Event", () => {
    it("passes valid event", () => {
      const r = validateContract("event", { version: "1.0", type: "phase_end", phase: "code" });
      expect(r.valid).toBe(true);
    });

    it("passes with reflection", () => {
      const r = validateContract("event", {
        version: "1.0", type: "reflection", phase: "code",
        reflection: { what_went_well: ["works"] },
      });
      expect(r.valid).toBe(true);
    });
  });

  describe("State", () => {
    it("passes valid state", () => {
      const r = validateContract("state", {
        version: "1.0", checkpoint: { phase: "code" }, session_id: "sess_1",
      });
      expect(r.valid).toBe(true);
    });
  });
});
