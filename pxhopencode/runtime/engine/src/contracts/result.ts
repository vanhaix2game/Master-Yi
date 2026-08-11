import { z } from "zod";

export const ResultSchema = z.object({
  version: z.literal("1.0"),
  status: z.enum(["pass", "fail", "partial"]),
  artifacts: z.array(
    z.object({
      path: z.string(),
      summary: z.string(),
    })
  ).default([]),
  message: z.string().optional(),
});

export type ParsedResult = z.infer<typeof ResultSchema>;
