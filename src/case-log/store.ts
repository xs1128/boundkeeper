import type { CaseLogEntry } from "./types";

export class CaseLogNotImplementedError extends Error {
  constructor() {
    super("Local case log is not implemented yet.");
    this.name = "CaseLogNotImplementedError";
  }
}

export async function listCaseEntries(): Promise<CaseLogEntry[]> {
  throw new CaseLogNotImplementedError();
}

export async function saveCaseEntry(_entry: CaseLogEntry): Promise<void> {
  void _entry;
  throw new CaseLogNotImplementedError();
}
