import { z } from "zod";

export const analyzeResultSchema = z.object({
  riskLevel: z.enum(["none", "low", "medium", "high"]),
  categories: z.array(
    z.object({
      id: z.string(),
      labelZh: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
    }),
  ),
  legalRefs: z.array(
    z.object({
      statute: z.string(),
      summaryZh: z.string(),
      url: z.string().optional(),
    }),
  ),
  explanationZh: z.string(),
  inputImprovementZh: z.array(z.string()).min(1),
  nextStepsZh: z.array(z.string()),
  disclaimers: z.array(z.string()),
  elementsNote: z.string().optional(),
});
