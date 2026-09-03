"use client";

import { FormEvent, useState } from "react";
import { MessageInput } from "./MessageInput";

type ApiError = {
  error?: {
    messageZh?: string;
  };
};

export function MessageAnalyzer() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("正在連接分析入口…");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json()) as ApiError;
      setStatus(body.error?.messageZh ?? "分析入口已連接。");
    } catch {
      setStatus("目前無法連接服務，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card" aria-labelledby="message-label">
      <MessageInput
        isSubmitting={isSubmitting}
        onChange={setText}
        onSubmit={handleSubmit}
        text={text}
      />
      {status ? (
        <p className="status" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
