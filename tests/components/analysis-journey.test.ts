// @vitest-environment happy-dom

import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageAnalyzer } from "@/components/MessageAnalyzer";
import { AnalysisResult } from "@/components/AnalysisResult";
import { fixtureOptions } from "@/src/analysis/fixtures/options";
import { analyzeResultSchema } from "@/src/analysis/schemas/analyze-result";
import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";
import { saveCaseEntry } from "@/src/case-log/store";
import { serializeCaseLogExport } from "@/src/case-log/export";
import sanitizedResult from "@/assets/fixtures/sanitized-analysis-result.json";

vi.mock("@/src/case-log/store", () => ({ saveCaseEntry: vi.fn() }));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
const result = analyzeResultSchema.parse(sanitizedResult);

function query<T extends Element>(selector: string): T {
  const element = container.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

async function render(element: ReactElement = createElement(MessageAnalyzer)) {
  await act(async () => root.render(element));
}

async function edit(value: string, selector = "#manager-message") {
  const field = query<HTMLTextAreaElement>(selector);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function select(id: string) {
  await act(async () => {
    const picker = query<HTMLSelectElement>("select");
    picker.value = id;
    picker.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function submit() {
  await act(async () => {
    query<HTMLFormElement>("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

async function click(selector: string) {
  await act(async () => query<HTMLButtonElement>(selector).click());
}

beforeEach(() => {
  vi.mocked(saveCaseEntry).mockReset().mockResolvedValue();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(result)));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("B1 analysis journey", () => {
  it("starts empty, explains submission/privacy, and sends nothing while typing", async () => {
    await render();
    expect(container.textContent).toContain("尚未分析");
    expect(container.textContent).toContain("只有按下「檢查這則訊息」後才會分析");
    expect(container.textContent).toContain("預設不會在伺服器儲存訊息");
    expect(query<HTMLButtonElement>('button[type="submit"]').disabled).toBe(true);
    await edit("   \n  ");
    expect(query<HTMLButtonElement>('button[type="submit"]').disabled).toBe(true);
    await submit();
    expect(container.textContent).toContain("請輸入 1 至 8,000 個字元");
    await edit("待分析訊息");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(fixtureOptions)("submits $id as a fixture and renders successful analysis", async (fixture) => {
    await render();
    await select(fixture.id);
    expect(query<HTMLTextAreaElement>("#manager-message").value).toBe(fixture.text);
    expect(fetchMock).not.toHaveBeenCalled();
    await submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ text: fixture.text, mode: "fixture" });
    expect(query('[aria-label="分析結果"]').textContent).toContain(result.explanationZh);
    expect(query<HTMLTextAreaElement>("#manager-message").value).toBe(fixture.text);
  });

  it("switches edited fixtures to live mode and removes stale results", async () => {
    await render();
    await select(fixtureOptions[0].id);
    await submit();
    await edit("修改過的主管訊息");
    expect(query<HTMLSelectElement>("select").value).toBe("");
    expect(container.querySelector('[aria-label="分析結果"]')).toBeNull();
    expect(container.textContent).toContain("目前使用一般分析");
    await submit();
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string)).toEqual({ text: "修改過的主管訊息", mode: "live" });
  });

  it("validates trimmed input limits without discarding pasted content", async () => {
    await render();
    const tooLong = "字".repeat(8001);
    await edit(tooLong);
    await submit();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(query<HTMLTextAreaElement>("#manager-message").value).toBe(tooLong);
    await edit(`  ${"字".repeat(8000)}  `);
    await submit();
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).text).toHaveLength(8000);
  });

  it("shows pending state and prevents duplicate requests until completion", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await render();
    await edit("主管訊息");
    await submit();
    expect(container.textContent).toContain("正在分析");
    expect(query<HTMLButtonElement>('button[type="submit"]').disabled).toBe(true);
    expect(query<HTMLSelectElement>("select").disabled).toBe(true);
    expect(query<HTMLTextAreaElement>("#manager-message").disabled).toBe(true);
    await submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => finish(new Response(JSON.stringify(result))));
    expect(container.textContent).toContain("分析完成");
  });

  it("separates API failures from results, preserves input and explicitly retries", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      error: { code: "ANALYSIS_UNAVAILABLE", messageZh: "分析服務暫時無法使用，請稍後再試。" },
      disclaimer: FIXED_DISCLAIMER,
    }), { status: 503 }));
    await render();
    await select(fixtureOptions[1].id);
    await submit();
    expect(container.querySelector('[aria-label="分析結果"]')).toBeNull();
    expect(query('[role="alert"]').textContent).toContain("分析服務暫時無法使用");
    expect(query('.error-state').textContent).toContain(FIXED_DISCLAIMER);
    expect(query<HTMLTextAreaElement>("#manager-message").value).toBe(fixtureOptions[1].text);
    await click('.error-state button');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]!.body).toEqual(fetchMock.mock.calls[0][1]!.body);
    expect(container.querySelector('.error-state')).toBeNull();
    expect(container.querySelector('[aria-label="分析結果"]')).not.toBeNull();
  });

  it.each(["network", "html", "invalid-success", "invalid-error"])("handles %s without exposing transport details", async (failure) => {
    if (failure === "network") fetchMock.mockRejectedValueOnce(new Error("private transport detail"));
    if (failure === "html") fetchMock.mockResolvedValueOnce(new Response("<html>private transport detail</html>", { status: 504 }));
    if (failure === "invalid-success") fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ explanationZh: "private transport detail" })));
    if (failure === "invalid-error") fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "private transport detail" }), { status: 502 }));
    await render();
    await edit("保留這則訊息");
    await submit();
    expect(query('[role="alert"]').textContent).toBeTruthy();
    expect(container.textContent).not.toContain("private transport detail");
    expect(container.querySelector('[aria-label="分析結果"]')).toBeNull();
    expect(query<HTMLTextAreaElement>("#manager-message").value).toBe("保留這則訊息");
  });

  it("aborts after 30 seconds and permits manual retry with the original input", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      options!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    await render();
    await edit("等待分析的訊息");
    await submit();
    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(query('[role="alert"]').textContent).toContain("超過 30 秒");
    expect(fetchMock.mock.calls[0][1]!.signal!.aborted).toBe(true);
    expect(query<HTMLTextAreaElement>("#manager-message").value).toBe("等待分析的訊息");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await click('.error-state button');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("分析完成");
  });

  it("renders crisis resources as a successful result with no required legal references", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      ...result,
      categories: [{ id: "crisis", labelZh: "優先尋求安全支援", confidence: "high" }],
      explanationZh: "請先尋求安全支援：1925、1995、1955。",
      legalRefs: [],
    })));
    await render();
    await edit("安全分流測試");
    await submit();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(query('[aria-label="分析結果"]').textContent).toContain("1925、1995、1955");
    expect(query('details').textContent).toContain("本次結果未列出法規參考");
  });
});

describe("merged case-log integration", () => {
  it("saves only on explicit request, with the analysis snapshot and no original message", async () => {
    await render();
    await edit("主管原文唯一標記");
    await submit();
    expect(saveCaseEntry).not.toHaveBeenCalled();
    await click('.result-actions button');
    expect(saveCaseEntry).toHaveBeenCalledTimes(1);
    const entry = vi.mocked(saveCaseEntry).mock.calls[0][0];
    expect(entry.analysis.inputImprovementZh.length).toBeGreaterThan(0);
    expect(entry.analysis.disclaimers).toContain(FIXED_DISCLAIMER);
    expect(entry.messageHash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(entry).sort()).toEqual(["analysis", "createdAt", "id", "messageHash"]);
    expect(serializeCaseLogExport([entry])).not.toContain("主管原文唯一標記");
    expect(serializeCaseLogExport([entry])).toContain(entry.analysis.inputImprovementZh[0]);
    expect(container.textContent).toContain("已儲存到本機案件紀錄");
    await edit("下一則訊息");
    expect(container.querySelector('.result-actions')).toBeNull();
    expect(container.textContent).not.toContain("已儲存到本機案件紀錄");
  });

  it("prevents duplicate saves and input changes while saving", async () => {
    let finish!: () => void;
    vi.mocked(saveCaseEntry).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    await render();
    await select(fixtureOptions[0].id);
    await submit();
    await click('.result-actions button');
    expect(query<HTMLButtonElement>('.result-actions button').disabled).toBe(true);
    expect(query<HTMLTextAreaElement>('#manager-message').disabled).toBe(true);
    expect(query<HTMLSelectElement>('select').disabled).toBe(true);
    await click('.result-actions button');
    await submit();
    expect(saveCaseEntry).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(query<HTMLTextAreaElement>('#manager-message').disabled).toBe(false);
  });

  it("keeps analysis when storage fails, allowing retry", async () => {
    vi.mocked(saveCaseEntry).mockRejectedValueOnce(new Error("Storage unavailable"));
    await render();
    await select(fixtureOptions[0].id);
    await submit();
    await click('.result-actions button');
    expect(container.textContent).toContain("無法寫入本機案件紀錄");
    expect(container.querySelector('.analysis-result')).not.toBeNull();
    await click('.result-actions button');
    expect(saveCaseEntry).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("已儲存到本機案件紀錄");
  });
});

describe("B1 result", () => {
  it("renders all six sections in order, caveats, sources, and every disclaimer", async () => {
    await render(createElement(AnalysisResult, { result: { ...result, elementsNote: "需綜合情境判斷。" } }));
    const sections = [...container.querySelectorAll('.result-section')];
    expect(sections).toHaveLength(6);
    ["風險與類別", "白話解釋", "可能涉及的法規", "改進建議", "你可以做的事", FIXED_DISCLAIMER]
      .forEach((label, index) => expect(sections[index].textContent).toContain(label));
    expect(container.textContent).toContain("需綜合情境判斷。");
    result.categories.forEach((category) => expect(container.textContent).toContain(category.labelZh));
    result.inputImprovementZh.forEach((tip) => expect(container.textContent).toContain(tip));
    result.nextStepsZh.forEach((step) => expect(container.textContent).toContain(step));
    result.disclaimers.forEach((disclaimer) => expect(container.textContent).toContain(disclaimer));
    expect(query<HTMLDetailsElement>('details').open).toBe(false);
    expect(query<HTMLAnchorElement>('details a').href).toBe(result.legalRefs[0].url);
    await click('summary');
    expect(query<HTMLDetailsElement>('details').open).toBe(true);
  });

  it.each([
    ["none", "無明顯風險"], ["low", "低風險"], ["medium", "中等風險"], ["high", "高風險"],
  ] as const)("localizes risk %s as %s", async (riskLevel, label) => {
    await render(createElement(AnalysisResult, { result: { ...result, riskLevel } }));
    expect(query('.risk-badge').textContent).toBe(label);
  });

  it("keeps the fixed disclaimer even if omitted, and does not render unsafe source links", async () => {
    await render(createElement(AnalysisResult, { result: {
      ...result,
      disclaimers: [],
      legalRefs: [{ statute: "來源名稱", summaryZh: "摘要", url: "javascript:alert(1)" }],
    } }));
    expect(container.textContent).toContain(FIXED_DISCLAIMER);
    expect(container.textContent).toContain("來源名稱");
    expect(container.querySelector('a')).toBeNull();
  });
});
