import { AnalysisError } from "./errors";

export function normalizeMessage(text: string): string {
  if (typeof text !== "string" || !text.trim() || text.trim().length > 8000) {
    throw new AnalysisError("INVALID_INPUT");
  }
  const normalized = text.normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200b\u2060\ufeff]/g, "")
    .replace(/[“”「」『』]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
  if (!normalized || normalized.length > 8000) throw new AnalysisError("INVALID_INPUT");
  return normalized;
}
