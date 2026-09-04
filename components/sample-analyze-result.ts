import sanitizedResult from "@/assets/fixtures/sanitized-analysis-result.json";
import { analyzeResultSchema } from "@/src/analysis/schemas/analyze-result";

/** Shared, core-validated fictional data for tests; never a failed-request fallback. */
export const SAMPLE_ANALYZE_RESULT = analyzeResultSchema.parse(sanitizedResult);
