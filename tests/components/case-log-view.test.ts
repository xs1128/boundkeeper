// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaseLogView } from "@/components/CaseLogView";
import { SAMPLE_ANALYZE_RESULT } from "@/components/sample-analyze-result";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { listCaseEntries } from "@/src/case-log/store";
import { exportCaseLogAsJson } from "@/src/case-log/export";

vi.mock("@/src/case-log/store", () => ({ listCaseEntries: vi.fn() }));
vi.mock("@/src/case-log/export", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/case-log/export")>();
  return { ...actual, exportCaseLogAsJson: vi.fn() };
});

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const entry = {
  id: "entry-1",
  createdAt: "2026-09-04T03:00:00.000Z",
  messageHash: "abc123def456",
  analysis: SAMPLE_ANALYZE_RESULT,
};

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

async function render() {
  await act(async () => root.render(createElement(CaseLogView)));
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.mocked(listCaseEntries).mockReset();
  vi.mocked(exportCaseLogAsJson).mockReset();
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("case log view", () => {
  it("explains the empty state and links back to analysis", async () => {
    vi.mocked(listCaseEntries).mockResolvedValue({ entries: [], skippedCount: 0 });
    await render();
    await act(async () => {
      await vi.waitFor(() => expect(container.textContent).toContain("目前沒有已儲存的案件"));
    });
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
  });

  it("explains when only unreadable legacy records remain", async () => {
    vi.mocked(listCaseEntries).mockResolvedValue({ entries: [], skippedCount: 2 });
    await render();
    await act(async () => {
      await vi.waitFor(() => expect(container.textContent).toContain("找到 2 筆無法讀取的舊紀錄"));
    });
  });

  it("shows a storage error without entries", async () => {
    vi.mocked(listCaseEntries).mockRejectedValue(new Error("blocked"));
    await render();
    await act(async () => {
      await vi.waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull());
    });
    expect(container.textContent).toContain("無法讀取本機案件紀錄");
  });

  it("renders saved analysis without original message text and can export JSON", async () => {
    vi.mocked(listCaseEntries).mockResolvedValue({ entries: [entry], skippedCount: 0 });
    await render();
    await act(async () => {
      await vi.waitFor(() => expect(container.textContent).toContain(SAMPLE_ANALYZE_RESULT.explanationZh));
    });
    expect(container.textContent).toContain("高風險");
    expect(container.textContent).toContain(SAMPLE_ANALYZE_RESULT.categories[0].labelZh);
    expect(container.textContent).toContain("不含原始訊息");
    expect(container.textContent).toContain(FIXED_DISCLAIMER);
    expect(container.textContent).not.toContain("今晚全組下班後再做四小時");
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="下載 JSON"]')!.click();
    });
    expect(exportCaseLogAsJson).toHaveBeenCalledWith([entry]);
    expect(container.textContent).toContain("已下載 JSON 檔案");
  });
});
