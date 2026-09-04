import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import type { CaseLogEntry } from "./types";

export const EXPORT_NOTICE_ZH =
  "本資料僅供諮詢整理，不是法律認定；如需正式法律意見，請洽專業律師或 1955。";

export type CaseLogExportDocument = {
  exportedAt: string;
  noticeZh: string;
  disclaimer: string;
  entries: CaseLogEntry[];
};

export function buildCaseLogExportDocument(
  entries: CaseLogEntry[],
  exportedAt = new Date().toISOString(),
): CaseLogExportDocument {
  return {
    exportedAt,
    noticeZh: EXPORT_NOTICE_ZH,
    disclaimer: FIXED_DISCLAIMER,
    entries,
  };
}

export function serializeCaseLogExport(entries: CaseLogEntry[]): string {
  return JSON.stringify(buildCaseLogExportDocument(entries), null, 2);
}

export function exportCaseLogAsJson(entries: CaseLogEntry[]): void {
  if (typeof document === "undefined") {
    throw new Error("JSON export is only available in the browser.");
  }

  const payload = serializeCaseLogExport(entries);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `labor-filter-case-log-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportCaseLogAsPdf(_entries: CaseLogEntry[]): never {
  void _entries;
  throw new Error("PDF export is not implemented.");
}
