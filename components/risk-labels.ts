import type { AnalyzeResult } from "@/src/analysis/types";

export const RISK_LEVEL_LABELS: Record<AnalyzeResult["riskLevel"], string> = {
  none: "無明顯風險",
  low: "低風險",
  medium: "中等風險",
  high: "高風險",
};

export const CONFIDENCE_LABELS: Record<
  AnalyzeResult["categories"][number]["confidence"],
  string
> = {
  low: "低",
  medium: "中",
  high: "高",
};

export function riskLevelLabel(level: AnalyzeResult["riskLevel"]): string {
  return RISK_LEVEL_LABELS[level];
}
