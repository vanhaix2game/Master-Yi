import { existsSync } from "node:fs";
import { join } from "node:path";

export function workspaceRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return cwd;
}

export function opencodeDir() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "runtime", "bin"))) return cwd;
  return join(cwd, ".opencode");
}

export function resolveWorkspaceFile(filePath) {
  const root = workspaceRoot();
  return join(root, filePath);
}

export function resolveOpenCodeFile(filePath) {
  const dir = opencodeDir();
  return join(dir, filePath);
}
