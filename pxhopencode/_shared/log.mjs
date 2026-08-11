import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LOG_DIR = join(process.cwd(), ".opencode", "logs");
const LOG_FILE = join(LOG_DIR, "runtime.log");

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

export function log(level, source, message) {
  ensureLogDir();
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] [${source}] ${message}\n`;
  try { appendFileSync(LOG_FILE, line, "utf-8"); } catch { /* skip */ }
}

export function info(source, msg) { log("INFO", source, msg); }
export function warn(source, msg) { log("WARN", source, msg); }
export function error(source, msg) { log("ERROR", source, msg); }
