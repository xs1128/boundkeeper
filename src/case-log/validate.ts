import { caseLogEntrySchema } from "./schema";
import type { CaseLogEntry } from "./types";

export type CaseLogList = {
  entries: CaseLogEntry[];
  skippedCount: number;
};

export function parseStoredCaseLog(raw: unknown[]): CaseLogList {
  const entries: CaseLogEntry[] = [];
  let skippedCount = 0;

  for (const item of raw) {
    const parsed = caseLogEntrySchema.safeParse(item);
    if (parsed.success) {
      entries.push(parsed.data);
    } else {
      skippedCount += 1;
    }
  }

  entries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return { entries, skippedCount };
}
