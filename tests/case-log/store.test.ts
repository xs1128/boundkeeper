import { describe, expect, it } from "vitest";
import { buildCaseLogExportDocument, serializeCaseLogExport } from "../../src/case-log/export";
import { hashMessage } from "../../src/case-log/hash";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { SAMPLE_ANALYZE_RESULT } from "../../components/sample-analyze-result";

describe("case log export", () => {
  it("builds a privacy-safe export document", () => {
    const document = buildCaseLogExportDocument([
      {
        id: "entry-1",
        createdAt: "2026-09-04T03:00:00.000Z",
        messageHash: "abc123",
        analysis: SAMPLE_ANALYZE_RESULT,
      },
    ]);

    expect(document.disclaimer).toBe(FIXED_DISCLAIMER);
    expect(document.noticeZh).toContain("不是法律認定");
    expect(document.entries[0]?.analysis.explanationZh).toContain("訊息");
    expect(JSON.stringify(document)).not.toContain("自己離職");
  });

  it("serializes export JSON", () => {
    const json = serializeCaseLogExport([]);
    expect(json).toContain("exportedAt");
    expect(json).toContain("entries");
  });
});

describe("case log hash", () => {
  it("hashes message text without storing the raw string in export helpers", async () => {
    const hash = await hashMessage("測試訊息");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain("測試");
  });
});
