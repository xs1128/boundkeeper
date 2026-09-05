import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import type { AnalyzeResult } from "@/src/analysis/types";
import { EXPORT_NOTICE_ZH } from "@/src/case-log/export";
import { PRODUCT_NAME_ZH } from "@/src/product";
import { CONFIDENCE_LABELS, riskLevelLabel } from "./risk-labels";

export function formatImprovementTips(tips: string[]): string {
  return tips.map((tip, index) => `${index + 1}. ${tip}`).join("\n");
}

export function formatConsultationSummary(analysis: AnalyzeResult): string {
  const categories = analysis.categories
    .map((category) => `${category.labelZh}（信心：${CONFIDENCE_LABELS[category.confidence]}）`)
    .join("、");
  const laws = analysis.legalRefs.length > 0
    ? analysis.legalRefs.map((reference) => `- ${reference.statute}：${reference.summaryZh}`).join("\n")
    : "本次結果未列出法規參考。";
  const extraDisclaimers = analysis.disclaimers.filter((text) => text !== FIXED_DISCLAIMER);
  const parts = [
    `${PRODUCT_NAME_ZH}諮詢摘要`,
    `風險：${riskLevelLabel(analysis.riskLevel)}`,
    `類別：${categories}`,
    "",
    "白話解釋",
    analysis.explanationZh,
  ];
  if (analysis.elementsNote) parts.push(analysis.elementsNote);
  parts.push(
    "",
    "可能涉及的法規",
    laws,
    "",
    "改進建議",
    formatImprovementTips(analysis.inputImprovementZh),
    "",
    "你可以做的事",
    formatImprovementTips(analysis.nextStepsZh),
    "",
    EXPORT_NOTICE_ZH,
    FIXED_DISCLAIMER,
    ...extraDisclaimers,
  );
  return parts.join("\n");
}
