#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

function err(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function ok(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function dim(s) { return "\x1b[2m" + s + "\x1b[0m"; }
function cyan(s) { return "\x1b[36m" + s + "\x1b[0m"; }

const ENV_FILE = ".opencode/.env";

function loadEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const raw = readFileSync(ENV_FILE, "utf-8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function cmdSet(key, value) {
  if (!key || !value) { console.log(err("Usage: secret set KEY=VALUE")); return; }
  const entry = key + "=" + value + "\n";

  if (!existsSync(ENV_FILE)) {
    writeFileSync(ENV_FILE, "# pxhopencode secrets\n" + entry);
  } else {
    appendFileSync(ENV_FILE, entry);
  }

  const gitignore = ".gitignore";
  if (existsSync(gitignore)) {
    const ig = readFileSync(gitignore, "utf-8");
    if (!ig.includes(".opencode/.env")) {
      appendFileSync(gitignore, "\n.opencode/.env\n");
    }
  }

  console.log(ok("Saved: " + key + dim(" (value hidden)")));
}

function cmdGet(key) {
  const env = loadEnv();
  if (key) {
    if (env[key]) console.log(key + "=" + env[key]);
    else console.log(err("Not found: " + key));
  } else {
    for (const k of Object.keys(env)) {
      console.log(cyan(k) + "=" + dim("****"));
    }
    if (!Object.keys(env).length) console.log(dim("No secrets"));
  }
}

function cmdRm(key) {
  if (!key) { console.log(err("Usage: secret rm KEY")); return; }
  const env = loadEnv();
  if (!(key in env)) { console.log(err("Not found: " + key)); return; }
  delete env[key];
  const lines = [ "# pxhopencode secrets" ];
  for (const [k, v] of Object.entries(env)) lines.push(k + "=" + v);
  writeFileSync(ENV_FILE, lines.join("\n") + "\n");
  console.log(ok("Removed: " + key));
}

const args = process.argv.slice(2);
const cmd = args[0] || "list";

if (cmd === "set" && args[1]) {
  const eq = args[1].indexOf("=");
  if (eq > 0) cmdSet(args[1].slice(0, eq), args[1].slice(eq + 1));
  else console.log(err("Usage: secret set KEY=VALUE"));
} else if (cmd === "get" || cmd === "list") cmdGet(args[1]);
else if (cmd === "rm" || cmd === "delete") cmdRm(args[1]);
else if (cmd === "env") {
  const env = loadEnv();
  for (const [k, v] of Object.entries(env)) console.log(k + "=" + v);
} else {
  console.log(dim("Usage:"));
  console.log("  secret list            " + dim("Show all keys (hidden values)"));
  console.log("  secret get <key>       " + dim("Show key value"));
  console.log("  secret set KEY=VALUE   " + dim("Save secret"));
  console.log("  secret rm <key>        " + dim("Delete secret"));
  console.log("  secret env             " + dim("Export all as KEY=VALUE"));
}
