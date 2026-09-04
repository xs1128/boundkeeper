"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { analyzeInputSchema } from "@/src/analysis/schemas/analyze-input";
import type { AnalyzeResult as AnalyzeResultData } from "@/src/analysis/types";
import { saveCaseEntry } from "@/src/case-log/store";
import { hashMessage } from "@/src/case-log/hash";
import { MessageInput } from "./MessageInput";
import { FixturePicker } from "./FixturePicker";
import { AnalysisResult } from "./AnalysisResult";
import { Disclaimer } from "./Disclaimer";
import { getFixtureOptions } from "./fixture-options";
import { parseAnalyzeResponse } from "./parse-analyze-response";

const fixtureOptions = getFixtureOptions();

type AnalysisState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: AnalyzeResultData };

export function MessageAnalyzer() {
  const [text, setText] = useState("");
  const [fixtureId, setFixtureId] = useState("");
  const [state, setState] = useState<AnalysisState>({ status: "empty" });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const savingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const isSubmitting = state.status === "loading";

  useEffect(() => () => requestRef.current?.abort(), []);

  function changeText(value: string) {
    setText(value);
    setFixtureId("");
    setState({ status: "empty" });
    setSaveMessage("");
  }

  function selectFixture(id: string) {
    setFixtureId(id);
    const fixture = fixtureOptions.find((option) => option.id === id);
    if (fixture) setText(fixture.text);
    setState({ status: "empty" });
    setSaveMessage("");
  }

  async function analyze() {
    if (requestRef.current || savingRef.current) return;
    const input = analyzeInputSchema.safeParse({
      text,
      mode: fixtureId ? "fixture" : "live",
    });
    if (!input.success) {
      setState({ status: "error", message: "請輸入 1 至 8,000 個字元的訊息（不含前後空白）。" });
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setState({ status: "loading" });
    setSaveMessage("");
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30_000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input.data),
        signal: controller.signal,
      });
      const body: unknown = await response.json();
      if (controller.signal.aborted) return;

      const parsed = parseAnalyzeResponse(body, response.ok);
      setState(parsed.ok
        ? { status: "success", result: parsed.result }
        : { status: "error", message: parsed.messageZh });
    } catch {
      if (!controller.signal.aborted) {
        setState({ status: "error", message: "目前無法取得分析，請確認連線後重試。" });
      }
    } finally {
      clearTimeout(timeout);
      if (timedOut) {
        setState({ status: "error", message: "分析等待超過 30 秒，請重試。訊息仍保留在輸入框中。" });
      }
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze();
  }

  async function handleSave(analysis: AnalyzeResultData) {
    if (state.status !== "success" || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const messageHash = await hashMessage(text);
      await saveCaseEntry({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        messageHash,
        analysis,
      });
      setSaveMessage("已儲存到本機案件紀錄。");
    } catch {
      setSaveMessage("無法寫入本機案件紀錄，請檢查瀏覽器儲存權限。");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="analysis-journey">
      <section className="card" aria-labelledby="message-label" aria-busy={isSubmitting}>
        <FixturePicker
          fixtures={fixtureOptions}
          selectedId={fixtureId}
          disabled={isSubmitting || isSaving}
          onSelect={selectFixture}
        />
        <p className="input-help" id="analysis-privacy">
          只有按下「檢查這則訊息」後才會分析。預設不會在伺服器儲存訊息。
          一般分析會將訊息傳送給 AI 服務。
        </p>
        <p className="input-help" role="status">
          {fixtureId
            ? "目前使用範例情境，不呼叫 AI。修改內容後會切換為一般分析。"
            : "目前使用一般分析；也可選擇上方範例情境試用。"}
        </p>
        <MessageInput
          isSubmitting={isSubmitting}
          disabled={isSubmitting || isSaving}
          onChange={changeText}
          onSubmit={handleSubmit}
          text={text}
        />
      </section>
      {state.status === "empty" && (
        <p className="input-help">尚未分析。貼上訊息或選擇範例，再按下檢查即可開始。</p>
      )}
      {isSubmitting && <p className="status" role="status">正在分析，請稍候…最多等待 30 秒。</p>}
      {state.status === "error" && (
        <section className="card error-state" aria-label="分析未完成">
          <p role="alert">{state.message}</p>
          <button type="button" onClick={() => void analyze()}>重試分析</button>
          <Disclaimer />
        </section>
      )}
      {state.status === "success" && (
        <>
          <p className="input-help" role="status">分析完成，請查看下方結果。</p>
          <AnalysisResult
            result={state.result}
            onSave={handleSave}
            isSaving={isSaving}
            saveMessage={saveMessage}
          />
        </>
      )}
    </div>
  );
}
