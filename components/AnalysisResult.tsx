"use client";

import type { AnalyzeResult as AnalyzeResultData } from "@/src/analysis/types";
import { HardNavLink } from "@/components/HardNavLink";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { formatConsultationSummary, formatImprovementTips } from "./consultation-summary";
import { Disclaimer } from "./Disclaimer";
import { CopyButton } from "./CopyButton";
import { CONFIDENCE_LABELS, riskLevelLabel } from "./risk-labels";

type AnalysisResultProps = {
  result: AnalyzeResultData;
  onSave?: (result: AnalyzeResultData) => Promise<void>;
  isSaving?: boolean;
  saveMessage?: string;
};

function sourceUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function AnalysisResult({ result, onSave, isSaving = false, saveMessage }: AnalysisResultProps) {
  const saved = saveMessage?.includes("已儲存") ?? false;

  return (
    <section className="card analysis-result" aria-label="分析結果">
      <div className="result-section">
        <h2>風險與類別</h2>
        <p className={`risk-badge risk-${result.riskLevel}`}>{riskLevelLabel(result.riskLevel)}</p>
        <ul className="category-list" aria-label="風險類別">
          {result.categories.map((category, index) => (
            <li key={`${category.id}-${index}`}>
              <span>{category.labelZh}</span>
              <span className="category-confidence">信心：{CONFIDENCE_LABELS[category.confidence]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="result-section">
        <h2>白話解釋</h2>
        <p className="preserve-lines">{result.explanationZh}</p>
        {result.elementsNote && <p className="elements-note">{result.elementsNote}</p>}
      </div>
      <details className="result-section legal-references">
        <summary>可能涉及的法規（{result.legalRefs.length}）</summary>
        {result.legalRefs.length === 0
          ? <p>本次結果未列出法規參考，請先閱讀白話解釋與下一步建議。</p>
          : <ul>{result.legalRefs.map((reference, index) => {
              const url = sourceUrl(reference.url);
              return (
                <li key={index}>
                  <h3>{reference.statute}</h3>
                  <p>{reference.summaryZh}</p>
                  {url && <a href={url} target="_blank" rel="noopener noreferrer">查看法規來源（另開視窗）</a>}
                </li>
              );
            })}</ul>}
      </details>
      <div className="result-section">
        <div className="section-heading">
          <h2>改進建議</h2>
          <CopyButton label="複製改進建議" text={formatImprovementTips(result.inputImprovementZh)} />
        </div>
        <p className="input-help" id="improvement-help">
          以下說明如何補充脈絡、釐清要求與調整回應方向，不是可直接複製貼上的回覆草稿。
        </p>
        <ol className="improvement-list" aria-describedby="improvement-help">
          {result.inputImprovementZh.map((tip, index) => <li key={index}>{tip}</li>)}
        </ol>
      </div>
      <div className="result-section">
        <h2>你可以做的事</h2>
        <ol>{result.nextStepsZh.map((step, index) => <li key={index}>{step}</li>)}</ol>
      </div>
      <div className="result-section">
        <Disclaimer />
        {result.disclaimers.filter((text) => text !== FIXED_DISCLAIMER).map((text, index) => (
          <p className="disclaimer" key={index}>{text}</p>
        ))}
      </div>
      <div className="result-actions">
        <p className="input-help">諮詢摘要不含主管原始訊息。按下儲存後，分析摘要只會保存在這台裝置。</p>
        <div className="result-action-row">
          <CopyButton label="複製諮詢摘要" text={formatConsultationSummary(result)} />
          {onSave && (
            <button type="button" aria-label="儲存到案件紀錄" disabled={isSaving} onClick={() => void onSave(result)}>
              {isSaving ? "儲存中…" : "儲存到案件紀錄"}
            </button>
          )}
        </div>
        {saveMessage && (
          <p className="inline-status" role="status">
            {saveMessage}
            {saved && (
              <>
                {" "}
                <HardNavLink href="/log">查看案件紀錄</HardNavLink>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
