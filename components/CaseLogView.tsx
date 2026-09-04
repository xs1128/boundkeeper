"use client";

import { useEffect, useState } from "react";
import type { CaseLogEntry } from "@/src/case-log/types";
import { listCaseEntries } from "@/src/case-log/store";
import { exportCaseLogAsJson } from "@/src/case-log/export";
import { riskLevelLabel } from "@/components/risk-labels";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";

type ViewState = "loading" | "empty" | "ready" | "error";

export function CaseLogView() {
  const [entries, setEntries] = useState<CaseLogEntry[]>([]);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    let active = true;

    listCaseEntries()
      .then((nextEntries) => {
        if (!active) {
          return;
        }

        setEntries(nextEntries);
        setViewState(nextEntries.length === 0 ? "empty" : "ready");
      })
      .catch(() => {
        if (active) {
          setViewState("error");
        }
      });

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
        <p>目前沒有已儲存的案件。請先在分析頁完成一次分析並按下「儲存到案件紀錄」。</p>
      </section>
    );
  }

  return (
    <section className="case-log">
      <div className="case-log-toolbar">
        <button onClick={handleExport} type="button">
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
            <p>{entry.analysis.explanationZh}</p>
            {entry.messageHash ? (
              <p className="hash-note">訊息指紋：{entry.messageHash.slice(0, 12)}…</p>
            ) : null}
            <footer className="result-disclaimer">{FIXED_DISCLAIMER}</footer>
          </li>
        ))}
      </ol>
    </section>
  );
}
