import type { AnalyzeResult } from "./types";
import { analyzeResultSchema } from "./schemas/analyze-result";

export function formatResult(result: AnalyzeResult): AnalyzeResult {
  // Parse returns a fresh, JSON-safe object with only the frozen contract fields.
  return analyzeResultSchema.parse(result);
}
