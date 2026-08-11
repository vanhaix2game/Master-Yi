import { z } from "zod";

export const ResponseSchema = z.object({
  version: z.literal("1.0"),
  status: z.enum(["ok", "error"]),
  summary: z.string(),
});

export type ParsedResponse = z.infer<typeof ResponseSchema>;
