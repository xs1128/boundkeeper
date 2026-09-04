import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/api/analyze/route";
import { fixtureOptions } from "../../src/analysis/fixtures/options";
import { analyzeResultSchema } from "../../src/analysis/schemas/analyze-result";
import { analyzeFailureSchema } from "../../src/analysis/schemas/analyze-failure";
import sharedResult from "../../assets/fixtures/sanitized-analysis-result.json";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const request = (body: unknown) => new Request("http://localhost/api/analyze", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

describe("Stream A contracts consumed by Stream B", () => {
  it.each(fixtureOptions)("accepts picker text for $id without provider access", async (option) => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn(() => { throw new Error("Unexpected provider request"); });
    vi.stubGlobal("fetch", fetch);
    const response = await POST(request({ text: option.text, mode: "fixture" }));
    expect(response.status).toBe(200);
    const result = analyzeResultSchema.parse(await response.json());
    expect(analyzeFailureSchema.safeParse(result).success).toBe(false);
    expect(Object.keys(option).sort()).toEqual(["id", "label", "text"]);
    if (option.id === "unpaid-overtime") expect(result).toEqual(sharedResult);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { body: { text: " " }, status: 400, code: "INVALID_INPUT" },
    { body: { text: "修改過的範例", mode: "fixture" }, status: 422, code: "FIXTURE_NOT_FOUND" },
    { body: { text: "請確認明天的工作安排。" }, status: 503, code: "ANALYSIS_UNAVAILABLE" },
  ])("separates $code from successful analysis", async ({ body, status, code }) => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(request(body));
    expect(response.status).toBe(status);
    const failure = analyzeFailureSchema.parse(await response.json());
    expect(failure.error.code).toBe(code);
    expect(analyzeResultSchema.safeParse(failure).success).toBe(false);
  });

  it("parses the invalid JSON response", async () => {
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
    expect(analyzeFailureSchema.parse(await response.json()).error.code).toBe("INVALID_JSON");
  });

  it("returns crisis as a success with no legal references", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const response = await POST(request({ text: "我想自殺", mode: "live" }));
    expect(response.status).toBe(200);
    const result = analyzeResultSchema.parse(await response.json());
    expect(result.categories[0].id).toBe("crisis");
    expect(result.legalRefs).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
