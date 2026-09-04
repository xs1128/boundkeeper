// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/components/copy-text";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("clipboard fallback", () => {
  it("uses the clipboard API without creating a temporary field", async () => {
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    expect(await copyText("修改後的回覆")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("修改後的回覆");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it.each(["denied", "unavailable"])("copies with the legacy fallback when clipboard is %s", async (condition) => {
    if (condition === "denied") {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Denied"));
    } else {
      vi.spyOn(navigator, "clipboard", "get").mockReturnValue(undefined as unknown as Clipboard);
    }
    const button = document.createElement("button");
    document.body.append(button);
    button.focus();
    const execCommand = vi.fn(() => {
      const field = document.activeElement as HTMLTextAreaElement;
      expect(field.value).toBe("修改後的回覆");
      expect(field.selectionStart).toBe(0);
      expect(field.selectionEnd).toBe(field.value.length);
      return true;
    });
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    try {
      expect(await copyText("修改後的回覆")).toBe(true);
      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(document.activeElement).toBe(button);
      expect(document.querySelector("textarea")).toBeNull();
    } finally {
      Reflect.deleteProperty(document, "execCommand");
    }
  });

  it.each([false, "throw"])("cleans up and restores focus when legacy copy fails: %s", async (outcome) => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Denied"));
    const button = document.createElement("button");
    document.body.append(button);
    button.focus();
    Object.defineProperty(document, "execCommand", { configurable: true, value: () => {
      if (outcome === "throw") throw new Error("Unsupported");
      return outcome;
    } });
    try {
      expect(await copyText("回覆")).toBe(false);
      expect(document.activeElement).toBe(button);
      expect(document.querySelector("textarea")).toBeNull();
    } finally {
      Reflect.deleteProperty(document, "execCommand");
    }
  });
});
