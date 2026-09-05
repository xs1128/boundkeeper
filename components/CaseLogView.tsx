"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CaseLogEntry } from "@/src/case-log/types";
import { listCaseEntries } from "@/src/case-log/store";
import { exportCaseLogAsJson } from "@/src/case-log/export";
import { formatConsultationSummary } from "./consultation-summary";
import { CONFIDENCE_LABELS, riskLevelLabel } from "@/components/risk-labels";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { CopyButton } from "./CopyButton";

type ViewState = "loading" | "empty" | "ready" | "error";

export function CaseLogView() {
  const [entries, setEntries] = useState<CaseLogEntry[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const doc = document as Document & {
        prerendering?: boolean;
      };
      if (typeof document !== "undefined" && doc.prerendering) {
        await new Promise<void>((resolve) => {
          document.addEventListener("prerenderingchange", () => resolve(), { once: true });
        });
      }
      if (!active) {
        return;
      }

      try {
        const nextLog = await listCaseEntries();
        if (!active) {
          return;
        }
        setEntries(nextLog.entries);
        setSkippedCount(nextLog.skippedCount);
        setViewState(nextLog.entries.length === 0 ? "empty" : "ready");
      } catch {
        if (active) {
          setViewState("error");
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  function handleExport() {
    try {
      exportCaseLogAsJson(entries);
      setExportMessage("已下載 JSON 檔案。");
    } catch {
      setExportMessage("無法匯出 JSON，請稍後再試。");
    }
  }

  if (viewState === "loading") {
    return <p className="status">正在讀取本機案件紀錄…</p>;
  }

  if (viewState === "error") {
    return (
      <div className="error-panel" role="alert">
        無法讀取本機案件紀錄。請確認瀏覽器允許網站使用本機儲存空間。
      </div>
    );
  }

  if (viewState === "empty") {
    return (
      <section className="card empty-state">
        {skippedCount > 0 ? (
          <p role="alert">
            找到 {skippedCount} 筆無法讀取的舊紀錄（格式已過期或資料不完整）。這些紀錄不會顯示，但不影響新的分析與儲存。
          </p>
        ) : (
          <p>目前沒有已儲存的案件。請先在分析頁完成一次分析並按下「儲存到案件紀錄」。</p>
        )}
        <p>
          <Link href="/">回到分析訊息</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="case-log">
      {skippedCount > 0 ? (
        <p className="input-help" role="status">
          已略過 {skippedCount} 筆無法讀取的舊紀錄。
        </p>
      ) : null}
      <div className="case-log-toolbar">
        <button aria-label="下載 JSON" onClick={handleExport} type="button">
          下載 JSON
        </button>
        {exportMessage ? (
          <p className="inline-status" role="status">
            {exportMessage}
          </p>
        ) : null}
      </div>

      <ol className="case-log-list">
        {entries.map((entry) => (
          <li key={entry.id} className="card case-log-item">
            <header>
              <time dateTime={entry.createdAt}>
                {new Date(entry.createdAt).toLocaleString("zh-TW")}
              </time>
              <p className={`risk-badge risk-${entry.analysis.riskLevel}`}>
                {riskLevelLabel(entry.analysis.riskLevel)}
              </p>
            </header>
            <ul className="category-list" aria-label="風險類別">
              {entry.analysis.categories.map((category, index) => (
                <li key={`${entry.id}-${category.id}-${index}`}>
                  <span>{category.labelZh}</span>
                  <span className="category-confidence">信心：{CONFIDENCE_LABELS[category.confidence]}</span>
                </li>
              ))}
            </ul>
            <p>{entry.analysis.explanationZh}</p>
            <details>
              <summary>改進建議與下一步</summary>
              <ol className="improvement-list">
                {entry.analysis.inputImprovementZh.map((tip, index) => <li key={`tip-${index}`}>{tip}</li>)}
              </ol>
              <ol>
                {entry.analysis.nextStepsZh.map((step, index) => <li key={`step-${index}`}>{step}</li>)}
              </ol>
            </details>
            {entry.messageHash ? (
              <p className="hash-note">訊息指紋：{entry.messageHash.slice(0, 12)}…（不含原始訊息）</p>
            ) : null}
            <CopyButton label="複製諮詢摘要" text={formatConsultationSummary(entry.analysis)} />
            <footer className="result-disclaimer">{FIXED_DISCLAIMER}</footer>
          </li>
        ))}
      </ol>
    </section>
  );
}
