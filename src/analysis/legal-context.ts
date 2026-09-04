import corpus from "../../assets/legal/corpus.zh-TW.json";
import type { AnalyzeResult } from "./types";
import { AnalysisError } from "./errors";

export const CATEGORY_IDS = [
  "workplace_bullying", "illegal_overtime", "improper_transfer",
  "forced_resignation", "legal_management", "other",
] as const;
export type CategoryId = typeof CATEGORY_IDS[number];
export const CATEGORY_LABELS: Record<CategoryId | "crisis", string> = {
  ...corpus.categoryLabels,
  other: "資訊不足／其他勞動風險",
  crisis: "優先確認人身安全",
};
export const BULLYING_ELEMENTS_NOTE =
  "職場霸凌須綜合勞動場所與執行職務、職務或權勢關係、是否逾越業務必要合理範圍、不當言行的持續性及身心健康危害；情節重大者不以持續發生為必要。單則訊息僅是風險線索，不能代替情境、證據及調查。";

export const legalRecords = corpus.records;
export function legalRefFor(id: string): AnalyzeResult["legalRefs"][number] {
  const record = legalRecords.find((item) => item.id === id);
  if (!record) throw new AnalysisError("INVALID_ANALYSIS");
  return {
    statute: `${record.officialNameZh} ${record.articleOrSection}`,
    summaryZh: record.summaryZh,
    url: record.canonicalUrl,
  };
}

export const LEGAL_CONTEXT = legalRecords.map((record) => ({
  sourceId: record.id,
  sourceKind: record.sourceKind,
  statute: `${record.officialNameZh} ${record.articleOrSection}`,
  categoryIds: record.categoryIds,
  summaryZh: record.summaryZh,
  caveatsZh: record.caveatsZh,
  version: record.version,
  lastVerified: record.lastVerified,
}));
