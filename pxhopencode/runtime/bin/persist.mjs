#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const CMD = process.argv[2];
const ARG = process.argv[3];

function resolveOpenCodeRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return join(cwd, ".opencode");
}

const OC_ROOT = resolveOpenCodeRoot();
const WS_ROOT = process.cwd();

function readJSON(p) {
  try {
    const raw = readFileSync(p, "utf-8");
    return JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
  } catch { return null; }
}

function writeJSON(p, data) {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

const PIPEFILE = join(WS_ROOT, ".pipeline-state.json");
const MEMORY_ROOT = join(OC_ROOT, ".memory");
const MEMORY_CATEGORIES = new Set([
  "index", "project", "architecture", "patterns", "bugs", "decisions",
  "preferences", "workflow", "prompt", "vibe", "snapshots", "timeline", "stats", "feedback",
]);
const COLLECTIONS = {
  bugs: "bugs",
  decisions: "decisions",
  snapshots: "snapshots",
  timeline: "entries",
  feedback: "entries",
};

function memoryFile(category) {
  if (!MEMORY_CATEGORIES.has(category)) {
    console.error("Unknown memory category: " + category);
    process.exit(1);
  }
  return join(MEMORY_ROOT, category + ".json");
}

function touch(data) {
  data.updated = new Date().toISOString();
  return data;
}

function arrayCount(data, key) {
  return Array.isArray(data?.[key]) ? data[key].length : 0;
}

function syncMemoryStats() {
  const bugs = readJSON(memoryFile("bugs")) || {};
  const decisions = readJSON(memoryFile("decisions")) || {};
  const snapshots = readJSON(memoryFile("snapshots")) || {};
  const timeline = readJSON(memoryFile("timeline")) || {};
  const total = arrayCount(bugs, "bugs") + arrayCount(decisions, "decisions")
    + arrayCount(snapshots, "snapshots") + arrayCount(timeline, "entries");
  const index = touch(readJSON(memoryFile("index")) || { version: "1.0" });
  index.memory_count = total;
  writeJSON(memoryFile("index"), index);
  const stats = touch(readJSON(memoryFile("stats")) || { version: "1.0" });
  stats.total_memories = total;
  stats.total_bugs = arrayCount(bugs, "bugs");
  stats.total_decisions = arrayCount(decisions, "decisions");
  stats.total_snapshots = arrayCount(snapshots, "snapshots");
  stats.last_session = new Date().toISOString();
  writeJSON(memoryFile("stats"), stats);
}

function repairMemory() {
  for (const [category, collection] of Object.entries(COLLECTIONS)) {
    const file = memoryFile(category);
    const data = readJSON(file) || { version: "1.0" };
    if (!Array.isArray(data[collection])) data[collection] = [];
    if (Array.isArray(data.entries) && collection !== "entries") {
      data[collection].push(...data.entries);
      delete data.entries;
    }
    writeJSON(file, touch(data));
  }
  syncMemoryStats();
  console.log("[REPAIR] memory schema and counters synchronized");
}

switch (CMD) {
  // ── Pipeline ───────────────────────────────────────────────
  case "pipe": {
    const status = ARG; // start | pass | fail
    const phase = process.argv[4];
    if (!phase) { console.error("Usage: persist.mjs pipe <status> <phase>"); process.exit(1); }
    let pipe = readJSON(PIPEFILE) || [];
    const existing = pipe.findIndex(p => p.phase === phase);
    const entry = { phase, status, agent: process.argv[5] || "", ts: new Date().toISOString() };
    if (existing >= 0) pipe[existing] = entry;
    else pipe.push(entry);
    writeJSON(PIPEFILE, pipe);
    console.log(`[PIPE] ${phase}: ${status}`);
    break;
  }

  // ── Memory reflection ──────────────────────────────────────
  case "reflect": {
    const category = ARG; // patterns | decisions | bugs | stats | ...
    const key = process.argv[4];
    const val = process.argv[5];
    if (!category || !key) { console.error("Usage: persist.mjs reflect <category> <key> [val]"); process.exit(1); }
    const file = memoryFile(category);
    let data = readJSON(file) || {};
    if (val !== undefined) data[key] = val;
    else delete data[key];
    ensureDir(file);
    writeJSON(file, touch(data));
    syncMemoryStats();
    console.log(`[REFLECT] ${category}.json ${key}=${val ?? "(removed)"}`);
    break;
  }

  // ── Append to array in memory ─────────────────────────────
  case "append": {
    const cat = ARG;
    const entryRaw = process.argv[4];
    if (!cat || !entryRaw) { console.error("Usage: persist.mjs append <category> <json_entry>"); process.exit(1); }
    const f = memoryFile(cat);
    const collection = COLLECTIONS[cat] || "entries";
    let d = readJSON(f) || { version: "1.0" };
    if (!Array.isArray(d[collection])) d[collection] = [];
    try { d[collection].push(JSON.parse(entryRaw)); } catch { d[collection].push(entryRaw); }
    ensureDir(f);
    writeJSON(f, touch(d));
    syncMemoryStats();
    console.log(`[APPEND] ${cat}.json +1 entry`);
    break;
  }

  // ── Prompt log ─────────────────────────────────────────────
  case "log": {
    const content = process.argv.slice(3).join(" ");
    if (!content) { console.error("Usage: persist.mjs log <content>"); process.exit(1); }
    const logFile = join(WS_ROOT, "promptLog.txt");
    writeFileSync(logFile, content + "\n");
    console.log("[LOG] promptLog.txt written");
    break;
  }

  case "repair": {
    repairMemory();
    break;
  }

  // ── Status ─────────────────────────────────────────────────
  case "status": {
    console.log("\n  Memory root:", MEMORY_ROOT);
  console.log("  Pipeline:", existsSync(PIPEFILE) ? readJSON(PIPEFILE)?.length + " entries" : "none");
  console.log("  Prompt log:", existsSync(join(WS_ROOT, "promptLog.txt")) ? "exists" : "none");
    break;
  }

  default:
    console.log(`Usage: persist.mjs <pipe|reflect|append|log|repair|status> [args...]`);
    console.log(`  pipe <start|pass|fail> <phase> [agent]      — Track pipeline phase`);
    console.log(`  reflect <category> <key> [val]              — Set memory key-value`);
    console.log(`  append <category> <json_entry>              — Append to memory array`);
    console.log(`  log <content>                               — Write prompt log`);
    console.log(`  repair                                      — Normalize memory schema and counters`);
    console.log(`  status                                      — Show persistence status`);
}

function ensureDir(p) {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}
