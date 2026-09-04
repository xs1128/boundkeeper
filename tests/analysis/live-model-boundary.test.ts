import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { DEFAULT_OPENAI_MODEL, LIVE_TIMEOUT_MS } from "../../src/analysis/llm-analyze";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";

const modelOutput = {
  riskLevel: "medium",
  categories: [{ id: "illegal_overtime", confidence: "high" }],
  legalSourceIds: ["lsa-24", "lsa-32"],
  explanationZh: "訊息可能涉及延長工作時間，仍須確認實際班表及加班費。",
  suggestedReplyZh: "請確認工作時段及加班費的安排。",
  nextStepsZh: ["先核對工作時段、薪資明細及適用工時制度。"],
};
function response(output: unknown = modelOutput) {
  return new Response(JSON.stringify({
    id: "chatcmpl-test", object: "chat.completion", created: 1,
    model: DEFAULT_OPENAI_MODEL,
    choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify(output) }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => { vi.stubEnv("OPENAI_API_KEY", "test-key-not-real"); vi.stubEnv("OPENAI_MODEL", ""); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("live pipeline with the real SDK and a mocked HTTP boundary", () => {
  it("sends a structured, non-stored request using curated context and returns the public contract", async () => {
    const fetch = vi.fn(async () => response()); vi.stubGlobal("fetch", fetch);
    const timer = vi.spyOn(AbortSignal, "timeout");
    const result = await analyzeMessage({ text: "今晚需要加班兩小時，請幫我確認工時與薪資如何安排。" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(body.store).toBe(false);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.messages[0].content).toContain("curatedLegalContext");
    expect(body.messages[0].content).toContain("情節重大者不以持續發生為必要");
    expect(body.messages[1].content).toContain("ruleHints");
    expect(timer).toHaveBeenCalledWith(LIVE_TIMEOUT_MS);
    expect(result.categories[0].id).toBe("illegal_overtime");
    expect(result.legalRefs[0].url).toContain("law.moj.gov.tw");
    expect(result.disclaimers).toContain(FIXED_DISCLAIMER);
    expect(result).not.toHaveProperty("legalSourceIds");
  });
  it("respects the model override", async () => {
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");
    const fetch = vi.fn(async () => response()); vi.stubGlobal("fetch", fetch);
    await analyzeMessage({ text: "今晚加班兩小時，請協助確認工時與給付安排。" });
    const [, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(options.body as string).model).toBe("gpt-4.1-mini");
  });
  it("does not use fixture fallback for a live request when credentials are missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", ""); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
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
    vi.stubGlobal("fetch", vi.fn(async () => response(output)));
    await expect(analyzeMessage({ text: "請確認加班費" })).rejects.toMatchObject({ name: "AnalysisError" });
  });
  it("returns a safe timeout failure when the request is aborted", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("private body", "AbortError"); }));
    await expect(analyzeMessage({ text: "今晚加班" })).rejects.toMatchObject({ code: "ANALYSIS_TIMEOUT" });
  });
});
