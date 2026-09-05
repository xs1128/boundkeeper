"use client";

import Link from "next/link";

export default function LogRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="card empty-state">
      <h2>案件紀錄無法顯示</h2>
      <p role="alert">讀取或顯示本機紀錄時發生錯誤。若剛更新過網站，請重新整理；若仍失敗，可能是舊紀錄格式不相容。</p>
      <p>
        <button type="button" onClick={() => reset()}>
          重試
        </button>
      </p>
      <p>
        <Link href="/">回到分析訊息</Link>
      </p>
    </section>
  );
}
