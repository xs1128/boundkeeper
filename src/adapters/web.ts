import { analyzeInputSchema } from "../analysis/schemas/analyze-input";

export function parseWebAnalyzeRequest(input: unknown) {
  return analyzeInputSchema.safeParse(input);
}
