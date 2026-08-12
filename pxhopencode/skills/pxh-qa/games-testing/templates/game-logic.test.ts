import { describe, it, expect } from "vitest";
import { createMockFSM, simulateKey, wait, createMockAudioContext } from "./game-test-utils";

describe("FSM", () => {
  it("starts at initial state", () => {
    const fsm = createMockFSM(["idle", "run", "jump", "attack", "hurt", "die"]);
    expect(fsm.state).toBe("idle");
  });

  it("tracks transitions", () => {
    const fsm = createMockFSM(["idle", "run", "jump"]);
    fsm.setState("run");
    fsm.setState("jump");
    expect(fsm.getTransitionHistory()).toHaveLength(2);
    expect(fsm.getTransitionHistory()[0]).toEqual({ from: "idle", to: "run" });
  });

  it("validates allowed states", () => {
    const fsm = createMockFSM(["idle", "run"]);
    expect(fsm.canTransition("idle", "run")).toBe(true);
    expect(fsm.canTransition("idle", "die")).toBe(false);
  });

  it("resets correctly", () => {
    const fsm = createMockFSM(["idle", "run"]);
    fsm.setState("run");
    fsm.reset();
    expect(fsm.state).toBe("idle");
    expect(fsm.getTransitionHistory()).toHaveLength(0);
  });
});

describe("Audio", () => {
  it("creates mock audio context", () => {
    const ctx = createMockAudioContext();
    expect(ctx.sampleRate).toBe(44100);
    expect(ctx.state).toBe("running");
  });

  it("creates buffer source", () => {
    const ctx = createMockAudioContext();
    const src = ctx.createBufferSource();
    expect(src.start).toBeDefined();
    expect(src.stop).toBeDefined();
  });
});

describe("Keyboard input", () => {
  it("dispatches keydown event", () => {
    let fired = false;
    document.addEventListener("keydown", () => { fired = true; });
    simulateKey("KeyW", "down");
    expect(fired).toBe(true);
  });
});
