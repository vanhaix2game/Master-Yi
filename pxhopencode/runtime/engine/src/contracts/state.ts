import { z } from "zod";

export const StateSchema = z.object({
  version: z.literal("1.0"),
  checkpoint: z.record(z.unknown()),
  session_id: z.string().min(1, "session_id is required"),
});

export type ParsedState = z.infer<typeof StateSchema>;
