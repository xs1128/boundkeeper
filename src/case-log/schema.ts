import { z } from "zod";
import { analyzeResultSchema } from "@/src/analysis/schemas/analyze-result";

export const caseLogEntrySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  messageHash: z.string().optional(),
  analysis: analyzeResultSchema,
});
