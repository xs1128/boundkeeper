import type { AnalyzeResult as AnalyzeResultData } from "@/src/analysis/types";

type AnalysisResultProps = {
  result: AnalyzeResultData;
};

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <section aria-label="分析結果">
      <p>風險等級：{result.riskLevel}</p>
      <h2>白話解釋</h2>
      <p>{result.explanationZh}</p>
      <h2>建議回覆</h2>
      <p>{result.suggestedReplyZh}</p>
    </section>
  );
}
