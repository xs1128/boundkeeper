import type { AnalyzeResult } from "@/src/analysis/types";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";

export const SAMPLE_ANALYZE_RESULT: AnalyzeResult = {
  riskLevel: "medium",
  categories: [
    {
      id: "workplace_bullying",
      labelZh: "職場霸凌風險",
      confidence: "medium",
    },
  ],
  legalRefs: [
    {
      statute: "職安法 §22-1",
      summaryZh:
        "雇主應採取適當措施，預防職場霸凌；霸凌須符合權勢濫用、逾越必要合理範圍等要件。",
      url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001",
    },
  ],
  explanationZh:
    "訊息帶有威脅性語氣，可能超出合理管理範圍。單一訊息通常不足以認定職場霸凌，但值得留意是否持續發生。",
  suggestedReplyZh:
    "收到。我會依指示完成工作。若對交付標準或時程有疑問，能否請您以書面方式說明，以便我確認後執行？",
  nextStepsZh: [
    "保留此訊息截圖或紀錄，勿立即情緒性回覆。",
    "若類似訊息反覆出現，可記錄時間與內容。",
    "需要協助時，可洽 1955 勞工諮詢申訴專線了解一般資訊。",
  ],
  disclaimers: [FIXED_DISCLAIMER],
  elementsNote:
    "職場霸凌認定通常需綜合權勢濫用、逾越必要合理範圍、持續性與危害等要件；本分析僅供風險參考。",
};
