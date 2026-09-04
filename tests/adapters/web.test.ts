import { describe, expect, it } from "vitest";
import { parseWebAnalyzeRequest } from "../../src/adapters/web";

describe("web adapter transport behavior", () => {
  it("accepts fixture, live, and optional context payloads", () => {
    expect(parseWebAnalyzeRequest({ text: "主管訊息", mode: "fixture" }).success).toBe(true);
    expect(parseWebAnalyzeRequest({ text: "主管訊息", mode: "live" }).success).toBe(true);
    expect(parseWebAnalyzeRequest({
      text: "主管訊息",
      context: { workerRole: "工程師", industry: "製造", messageCountFromSender: 2 },
    }).success).toBe(true);
  });

  it("rejects blank, oversized, or invalid context values", () => {
    expect(parseWebAnalyzeRequest({ text: " " }).success).toBe(false);
    expect(parseWebAnalyzeRequest({ text: "字".repeat(8001) }).success).toBe(false);
    expect(parseWebAnalyzeRequest({ text: "訊息", mode: "wrong" }).success).toBe(false);
    expect(parseWebAnalyzeRequest({
      text: "訊息",
      context: { messageCountFromSender: -1 },
    }).success).toBe(false);
  });
});
