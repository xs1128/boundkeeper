import { FIXED_DISCLAIMER } from "./disclaimer";
import type { AnalyzeResult } from "./types";

// Conservative routing includes quoted threats. This is not a clinical assessment.
export function safetyCheck(text: string): AnalyzeResult | null {
  const compact = text.replace(/\s/g, "");
  const crisis = /(自殺|自殘|輕生|不想活|活不下去|想死|去死|跳樓|跳河|割腕|結束生命|殺了|殺死|殺掉|砍死|傷害自己|傷害別人|傷害他人)/.test(compact)
    || /\b(kill\s+(myself|yourself|him|her|them|you)|suicid\w*|self[- ]harm|want\s+to\s+die)\b/i.test(text);
  if (!crisis) return null;
  return {
    riskLevel: "high",
    categories: [{ id: "crisis", labelZh: "優先確認人身安全", confidence: "low" }],
    legalRefs: [],
    explanationZh: "訊息可能涉及自傷、傷人或人身威脅。無法僅靠文字確認誰正面臨危險，請先確認自己及相關人員的安全，暫緩一般勞動法分析。",
    suggestedReplyZh: "我需要先確認安全，現在先暫停這段對話，稍後再討論工作事項。",
    nextStepsZh: [
      "若有人正面臨立即危險，請先到安全處，撥打 110 或 119，並請可信任的人陪伴或協助。",
      "需要情緒支持時，可撥打 1925 安心專線（24 小時免付費）或 1995 生命線；若是他人面臨危機，也可尋求協助。",
      "人身安全確認後，勞動權益問題可洽 1955 勞工諮詢申訴專線。回覆草稿僅在安全且適合時使用。",
    ],
    disclaimers: [FIXED_DISCLAIMER],
    elementsNote: "這是安全提醒，並非心理診斷或法律認定；引述或否定語句也可能觸發保守的安全分流。",
  };
}
