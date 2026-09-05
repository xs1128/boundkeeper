"use client";

import { useEffect } from "react";

const RELOAD_FLAG = "labor-filter:navigation-reload";

function isRecoverableNavigationFailure(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";

  return (
    message.includes("Connection closed") ||
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch RSC payload") ||
    message.includes("Load failed")
  );
}

function reloadOnce(): void {
  if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
    return;
  }

  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
}

export function NavigationRecovery() {
  useEffect(() => {
    sessionStorage.removeItem(RELOAD_FLAG);

    function handleError(event: ErrorEvent) {
      if (!isRecoverableNavigationFailure(event.error ?? event.message)) {
        return;
      }

      event.preventDefault();
      reloadOnce();
    }

    function handleRejection(event: PromiseRejectionEvent) {
      if (!isRecoverableNavigationFailure(event.reason)) {
        return;
      }

      event.preventDefault();
      reloadOnce();
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
