import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseServiceAccountJson,
  resolveLlmBackend,
} from "../../src/analysis/llm-config";

const sampleServiceAccount = {
  type: "service_account",
  project_id: "demo-project",
  private_key_id: "key-id",
  private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
  client_email: "demo@demo-project.iam.gserviceaccount.com",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseServiceAccountJson", () => {
  it("parses valid inline JSON", () => {
    const parsed = parseServiceAccountJson(JSON.stringify(sampleServiceAccount));
    expect(parsed?.client_email).toBe(sampleServiceAccount.client_email);
    expect(parsed?.project_id).toBe("demo-project");
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseServiceAccountJson("{not-json")).toBeUndefined();
    expect(parseServiceAccountJson(JSON.stringify({ client_email: "x" }))).toBeUndefined();
  });
});

describe("resolveLlmBackend", () => {
  it("prefers agent-platform when service account JSON is set", () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", JSON.stringify(sampleServiceAccount));
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "AQ.should-not-win");
    expect(resolveLlmBackend()).toBe("agent-platform");
  });

  it("uses project env when JSON is absent", () => {
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "demo-project");
    expect(resolveLlmBackend()).toBe("agent-platform");
  });
});
