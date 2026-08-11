#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

function readJSON(p) {
  try {
    var raw = readFileSync(p, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch { return null; }
}

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
function green(s) { return c(s, 32); }
function cyan(s) { return c(s, 36); }
function yellow(s) { return c(s, 33); }
function red(s) { return c(s, 31); }
function dim(s) { return c(s, 2); }

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
function ask(q) { return new Promise(function(resolve) { rl.question(q, resolve); }); }

async function cmdInit() {
  console.log("\n  " + cyan(">") + " vibe init " + dim("-- Project init") + "\n");
  var type = (await ask("  Type (" + green("web") + "/" + green("game") + "/" + green("ai") + "/" + green("tool") + "): ")).trim().toLowerCase() || "web";
  var name = (await ask("  Name: ")).trim() || "my-project";
  var target = join(process.cwd(), name);
  if (existsSync(target)) { console.log("  " + red("X") + ' "' + name + '" exists\n'); return; }
  mkdirSync(target, { recursive: true });

  var pkg = { name: name, version: "0.1.0", private: true, scripts: {}, devDependencies: {} };
  if (type === "web") { pkg.devDependencies.vite = "^5.0.0"; pkg.scripts.dev = "vite"; }
  if (type === "ai") { pkg.scripts.start = "node index.js"; }
  writeFileSync(join(target, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  writeFileSync(join(target, ".gitignore"), "node_modules/\n.env\ndist/\n.opencode/\n.github/\n.vibe/\n.memory/\npromptLog.txt\n");

  for (var _d = 0; _d < ["src", "public"].length; _d++) mkdirSync(join(target, ["src", "public"][_d]), { recursive: true });
  var html = '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + name + '</title></head><body><div id="root"></div>'
    + '<script type="module" src="/src/main.ts"></script></body></html>\n';
  writeFileSync(join(target, "index.html"), html);
  writeFileSync(join(target, "src", "main.ts"), "console.log('" + name + " - powered by pxhopencode');\n");

  console.log("  " + green("OK") + ' Project "' + name + '" created\n');
  console.log("  " + cyan("$ cd " + name + " && opencode") + "\n");
}

async function cmdStatus() {
  console.log("\n  " + cyan(">") + " vibe status " + dim("-- Session status") + "\n");
  var hasMemory = false;
  if (existsSync(MEMORY_ROOT)) {
    var files = readdirSync(MEMORY_ROOT).filter(function(f) { return f.endsWith(".json"); });
    hasMemory = files.length > 0;
    if (hasMemory) {
      for (var _i = 0; _i < files.sort().length; _i++) {
        var f = files.sort()[_i];
        var data = readJSON(join(MEMORY_ROOT, f));
        if (!data) continue;
        var count = data.memory_count || (data.entries ? data.entries.length : 0);
        var conf = (typeof data.confidence === "number") ? data.confidence : "-";
        var updated = data.updated ? data.updated.slice(0, 10) : "-";
        var fn = f.replace(".json", "");
        console.log("  " + cyan(fn.padEnd(14)) + " count:" + String(count).padEnd(4) + " conf:" + String(conf).padEnd(4) + " updated:" + updated);
      }
    }
  }
  var pipeFile = join(process.cwd(), ".pipeline-state.json");
  if (existsSync(pipeFile)) {
    var pipe = readJSON(pipeFile);
    if (pipe && pipe.length) {
      console.log("\n  " + yellow("Pipeline:"));
      for (var _p = 0; _p < pipe.length; _p++) {
        var step = pipe[_p];
        var icon = step.status === "pass" ? green("OK") : step.status === "fail" ? red("XX") : dim("--");
        console.log("  " + icon + " " + step.phase.padEnd(12) + " " + (step.agent ? dim("-> " + step.agent) : ""));
      }
    }
  }
  if (!hasMemory) console.log("  " + yellow("No memory found. Run start.bat first.") + "\n");
  console.log();
}

async function cmdResume() {
  console.log("\n  " + cyan(">") + " vibe resume " + dim("-- Resume session") + "\n");
  var pipeFile = join(process.cwd(), ".pipeline-state.json");
  if (!existsSync(pipeFile)) { console.log("  " + yellow("No session to resume.") + "\n"); return; }
    var pipe = readJSON(pipeFile);
  if (!pipe || pipe.length === 0) { console.log("  " + yellow("No session to resume.") + "\n"); return; }
  var incomplete = null;
  for (var _i2 = 0; _i2 < pipe.length; _i2++) { if (pipe[_i2].status !== "pass") incomplete = pipe[_i2]; }
  if (!incomplete) { console.log("  " + green("All phases complete!") + "\n"); return; }
  console.log("  Last unfinished phase: " + cyan(incomplete.phase) + " -> " + dim(incomplete.agent || "?"));
  console.log("  " + dim("Run opencode and describe your task to resume.") + "\n");
}

async function cmdFeedback() {
  console.log("\n  " + cyan(">") + " vibe feedback " + dim("-- Send feedback") + "\n");
  var msg = (await ask("  What could be better? (or 'good'): ")).trim();
  if (!msg) { console.log("  " + dim("Empty, skipping.") + "\n"); return; }
  var fb = { type: "feedback", message: msg, timestamp: new Date().toISOString() };
  if (existsSync(MEMORY_ROOT)) {
    var fbFile = join(MEMORY_ROOT, "feedback.json");
    var existing = [];
    try { var _d2 = readJSON(fbFile); if (_d2 && _d2.entries) existing = _d2.entries; } catch {}
    existing.push(fb);
    writeFileSync(fbFile, JSON.stringify({ memory_count: existing.length, entries: existing, updated: new Date().toISOString() }, null, 2));
  }
  console.log("  " + green("Feedback recorded.") + " Thanks!\n");
}

async function cmdScaffold() {
  console.log("\n  " + cyan(">") + " vibe scaffold " + dim("-- Project scaffold") + "\n");
  var templates = join(OC_ROOT, "_shared", "templates");
  if (!existsSync(templates)) { console.log("  " + yellow("No templates found.") + "\n"); return; }
  var dirs = readdirSync(templates).filter(function(d) {
    try { return readdirSync(join(templates, d)).length > 0; } catch { return false; }
  });
  if (dirs.length === 0) { console.log("  " + yellow("No templates found.") + "\n"); return; }
  console.log("  Available templates:\n");
  for (var _i3 = 0; _i3 < dirs.length; _i3++) console.log("  " + cyan(String(_i3 + 1) + ".") + " " + dirs[_i3]);
  console.log();
  var sel = (await ask("  Select (1-" + dirs.length + "): ")).trim();
  var idx = parseInt(sel) - 1;
  if (isNaN(idx) || idx < 0 || idx >= dirs.length) { console.log("  " + red("Invalid.") + "\n"); return; }
  var name = (await ask("  Project name: ")).trim() || dirs[idx];
  var src = join(templates, dirs[idx]);
  var dst = join(process.cwd(), name);
  (function copyRecursive(s, d) {
    mkdirSync(d, { recursive: true });
    var entries = readdirSync(s, { withFileTypes: true });
    for (var _e = 0; _e < entries.length; _e++) {
      var entry = entries[_e];
      var sp = join(s, entry.name);
      var dp = join(d, entry.name);
      if (entry.isDirectory()) copyRecursive(sp, dp);
      else writeFileSync(dp, readFileSync(sp));
    }
  })(src, dst);
  console.log("  " + green("OK") + ' Scaffolded "' + name + '" from template "' + dirs[idx] + '"\n');
}

async function main() {
  var args = process.argv.slice(2);
  var cmd = args[0] || "help";
  if (cmd === "init") { await cmdInit(); }
  else if (cmd === "status") { await cmdStatus(); }
  else if (cmd === "resume") { await cmdResume(); }
  else if (cmd === "feedback") { await cmdFeedback(); }
  else if (cmd === "scaffold") { await cmdScaffold(); }
  else {
    console.log("\n  " + green("pxhopencode Vibe CLI"));
    console.log("  " + dim("---"));
    console.log("  " + cyan("  init") + "       Create new project");
    console.log("  " + cyan("  status") + "     Show session and memory status");
    console.log("  " + cyan("  resume") + "     Resume unfinished session");
    console.log("  " + cyan("  feedback") + "   Send feedback about a session");
    console.log("  " + cyan("  scaffold") + "   Scaffold from template");
    console.log("  " + cyan("  help") + "       Show this help\n");
    console.log("  " + dim("All commands:") + "  vibe init   vibe status   vibe resume   vibe feedback   vibe scaffold\n");
  }
  rl.close();
}

main().catch(function(e) { console.error(e); process.exit(1); });
