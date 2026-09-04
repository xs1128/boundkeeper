import { analyzeResultSchema } from "@/src/analysis/schemas/analyze-result";
import type { AnalyzeResult } from "@/src/analysis/types";

type ApiErrorBody = {
  error?: {
    code?: string;
    messageZh?: string;
  };
};

export function parseAnalyzeResponse(
  body: unknown,
): { ok: true; result: AnalyzeResult } | { ok: false; messageZh: string } {
  const parsed = analyzeResultSchema.safeParse(body);
  if (parsed.success) {
    return { ok: true, result: parsed.data };
  }

  const errorBody = body as ApiErrorBody;
  return {
    ok: false,
    messageZh:
      errorBody.error?.messageZh ??
      "目前無法完成分析，請稍後再試或改用範例情境。",
  };
}
