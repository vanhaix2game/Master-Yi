import { z } from "zod";

export const RequestSchema = z.object({
  version: z.literal("1.0"),
  type: z.enum(["web", "game", "ai", "tool", "debug", "vibe", "ui-ux", "meeting", "release", "compile", "preview", "unknown"]),
  target: z.string().min(1, "target is required"),
  context: z.record(z.unknown()).default({}),
});

export const RequestTypeValues = RequestSchema.shape.type._def.values as readonly string[];
export type ParsedRequest = z.infer<typeof RequestSchema>;
