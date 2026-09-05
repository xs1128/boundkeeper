import { describe, expect, it } from "vitest";
import sanitizedResult from "@/assets/fixtures/sanitized-analysis-result.json";
import { parseStoredCaseLog } from "../../src/case-log/validate";

describe("parseStoredCaseLog", () => {
  it("keeps valid entries and counts skipped malformed records", () => {
    const valid = {
      id: "entry-1",
      createdAt: "2026-09-05T03:00:00.000Z",
      messageHash: "abc123",
      analysis: sanitizedResult,
    };
    const invalid = {
      id: "entry-2",
      createdAt: "2026-09-04T03:00:00.000Z",
      analysis: { riskLevel: "high" },
    };

    const result = parseStoredCaseLog([invalid, valid]);

    expect(result.skippedCount).toBe(1);
    expect(result.entries).toEqual([valid]);
  });

  it("returns empty results when every stored record is invalid", () => {
    const result = parseStoredCaseLog([
      { id: "bad-1", createdAt: "2026-09-04T03:00:00.000Z" },
      { id: "bad-2", createdAt: "2026-09-04T03:00:00.000Z", analysis: null },
    ]);

    expect(result).toEqual({ entries: [], skippedCount: 2 });
  });
});
