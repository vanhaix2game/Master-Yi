import { existsSync } from "node:fs";
import { readFile as fsReadFile, writeFile } from "node:fs/promises";

function stripBOM(s: string): string {
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}
import { join } from "node:path";
import type { MemoryCategory, MemoryFile } from "./types";

const ALL_CATEGORIES: MemoryCategory[] = [
  "index", "project", "architecture", "patterns", "bugs", "decisions",
  "preferences", "workflow", "prompt", "vibe", "snapshots", "timeline", "stats",
];

const CATEGORY_MAP: Record<string, MemoryCategory> = {};
for (const c of ALL_CATEGORIES) CATEGORY_MAP[c] = c;

function resolveMode(): "embedded" | "standalone" {
  const cwd = process.cwd();
  if (existsSync(join(cwd, ".opencode", "runtime"))) return "embedded";
  return "standalone";
}

export function getMemoryRoot(): string {
  const cwd = process.cwd();
  if (resolveMode() === "embedded") {
    return join(cwd, ".opencode", ".memory");
  }
  return join(cwd, ".memory");
}

async function memoryDir(): Promise<string> {
  return getMemoryRoot();
}

export async function readMemory<T = unknown>(cat: MemoryCategory): Promise<MemoryFile<T> | null> {
  const dir = await memoryDir();
  const fp = join(dir, `${cat}.json`);
  try {
    const raw = await fsReadFile(fp, "utf-8");
    return JSON.parse(stripBOM(raw)) as MemoryFile<T>;
  } catch {
    return null;
  }
}

export async function writeMemory<T = unknown>(cat: MemoryCategory, data: MemoryFile<T>): Promise<void> {
  const dir = await memoryDir();
  const fp = join(dir, `${cat}.json`);
  data.updated = new Date().toISOString();
  await writeFile(fp, JSON.stringify(data, null, 2), "utf-8");
}

export async function mergeMemory<T = unknown>(cat: MemoryCategory, data: Partial<MemoryFile<T>>): Promise<void> {
  const existing = await readMemory<T>(cat);
  const merged = { ...existing, ...data, updated: new Date().toISOString() } as MemoryFile<T>;
  await writeMemory(cat, merged);
}

export function resolveCategory(key: string): MemoryCategory | null {
  return CATEGORY_MAP[key] ?? null;
}

export { ALL_CATEGORIES, CATEGORY_MAP };
export type { MemoryCategory };
