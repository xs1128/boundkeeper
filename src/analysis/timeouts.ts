/** Model abort. Keep below the analyze route `maxDuration`. */
export const LIVE_TIMEOUT_MS = 45_000;

/** Browser fetch abort. Must exceed LIVE_TIMEOUT_MS so Gemini can finish. */
export const CLIENT_ANALYZE_TIMEOUT_MS = 60_000;

export const CLIENT_ANALYZE_TIMEOUT_SECONDS = CLIENT_ANALYZE_TIMEOUT_MS / 1000;
