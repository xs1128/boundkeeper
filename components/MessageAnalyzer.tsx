"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { analyzeInputSchema } from "@/src/analysis/schemas/analyze-input";
import type { AnalyzeResult as AnalyzeResultData } from "@/src/analysis/types";
import { EMPTY_CONVERSATION, readConversation, writeConversation, type Conversation } from "@/src/analysis/conversation-session";
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
  | { status: "error"; message: string };

export function MessageAnalyzer() {
  const [conversation, setConversation] = useState<Conversation>(EMPTY_CONVERSATION);
  const [sessionReady, setSessionReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const { text, fixtureId, completed } = conversation;
  const [state, setState] = useState<AnalysisState>({ status: "empty" });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const savingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const isSubmitting = state.status === "loading";

  useEffect(() => {
    const restored = readConversation();
    const fixture = fixtureOptions.find((option) => option.id === restored.conversation.fixtureId);
    // Browser-only storage is restored after hydration to match the server's empty form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversation({
      ...restored.conversation,
      fixtureId: fixture?.text === restored.conversation.text ? fixture.id : "",
    });
    setStorageAvailable(restored.available);
    setSessionReady(true);
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  function updateConversation(next: Conversation) {
    setConversation(next);
    setStorageAvailable(writeConversation(next));
  }

  function clearConversation() {
    requestRef.current?.abort();
    requestRef.current = null;
    updateConversation(EMPTY_CONVERSATION);
    setState({ status: "empty" });
    setSaveMessage("");
  }

  function changeText(value: string) {
    updateConversation({ ...conversation, text: value, fixtureId: "" });
    setState({ status: "empty" });
    setSaveMessage("");
  }

  function selectFixture(id: string) {
    const fixture = fixtureOptions.find((option) => option.id === id);
    updateConversation({ ...conversation, fixtureId: id, text: fixture?.text ?? text });
    setState({ status: "empty" });
    setSaveMessage("");
  }

  async function analyze() {
    if (!sessionReady || requestRef.current || savingRef.current) return;
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
      if (parsed.ok) {
        updateConversation({ ...conversation, completed: { sourceText: text, result: parsed.result } });
        setState({ status: "empty" });
      } else {
        setState({ status: "error", message: parsed.messageZh });
      }
    } catch {
      if (!controller.signal.aborted) {
        setState({ status: "error", message: "目前無法取得分析，請確認連線後重試。" });
      }
    } finally {
      clearTimeout(timeout);
      if (timedOut && requestRef.current === controller) {
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
    if (!completed || isSubmitting || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const messageHash = await hashMessage(completed.sourceText);
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
          disabled={!sessionReady || isSubmitting || isSaving}
          onSelect={selectFixture}
        />
        <p className="input-help" id="analysis-privacy">
          只有按下「檢查這則訊息」後才會分析。預設不會在伺服器儲存訊息。
          一般分析會將訊息傳送給 AI 服務。輸入與分析結果僅暫存於目前分頁，切頁或重新整理可還原；關閉分頁後清除。
        </p>
        <p className="input-help" role="status">
          {fixtureId
            ? "目前使用範例情境，不呼叫 AI。修改內容後會切換為一般分析。"
            : "目前使用一般分析；也可選擇上方範例情境試用。"}
        </p>
        {!storageAvailable && (
          <p className="input-help" role="alert">瀏覽器暫存無法使用，切頁或重新整理可能遺失內容；清除也可能無法移除先前暫存。</p>
        )}
        <MessageInput
          isSubmitting={isSubmitting}
          disabled={!sessionReady || isSubmitting || isSaving}
          onChange={changeText}
          onSubmit={handleSubmit}
          text={text}
        />
        <div className="actions">
          <button type="button" className="button-secondary" aria-label="清除對話" disabled={!sessionReady || isSaving} onClick={clearConversation}>
            清除對話
          </button>
        </div>
      </section>
      {state.status === "empty" && !completed && (
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
      {completed && (
        <>
          <p className="input-help" role="status">
            {text !== completed.sourceText
              ? "輸入內容已變更，下方結果仍對應上次分析原文。請再次檢查以更新結果。"
              : state.status !== "empty"
                ? "下方保留上次完成的分析結果。"
                : "分析完成，請查看下方結果。"}
          </p>
          <section className="card" aria-label="本次分析原文">
            <h2>本次分析原文</h2>
            <p className="preserve-lines">{completed.sourceText}</p>
          </section>
          <AnalysisResult
            result={completed.result}
            onSave={isSubmitting ? undefined : handleSave}
            isSaving={isSaving}
            saveMessage={saveMessage}
          />
        </>
      )}
    </div>
  );
}
