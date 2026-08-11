#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as readline from "node:readline";

function resolveOpenCodeRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return join(cwd, ".opencode");
}

const OC_ROOT = resolveOpenCodeRoot();
const MEMORY_ROOT = join(OC_ROOT, ".memory");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

function color(s, c) {
  const codes = { green: 32, yellow: 33, blue: 34, cyan: 36, red: 31, dim: 2 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

async function main() {
  console.log(`\n  ${color("✦", "cyan")}  ${color("PXHOPENCODE", "green")}  ${color("✦", "cyan")}`);
  console.log(`  ${color("AI Company cho Vibe Coding", "dim")}`);
  console.log(`  v${readPackageVersion()}\n`);

  if (existsSync(MEMORY_ROOT)) {
    const files = readDir(MEMORY_ROOT).filter(f => f.endsWith(".json")).length;
    console.log(`  ${color("✓", "green")} Memory initialized (${files} files)`);
  } else {
    console.log(`  ${color("!", "yellow")} Memory not initialized — run start.bat first`);
  }

  console.log(`\n  ${color("─── Welcome ───", "dim")}`);
  console.log(`  Các lệnh có sẵn:`);
  console.log(`  ${color("  vibe init", "cyan")}     Khởi tạo project mới`);
  console.log(`  ${color("  vibe status", "cyan")}   Xem trạng thái session`);
  console.log(`  ${color("  vibe resume", "cyan")}   Tiếp tục session dang dở`);
  console.log(`  ${color("  vibe scaffold", "cyan")} Tạo project từ template`);
  console.log(`  ${color("  vibe feedback", "cyan")} Gửi feedback về session`);
  console.log(`  ${color("  opencode", "cyan")}       Bắt đầu vibe coding\n`);

  const type = (await ask(`  Bạn muốn làm gì? (${color("web", "green")}/${color("game", "green")}/${color("ai", "green")}/${color("tool", "green")}/${color("skip", "dim")}): `)).trim().toLowerCase() || "skip";

  if (["web", "game", "ai", "tool"].includes(type)) {
    const name = (await ask(`  Tên project: `)).trim() || "my-project";
    console.log(`\n  ${color("→", "blue")} Scaffolding project "${name}" (type: ${type})...`);
    await scaffold(type, name);
    console.log(`  ${color("✓", "green")} Project "${name}" created!\n`);
    console.log(`  Next: ${color("cd " + name + " && opencode", "cyan")}\n`);
  } else {
    console.log(`\n  ${color("→", "blue")} Run ${color("opencode", "cyan")} to start coding!\n`);
  }

  rl.close();
}

function readJSON(p) {
  try {
    var raw = readFileSync(p, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch { return null; }
}

function readPackageVersion() {
  var pkg = readJSON(join(OC_ROOT, "package.json"));
  return pkg ? pkg.version || "?" : "?";
}

function readDir(p) {
  try { return readdirSync(p); } catch { return []; }
}

async function scaffold(type, name) {
  const target = join(process.cwd(), name);
  if (existsSync(target)) {
    console.log(`  ${color("!", "yellow")} Directory "${name}" exists, skipping scaffold`);
    return;
  }
  mkdirSync(target, { recursive: true });

  const pkg = {
    name, version: "0.1.0", private: true,
    scripts: { dev: type === "web" ? "vite" : "echo 'no dev script'" },
  };
  if (type === "web") {
    pkg.devDependencies = { vite: "^5.0.0" };
  }
  writeFileSync(join(target, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  const gitignore = ["node_modules/", ".env", "dist/", ".opencode/", ".github/", ".vibe/", ".memory/", "promptLog.txt"].join("\n") + "\n";
  writeFileSync(join(target, ".gitignore"), gitignore);

  if (type === "web") {
    mkdirSync(join(target, "src"), { recursive: true });
    writeFileSync(join(target, "index.html"),
      '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      name + '</title><script type="module" src="/src/main.ts"></script></head><body><div id="root"></div></body></html>\n');
    writeFileSync(join(target, "src", "main.ts"), "console.log('Hello from " + name + "!');\n");
  }

  if (type === "game") {
    writeFileSync(join(target, "index.html"),
      '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      name + '</title></head><body><script type="module" src="/src/main.ts"></script></body></html>\n');
    mkdirSync(join(target, "src"), { recursive: true });
    writeFileSync(join(target, "src", "main.ts"), "// Game entry point\n");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
