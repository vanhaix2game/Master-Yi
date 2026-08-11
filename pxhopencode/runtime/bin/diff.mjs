#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function err(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function ok(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function dim(s) { return "\x1b[2m" + s + "\x1b[0m"; }
function cyan(s) { return "\x1b[36m" + s + "\x1b[0m"; }
function red(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function green(s) { return "\x1b[32m" + s + "\x1b[0m"; }

function sanitize(v) {
  if (!v) return "";
  return String(v).replace(/[;&|`$(){}[\]!#~<>]/g, "");
}

function runGit(args) {
  try { return execSync("git " + sanitize(args), { encoding: "utf-8", cwd: process.cwd() }); }
  catch { return null; }
}

function cmdDiff(file) {
  const isGit = existsSync(join(process.cwd(), ".git"));
  if (!isGit) { console.log(err("Not a git repository")); return; }

  let diff;
  if (file) diff = runGit("diff -- " + file);
  else diff = runGit("diff --stat");

  if (!diff || diff.trim() === "") { console.log(dim("No changes")); return; }

  if (file) {
    console.log(dim("  -- Diff: " + file + " --"));
    for (const line of diff.split("\n")) {
      if (line.startsWith("+")) console.log(green(line));
      else if (line.startsWith("-")) console.log(red(line));
      else if (line.startsWith("@")) console.log(cyan(line));
      else console.log(line);
    }
  } else {
    console.log(dim("  -- Files changed --"));
    console.log(diff);
  }
}

function cmdRollback(file) {
  const isGit = existsSync(join(process.cwd(), ".git"));
  if (!isGit) { console.log(err("Not a git repository")); return; }
  if (!file) { console.log(err("Usage: rollback <file>")); return; }
  try {
    execSync("git checkout -- " + sanitize(file), { cwd: process.cwd() });
    console.log(ok("Rolled back: " + file));
  } catch { console.log(err("Failed to rollback: " + file)); }
}

function cmdLog(n) {
  const log = runGit("log --oneline -" + (n || 10));
  if (log) console.log(log);
  else console.log(err("No git log available"));
}

function cmdShow(commit) {
  const s = runGit("show --stat " + (commit || "HEAD"));
  if (s) console.log(s);
  else console.log(err("Cannot show commit"));
}

const args = process.argv.slice(2);
const cmd = args[0] || "status";

if (cmd === "status" || cmd === "diff") cmdDiff(args[1]);
else if (cmd === "rollback") cmdRollback(args[1]);
else if (cmd === "log") cmdLog(args[1]);
else if (cmd === "show") cmdShow(args[1]);
else {
  console.log(dim("Usage:"));
  console.log("  diff                  " + dim("Show changed files"));
  console.log("  diff <file>           " + dim("Show diff for file"));
  console.log("  rollback <file>       " + dim("Revert file changes"));
  console.log("  log [n]               " + dim("Show last n commits"));
  console.log("  show [commit]         " + dim("Show commit details"));
}
