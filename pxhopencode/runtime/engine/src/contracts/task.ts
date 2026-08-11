import { z } from "zod";

export const TaskSchema = z.object({
  version: z.literal("1.0"),
  phase: z.enum(["analyze", "meeting", "architect", "code", "fix", "test", "review", "build", "ui-ux", "persist"]),
  target: z.string().min(1, "target is required"),
  skills: z.array(z.string()).default([]),
  workflow: z.string().min(1, "workflow is required"),
  context: z.record(z.unknown()).default({}),
});

export const TaskPhaseValues = TaskSchema.shape.phase._def.values as readonly string[];
export type ParsedTask = z.infer<typeof TaskSchema>;
