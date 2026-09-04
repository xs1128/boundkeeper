import { expect, it } from "vitest";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { plantedFixtures } from "../../src/analysis/fixtures/planted";
import { hasGeminiCredentials } from "../../src/analysis/llm-config";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { analyzeResultSchema } from "../../src/analysis/schemas/analyze-result";

it("LIVE smoke: one fictional message through gemini-3.7-flash (uses paid API)", async () => {
  if (!hasGeminiCredentials() && !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "Live smoke requires GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CLOUD_PROJECT, GOOGLE_GENERATIVE_AI_API_KEY, or OPENAI_API_KEY in the environment.",
    );
  }
  const result = await analyzeMessage({ text: plantedFixtures[1].message, mode: "live" });
  expect(analyzeResultSchema.safeParse(result).success).toBe(true);
  expect(result.disclaimers).toContain(FIXED_DISCLAIMER);
  expect(result.legalRefs.length).toBeGreaterThan(0);
});
