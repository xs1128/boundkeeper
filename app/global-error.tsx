"use client";

import { useEffect } from "react";

const RELOAD_FLAG = "labor-filter:navigation-reload";

function isRecoverableNavigationFailure(error: Error): boolean {
  const message = error.message ?? "";

  return (
    message.includes("Connection closed") ||
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch RSC payload") ||
    message.includes("Load failed")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isRecoverableNavigationFailure(error)) {
      return;
    }

    if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
      return;
    }

    sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
  }, [error]);

  return (
    <html lang="zh-Hant">
      <body>
        <main className="shell">
          <section className="card empty-state">
            <h1>頁面無法載入</h1>
            <p>可能是部署更新或網路中斷造成。請重新整理後再試一次。</p>
            <p>
              <button type="button" onClick={() => reset()}>
                重新整理
              </button>
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
