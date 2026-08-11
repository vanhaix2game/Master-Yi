#!/usr/bin/env node
/**
 * eval-grader.js — Black-box script
 * Đọc eval report JSON → tính pass rate + summary.
 * 
 * Usage:
 *   node eval-grader.js --input eval-report.json
 *   node eval-grader.js --help
 * 
 * Output: Summary JSON + exit code 0 nếu pass rate >= threshold, 1 nếu không.
 * Không server, không side-effect, deterministic.
 */

const fs = require("fs");
const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  console.log(JSON.stringify({
    usage: "node eval-grader.js --input <eval-report.json> [--threshold 0.8]",
    input: "JSON file với EvalReport { assertions: [{name, pass, message, evidence}], passRate }",
    output: "Summary { passed, total, passRate, threshold, passedThreshold, failed[] }",
    exit: "0 nếu passRate >= threshold, 1 nếu không",
  }, null, 2));
  process.exit(0);
}

const inputPath = parseArg("--input");
const threshold = parseFloat(parseArg("--threshold") || "0.8");

if (!inputPath) {
  console.error(JSON.stringify({ error: "--input required" }));
  process.exit(1);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
} catch (e) {
  console.error(JSON.stringify({ error: `Cannot read ${inputPath}: ${e.message}` }));
  process.exit(1);
}

const assertions = report.assertions || [];
const passed = assertions.filter(a => a.pass).length;
const total = assertions.length;
const passRate = total > 0 ? passed / total : 0;
const failed = assertions.filter(a => !a.pass).map(a => ({
  name: a.name,
  message: a.message,
}));

const summary = {
  passed,
  total,
  passRate: Math.round(passRate * 100) / 100,
  threshold,
  passedThreshold: passRate >= threshold,
  failed: failed.length > 0 ? failed : undefined,
  recommendations: generateRecommendations(failed),
};

console.log(JSON.stringify(summary, null, 2));
process.exit(passRate >= threshold ? 0 : 1);

function parseArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
}

function generateRecommendations(failed) {
  if (failed.length === 0) return undefined;
  const recs = {
    "physics-stable": "Kiểm tra maxSpeed clamp + CCD cho ball không xuyên wall",
    "checkpoint-trigger": "Tăng checkpoint radius hoặc check checkpoint indexing",
    "fps-target": "Giảm draw calls, bật object pool, LOD, frustum culling",
    "memory-leak": "Check event listener cleanup, object disposal trong scene destroy",
    "fsm-has-state": "FSM chưa init state — gọi fsm.setState('idle') trong create",
    "fsm-valid-transitions": "Thêm transition rules cho state hiện tại",
    "audio-play": "Wrap audio.play() trong try/catch + check AudioContext state",
    "input-responsive": "Thêm justPressed tracking + clearFrame() cuối mỗi frame",
  };

  return failed
    .filter(f => recs[f.name])
    .map(f => ({ assertion: f.name, recommendation: recs[f.name] }));
}
