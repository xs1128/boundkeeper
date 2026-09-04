"use client";

import { useEffect, useId, useRef, useState } from "react";
import { copyText } from "./copy-text";

type CopyButtonProps = {
  label: string;
  text: string;
};

export function CopyButton({ label, text }: CopyButtonProps) {
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [fallbackFor, setFallbackFor] = useState<string | null>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const statusId = useId();
  const status = copiedFor === text ? "copied" : fallbackFor === text ? "fallback" : "idle";

  useEffect(() => {
    if (status !== "fallback" || !fallbackRef.current) return;
    fallbackRef.current.focus({ preventScroll: true });
    fallbackRef.current.select();
  }, [status, text]);

  async function handleCopy() {
    const ok = await copyText(text);
    setCopiedFor(ok ? text : null);
    setFallbackFor(ok ? null : text);
  }

  return (
    <div className="copy-control">
      <button
        type="button"
        className="button-secondary copy-button"
        aria-label={label}
        aria-describedby={status === "idle" ? undefined : statusId}
        onClick={() => void handleCopy()}
      >
        {label}
      </button>
      {status === "copied" && (
        <p className="inline-status" id={statusId} role="status">已複製到剪貼簿。</p>
      )}
      {status === "fallback" && (
        <>
          <p className="inline-status" id={statusId} role="status">無法自動複製，請改用下方已選取的文字手動複製。</p>
          <textarea
            ref={fallbackRef}
            className="copy-fallback"
            readOnly
            value={text}
            aria-label="可手動複製的文字"
          />
        </>
      )}
    </div>
  );
}
