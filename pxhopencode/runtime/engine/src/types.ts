export type ContractVersion = "1.0";
export type RequestType = "web" | "game" | "ai" | "tool" | "debug" | "vibe" | "ui-ux" | "meeting" | "release" | "compile" | "preview" | "unknown";
export type TaskPhase = "analyze" | "meeting" | "architect" | "code" | "fix" | "test" | "review" | "build" | "ui-ux" | "persist";
export type TaskStatus = "pass" | "fail" | "partial";
export type EventType = "phase_start" | "phase_end" | "error" | "decision" | "checkpoint" | "reflection" | "retry" | "loop" | "alert" | "feedback";
export type MemoryCategory =
  | "index" | "project" | "architecture" | "patterns" | "bugs" | "decisions"
  | "preferences" | "workflow" | "prompt" | "vibe" | "snapshots" | "timeline" | "stats";

export interface RequestContract {
  version: ContractVersion;
  type: RequestType;
  target: string;
  context: Record<string, unknown>;
}

export interface TaskContract {
  version: ContractVersion;
  phase: TaskPhase;
  target: string;
  skills: string[];
  workflow: string;
  context: Record<string, unknown>;
}

export interface ResultContract {
  version: ContractVersion;
  status: TaskStatus;
  artifacts: Array<{ path: string; summary: string }>;
  message?: string;
}

export interface ResponseContract {
  version: ContractVersion;
  status: "ok" | "error";
  summary: string;
}

export interface EventContract {
  version: ContractVersion;
  type: EventType;
  phase: string;
  reflection?: Record<string, unknown>;
}

export interface StateContract {
  version: ContractVersion;
  checkpoint: Record<string, unknown>;
  session_id: string;
}

export interface MemoryFile<T = unknown> {
  memory_count?: number;
  confidence?: number;
  updated?: string;
  entries?: T[];
  [key: string]: unknown;
}

export interface PipelineStep {
  phase: TaskPhase;
  agent: string;
  output?: string;
  status?: TaskStatus;
}
