#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function resolveOpenCodeRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return join(cwd, ".opencode");
}

const OC_ROOT = resolveOpenCodeRoot();
const MEMORY_ROOT = (() => {
  if (process.cwd().includes(".opencode")) return join(process.cwd(), ".memory");
  if (existsSync(join(process.cwd(), ".opencode", ".memory"))) return join(process.cwd(), ".opencode", ".memory");
  return join(process.cwd(), ".memory");
})();

function c(s, code) { return "\x1b[" + code + "m" + s + "\x1b[0m"; }

function readJSON(p) {
  try {
    var raw = readFileSync(p, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch { return null; }
}

function memoryStatus() {
  if (!existsSync(MEMORY_ROOT)) return { files: 0, categories: [] };
  var files = readdirSync(MEMORY_ROOT).filter(function(f) { return f.endsWith(".json") && f !== "feedback.json"; });
  var cats = [];
  for (var i = 0; i < files.sort().length; i++) {
    var data = readJSON(join(MEMORY_ROOT, files[i]));
    var count = data ? (data.memory_count || (data.entries ? data.entries.length : 0)) : 0;
    var conf = data && data.confidence != null ? data.confidence : 0;
    var updated = data && data.updated ? data.updated.slice(0, 10) : "-";
    cats.push({ name: files[i].replace(".json", ""), count: count, conf: conf, updated: updated });
  }
  return { files: files.length, categories: cats };
}

function pipelineStatus() {
  var fp = join(process.cwd(), ".pipeline-state.json");
  if (!existsSync(fp)) return null;
  return readJSON(fp);
}

console.log("\n  " + c("=== pxhopencode status ===", "36") + "  v" + (function() {
  var p = readJSON(join(process.cwd(), "package.json"));
  return p ? p.version || "?" : "?";
})() + "\n");

var mem = memoryStatus();
console.log("  " + c("Memory", "33"));
if (mem.files > 0) {
  for (var i = 0; i < mem.categories.length; i++) {
    var cat = mem.categories[i];
    var countStr = typeof cat.count === "number" ? String(cat.count) : "?";
    var confStr = typeof cat.conf === "number" ? String(cat.conf) + "%" : "?";
    console.log("  " + c(cat.name.padEnd(14), "36") + " " + countStr.padStart(4) + " entries  conf:" + confStr.padStart(4) + "  " + c(cat.updated, "2"));
  }
} else {
  console.log("  " + c("No memory files found. Run start.bat to init.", "33"));
}
console.log();

var pipe = pipelineStatus();
if (pipe) {
  console.log("  " + c("Pipeline", "33"));
  for (var j = 0; j < pipe.length; j++) {
    var step = pipe[j];
    var icon = step.status === "pass" ? c("OK", "32") : step.status === "fail" ? c("XX", "31") : c("--", "2");
    console.log("  " + icon + " " + c(step.phase.padEnd(12), "37") + " " + (step.agent ? c("-> " + step.agent, "2") : ""));
  }
} else {
  console.log("  " + c("No active pipeline.", "2"));
}
console.log();

var pkg = readJSON(join(process.cwd(), "package.json"));
if (pkg) {
  console.log("  " + c("System", "33"));
  console.log("  " + c("version".padEnd(14), "2") + " " + pkg.version);
  console.log("  " + c("agents".padEnd(14), "2") + " 10");
  console.log("  " + c("workflows".padEnd(14), "2") + " 8");
  console.log("  " + c("commands".padEnd(14), "2") + " 12+");
  console.log();
}
