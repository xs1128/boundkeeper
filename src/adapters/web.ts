import { z } from "zod";

const analyzeInputSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  locale: z.literal("zh-TW").optional(),
  context: z
    .object({
      messageCountFromSender: z.number().int().nonnegative().optional(),
      workerRole: z.string().trim().max(100).optional(),
      industry: z.string().trim().max(100).optional(),
    })
    .optional(),
  mode: z.enum(["live", "fixture"]).optional(),
});

export function parseWebAnalyzeRequest(input: unknown) {
  return analyzeInputSchema.safeParse(input);
}
