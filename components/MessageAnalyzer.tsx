"use client";

import { FormEvent, useState } from "react";
import type { AnalyzeResult } from "@/src/analysis/types";
import { saveCaseEntry } from "@/src/case-log/store";
import { hashMessage } from "@/src/case-log/hash";
import { AnalysisResult } from "./AnalysisResult";
import { FixturePicker } from "./FixturePicker";
import { getFixtureOptions } from "./fixture-options";
import { MessageInput } from "./MessageInput";
import { parseAnalyzeResponse } from "./parse-analyze-response";
import { SAMPLE_ANALYZE_RESULT } from "./sample-analyze-result";

const fixtureOptions = getFixtureOptions();

export function MessageAnalyzer() {
  const [text, setText] = useState("");
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  function handleTextChange(nextText: string) {
    setText(nextText);
    if (selectedFixtureId) {
      const fixture = fixtureOptions.find((item) => item.id === selectedFixtureId);
      if (!fixture || fixture.text !== nextText) {
        setSelectedFixtureId(null);
      }
    }
  }

  function handleFixtureSelect(
    fixture: { id: string; label: string; text: string } | null,
  ) {
    if (!fixture) {
      setSelectedFixtureId(null);
      return;
    }

    setSelectedFixtureId(fixture.id);
    setText(fixture.text);
    setResult(null);
    setError(null);
    setSaveMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setError(null);
    setSaveMessage("");

    const mode = selectedFixtureId ? "fixture" : "live";

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const body: unknown = await response.json();
      const parsed = parseAnalyzeResponse(body);

      if (parsed.ok) {
        setResult(parsed.result);
        return;
      }

      setError(parsed.messageZh);
    } catch {
      setError("目前無法連接服務，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSave(analysis: AnalyzeResult) {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const messageHash = text.trim() ? await hashMessage(text) : undefined;
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
      setIsSaving(false);
    }
  }

  function handlePreviewSample() {
    setResult(SAMPLE_ANALYZE_RESULT);
    setError(null);
    setSaveMessage("");
  }

  return (
    <>
      <section className="card" aria-labelledby="message-label">
        <FixturePicker fixtures={fixtureOptions} onSelect={handleFixtureSelect} />

        <MessageInput
          isSubmitting={isSubmitting}
          onChange={handleTextChange}
          onSubmit={handleSubmit}
          text={text}
        />

        <p className="privacy-note">
          只有在你按下「檢查這則訊息」後才會送出分析；預設不會在 server 儲存訊息內容。
        </p>

        {isSubmitting ? (
          <p className="status" role="status">
            正在分析中，請稍候…
          </p>
        ) : null}

        {error ? (
          <div className="error-panel" role="alert">
            <p>{error}</p>
            {process.env.NODE_ENV === "development" ? (
              <button
                className="button-secondary"
                onClick={handlePreviewSample}
                type="button"
              >
                預覽結果版面（開發用）
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {result ? (
        <AnalysisResult
          key={result.explanationZh}
          isSaving={isSaving}
          onSave={handleSave}
          result={result}
          saveMessage={saveMessage}
        />
      ) : null}
    </>
  );
}
