import fs from "node:fs/promises";
import path from "node:path";

interface ScaffoldOptions {
  name: string;
  type: "react" | "next" | "express" | "cli";
  language: "ts" | "js";
  features: string[];
}

const TEMPLATES: Record<string, (name: string) => string> = {
  "react/component": (name) =>
`interface ${name}Props {
  children?: React.ReactNode;
}

export function ${name}({ children }: ${name}Props) {
  return <div className="${name.toLowerCase()}">{children}</div>;
}
`,
  "react/hook": (name) =>
`import { useState, useCallback } from "react";

export function ${name}<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, setValue, reset };
}
`,
  "express/route": (name) =>
`import { Router, Request, Response } from "express";

const router = Router();

router.get("/${name}", (req: Request, res: Response) => {
  res.json({ message: "${name} endpoint" });
});

export default router;
`,
};

export async function scaffold(targetDir: string, files: Record<string, string>) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(targetDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content.trimStart() + "\n");
  }
}
