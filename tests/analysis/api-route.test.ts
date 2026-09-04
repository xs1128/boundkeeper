import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/api/analyze/route";
import { plantedFixtures } from "../../src/analysis/fixtures/planted";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { analyzeResultSchema } from "../../src/analysis/schemas/analyze-result";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const request = (body: unknown) => new Request("http://localhost/api/analyze", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

describe("analysis API integration", () => {
  it("returns a usable fixture result instead of the old 501", async () => {
    const response = await POST(request({ text: plantedFixtures[0].message, mode: "fixture" }));
    expect(response.status).toBe(200);
    expect(analyzeResultSchema.safeParse(await response.json()).success).toBe(true);
  });
  it("returns a friendly configuration failure without raw input", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(request({ text: "私密的主管訊息" }));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.messageZh).toContain("目前無法完成分析");
    expect(body.disclaimer).toBe(FIXED_DISCLAIMER);
    expect(JSON.stringify(body)).not.toContain("私密的主管訊息");
  });
  it.each([{}, { text: " " }, { text: "字".repeat(8001) }, { text: "訊息", mode: "wrong" }])("returns 400 for invalid input", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
  });
  it("returns 400 for invalid JSON", async () => {
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
  });
  it("returns 422 for unsupported offline messages", async () => {
    const response = await POST(request({ text: "不是範例的訊息", mode: "fixture" }));
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("FIXTURE_NOT_FOUND");
  });
});
