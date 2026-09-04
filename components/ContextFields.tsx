type ContextFieldsProps = {
  workerRole: string;
  industry: string;
  messageCountFromSender: string;
  disabled?: boolean;
  fixtureSelected: boolean;
  onChange: (field: "workerRole" | "industry" | "messageCountFromSender", value: string) => void;
};

export function ContextFields({
  workerRole,
  industry,
  messageCountFromSender,
  disabled = false,
  fixtureSelected,
  onChange,
}: ContextFieldsProps) {
  return (
    <details className="context-fields">
      <summary>補充工作背景（選填）</summary>
      <p className="input-help">
        職務、產業與先前訊息則數只作為持續性或產業脈絡提示，不會寫入案件紀錄。
        {fixtureSelected ? "目前使用範例情境，送出時不會帶入這些欄位。" : "一般分析時會一併送出已填欄位。"}
      </p>
      <div className="context-grid">
        <label htmlFor="worker-role">
          職務
          <input
            id="worker-role"
            name="workerRole"
            maxLength={100}
            disabled={disabled}
            value={workerRole}
            onChange={(event) => onChange("workerRole", event.target.value)}
          />
        </label>
        <label htmlFor="worker-industry">
          產業
          <input
            id="worker-industry"
            name="industry"
            maxLength={100}
            disabled={disabled}
            value={industry}
            onChange={(event) => onChange("industry", event.target.value)}
          />
        </label>
        <label htmlFor="message-count">
          同一主管先前訊息則數
          <input
            id="message-count"
            name="messageCountFromSender"
            inputMode="numeric"
            maxLength={4}
            disabled={disabled}
            value={messageCountFromSender}
            onChange={(event) => onChange("messageCountFromSender", event.target.value)}
          />
        </label>
      </div>
    </details>
  );
}
