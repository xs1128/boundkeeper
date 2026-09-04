import { analyzeResultSchema } from "@/src/analysis/schemas/analyze-result";
import { analyzeFailureSchema } from "@/src/analysis/schemas/analyze-failure";
import type { AnalyzeResult } from "@/src/analysis/types";

export function parseAnalyzeResponse(
  body: unknown,
  httpOk: boolean,
): { ok: true; result: AnalyzeResult } | { ok: false; messageZh: string } {
  if (!httpOk) {
    const failure = analyzeFailureSchema.safeParse(body);
    return {
      ok: false,
      messageZh: failure.success
        ? failure.data.error.messageZh
        : "分析服務暫時無法使用，請稍後重試。",
    };
  }

  const parsed = analyzeResultSchema.safeParse(body);
  return parsed.success
    ? { ok: true, result: parsed.data }
    : { ok: false, messageZh: "收到的分析資料不完整，請重試。" };
}
