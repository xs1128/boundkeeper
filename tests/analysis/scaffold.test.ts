import { describe, expect, it } from "vitest";
import {
  analyzeMessage,
  AnalysisNotImplementedError,
} from "../../src/analysis/analyze-message";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { parseWebAnalyzeRequest } from "../../src/adapters/web";

describe("analysis scaffold", () => {
  it("keeps the required disclaimer available", () => {
    expect(FIXED_DISCLAIMER).toContain("一般性勞動法資訊");
    expect(FIXED_DISCLAIMER).toContain("不構成法律意見");
  });

  it("accepts the minimum web input", () => {
    const result = parseWebAnalyzeRequest({ text: "請明天準時到班。" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = parseWebAnalyzeRequest({ text: "   " });
    expect(result.success).toBe(false);
  });

  it("marks the analysis core as intentionally pending", async () => {
    await expect(analyzeMessage({ text: "測試訊息" })).rejects.toBeInstanceOf(
      AnalysisNotImplementedError,
    );
  });
});
