import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeMessage } from "../../src/analysis/normalize";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { safetyCheck } from "../../src/analysis/safety-check";

const llmAnalyze = vi.hoisted(() => vi.fn());
vi.mock("../../src/analysis/llm-analyze", () => ({ llmAnalyze }));
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("normalization", () => {
  it("normalizes quotes, width, line endings and invisible separators without dropping mixed-language content", () => {
    expect(normalizeMessage(" \u200b「ＡＰＩ」\r\n‘報告’  ")).toBe('"API"\n\'報告\'');
  });
  it.each(["", " \n ", "\u200b", "字".repeat(8001)])("rejects invalid text without echoing input", (text) => {
    expect(() => normalizeMessage(text)).toThrow("請提供 1 至 8,000");
  });
  it("accepts the exact trimmed input bounds", () => {
    expect(normalizeMessage(" 字 ")).toBe("字");
    expect(normalizeMessage(`  ${"字".repeat(8000)}  `)).toHaveLength(8000);
  });
  it("rejects invalid context before the model boundary", async () => {
    await expect(analyzeMessage({ text: "測試", context: { messageCountFromSender: -1 } })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(llmAnalyze).not.toHaveBeenCalled();
  });
});

describe("crisis routing", () => {
  it.each(["我不想活了", "我要殺了他", "主管叫我去死", "我想自\u200b殺", "I want to kill myself"])("short circuits %s in both modes", async (text) => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); vi.stubEnv("OPENAI_API_KEY", "");
    for (const mode of ["live", "fixture"] as const) {
      const result = await analyzeMessage({ text, mode });
      expect(result.categories[0].id).toBe("crisis");
      expect(result.legalRefs).toEqual([]);
      expect(result.disclaimers).toContain(FIXED_DISCLAIMER);
      for (const phone of ["1925", "1995", "1955"]) expect(result.nextStepsZh.join(" ")).toContain(phone);
    }
    expect(llmAnalyze).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("does not route ordinary deadlines to crisis support", () => {
    expect(safetyCheck("今天是報告的 deadline，請協助完成。")).toBeNull();
  });
});
