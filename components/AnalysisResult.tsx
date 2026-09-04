"use client";

import { useState } from "react";
import type { AnalyzeResult } from "@/src/analysis/types";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { CONFIDENCE_LABELS, riskLevelLabel } from "./risk-labels";
import { copyText } from "./copy-text";

type AnalysisResultProps = {
  result: AnalyzeResult;
  onSave?: (result: AnalyzeResult) => Promise<void>;
  isSaving?: boolean;
  saveMessage?: string;
};

export function AnalysisResult({
  result,
  onSave,
  isSaving = false,
  saveMessage,
}: AnalysisResultProps) {
  const [reply, setReply] = useState(result.suggestedReplyZh);
  const [copyStatus, setCopyStatus] = useState("");

  async function handleCopyReply() {
    const copied = await copyText(reply);
    setCopyStatus(copied ? "已複製建議回覆。" : "無法複製，請手動選取文字。");
  }

  return (
    <section className="result" aria-label="分析結果">
      <div className="result-header">
        <p className={`risk-badge risk-${result.riskLevel}`}>
          {riskLevelLabel(result.riskLevel)}
        </p>
        {result.categories.length > 0 ? (
          <ul className="category-list">
            {result.categories.map((category) => (
              <li key={category.id}>
                <span>{category.labelZh}</span>
                <span className="category-confidence">
                  信心：{CONFIDENCE_LABELS[category.confidence]}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {result.elementsNote ? (
        <p className="elements-note">{result.elementsNote}</p>
      ) : null}

      <section aria-labelledby="explanation-heading">
        <h2 id="explanation-heading">白話解釋</h2>
        <p>{result.explanationZh}</p>
      </section>

      {result.legalRefs.length > 0 ? (
        <details className="legal-refs">
          <summary>可能涉及的法規</summary>
          <ul>
            {result.legalRefs.map((ref) => (
              <li key={`${ref.statute}-${ref.summaryZh.slice(0, 24)}`}>
                <strong>{ref.statute}</strong>
                <p>{ref.summaryZh}</p>
                {ref.url ? (
                  <a href={ref.url} rel="noreferrer" target="_blank">
                    查看法規來源
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <section aria-labelledby="reply-heading">
        <div className="section-heading">
          <h2 id="reply-heading">建議回覆</h2>
          <button className="button-secondary" onClick={handleCopyReply} type="button">
            複製回覆
          </button>
        </div>
        <textarea
          aria-label="建議回覆（可編輯）"
          className="reply-editor"
          onChange={(event) => setReply(event.target.value)}
          value={reply}
        />
        {copyStatus ? (
          <p className="inline-status" role="status">
            {copyStatus}
          </p>
        ) : null}
      </section>

      {result.nextStepsZh.length > 0 ? (
        <section aria-labelledby="next-steps-heading">
          <h2 id="next-steps-heading">你可以做的事</h2>
          <ul className="next-steps">
            {result.nextStepsZh.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="result-disclaimer" aria-label="法律資訊聲明">
        {result.disclaimers[0] ?? FIXED_DISCLAIMER}
      </footer>

      {onSave ? (
        <div className="result-actions">
          <button disabled={isSaving} onClick={() => onSave({ ...result, suggestedReplyZh: reply })} type="button">
            {isSaving ? "儲存中…" : "儲存到案件紀錄"}
          </button>
          {saveMessage ? (
            <p className="inline-status" role="status">
              {saveMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
