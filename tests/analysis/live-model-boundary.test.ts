import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { DEFAULT_GEMINI_MODEL, LIVE_TIMEOUT_MS } from "../../src/analysis/llm-analyze";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { plantedFixtures } from "../../src/analysis/fixtures/planted";
import { legalRefFor } from "../../src/analysis/legal-context";

const modelOutput = {
  riskLevel: "medium",
  categories: [{ id: "illegal_overtime", confidence: "high" }],
  legalSourceIds: ["lsa-24", "lsa-32"],
  explanationZh: "訊息可能涉及延長工作時間，仍須確認實際班表及加班費。",
  inputImprovementZh: ["回覆時宜要求確認實際工作時段及加班費安排，避免口頭同意無薪加班。"],
  nextStepsZh: ["先核對工作時段、薪資明細及適用工時制度。"],
};

function geminiResponse(output: unknown = modelOutput) {
  return new Response(JSON.stringify({
    candidates: [{
      content: { parts: [{ text: JSON.stringify(output) }] },
      finishReason: "STOP",
    }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.stubEnv("LLM_PROVIDER", "vertex");
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "AQ.test-key-not-real");
  vi.stubEnv("GOOGLE_VERTEX_API_KEY", "");
  vi.stubEnv("GOOGLE_VERTEX_PROJECT", "");
  vi.stubEnv("OPENAI_API_KEY", "");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("live pipeline with the real SDK and a mocked HTTP boundary", () => {
  it.each(plantedFixtures.slice(5))("accepts curated expanded output for $id through the live SDK boundary", async (fixture) => {
    const output = {
      riskLevel: fixture.result.riskLevel,
      categories: [{ id: fixture.expectedPrimaryCategory, confidence: "medium" }],
      legalSourceIds: fixture.result.legalSourceIds,
      explanationZh: fixture.result.explanationZh,
      inputImprovementZh: fixture.result.inputImprovementZh,
      nextStepsZh: fixture.result.nextStepsZh,
    };
    const fetch = vi.fn(async () => geminiResponse(output));
    vi.stubGlobal("fetch", fetch);
    const result = await analyzeMessage({ text: fixture.message, mode: "live" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.categories[0].id).toBe(fixture.expectedPrimaryCategory);
    expect(result.legalRefs).toEqual(fixture.result.legalSourceIds.map(legalRefFor));
    expect(result.disclaimers).toContain(FIXED_DISCLAIMER);
    const [, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(JSON.stringify(body.systemInstruction)).toContain("gewa-12");
    expect(JSON.stringify(body.systemInstruction)).toContain("leave-9-1");
    expect(JSON.stringify(body.systemInstruction)).toContain("regulation");
    if (fixture.expectedPrimaryCategory === "sexual_harassment") {
      expect(result.elementsNote).toContain("不以反覆發生");
      expect(result.elementsNote).not.toContain("職場霸凌須綜合");
    }
  });
  it("sends a structured Gemini API request using curated context and returns the public contract", async () => {
    const fetch = vi.fn(async () => geminiResponse()); vi.stubGlobal("fetch", fetch);
    const timer = vi.spyOn(AbortSignal, "timeout");
    const result = await analyzeMessage({ text: "今晚需要加班兩小時，請幫我確認工時與薪資如何安排。" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
    );
    const body = JSON.parse(options.body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toBeDefined();
    expect(body.contents[0].parts[0].text).toContain("ruleHints");
    expect(JSON.stringify(body)).toContain("curatedLegalContext");
    expect(JSON.stringify(body)).toContain("情節重大者不以持續發生為必要");
    expect((options.headers as Record<string, string>)["x-goog-api-key"]).toBe("AQ.test-key-not-real");
    expect(timer).toHaveBeenCalledWith(LIVE_TIMEOUT_MS);
    expect(result.categories[0].id).toBe("illegal_overtime");
    expect(result.legalRefs[0].url).toContain("law.moj.gov.tw");
    expect(result.disclaimers).toContain(FIXED_DISCLAIMER);
    expect(result).not.toHaveProperty("legalSourceIds");
  });
  it("does not use fixture fallback for a live request when credentials are missing", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    vi.stubEnv("GOOGLE_VERTEX_API_KEY", "");
    vi.stubEnv("GOOGLE_VERTEX_PROJECT", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(analyzeMessage({ text: "測試訊息" })).rejects.toMatchObject({ code: "ANALYSIS_UNAVAILABLE" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not expose or log failed provider bodies and does not retry", async () => {
    const sensitive = "private message and provider credential";
    const fetch = vi.fn(async () => new Response(sensitive, { status: 503 })); vi.stubGlobal("fetch", fetch);
    const logs = [vi.spyOn(console, "error"), vi.spyOn(console, "log"), vi.spyOn(console, "warn")];
    const failure = await analyzeMessage({ text: sensitive }).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: "ANALYSIS_UNAVAILABLE" });
    expect(String(failure)).not.toContain(sensitive);
    expect(failure).not.toHaveProperty("cause");
    expect(fetch).toHaveBeenCalledTimes(1);
    for (const log of logs) expect(JSON.stringify(log.mock.calls)).not.toContain(sensitive);
  });
  it.each([
    { ...modelOutput, categories: [{ id: "invented", confidence: "high" }] },
    { ...modelOutput, legalSourceIds: ["invented-law"] },
    { ...modelOutput, legalSourceIds: [] },
    { ...modelOutput, explanationZh: "" },
  ])("fails safely on malformed or ungrounded model output", async (output) => {
    vi.stubGlobal("fetch", vi.fn(async () => geminiResponse(output)));
    await expect(analyzeMessage({ text: "請確認加班費" })).rejects.toMatchObject({ name: "AnalysisError" });
  });
  it("returns a safe timeout failure when the request is aborted", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("private body", "AbortError"); }));
    await expect(analyzeMessage({ text: "今晚加班" })).rejects.toMatchObject({ code: "ANALYSIS_TIMEOUT" });
  });
});
