import type { AnalyzeInput, AnalyzeResult } from "./types";

export class AnalysisNotImplementedError extends Error {
  constructor() {
    super("Analysis core is not implemented yet.");
    this.name = "AnalysisNotImplementedError";
  }
}

export async function analyzeMessage(
  input: AnalyzeInput,
): Promise<AnalyzeResult> {
  void input;
  throw new AnalysisNotImplementedError();
}
