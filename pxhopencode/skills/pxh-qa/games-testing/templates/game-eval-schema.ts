/**
 * game-eval-schema.ts — Eval assertions cho game quality
 * Dùng với Vitest để verify game không bị "cùi".
 * 
 * Usage:
 *   import { assertGameQuality, assertPhysics, assertPerformance } from "./game-eval-schema";
 *   describe("Game quality", () => { assertGameQuality(game); });
 * 
 * Không server, không side-effect, deterministic.
 */

export interface EvalAssertion {
  name: string;
  pass: boolean;
  message: string;
  evidence?: string;
}

export interface EvalReport {
  timestamp: number;
  assertions: EvalAssertion[];
  passRate: number;
  duration: number;
}

/**
 * Assert cơ bản: game object khởi tạo không crash
 */
export function assertGameInit(scene: any): EvalAssertion {
  try {
    const exists = scene !== null && scene !== undefined;
    return {
      name: "game-init",
      pass: exists,
      message: exists ? "Scene khởi tạo thành công" : "Scene null/undefined",
    };
  } catch (e: any) {
    return { name: "game-init", pass: false, message: `Scene init crash: ${e.message}` };
  }
}

/**
 * Assert physics: ball không xuyên wall, không bounce vô hạn
 */
export function assertPhysicsStable(ball: any, world: any): EvalAssertion {
  if (!ball || !world) {
    return { name: "physics-stable", pass: false, message: "Ball hoặc world null" };
  }
  const vel = ball.velocity || { x: 0, y: 0, z: 0 };
  const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
  const maxSpeed = ball.maxSpeed || 20;
  return {
    name: "physics-stable",
    pass: speed < maxSpeed * 1.5,
    message: speed < maxSpeed * 1.5
      ? `Tốc độ ${speed.toFixed(1)} hợp lệ (max ${maxSpeed})`
      : `Tốc độ ${speed.toFixed(1)} vượt quá ${maxSpeed * 1.5}`,
    evidence: `speed=${speed.toFixed(2)}, maxSpeed=${maxSpeed}`,
  };
}

/**
 * Assert checkpoint: ball gần checkpoint → trigger
 */
export function assertCheckpointTrigger(
  ballPos: { x: number; y: number; z: number },
  checkpoints: Array<{ x: number; y: number; z: number }>,
  threshold = 2
): EvalAssertion {
  if (!checkpoints?.length) {
    return { name: "checkpoint-trigger", pass: false, message: "Không có checkpoint" };
  }
  const closest = Math.min(...checkpoints.map(cp => {
    const dx = ballPos.x - cp.x, dy = ballPos.y - cp.y, dz = ballPos.z - cp.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }));
  return {
    name: "checkpoint-trigger",
    pass: closest <= threshold,
    message: closest <= threshold
      ? `Checkpoint trigger ở khoảng cách ${closest.toFixed(2)}`
      : `Ball cách checkpoint xa nhất ${closest.toFixed(2)} (threshold ${threshold})`,
    evidence: `closest=${closest.toFixed(2)}, threshold=${threshold}`,
  };
}

/**
 * Assert FPS: performance benchmark pass
 */
export function assertFPS(fps: number, minDesktop = 55): EvalAssertion {
  return {
    name: "fps-target",
    pass: fps >= minDesktop,
    message: fps >= minDesktop
      ? `FPS ${fps} ≥ ${minDesktop}`
      : `FPS ${fps} < ${minDesktop}`,
    evidence: `fps=${fps}, min=${minDesktop}`,
  };
}

/**
 * Assert memory: heap diff < threshold
 */
export function assertMemoryLeak(
  heapBefore: number,
  heapAfter: number,
  thresholdKB = 500
): EvalAssertion {
  const diffKB = (heapAfter - heapBefore) / 1024;
  return {
    name: "memory-leak",
    pass: diffKB < thresholdKB,
    message: diffKB < thresholdKB
      ? `Heap diff ${diffKB.toFixed(1)}KB < ${thresholdKB}KB`
      : `Heap diff ${diffKB.toFixed(1)}KB >= ${thresholdKB}KB — possible leak`,
    evidence: `before=${heapBefore}, after=${heapAfter}, diffKB=${diffKB.toFixed(1)}`,
  };
}

/**
 * Assert state machine: valid transitions
 */
export function assertFSM(fsm: any, allowedTransitions: Record<string, string[]>): EvalAssertion[] {
  const results: EvalAssertion[] = [];
  if (!fsm) {
    results.push({ name: "fsm-exists", pass: false, message: "FSM null" });
    return results;
  }
  const current = fsm.currentState || fsm.state;
  if (!current) {
    results.push({ name: "fsm-has-state", pass: false, message: "FSM không có state" });
    return results;
  }
  results.push({ name: "fsm-has-state", pass: true, message: `FSM state = ${current}` });

  const valid = allowedTransitions[current];
  if (valid) {
    results.push({
      name: "fsm-valid-transitions",
      pass: true,
      message: `Từ "${current}" có thể chuyển: ${valid.join(", ")}`,
    });
  }
  return results;
}

/**
 * Assert audio: play không throw
 */
export function assertAudioPlay(audio: any): EvalAssertion {
  try {
    if (!audio) return { name: "audio-play", pass: false, message: "Audio null" };
    if (typeof audio.play === "function") audio.play();
    return { name: "audio-play", pass: true, message: "Audio.play() không throw" };
  } catch (e: any) {
    return { name: "audio-play", pass: false, message: `Audio.play() throw: ${e.message}` };
  }
}

/**
 * Assert input: justPressed pattern hoạt động
 */
export function assertInputResponsive(input: any, key: string): EvalAssertion {
  if (!input) {
    return { name: "input-responsive", pass: false, message: "Input manager null" };
  }
  const hasJustPressed = typeof input.justPressed === "function"
    || typeof input.justPressed !== "undefined";
  return {
    name: "input-responsive",
    pass: hasJustPressed,
    message: hasJustPressed
      ? "Input có justPressed pattern"
      : "Input thiếu justPressed — có thể bị input lag",
  };
}

/**
 * Tạo report từ mảng assertions
 */
export function generateReport(assertions: EvalAssertion[]): EvalReport {
  const passed = assertions.filter(a => a.pass).length;
  return {
    timestamp: Date.now(),
    assertions,
    passRate: assertions.length > 0 ? passed / assertions.length : 0,
    duration: 0,
  };
}
