import { z } from "zod";
import { FIXED_DISCLAIMER } from "../disclaimer";
import type { AnalysisError } from "../errors";

const failureCodes = [
  "INVALID_JSON",
  "INVALID_INPUT",
  "FIXTURE_NOT_FOUND",
  "INVALID_ANALYSIS",
  "ANALYSIS_UNAVAILABLE",
  "ANALYSIS_TIMEOUT",
] as const satisfies readonly (AnalysisError["code"] | "INVALID_JSON")[];

/** Existing non-2xx HTTP body; success bodies use analyzeResultSchema directly. */
export const analyzeFailureSchema = z.object({
  error: z.object({
    code: z.enum(failureCodes),
    messageZh: z.string().min(1),
  }),
  disclaimer: z.literal(FIXED_DISCLAIMER),
});

export type AnalyzeFailure = z.infer<typeof analyzeFailureSchema>;
