import { describe, it, expect } from "vitest";
import { route, classifyPrompt, workflowToPhases } from "../src/router.js";

describe("Router", () => {
  describe("route", () => {
    it("routes web type", () => {
      const r = route("web");
      expect(r.workflow).toContain("web.workflow");
      expect(r.initialPhase).toBe("architect");
    });

    it("routes debug type", () => {
      const r = route("debug");
      expect(r.workflow).toContain("debug");
      expect(r.initialPhase).toBe("fix");
    });

    it("routes unknown type to company workflow", () => {
      const r = route("unknown");
      expect(r.workflow).toContain("company.workflow");
    });
  });

  describe("classifyPrompt", () => {
    it("detects web intent", () => {
      expect(classifyPrompt("Build a React website")).toMatchObject({ type: "web" });
    });

    it("detects game intent", () => {
      expect(classifyPrompt("Create a Phaser game")).toMatchObject({ type: "game" });
    });

    it("detects bug intent", () => {
      expect(classifyPrompt("Fix this crash error")).toMatchObject({ type: "debug" });
    });

    it("detects AI intent", () => {
      expect(classifyPrompt("Build an LLM chatbot")).toMatchObject({ type: "ai" });
    });

    it("detects ui-ux intent", () => {
      expect(classifyPrompt("Redesign the dark mode UI")).toMatchObject({ type: "ui-ux" });
    });

    it("returns unknown for gibberish", () => {
      expect(classifyPrompt("asdfghjkl")).toMatchObject({ type: "unknown", confidence: 0 });
    });

    it("catches game before vibe when keyword matches", () => {
      expect(classifyPrompt("Làm một cái game")).toMatchObject({ type: "game" });
    });

    it("catches vibe intent for generic build", () => {
      expect(classifyPrompt("Làm một cái app mới")).toMatchObject({ type: "vibe" });
    });
  });

  describe("workflowToPhases", () => {
    it("debug workflow returns fix→test→build→persist", () => {
      expect(workflowToPhases("debug.workflow.md")).toEqual(["fix", "test", "build", "persist"]);
    });

    it("web workflow returns architect→code→test→review→build→persist", () => {
      const phases = workflowToPhases("web.workflow.md");
      expect(phases).toContain("architect");
      expect(phases).toContain("code");
      expect(phases).toContain("persist");
    });

    it("always ends with persist", () => {
      for (const wf of ["web", "game", "debug", "release", "company"]) {
        const phases = workflowToPhases(`${wf}.workflow.md`);
        expect(phases[phases.length - 1]).toBe("persist");
      }
    });
  });
});
