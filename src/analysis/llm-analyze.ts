import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { AnalyzeInput, AnalyzeResult } from "./types";
import type { RuleHint } from "./rules/prefilter";
import { AnalysisError } from "./errors";
import { CATEGORY_IDS, CATEGORY_LABELS, LEGAL_CONTEXT, legalRecords, legalRefFor } from "./legal-context";
import { SYSTEM_PROMPT_ZH_TW } from "./prompts/system.zh-TW";

export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini-2025-04-14";
export const LIVE_TIMEOUT_MS = 12000;

// Provider-only shape; the public AnalyzeResult contract stays unchanged.
export const modelResultSchema = z.object({
  riskLevel: z.enum(["none", "low", "medium", "high"]),
  categories: z.array(z.object({
    id: z.enum(CATEGORY_IDS),
    confidence: z.enum(["low", "medium", "high"]),
  })).min(1).max(6),
  legalSourceIds: z.array(z.enum(legalRecords.map((record) => record.id))).max(6),
  explanationZh: z.string().trim().min(1).max(2000),
  suggestedReplyZh: z.string().max(1500),
  nextStepsZh: z.array(z.string().max(600)).max(5),
});

export async function llmAnalyze(input: AnalyzeInput, hints: RuleHint[]): Promise<AnalyzeResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  if (!apiKey || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,100}$/.test(model)) {
    throw new AnalysisError("ANALYSIS_UNAVAILABLE");
  }
  const signal = AbortSignal.timeout(LIVE_TIMEOUT_MS);
  try {
    const openai = createOpenAI({ apiKey });
    const { object } = await generateObject({
      model: openai.chat(model),
      schema: modelResultSchema,
      system: `${SYSTEM_PROMPT_ZH_TW}\n${JSON.stringify({ categoryIds: CATEGORY_IDS, curatedLegalContext: LEGAL_CONTEXT })}`,
      prompt: JSON.stringify({ untrustedMessage: input.text, untrustedContext: input.context ?? {}, ruleHints: hints }),
      maxOutputTokens: 2200,
      maxRetries: 0,
      abortSignal: signal,
      providerOptions: { openai: { store: false } },
      experimental_telemetry: { isEnabled: false, recordInputs: false, recordOutputs: false },
    });
    const parsed = modelResultSchema.safeParse(object);
    if (!parsed.success) throw new AnalysisError("INVALID_ANALYSIS");
    const value = parsed.data;
    return {
      riskLevel: value.riskLevel,
      categories: value.categories.map((category) => ({ ...category, labelZh: CATEGORY_LABELS[category.id] })),
      legalRefs: value.legalSourceIds.map(legalRefFor),
      explanationZh: value.explanationZh,
      suggestedReplyZh: value.suggestedReplyZh,
      nextStepsZh: value.nextStepsZh,
      disclaimers: [],
    };
  } catch (error) {
    // SDK errors can contain the prompt or response. Never retain their cause.
    if (error instanceof AnalysisError) throw error;
    throw new AnalysisError(signal.aborted ? "ANALYSIS_TIMEOUT" : "ANALYSIS_UNAVAILABLE");
  }
}
