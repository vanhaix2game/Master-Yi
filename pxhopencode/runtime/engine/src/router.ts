import type { RequestType, TaskPhase } from "./types";

interface RouteTarget {
  workflow: string;
  initialPhase: TaskPhase;
  skills: string[];
}

const INTENT_ROUTES: Record<string, RouteTarget> = {
  web: { workflow: "workflows/web.workflow.md", initialPhase: "architect", skills: ["webs-frontend", "webs-backend", "webs-styling"] },
  game: { workflow: "workflows/game.workflow.md", initialPhase: "architect", skills: ["game-development", "games-2d", "games-3d"] },
  ai: { workflow: "workflows/ai.workflow.md", initialPhase: "architect", skills: ["ais-llm", "ais-prompts", "ais-production"] },
  tool: { workflow: "workflows/tool.workflow.md", initialPhase: "architect", skills: ["tools-cli", "tools-automation"] },
  debug: { workflow: "workflows/debug.workflow.md", initialPhase: "fix", skills: ["process-systematic-debugging"] },
  vibe: { workflow: "workflows/company.workflow.md", initialPhase: "architect", skills: [] },
  "ui-ux": { workflow: "workflows/web.workflow.md", initialPhase: "ui-ux", skills: ["ui-ux", "webs-styling"] },
  meeting: { workflow: "workflows/meeting.workflow.md", initialPhase: "meeting", skills: [] },
  release: { workflow: "workflows/release.workflow.md", initialPhase: "build", skills: ["tools-packaging"] },
  compile: { workflow: "skills/prompt-compiler/SKILL.md", initialPhase: "analyze", skills: ["prompt-compiler"] },
  preview: { workflow: "skills/games-preview/SKILL.md", initialPhase: "code", skills: ["games-preview"] },
};

export function route(type: RequestType): RouteTarget {
  const r = INTENT_ROUTES[type];
  if (r) return r;
  return { workflow: "workflows/company.workflow.md", initialPhase: "analyze", skills: [] };
}

export function classifyPrompt(prompt: string): { type: RequestType; confidence: number } {
  const lower = prompt.toLowerCase();

  const patterns: Array<{ re: RegExp; type: RequestType }> = [
    { re: /\b(web|website|frontend|next\.?js|react|api)\b/, type: "web" },
    { re: /\b(game|phaser|three\.?js|unity|play)\b/, type: "game" },
    { re: /\b(ai|llm|rag|chatbot|agent)\b/, type: "ai" },
    { re: /\b(cli|tool|automation|script)\b/, type: "tool" },
    { re: /\b(bug|fix|error|crash|debug|broken)\b/, type: "debug" },
    { re: /\b(ui|ux|design|style|theme|dark mode)\b/, type: "ui-ux" },
    { re: /\b(release|deploy|publish|build|package)\b/, type: "release" },
    { re: /\b(compile|prompt)\b/, type: "compile" },
  ];

  for (const { re, type } of patterns) {
    if (re.test(lower)) {
      return { type, confidence: 0.85 };
    }
  }

  if (/(làm|tạo|xây|build|create|make|generate|implement)/.test(lower)) {
    return { type: "vibe", confidence: 0.6 };
  }

  return { type: "unknown", confidence: 0 };
}

export function workflowToPhases(workflow: string): TaskPhase[] {
  const wf = workflow.toLowerCase();
  if (wf.includes("debug")) return ["fix", "test", "build", "persist"];
  if (wf.includes("release")) return ["build", "persist"];
  if (wf.includes("ai") || wf.includes("web") || wf.includes("tool")) {
    return ["architect", "code", "test", "review", "build", "persist"];
  }
  if (wf.includes("game")) return ["architect", "code", "fix", "test", "review", "build", "persist"];
  if (wf.includes("company")) return ["architect", "code", "test", "fix", "review", "build", "persist"];
  if (wf.includes("meeting")) return ["meeting", "persist"];
  return ["analyze", "code", "persist"];
}
