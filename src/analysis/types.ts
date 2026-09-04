export type AnalyzeInput = {
  text: string;
  locale?: "zh-TW";
  context?: {
    messageCountFromSender?: number;
    workerRole?: string;
    industry?: string;
  };
  mode?: "live" | "fixture";
};

export type AnalyzeResult = {
  riskLevel: "none" | "low" | "medium" | "high";
  categories: Array<{
    id: string;
    labelZh: string;
    confidence: "low" | "medium" | "high";
  }>;
  legalRefs: Array<{
    statute: string;
    summaryZh: string;
    url?: string;
  }>;
  explanationZh: string;
  inputImprovementZh: string[];
  nextStepsZh: string[];
  disclaimers: string[];
  elementsNote?: string;
};
