import type { AnalyzeInput, AnalyzeResult } from "./types";

export class LlmAnalyzeNotImplementedError extends Error {
  constructor() {
    super("LLM analysis is not implemented yet.");
    this.name = "LlmAnalyzeNotImplementedError";
  }
}

export async function llmAnalyze(_input: AnalyzeInput): Promise<AnalyzeResult> {
  void _input;
  throw new LlmAnalyzeNotImplementedError();
}
