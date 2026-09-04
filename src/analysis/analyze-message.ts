import type { AnalyzeInput, AnalyzeResult } from "./types";
import { analyzeInputSchema } from "./schemas/analyze-input";
import { AnalysisError } from "./errors";
import { normalizeMessage } from "./normalize";
import { safetyCheck } from "./safety-check";
import { rulePrefilter } from "./rules/prefilter";
import { matchPlantedFixture } from "./fixtures/planted";
import { postValidate } from "./post-validate";
import { formatResult } from "./format";

export async function analyzeMessage(
  input: AnalyzeInput,
): Promise<AnalyzeResult> {
  const parsed = analyzeInputSchema.safeParse(input);
  if (!parsed.success) throw new AnalysisError("INVALID_INPUT");
  try {
    const text = normalizeMessage(parsed.data.text);
    const crisis = safetyCheck(text);
    if (crisis) return formatResult(postValidate(crisis, text, true));
    const hints = rulePrefilter(text);
    if (parsed.data.mode === "fixture") {
      const result = matchPlantedFixture(text);
      if (!result) throw new AnalysisError("FIXTURE_NOT_FOUND");
      return formatResult(postValidate(result, text));
    }
    // No SDK import, credentials or network path is reached in fixture/crisis mode.
    const { llmAnalyze } = await import("./llm-analyze");
    return formatResult(postValidate(await llmAnalyze({ ...parsed.data, text }, hints), text));
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    throw new AnalysisError("ANALYSIS_UNAVAILABLE");
  }
}
