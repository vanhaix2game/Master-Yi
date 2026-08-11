#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function resolveOpenCodeRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return join(cwd, ".opencode");
}

const OC_ROOT = resolveOpenCodeRoot();
const PREFIX = OC_ROOT === process.cwd() ? "" : ".opencode";
const phasesConfig = JSON.parse(readFileSync(join(OC_ROOT, "_shared", "phases.json"), "utf-8"));
const VALID_PHASES = phasesConfig.phases;
function bin(name) { return join(PREFIX, "runtime", "bin", name + ".mjs"); }

function run(script, args) {
  const cmd = `node ${script} ${args || ""}`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", cwd: process.cwd() });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.stdout || "", err: e.stderr || e.message };
  }
}

function err(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function ok(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function yell(s) { return "\x1b[33m" + s + "\x1b[0m"; }
function dim(s) { return "\x1b[2m" + s + "\x1b[0m"; }
function cyan(s) { return "\x1b[36m" + s + "\x1b[0m"; }

function preHook(phase) {
  console.log(dim("\n  == PRE-HOOK: ") + cyan(phase) + dim(" =="));
  let passed = 0, failed = 0;

  // Step 1: Validate contracts
  console.log(dim("  [1/4] Validate engine..."));
  const v = run(bin("validate"), "all");
  if (v.ok) { console.log(ok("  [OK] Engine valid")); passed++; }
  else { console.log(err("  [FAIL] " + (v.err || v.out).slice(0, 100))); failed++; }

  // Step 2: Inject context
  console.log(dim("  [2/4] Inject context..."));
  const ctx = run(bin("context"), "export");
  if (ctx.ok) {
    const lines = ctx.out.trim().split("\n").filter(l => l).length;
    console.log(ok("  [OK] " + lines + " context entries"));
    passed++;
  } else { console.log(yell("  [-] No context")); passed++; }

  // Step 3: Start pipeline phase
  console.log(dim("  [3/4] Pipeline start..."));
  const p = run(bin("pipeline"), "start " + phase);
  if (p.ok) { console.log(ok("  [OK] Phase started: " + phase)); passed++; }
  else { console.log(err("  [FAIL] " + (p.err || p.out).slice(0, 100))); failed++; }

  // Step 4: Detect project (first time)
  console.log(dim("  [4/4] Project detect..."));
  const d = run(bin("detect"), "");
  if (d.ok) {
    const lines = d.out.split("\n");
    const typeLine = lines.find(l => l.includes("Type:"));
    const langLine = lines.find(l => l.includes("Language:"));
    const fwLine = lines.find(l => l.includes("Framework:"));
    const parts = [typeLine ? typeLine.split(/\x1b\[\d+m/).pop() : "", langLine ? langLine.split(/\x1b\[\d+m/).pop() : ""].filter(Boolean);
    console.log(ok("  [OK] " + parts.join(" / ")));
    passed++;
  } else { console.log(yell("  [-] Detect unavailable")); passed++; }

  return { passed, failed };
}

function postHook(phase, status) {
  console.log(dim("\n  == POST-HOOK: ") + cyan(phase) + dim(" =="));
  let passed = 0, failed = 0;

  // Step 1: Complete pipeline phase
  console.log(dim("  [1/2] Pipeline " + status + "..."));
  const p = run(bin("pipeline"), status + " " + phase);
  if (p.ok) { console.log(ok("  [OK] Phase " + status + ": " + phase)); passed++; }
  else { console.log(err("  [FAIL] " + (p.err || p.out).slice(0, 100))); failed++; }

  // Step 2: Add to context
  console.log(dim("  [2/2] Context update..."));
  const summary = phase + " " + status;
  const c = run(bin("context"), "add \"" + summary + "\"");
  if (c.ok) { console.log(ok("  [OK] Context updated")); passed++; }
  else { console.log(yell("  [-] Context skip")); passed++; }

  return { passed, failed };
}

function cmdRun(phase) {
  if (!VALID_PHASES.includes(phase)) { console.log(err("Invalid phase: " + phase + " (use: " + VALID_PHASES.join("|") + ")")); process.exit(1); }
  console.log(cyan("\n  === ENFORCE: " + phase + " ==="));
  const pre = preHook(phase);
  if (pre.failed > 0) {
    console.log(err("\n  [ENFORCE BLOCKED] " + pre.failed + " pre-hook(s) failed. Fix before proceeding.\n"));
    process.exit(1);
  }
  console.log(ok("\n  [ENFORCE OK] All pre-hooks passed. Agent may proceed.\n"));
}

function cmdPass(phase) {
  const r = postHook(phase, "pass");
  console.log(r.failed === 0 ? ok("\n  [ENFORCE OK]\n") : yell("\n  [ENFORCE WARN] " + r.failed + " post-hook(s) failed\n"));
}

function cmdFail(phase) {
  const r = postHook(phase, "fail");
  console.log(yell("\n  [ENFORCE] Phase failed. Pipeline updated.\n"));
}

function cmdPhase() {
  console.log(dim("Available phases: ") + VALID_PHASES.map(p => cyan(p)).join(", ") + "\n");
  const file = join(process.cwd(), ".pipeline-state.json");
  if (existsSync(file)) {
    try {
      const pipe = JSON.parse(readFileSync(file, "utf-8"));
      console.log(dim("Current state:"));
      for (const s of pipe) {
        const icon = s.status === "pass" ? ok("OK") : s.status === "fail" ? err("XX") : dim("--");
        console.log("  " + icon + " " + cyan(s.phase.padEnd(12)) + dim(" -> " + (s.agent || "?")));
      }
    } catch { /* ignore */ }
  }
}

const args = process.argv.slice(2);
const cmd = args[0] || "phase";

if (cmd === "run") cmdRun(args[1]);
else if (cmd === "pass") cmdPass(args[1]);
else if (cmd === "fail") cmdFail(args[1]);
else if (cmd === "phase") cmdPhase();
else {
  console.log(dim("Usage:"));
  console.log("  enforce run <phase>     " + dim("PRE-hooks: validate + context + pipeline start + detect"));
  console.log("  enforce pass <phase>    " + dim("POST-hooks: pipeline pass + context update"));
  console.log("  enforce fail <phase>    " + dim("POST-hooks: pipeline fail + context update"));
  console.log("  enforce phase           " + dim("Show phases + current state"));
}
