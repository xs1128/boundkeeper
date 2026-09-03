import type { CaseLogEntry } from "./types";

export class CaseExportNotImplementedError extends Error {
  constructor() {
    super("Case export is not implemented yet.");
    this.name = "CaseExportNotImplementedError";
  }
}

export function exportCaseLogAsJson(_entries: CaseLogEntry[]): never {
  void _entries;
  throw new CaseExportNotImplementedError();
}

export function exportCaseLogAsPdf(_entries: CaseLogEntry[]): never {
  void _entries;
  throw new CaseExportNotImplementedError();
}
