import type { AnalyzeResult } from "@/src/analysis/types";

export type CaseLogEntry = {
  id: string;
  createdAt: string;
  messageHash?: string;
  analysis: AnalyzeResult;
};
