import type { FormEvent } from "react";

type MessageInputProps = {
  text: string;
  isSubmitting: boolean;
  disabled?: boolean;
  onChange: (text: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessageInput({
  text,
  isSubmitting,
  disabled = isSubmitting,
  onChange,
  onSubmit,
}: MessageInputProps) {
  return (
    <form onSubmit={onSubmit}>
      <label id="message-label" htmlFor="manager-message">
        貼上主管傳來的訊息
      </label>
      <textarea
        id="manager-message"
        name="message"
        disabled={disabled}
        aria-describedby="analysis-privacy message-count"
        placeholder="例如：明天沒做完就不用來了…"
        value={text}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="actions">
        <span className="counter" id="message-count">{text.trim().length} / 8,000</span>
        <button disabled={text.trim().length === 0 || disabled} type="submit">
          {isSubmitting ? "分析中…" : "檢查這則訊息"}
        </button>
      </div>
    </form>
  );
}
