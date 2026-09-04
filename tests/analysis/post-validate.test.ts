import { describe, expect, it } from "vitest";
import result from "../../assets/fixtures/sanitized-analysis-result.json";
import { postValidate } from "../../src/analysis/post-validate";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";

describe("post-validation", () => {
  const input = "請確認實際工作時段與加班費的計算方式及出勤紀錄。";
  it("enforces the exact disclaimer and canonical legal text", () => {
    const raw = structuredClone(result);
    raw.disclaimers = ["模型宣稱這是法律意見"];
    raw.legalRefs[0].summaryZh = "錯誤法律摘要";
    raw.categories[0].labelZh = "已違法";
    const validated = postValidate(raw, input);
    expect(validated.disclaimers).toContain(FIXED_DISCLAIMER);
    expect(validated.legalRefs[0]).toEqual(result.legalRefs[0]);
    expect(validated.categories[0].labelZh).toBe("加班與工資風險");
    expect(JSON.stringify(validated)).not.toContain("模型宣稱");
  });
  it("repairs blank improvement tips and next steps and lowers short-input confidence", () => {
    const raw = structuredClone(result); raw.inputImprovementZh = [" "]; raw.nextStepsZh = [" "];
    raw.categories[0].confidence = "high";
    const checked = postValidate(raw, "加班？");
    expect(checked.inputImprovementZh[0].trim().length).toBeGreaterThan(0);
    expect(checked.nextStepsZh[0].trim().length).toBeGreaterThan(0);
    expect(checked.categories[0].confidence).toBe("low");
    expect(raw.inputImprovementZh).toEqual([" "]);
  });
  it.each([
    { categories: [{ id: "invented", labelZh: "未知", confidence: "high" }] },
    { categories: [{ id: "crisis", labelZh: "危機", confidence: "high" }] },
    { categories: [] }, { riskLevel: "critical" }, { explanationZh: " " },
    { legalRefs: [{ statute: "不存在", summaryZh: "假的", url: "https://example.com" }] },
    { legalRefs: [] }, { inputImprovementZh: ["違法確定，你一定會贏。"] },
  ])("rejects invalid or ungrounded output: %j", (override) => {
    expect(() => postValidate({ ...result, ...override }, input)).toThrow();
  });
});
