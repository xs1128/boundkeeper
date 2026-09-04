import { describe, expect, it } from "vitest";
import { formatConsultationSummary, formatImprovementTips } from "../../components/consultation-summary";
import { EXPORT_NOTICE_ZH } from "../../src/case-log/export";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { SAMPLE_ANALYZE_RESULT } from "../../components/sample-analyze-result";

describe("consultation summary", () => {
  it("formats a shareable handoff without requiring the original message", () => {
    const summary = formatConsultationSummary(SAMPLE_ANALYZE_RESULT);
    expect(summary).toContain("勞權濾網諮詢摘要");
    expect(summary).toContain("高風險");
    expect(summary).toContain(SAMPLE_ANALYZE_RESULT.explanationZh);
    expect(summary).toContain(formatImprovementTips(SAMPLE_ANALYZE_RESULT.inputImprovementZh));
    expect(summary).toContain(EXPORT_NOTICE_ZH);
    expect(summary).toContain(FIXED_DISCLAIMER);
    expect(summary).not.toContain("今晚全組下班後再做四小時");
  });
});
