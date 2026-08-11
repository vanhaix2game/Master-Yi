import { z } from "zod";

export const EventSchema = z.object({
  version: z.literal("1.0"),
  type: z.enum(["phase_start", "phase_end", "error", "decision", "checkpoint", "reflection", "retry", "loop", "alert", "feedback"]),
  phase: z.string().min(1, "phase is required"),
  reflection: z.record(z.unknown()).optional(),
});

export const EventTypeValues = EventSchema.shape.type._def.values as readonly string[];
export type ParsedEvent = z.infer<typeof EventSchema>;
