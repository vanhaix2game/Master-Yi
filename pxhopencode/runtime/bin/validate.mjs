#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function err(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function ok(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function dim(s) { return "\x1b[2m" + s + "\x1b[0m"; }

async function main() {
  const type = process.argv[2] || "all";
  const workspaceRoot = process.cwd();
  const ocRoot = existsSync(join(workspaceRoot, "runtime", "engine"))
    ? workspaceRoot
    : join(workspaceRoot, ".opencode");
  const target = join(ocRoot, "runtime", "engine");
  if (!target) { console.log(err("Engine not found")); process.exit(1); }
  if (!existsSync(target)) { console.log(err("Engine not found: " + target)); process.exit(1); }

  const engine = join(target, "src");
  let passed = 0, failed = 0;

  function check(label, condition) {
    console.log("  " + (condition ? ok("OK") : err("FAIL")) + " " + label);
    if (condition) passed++; else failed++;
  }

  if (type === "all" || type === "contracts") {
    console.log(dim("\n  -- Contracts --"));
    const contracts = ["request", "task", "result", "response", "event", "state"];
    for (const c of contracts) {
      const cp = join(engine, "contracts", c + ".ts");
      const raw = existsSync(cp) ? readFileSync(cp, "utf-8") : "";
      const hasSchema = raw.includes("export const") && raw.includes("Schema");
      const hasZod = raw.includes("z.object(");
      check("contract/" + c, hasSchema && hasZod);
    }
    const idx = join(engine, "contracts", "index.ts");
    const idxRaw = existsSync(idx) ? readFileSync(idx, "utf-8") : "";
    check("contracts/index re-exports all 6", ["RequestSchema", "TaskSchema", "ResultSchema", "ResponseSchema", "EventSchema", "StateSchema"].every(s => idxRaw.includes(s)));
  }

  if (type === "all" || type === "pipeline") {
    console.log(dim("\n  -- Pipeline --"));
    const pp = join(engine, "pipeline.ts");
    if (existsSync(pp)) {
      const raw = readFileSync(pp, "utf-8");
      const phasesConfig = JSON.parse(readFileSync(join(ocRoot, "_shared", "phases.json"), "utf-8"));
      const hasAllPhases = phasesConfig.phases.every(p => raw.includes(`"${p}"`));
      check("pipeline.ts all phases present", hasAllPhases);
      check("pipeline.ts class Pipeline", raw.includes("class Pipeline"));
    } else { check("pipeline.ts exists", false); }
  }

  if (type === "all" || type === "router") {
    console.log(dim("\n  -- Router --"));
    const rp = join(engine, "router.ts");
    if (existsSync(rp)) {
      const raw = readFileSync(rp, "utf-8");
      check("router.ts has route function", raw.includes("function route"));
      check("router.ts phase routing", raw.includes("switch") || raw.includes("if") || raw.includes("case"));
    } else { check("router.ts exists", false); }
  }

  if (type === "all" || type === "memory") {
    console.log(dim("\n  -- Memory --"));
    const mp = join(engine, "memory.ts");
    if (existsSync(mp)) {
      const raw = readFileSync(mp, "utf-8");
      check("memory.ts has readMemory", raw.includes("readMemory"));
      check("memory.ts has writeMemory", raw.includes("writeMemory"));
    } else { check("memory.ts exists", false); }
  }

  if (type === "all" || type === "phases") {
    console.log(dim("\n  -- Phases Config --"));
    const pf = join(ocRoot, "_shared", "phases.json");
    if (existsSync(pf)) {
      const cfg = JSON.parse(readFileSync(pf, "utf-8"));
      check("phases.json has 10 phases", cfg.phases && cfg.phases.length === 10);
      check("phases.json agents map", cfg.agents && Object.keys(cfg.agents).length === 10);
    } else { check("phases.json exists", false); }
  }

  if (type === "all" || type === "contracts-readme") {
    console.log(dim("\n  -- Contracts Docs --"));
    check("runtime/contracts/README.md exists", existsSync(join(ocRoot, "runtime", "contracts", "README.md")));
  }

  console.log(dim("\n  -- Summary --"));
  const total = passed + failed;
  if (failed === 0) console.log("  " + ok("ALL " + passed + "/" + total + " PASSED"));
  else console.log("  " + err(passed + "/" + total + " PASSED, " + failed + " FAILED"));
  process.exit(failed > 0 ? 1 : 0);
}

main();
