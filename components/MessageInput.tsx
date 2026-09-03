import type { FormEvent } from "react";

type MessageInputProps = {
  text: string;
  isSubmitting: boolean;
  onChange: (text: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessageInput({
  text,
  isSubmitting,
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
        maxLength={8000}
        placeholder="例如：明天沒做完就不用來了…"
        value={text}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="actions">
        <span className="counter">{text.length} / 8,000</span>
        <button disabled={text.length === 0 || isSubmitting} type="submit">
          {isSubmitting ? "連接中…" : "檢查這則訊息"}
        </button>
      </div>
    </form>
  );
}
