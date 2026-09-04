import { describe, expect, it } from "vitest";
import { parseAnalyzeResponse } from "../../components/parse-analyze-response";
import { riskLevelLabel } from "../../components/risk-labels";
import { SAMPLE_ANALYZE_RESULT } from "../../components/sample-analyze-result";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";

describe("analyze response parsing", () => {
  it("accepts a valid analyze result only with successful HTTP status", () => {
    const parsed = parseAnalyzeResponse(SAMPLE_ANALYZE_RESULT, true);
    expect(parsed).toEqual({ ok: true, result: SAMPLE_ANALYZE_RESULT });
    expect(parseAnalyzeResponse(SAMPLE_ANALYZE_RESULT, false).ok).toBe(false);
  });

  it("maps validated API errors to user-facing copy", () => {
    const parsed = parseAnalyzeResponse({
      error: {
        code: "ANALYSIS_UNAVAILABLE",
        messageZh: "分析服務暫時無法使用。",
      },
      disclaimer: FIXED_DISCLAIMER,
    }, false);
    expect(parsed).toEqual({ ok: false, messageZh: "分析服務暫時無法使用。" });
  });

  it.each([null, undefined, [], "invalid", { error: { messageZh: "private detail" } }])(
    "handles malformed bodies without throwing or exposing unvalidated details", (body) => {
      expect(parseAnalyzeResponse(body, true).ok).toBe(false);
      expect(parseAnalyzeResponse(body, false).ok).toBe(false);
      expect(JSON.stringify(parseAnalyzeResponse(body, false))).not.toContain("private detail");
    },
  );
});

describe("risk labels", () => {
  it("does not expose raw enum values", () => {
    expect(riskLevelLabel("medium")).toBe("中等風險");
    expect(riskLevelLabel("none")).not.toBe("none");
  });
});
