import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..");

function readFileSafe(p: string): string | null {
  try { return readFileSync(p, "utf-8"); } catch { return null; }
}

describe("Architecture Integrity", () => {
  describe("agents/", () => {
    const agentDir = join(ROOT, "agents");
    const files = readdirSync(agentDir).filter(f => f.endsWith(".md"));
    const agentNames = files.map(f => f.replace(/\.md$/, ""));

    it("has 10 agents", () => {
      expect(agentNames).toHaveLength(10);
    });

    it("includes all required agents", () => {
      const required = ["pxh-pm", "pxh-help", "pxh-architect", "pxh-expert", "pxh-fix-bugs", "pxh-qa", "pxh-review-code", "pxh-devops", "pxh-save-history", "pxh-ui-ux"];
      for (const name of required) {
        expect(agentNames).toContain(name);
      }
    });

    it("every agent has MEMORY REFLECTION section", () => {
      for (const file of files) {
        const content = readFileSafe(join(agentDir, file));
        expect(content).not.toBeNull();
        expect(content).toContain("MEMORY REFLECTION");
      }
    });

    it("every agent has Anti-Rationalization section", () => {
      for (const file of files) {
        const content = readFileSafe(join(agentDir, file));
        expect(content).not.toBeNull();
        expect(content).toContain("Anti-Rationalization");
      }
    });

    it("every agent has Red Flags section", () => {
      for (const file of files) {
        const content = readFileSafe(join(agentDir, file));
        expect(content).not.toBeNull();
        expect(content).toContain("Red Flags");
      }
    });
  });

  describe("workflows/", () => {
    const wfDir = join(ROOT, "workflows");
    const files = readdirSync(wfDir).filter(f => f.endsWith(".md"));

    it("has 8 workflows", () => {
      expect(files).toHaveLength(8);
    });

    it("every workflow has Anti-Rationalization", () => {
      for (const file of files) {
        const content = readFileSafe(join(wfDir, file));
        expect(content).not.toBeNull();
        expect(content).toContain("Anti-Rationalization");
      }
    });

    it("every workflow has Loop/Failover section", () => {
      for (const file of files) {
        const content = readFileSafe(join(wfDir, file));
        expect(content).not.toBeNull();
        expect(content?.includes("Loop") || content?.includes("Loop/Failover")).toBe(true);
      }
    });
  });

  describe("runtime/", () => {
    it("has 4 layer files", () => {
      const layers = readdirSync(join(ROOT, "runtime", "layers")).filter(f => f.endsWith(".md"));
      expect(layers).toHaveLength(4);
    });

    it("has 3 policy files", () => {
      const policies = readdirSync(join(ROOT, "runtime", "policies")).filter(f => f.endsWith(".md"));
      expect(policies).toHaveLength(3);
    });

    it("has contracts README", () => {
      expect(existsSync(join(ROOT, "runtime", "contracts", "README.md"))).toBe(true);
    });
  });

  describe("skills/", () => {
    const skillDir = join(ROOT, "skills");
    const dirs = readdirSync(skillDir).filter(d => {
      try { return readdirSync(join(skillDir, d)).includes("SKILL.md"); } catch { return false; }
    });

    it("has at least 40 skill directories with SKILL.md", () => {
      expect(dirs.length).toBeGreaterThanOrEqual(40);
    });
  });

  describe("open code.json", () => {
    it("exists and is valid JSON", () => {
      const raw = readFileSafe(join(ROOT, "opencode.json"));
      expect(raw).not.toBeNull();
      const cfg = JSON.parse(raw!);
      expect(cfg.default_agent).toBe("pxh-pm");
      expect(cfg.agent).toBeDefined();
      expect(cfg.command).toBeDefined();
    });

    it("references all 10 agents in config", () => {
      const raw = readFileSafe(join(ROOT, "opencode.json"))!;
      const cfg = JSON.parse(raw);
      const configured = Object.keys(cfg.agent);
      expect(configured).toHaveLength(10);
    });

    it("has at least 10 commands defined", () => {
      const raw = readFileSafe(join(ROOT, "opencode.json"))!;
      const cfg = JSON.parse(raw);
      const cmds = Object.keys(cfg.command);
      expect(cmds.length).toBeGreaterThanOrEqual(10);
    });

    it("uses only supported skill and compaction options", () => {
      const cfg = JSON.parse(readFileSafe(join(ROOT, "opencode.json"))!);
      expect(Object.keys(cfg.skills)).toEqual(["paths"]);
      expect(cfg.compaction).toMatchObject({ auto: true, prune: true, tail_turns: 3 });
      expect(cfg.compaction.strategy).toBeUndefined();
      expect(cfg.compaction.min_turns).toBeUndefined();
    });

    it("loads only compact global instructions and caps agent steps", () => {
      const cfg = JSON.parse(readFileSafe(join(ROOT, "opencode.json"))!);
      expect(cfg.instructions).toEqual(["_shared/core-rules.md"]);
      for (const agent of Object.values(cfg.agent) as Array<{ steps?: number }>) {
        expect(agent.steps).toBeGreaterThan(0);
        expect(agent.steps).toBeLessThanOrEqual(20);
      }
    });

    it("limits edit access for orchestration and review agents", () => {
      const cfg = JSON.parse(readFileSafe(join(ROOT, "opencode.json"))!);
      for (const agent of ["pxh-pm", "pxh-help", "pxh-architect", "pxh-devops", "pxh-review-code"]) {
        expect(cfg.agent[agent].permission.edit).toBe("deny");
      }
    });
  });

  describe("STATUS.md integrity", () => {
    it("exists and has version info", () => {
      const raw = readFileSafe(join(ROOT, "STATUS.md"));
      expect(raw).not.toBeNull();
      expect(raw).toContain("TOÀN DIỆN");
      expect(raw).toContain("Agents");
      expect(raw).toContain("Workflows");
      expect(raw).toContain("Skills");
    });

    it("keeps release metadata synchronized", () => {
      const pkg = JSON.parse(readFileSafe(join(ROOT, "package.json"))!);
      expect(readFileSafe(join(ROOT, "README.md"))).toContain(`v${pkg.version}`);
      expect(readFileSafe(join(ROOT, "docs-vibe", "index.html"))).toContain(`v${pkg.version}`);
      expect(readFileSafe(join(ROOT, "LICENSE"))).toMatch(/^MIT License/);
      expect(existsSync(join(ROOT, ".pipeline-state.json"))).toBe(false);
    });
  });
});
