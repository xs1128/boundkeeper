import type { AnalyzeResult } from "./types";
import { analyzeResultSchema } from "./schemas/analyze-result";
import { FIXED_DISCLAIMER } from "./disclaimer";
import { AnalysisError } from "./errors";
import { BULLYING_ELEMENTS_NOTE, SEXUAL_HARASSMENT_NOTE, CATEGORY_IDS, CATEGORY_LABELS, legalRecords, legalRefFor, type CategoryId } from "./legal-context";

export function postValidate(candidate: unknown, inputText: string, crisis = false): AnalyzeResult {
  const parsed = analyzeResultSchema.safeParse(candidate);
  if (!parsed.success) throw new AnalysisError("INVALID_ANALYSIS");
  const result = parsed.data;
  if (!result.categories.length || result.categories.length > 6 || !result.explanationZh.trim()) {
    throw new AnalysisError("INVALID_ANALYSIS");
  }
  const seen = new Set<string>();
  result.categories = result.categories.filter((category) => {
    if (!(CATEGORY_IDS as readonly string[]).includes(category.id) && !(crisis && category.id === "crisis")) {
      throw new AnalysisError("INVALID_ANALYSIS");
    }
    if (seen.has(category.id)) return false;
    seen.add(category.id);
    category.labelZh = CATEGORY_LABELS[category.id as CategoryId | "crisis"];
    if (inputText.replace(/\s/g, "").length < 20) category.confidence = "low";
    return true;
  });
  if (result.categories.length > 1) {
    result.categories = result.categories.filter((category) => category.id !== "legal_management");
  }
  if (result.categories.every((category) => category.id === "legal_management") && ["medium", "high"].includes(result.riskLevel)) {
    throw new AnalysisError("INVALID_ANALYSIS");
  }
  const records = [...new Set(result.legalRefs.map((ref) => ref.url))].map((url) => {
    const record = legalRecords.find((item) => item.canonicalUrl === url);
    if (!record || !record.categoryIds.some((id) => result.categories.some((category) => category.id === id))) {
      throw new AnalysisError("INVALID_ANALYSIS");
    }
    return record;
  });
  if (records.length > 6) throw new AnalysisError("INVALID_ANALYSIS");
  if (!crisis) {
    const risks = result.categories.filter((category) => !["legal_management", "other"].includes(category.id));
    for (const category of risks) {
      if (!records.some((record) => ["statute", "regulation"].includes(record.sourceKind) && record.categoryIds.includes(category.id))) {
        throw new AnalysisError("INVALID_ANALYSIS");
      }
    }
    if (["medium", "high"].includes(result.riskLevel) && !records.some((record) => ["statute", "regulation"].includes(record.sourceKind))) {
      throw new AnalysisError("INVALID_ANALYSIS");
    }
  }
  // Never forward model-authored statute names, URLs or legal summaries.
  result.legalRefs = records.map((record) => legalRefFor(record.id));
  result.explanationZh = result.explanationZh.trim();
  result.inputImprovementZh = [...new Set(result.inputImprovementZh.map((tip) => tip.trim()).filter(Boolean))];
  if (!result.inputImprovementZh.length) {
    result.inputImprovementZh = ["回覆前先要求書面說明具體要求、時程與相關安排，避免在未確認前口頭承諾或認錯。"];
  }
  result.nextStepsZh = [...new Set(result.nextStepsZh.map((step) => step.trim()).filter(Boolean))];
  if (!result.nextStepsZh.length) {
    result.nextStepsZh = ["先釐清工作要求與事件背景；若仍有勞動權益疑問，可洽 1955 或專業律師。"];
  }
  const notes = records.flatMap((record) => record.caveatsZh);
  if (seen.has("workplace_bullying")) notes.unshift(BULLYING_ELEMENTS_NOTE);
  if (seen.has("sexual_harassment")) notes.unshift(SEXUAL_HARASSMENT_NOTE);
  if (crisis && result.elementsNote) notes.unshift(result.elementsNote);
  result.elementsNote = [...new Set(notes)].join("\n") || undefined;
  result.disclaimers = [FIXED_DISCLAIMER];
  if (records.length) {
    result.disclaimers.push(`資料來源：${records.map((record) => record.reuse.attributionZh).join("；")}授權：政府資料開放授權條款第 1 版 https://data.gov.tw/license`);
  }
  const generatedText = [result.explanationZh, ...result.inputImprovementZh, ...result.nextStepsZh].join("\n");
  if (/(違法確定|已(?:經)?(?:確定)?違法|(?:已(?:經)?|確定)構成(?:職場霸凌|性騷擾|性別歧視|就業歧視)|你(?:一定|必定)?會贏|保證勝訴)/.test(generatedText)
    || generatedText.length > 10000) {
    throw new AnalysisError("INVALID_ANALYSIS");
  }
  return analyzeResultSchema.parse(result);
}
