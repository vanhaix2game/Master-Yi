import { afterEach, describe, expect, it } from "vitest";
import { copyFileSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const fixtures: string[] = [];

function embeddedFixture(): { root: string; ocRoot: string } {
  const root = mkdtempSync(join(tmpdir(), "pxhopencode-e2e-"));
  fixtures.push(root);
  const ocRoot = join(root, ".opencode");
  cpSync(join(ROOT, "runtime", "bin"), join(ocRoot, "runtime", "bin"), { recursive: true });
  cpSync(join(ROOT, "runtime", "engine", "src"), join(ocRoot, "runtime", "engine", "src"), { recursive: true });
  cpSync(join(ROOT, "runtime", "contracts"), join(ocRoot, "runtime", "contracts"), { recursive: true });
  mkdirSync(join(ocRoot, "_shared"), { recursive: true });
  copyFileSync(join(ROOT, "_shared", "phases.json"), join(ocRoot, "_shared", "phases.json"));
  return { root, ocRoot };
}

afterEach(() => {
  while (fixtures.length) rmSync(fixtures.pop()!, { recursive: true, force: true });
});

describe("embedded CLI runtime", () => {
  it("validates an installation placed in .opencode", () => {
    const { root } = embeddedFixture();
    const output = execFileSync(process.execPath, [".opencode/runtime/bin/validate.mjs", "all"], {
      cwd: root,
      encoding: "utf-8",
    });
    expect(output).toContain("ALL");
    expect(output).toContain("PASSED");
  });

  it("writes typed memory collections and synchronized counters", () => {
    const { root, ocRoot } = embeddedFixture();
    const memory = join(ocRoot, ".memory");
    mkdirSync(memory, { recursive: true });
    for (const [name, value] of Object.entries({
      "index.json": { version: "1.0", memory_count: 0 },
      "stats.json": { version: "1.0" },
      "bugs.json": { version: "1.0", bugs: [] },
      "decisions.json": { version: "1.0", decisions: [] },
      "snapshots.json": { version: "1.0", snapshots: [] },
      "timeline.json": { version: "1.0", entries: [] },
      "feedback.json": { version: "1.0", entries: [] },
    })) writeFileSync(join(memory, name), JSON.stringify(value));

    execFileSync(process.execPath, [".opencode/runtime/bin/persist.mjs", "append", "decisions", '{"id":"adr-1"}'], {
      cwd: root,
      encoding: "utf-8",
    });
    const decisions = JSON.parse(readFileSync(join(memory, "decisions.json"), "utf-8"));
    const index = JSON.parse(readFileSync(join(memory, "index.json"), "utf-8"));
    const stats = JSON.parse(readFileSync(join(memory, "stats.json"), "utf-8"));
    expect(decisions.decisions).toHaveLength(1);
    expect(decisions.entries).toBeUndefined();
    expect(index.memory_count).toBe(1);
    expect(stats.total_decisions).toBe(1);
  });

  it("returns a failing exit code for invalid pipeline transitions", () => {
    const { root } = embeddedFixture();
    expect(() => execFileSync(process.execPath, [".opencode/runtime/bin/pipeline.mjs", "pass", "code"], {
      cwd: root,
      encoding: "utf-8",
      stdio: "pipe",
    })).toThrow();
    expect(existsSync(join(root, ".pipeline-state.json"))).toBe(false);
  });

  it("prepares an end-user prompt into log, context, and pipeline state", () => {
    const { root, ocRoot } = embeddedFixture();
    cpSync(join(ROOT, "prompt-compiler", "dist"), join(ocRoot, "prompt-compiler", "dist"), { recursive: true });
    const memory = join(ocRoot, ".memory");
    mkdirSync(memory, { recursive: true });
    writeFileSync(join(memory, "index.json"), JSON.stringify({ version: "1.0", memory_count: 0 }));

    const output = execFileSync(process.execPath, [
      ".opencode/runtime/bin/session.mjs", "prepare", "Fix the bug in the dashboard navigation with minimal changes",
    ], { cwd: root, encoding: "utf-8" });
    const prepared = JSON.parse(output);
    const promptLog = readFileSync(join(root, "promptLog.txt"), "utf-8");
    expect(prepared.route.intents).toContain("fix_bug");
    expect(prepared.route.constraints).toContain("minimal_changes");
    expect(new Set(prepared.route.stack.map((value: string) => value.toLowerCase())).size).toBe(prepared.route.stack.length);
    expect(prepared.ir).toBeUndefined();
    expect(prepared.metrics).toBeUndefined();
    expect(promptLog).toContain("RULE:");
    expect(promptLog).toContain("dashboard navigation");
    expect(promptLog.match(/Framework/g)).toBeNull();
    expect(existsSync(join(root, ".pipeline-state.json"))).toBe(true);
    expect(existsSync(join(ocRoot, ".context.json"))).toBe(true);
  });

  it("returns full compiler diagnostics only when requested", () => {
    const { root, ocRoot } = embeddedFixture();
    cpSync(join(ROOT, "prompt-compiler", "dist"), join(ocRoot, "prompt-compiler", "dist"), { recursive: true });
    mkdirSync(join(ocRoot, ".memory"), { recursive: true });
    writeFileSync(join(ocRoot, ".memory", "index.json"), JSON.stringify({ version: "1.0" }));

    const output = execFileSync(process.execPath, [
      ".opencode/runtime/bin/session.mjs", "prepare", "--full-ir", "Fix login bug with minimal changes",
    ], { cwd: root, encoding: "utf-8" });
    const prepared = JSON.parse(output);
    expect(prepared.ir.raw).toContain("login bug");
    expect(prepared.metrics.stages.length).toBeGreaterThan(0);
  });
});
