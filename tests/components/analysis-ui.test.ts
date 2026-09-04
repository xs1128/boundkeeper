import { describe, expect, it } from "vitest";
import { parseAnalyzeResponse } from "../../components/parse-analyze-response";
import { riskLevelLabel } from "../../components/risk-labels";
import { SAMPLE_ANALYZE_RESULT } from "../../components/sample-analyze-result";

describe("analyze response parsing", () => {
  it("accepts a valid analyze result payload", () => {
    const parsed = parseAnalyzeResponse(SAMPLE_ANALYZE_RESULT);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.result.riskLevel).toBe("medium");
    }
  });

  it("maps API errors to user-facing copy", () => {
    const parsed = parseAnalyzeResponse({
      error: {
        code: "ANALYSIS_NOT_IMPLEMENTED",
        messageZh: "分析核心尚未啟用。",
      },
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.messageZh).toBe("分析核心尚未啟用。");
    }
  });
});

describe("risk labels", () => {
  it("does not expose raw enum values", () => {
    expect(riskLevelLabel("medium")).toBe("中等風險");
    expect(riskLevelLabel("none")).not.toBe("none");
  });
});
