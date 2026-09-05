import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGoogleVertex } from "@ai-sdk/google-vertex";
import type { LanguageModel } from "ai";
import { AnalysisError } from "./errors";

export { LIVE_TIMEOUT_MS } from "./timeouts";

export const DEFAULT_GEMINI_MODEL = "gemini-3.7-flash";
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini-2025-04-14";

/** @deprecated use DEFAULT_GEMINI_MODEL */
export const DEFAULT_VERTEX_MODEL = DEFAULT_GEMINI_MODEL;

export type LlmBackend = "openai" | "gemini-api" | "agent-platform";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function resolveGeminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    || process.env.GEMINI_API_KEY?.trim()
    || process.env.GOOGLE_VERTEX_API_KEY?.trim()
  );
}

/** Parse inline service account JSON for Agent Platform (local + Vercel). */
export function parseServiceAccountJson(raw: string): ServiceAccountCredentials | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = JSON.parse(trimmed) as ServiceAccountCredentials;
    if (!parsed.client_email?.trim() || !parsed.private_key?.trim()) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function loadServiceAccountCredentials(): ServiceAccountCredentials | undefined {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) return parseServiceAccountJson(inline);
  return undefined;
}

function resolveAgentPlatformProject(credentials?: ServiceAccountCredentials): string | undefined {
  return (
    process.env.GOOGLE_VERTEX_PROJECT?.trim()
    || process.env.GOOGLE_CLOUD_PROJECT?.trim()
    || credentials?.project_id?.trim()
  );
}

function usesAgentPlatform(): boolean {
  return Boolean(loadServiceAccountCredentials() || resolveAgentPlatformProject());
}

export function hasGeminiCredentials(): boolean {
  return Boolean(resolveGeminiApiKey() || usesAgentPlatform());
}

/** @deprecated use hasGeminiCredentials */
export const hasVertexCredentials = hasGeminiCredentials;

export function resolveLlmBackend(): LlmBackend {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (raw === "openai") return "openai";
  if (usesAgentPlatform()) return "agent-platform";
  if (resolveGeminiApiKey()) return "gemini-api";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return "gemini-api";
}

/** @deprecated use resolveLlmBackend */
export function resolveLlmProvider(): "openai" | "vertex" {
  return resolveLlmBackend() === "openai" ? "openai" : "vertex";
}

export function resolveModel(backend: LlmBackend): string {
  if (backend !== "openai") {
    const override = process.env.GEMINI_MODEL?.trim() || process.env.VERTEX_MODEL?.trim();
    if (override && override !== DEFAULT_GEMINI_MODEL) {
      throw new AnalysisError("ANALYSIS_UNAVAILABLE");
    }
    return DEFAULT_GEMINI_MODEL;
  }
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,100}$/.test(model)) {
    throw new AnalysisError("ANALYSIS_UNAVAILABLE");
  }
  return model;
}

export function createLanguageModel(backend: LlmBackend, model: string): LanguageModel {
  if (backend === "gemini-api") {
    const apiKey = resolveGeminiApiKey();
    if (!apiKey) throw new AnalysisError("ANALYSIS_UNAVAILABLE");
    return createGoogleGenerativeAI({ apiKey })(model);
  }
  if (backend === "agent-platform") {
    const credentials = loadServiceAccountCredentials();
    const project = resolveAgentPlatformProject(credentials);
    if (!project) throw new AnalysisError("ANALYSIS_UNAVAILABLE");
    const location =
      process.env.GOOGLE_VERTEX_LOCATION?.trim()
      || process.env.GOOGLE_CLOUD_LOCATION?.trim()
      || "global";
    return createGoogleVertex({
      project,
      location,
      ...(credentials
        ? { googleAuthOptions: { credentials } }
        : {}),
    })(model);
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AnalysisError("ANALYSIS_UNAVAILABLE");
  return createOpenAI({ apiKey }).chat(model);
}

export function assertLiveCredentials(backend: LlmBackend): void {
  if (backend === "openai") {
    if (!process.env.OPENAI_API_KEY?.trim()) throw new AnalysisError("ANALYSIS_UNAVAILABLE");
    return;
  }
  if (!hasGeminiCredentials()) throw new AnalysisError("ANALYSIS_UNAVAILABLE");
}
