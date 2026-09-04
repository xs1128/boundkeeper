import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { plantedFixtures } from "../../src/analysis/fixtures/planted";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { analyzeResultSchema } from "../../src/analysis/schemas/analyze-result";
import sharedResult from "../../assets/fixtures/sanitized-analysis-result.json";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("planted fixtures without credentials or network", () => {
  const ranks = { none: 0, low: 1, medium: 2, high: 3 };
  it("covers the original and expanded categories with unique positive and negative scenarios", () => {
    expect(plantedFixtures).toHaveLength(22);
    expect(new Set(plantedFixtures.map((fixture) => fixture.id)).size).toBe(plantedFixtures.length);
    expect(new Set(plantedFixtures.map((fixture) => fixture.expectedPrimaryCategory)).size).toBe(12);
  });
  it.each(plantedFixtures)("classifies $id deterministically", async (fixture) => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn(() => { throw new Error("Unexpected network"); });
    vi.stubGlobal("fetch", fetch);
    const first = await analyzeMessage({ text: fixture.message, mode: "fixture" });
    expect(first.categories[0].id).toBe(fixture.expectedPrimaryCategory);
    expect(ranks[first.riskLevel]).toBeGreaterThanOrEqual(ranks[fixture.minimumRiskLevel]);
    expect(analyzeResultSchema.safeParse(first).success).toBe(true);
    expect(first.disclaimers).toContain(FIXED_DISCLAIMER);
    expect(first.legalRefs.length).toBeGreaterThan(0);
    expect(await analyzeMessage({ text: `  ${fixture.message}\n`, mode: "fixture" })).toEqual(first);
    first.nextStepsZh.push("caller mutation");
    expect((await analyzeMessage({ text: fixture.message, mode: "fixture" })).nextStepsZh).not.toContain("caller mutation");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects unknown offline input instead of fabricating analysis or using live mode", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(analyzeMessage({ text: "明天需要加班，請先確認安排。", mode: "fixture" })).rejects.toMatchObject({ code: "FIXTURE_NOT_FOUND" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("provides a sanitized golden result for Web and LINE", async () => {
    expect(sharedResult).toEqual(await analyzeMessage({ text: plantedFixtures[1].message, mode: "fixture" }));
    expect(JSON.stringify(sharedResult)).not.toContain(plantedFixtures[1].message);
  });
});
