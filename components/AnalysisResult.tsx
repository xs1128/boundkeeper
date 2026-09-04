"use client";

import { useRef, useState } from "react";
import type { AnalyzeResult as AnalyzeResultData } from "@/src/analysis/types";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { Disclaimer } from "./Disclaimer";
import { CONFIDENCE_LABELS, riskLevelLabel } from "./risk-labels";
import { copyText } from "./copy-text";

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
  const [reply, setReply] = useState(result.suggestedReplyZh);
  const [copyStatus, setCopyStatus] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  async function copyReply() {
    setIsCopying(true);
    setCopyStatus("");
    try {
      if (!await copyText(reply)) throw new Error("Clipboard unavailable");
      setCopyStatus("已複製回覆。");
    } catch {
      replyRef.current?.focus();
      replyRef.current?.select();
      setCopyStatus("無法自動複製。已選取回覆，請使用裝置的複製功能。");
    } finally {
      setIsCopying(false);
    }
  }

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
        <h2><label htmlFor="suggested-reply">建議回覆</label></h2>
        <p className="input-help" id="reply-help">可依你的情況修改，再複製使用。</p>
        <textarea
          id="suggested-reply"
          ref={replyRef}
          aria-describedby="reply-help"
          value={reply}
          readOnly={isCopying || isSaving}
          onChange={(event) => { setReply(event.target.value); setCopyStatus(""); }}
        />
        <button type="button" disabled={!reply.trim() || isCopying} onClick={() => void copyReply()}>
          {isCopying ? "複製中…" : "複製回覆"}
        </button>
        <p className="input-help" role="status">{copyStatus}</p>
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
      {onSave && (
        <div className="result-actions">
          <p className="input-help">按下儲存後，分析摘要與編輯後的回覆只會保存在這台裝置，不含主管原始訊息。</p>
          <button type="button" disabled={isSaving} onClick={() => void onSave({ ...result, suggestedReplyZh: reply })}>
            {isSaving ? "儲存中…" : "儲存到案件紀錄"}
          </button>
          {saveMessage && <p className="inline-status" role="status">{saveMessage}</p>}
        </div>
      )}
    </section>
  );
}
