const failures = {
  INVALID_INPUT: { status: 400, messageZh: "請提供 1 至 8,000 個字元的訊息，並確認補充資料格式。" },
  FIXTURE_NOT_FOUND: { status: 422, messageZh: "離線模式僅支援已提供的範例情境，請重新選擇範例。" },
  ANALYSIS_UNAVAILABLE: { status: 503, messageZh: "目前無法完成分析，請稍後再試，或先使用範例情境。" },
  ANALYSIS_TIMEOUT: { status: 504, messageZh: "分析時間較長，請稍後再試；需要即時勞動諮詢可洽 1955。" },
  INVALID_ANALYSIS: { status: 502, messageZh: "分析結果未通過檢查，請稍後再試；重大決定請洽 1955 或專業律師。" },
} as const;

export class AnalysisError extends Error {
  readonly status: number;
  readonly messageZh: string;

  constructor(readonly code: keyof typeof failures) {
    super(failures[code].messageZh);
    this.name = "AnalysisError";
    this.status = failures[code].status;
    this.messageZh = failures[code].messageZh;
  }
}
