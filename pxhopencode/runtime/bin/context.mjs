#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

function resolveOpenCodeRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return join(cwd, ".opencode");
}

const CTX_FILE = join(resolveOpenCodeRoot(), ".context.json");
const MAX_ENTRIES = 10;

function err(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function ok(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function dim(s) { return "\x1b[2m" + s + "\x1b[0m"; }
function cyan(s) { return "\x1b[36m" + s + "\x1b[0m"; }

function readCtx() {
  try { return JSON.parse(readFileSync(CTX_FILE, "utf-8")); } catch { return { prompts: [], session_id: null, updated: null }; }
}
function writeCtx(d) {
  d.updated = new Date().toISOString();
  mkdirSync(dirname(CTX_FILE), { recursive: true });
  writeFileSync(CTX_FILE, JSON.stringify(d, null, 2) + "\n");
}

function cmdAdd(prompt) {
  const ctx = readCtx();
  const trimmed = prompt.trim();
  if (!trimmed) { console.log(err("Empty prompt, ignoring")); return; }
  const isDuplicate = ctx.prompts.some(p => p.text === trimmed);
  if (isDuplicate) { console.log(dim("Duplicate prompt, skipped")); return; }
  ctx.prompts.push({ text: trimmed, timestamp: new Date().toISOString() });
  if (ctx.prompts.length > MAX_ENTRIES) ctx.prompts = ctx.prompts.slice(-MAX_ENTRIES);
  if (!ctx.session_id) ctx.session_id = "sess_" + Date.now().toString(36);
  writeCtx(ctx);
  console.log(ok("Context added") + dim(" (" + ctx.prompts.length + " prompts)"));
}

function cmdShow() {
  const ctx = readCtx();
  console.log(dim("\n  -- Session Context --"));
  console.log("  Session: " + cyan(ctx.session_id || "-"));
  console.log("  Updated: " + dim(ctx.updated || "-"));
  console.log("  Prompts: " + ctx.prompts.length);
  for (let i = 0; i < ctx.prompts.length; i++) {
    const p = ctx.prompts[i];
    console.log("  " + dim("  " + (i + 1) + ".") + " " + p.text.slice(0, 80) + dim(p.text.length > 80 ? "..." : ""));
  }
  console.log();
}

function cmdClear() {
  writeCtx({ prompts: [], session_id: null, updated: null });
  console.log(ok("Context cleared"));
}

function cmdExport() {
  const ctx = readCtx();
  const lines = ctx.prompts.map((p, i) => (i + 1) + ". " + p.text).join("\n");
  console.log(lines);
}

const args = process.argv.slice(2);
const cmd = args[0] || "show";

if (cmd === "add" && args.slice(1).join(" ")) cmdAdd(args.slice(1).join(" "));
else if (cmd === "show" || cmd === "list") cmdShow();
else if (cmd === "clear") cmdClear();
else if (cmd === "export") cmdExport();
else {
  console.log(dim("Usage:"));
  console.log("  context                  " + dim("Show session context"));
  console.log("  context add <prompt>     " + dim("Add prompt to context"));
  console.log("  context clear            " + dim("Clear context"));
  console.log("  context export           " + dim("Export context as text"));
}
