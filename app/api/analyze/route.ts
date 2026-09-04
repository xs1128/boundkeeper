import { NextResponse } from "next/server";
import { analyzeMessage } from "@/src/analysis/analyze-message";
import { AnalysisError } from "@/src/analysis/errors";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { parseWebAnalyzeRequest } from "@/src/adapters/web";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          messageZh: "請提供有效的訊息內容。",
        },
        disclaimer: FIXED_DISCLAIMER,
      },
      { status: 400 },
    );
  }

  const parsed = parseWebAnalyzeRequest(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          messageZh: "訊息需為 1 至 8,000 個字元。",
        },
        disclaimer: FIXED_DISCLAIMER,
      },
      { status: 400 },
    );
  }

  try {
    const result = await analyzeMessage(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const failure = error instanceof AnalysisError ? error : new AnalysisError("ANALYSIS_UNAVAILABLE");
    return NextResponse.json(
      { error: { code: failure.code, messageZh: failure.messageZh }, disclaimer: FIXED_DISCLAIMER },
      { status: failure.status },
    );
  }
}
