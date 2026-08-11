#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function ok(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function dim(s) { return "\x1b[2m" + s + "\x1b[0m"; }
function cyan(s) { return "\x1b[36m" + s + "\x1b[0m"; }
function yell(s) { return "\x1b[33m" + s + "\x1b[0m"; }

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, "utf-8")); } catch { return null; }
}

function readLines(p) {
  try { return readFileSync(p, "utf-8").split("\n"); } catch { return []; }
}

function detect(root) {
  const result = { framework: null, language: null, build: null, type: null, confidence: 0 };

  // package.json
  const pkg = readJSON(join(root, "package.json"));
  if (pkg) {
    result.language = "JavaScript/TypeScript";
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) { result.framework = "Next.js"; result.type = "web"; result.build = "next build"; }
    else if (deps.react || deps["react-dom"]) { result.framework = "React"; result.type = "web"; result.build = "vite build"; }
    else if (deps.vue) { result.framework = "Vue"; result.type = "web"; }
    else if (deps.phaser) { result.framework = "Phaser"; result.type = "game"; result.build = "vite build"; }
    else if (deps["three.js"] || deps.three) { result.framework = "Three.js"; result.type = "game"; }
    else if (deps.express) { result.framework = "Express"; result.type = "web"; }
    else if (deps["@nestjs/core"]) { result.framework = "NestJS"; result.type = "web"; }
    else result.type = "web";
    result.confidence += 40;

    const scripts = pkg.scripts || {};
    if (scripts.dev) result.build = scripts.dev.replace("&&", "").split(" ")[0];
    if (scripts.build) result.build = scripts.build;
  }

  // Cargo.toml
  if (existsSync(join(root, "Cargo.toml"))) {
    result.language = "Rust";
    result.type = "tool";
    result.build = "cargo build";
    result.confidence += 30;
    const lines = readLines(join(root, "Cargo.toml"));
    for (const line of lines) {
      const t = line.trim();
      if (t.includes("winit") || t.includes("bevy")) { result.framework = "Bevy"; result.type = "game"; break; }
      if (t.includes("actix-web") || t.includes("axum") || t.includes("rocket")) { result.framework = "Actix/Axum/Rocket"; result.type = "web"; break; }
      if (t.includes("clap")) { result.framework = "CLI"; result.type = "tool"; break; }
    }
  }

  // pyproject.toml
  if (existsSync(join(root, "pyproject.toml"))) {
    result.language = "Python";
    result.confidence += 30;
    const lines = readLines(join(root, "pyproject.toml"));
    for (const line of lines) {
      if (line.includes("fastapi")) { result.framework = "FastAPI"; result.type = "web"; result.build = "uvicorn"; break; }
      if (line.includes("django")) { result.framework = "Django"; result.type = "web"; break; }
      if (line.includes("flask")) { result.framework = "Flask"; result.type = "web"; break; }
    }
    if (!result.framework) result.type = "ai";
  }

  // .csproj
  const csproj = readdirSync(root).find(f => f.endsWith(".csproj"));
  if (csproj) {
    result.language = "C#";
    result.confidence += 20;
    result.type = "web";
    result.build = "dotnet build";
  }

  // index.html / game indicator
  if (existsSync(join(root, "index.html")) && !result.framework) {
    result.type = "web";
    result.confidence += 20;
  }

  if (!result.language) {
    result.language = "Unknown";
    result.confidence = 10;
  }
  if (!result.type) result.type = "unknown";

  return result;
}

function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const root = args[0] || process.cwd();
  if (!existsSync(root)) { console.log(err("Path not found: " + root)); process.exit(1); }
  console.log(dim("\n  -- Project Detect --"));
  const r = detect(root);
  console.log("  Type:       " + cyan(r.type));
  console.log("  Language:   " + cyan(r.language));
  if (r.framework) console.log("  Framework:  " + cyan(r.framework));
  if (r.build) console.log("  Build:      " + cyan(r.build));
  console.log("  Confidence: " + (r.confidence > 50 ? ok(r.confidence + "%") : yell(r.confidence + "%")));

  // Output JSON for scripting
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r));
  }
  console.log();
}

main();
