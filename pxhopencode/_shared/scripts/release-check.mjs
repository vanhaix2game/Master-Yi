#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const read = path => readFileSync(resolve(root, path), "utf8");
const pkg = JSON.parse(read("package.json"));
const version = pkg.version;
const failures = [];

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

requireCondition(/^\d+\.\d+$/.test(version), `Invalid release version: ${version}`);
requireCondition(read("README.md").includes(`v${version}`), "README version is stale");
requireCondition(read("README.md").includes("119 self-tests"), "README test count is stale");
requireCondition(read("STATUS.md").includes(`v${version}`), "STATUS version is stale");
requireCondition(read("docs-vibe/index.html").includes(`v${version}`), "Docs version is stale");
requireCondition(read("LICENSE").startsWith("MIT License"), "LICENSE is not MIT");
requireCondition(existsSync(resolve(root, "prompt-compiler", "dist", "index.js")), "Compiler dist is missing");

const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/);
for (const runtimeFile of [".pipeline-state.json", "promptLog.txt", ".context.json", ".env"]) {
  requireCondition(!tracked.includes(runtimeFile) || !existsSync(resolve(root, runtimeFile)), `Runtime file is tracked: ${runtimeFile}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[FAIL] ${failure}`);
  process.exit(1);
}
console.log(`[OK] Release integrity v${version}`);
