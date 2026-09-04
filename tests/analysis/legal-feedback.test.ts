import { describe, expect, it } from "vitest";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { plantedFixtures } from "../../src/analysis/fixtures/planted";
import { rulePrefilter } from "../../src/analysis/rules/prefilter";

describe("calibrated management and bullying signals", () => {
  it("keeps the firm but reasonable feedback fixture low or none", async () => {
    const fixture = plantedFixtures.find((item) => item.expectedPrimaryCategory === "legal_management")!;
    const result = await analyzeMessage({ text: fixture.message, mode: "fixture" });
    expect(["none", "low"]).toContain(result.riskLevel);
    expect(result.categories.map((item) => item.id)).toEqual(["legal_management"]);
  });
  it("does not suppress hostile hints just because performance is mentioned", () => {
    expect(rulePrefilter("你的績效不好，廢物！").map((item) => item.categoryId)).toContain("workplace_bullying");
    expect(rulePrefilter("請依約定標準在合理期限改善報告。")[0].categoryId).toBe("legal_management");
    expect(rulePrefilter("明天九點開會。")).toEqual([]);
  });
  it("preserves uncertainty and the serious single-event exception", async () => {
    const result = await analyzeMessage({ text: plantedFixtures[0].message, mode: "fixture" });
    expect(result.elementsNote).toContain("情節重大者不以持續發生為必要");
    expect(result.elementsNote).toContain("不能代替情境、證據及調查");
  });
});
