import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { POST } from "../../app/api/webhooks/line/route";
import {
  LINE_MAX_MESSAGES,
  LINE_REPLY_API_URL,
  LINE_TEXT_LIMIT,
  SHORT_DISCLAIMER_LINE,
  fitLineText,
  formatLineErrorMessages,
  formatLineReplyMessages,
  formatLineWelcomeMessages,
  handleLineWebhook,
  isLineFollowOrJoinEvent,
  isSupportedLineTextEvent,
  lineAdapter,
  LineUnsupportedEventError,
  verifyLineSignature,
} from "../../src/adapters/line";
import { AnalysisError } from "../../src/analysis/errors";
import { FIXED_DISCLAIMER } from "../../src/analysis/disclaimer";
import { plantedFixtures } from "../../src/analysis/fixtures/planted";
import type { AnalyzeResult } from "../../src/analysis/types";
import { SAMPLE_ANALYZE_RESULT } from "../../components/sample-analyze-result";

const FAKE_SECRET = "test_channel_secret_for_unit_tests";
const FAKE_TOKEN = "test_channel_access_token";
const OFFICIAL_BODY = '{"destination":"U8e742f61d673b39c7fff3cecb7536ef0","events":[]}';
const OFFICIAL_SECRET = "8c570fa6dd201bb328f1c1eac23a96d8";
const OFFICIAL_SIGNATURE = "GhRKmvmHys4Pi8DxkF4+EayaH0OqtJtaZxgTD9fMDLs=";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function sign(body: string, secret = FAKE_SECRET) {
  return createHmac("sha256", secret).update(body).digest("base64");
}

function textEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "message",
    mode: "active",
    replyToken: "reply-token-1",
    webhookEventId: "event-1",
    deliveryContext: { isRedelivery: false },
    source: { type: "user", userId: "U123" },
    timestamp: 1,
    message: { type: "text", id: "msg-1", text: plantedFixtures[0].message },
    ...overrides,
  };
}

function webhookBody(events: unknown[]) {
  return JSON.stringify({ destination: "Ubot", events });
}

function signedRequest(body: string, secret = FAKE_SECRET, signature?: string) {
  return new Request("http://localhost/api/webhooks/line", {
    method: "POST",
    headers: signature === "" ? {} : { "x-line-signature": signature ?? sign(body, secret) },
    body,
  });
}

describe("LINE signature verification", () => {
  it("accepts the official LINE sample webhook vector", () => {
    expect(verifyLineSignature(OFFICIAL_BODY, OFFICIAL_SIGNATURE, OFFICIAL_SECRET)).toBe(true);
  });

  it("rejects missing, wrong-length, or mismatched signatures", () => {
    const body = webhookBody([]);
    expect(verifyLineSignature(body, null, FAKE_SECRET)).toBe(false);
    expect(verifyLineSignature(body, "", FAKE_SECRET)).toBe(false);
    expect(verifyLineSignature(body, "abc", FAKE_SECRET)).toBe(false);
    expect(verifyLineSignature(body, sign(body, "other-secret"), FAKE_SECRET)).toBe(false);
    expect(verifyLineSignature(`${body} `, sign(body), FAKE_SECRET)).toBe(false);
  });
});

describe("LINE event parsing", () => {
  it("accepts active text messages and ignores unsupported or redelivered events", () => {
    expect(isSupportedLineTextEvent(textEvent())).toBe(true);
    expect(isSupportedLineTextEvent({ type: "follow", replyToken: "r" })).toBe(false);
    expect(isSupportedLineTextEvent({ type: "unfollow" })).toBe(false);
    expect(isSupportedLineTextEvent(textEvent({ message: { type: "image", id: "1" } }))).toBe(false);
    expect(isSupportedLineTextEvent(textEvent({ message: { type: "sticker", id: "1" } }))).toBe(false);
    expect(isSupportedLineTextEvent(textEvent({ deliveryContext: { isRedelivery: true } }))).toBe(false);
    expect(isSupportedLineTextEvent(textEvent({ mode: "standby" }))).toBe(false);
    expect(isSupportedLineTextEvent(textEvent({ message: { type: "text", text: "   " } }))).toBe(false);
  });

  it("maps a text event to adapter metadata without throwing on receive", async () => {
    const received = await lineAdapter.receive(textEvent());
    expect(received.text).toBe(plantedFixtures[0].message);
    expect(received.metadata.replyToken).toBe("reply-token-1");
    await expect(lineAdapter.receive({ type: "follow" })).rejects.toBeInstanceOf(LineUnsupportedEventError);
  });
});

describe("LINE reply chunking", () => {
  it("keeps the short disclaimer line and stays within LINE payload limits", () => {
    const messages = formatLineReplyMessages(SAMPLE_ANALYZE_RESULT);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.length).toBeLessThanOrEqual(LINE_MAX_MESSAGES);
    expect(messages.join("\n")).toContain(SHORT_DISCLAIMER_LINE);
    expect(messages.join("\n")).toContain("加班與工資風險");
    expect(messages.every((text) => text.length <= LINE_TEXT_LIMIT)).toBe(true);
  });

  it("splits long sections and never truncates the short disclaimer line", () => {
    const huge: AnalyzeResult = {
      ...SAMPLE_ANALYZE_RESULT,
      explanationZh: "解釋".repeat(4000),
      elementsNote: "提醒".repeat(2000),
      inputImprovementZh: Array.from({ length: 20 }, () => "建議".repeat(400)),
      nextStepsZh: Array.from({ length: 20 }, () => "下一步".repeat(400)),
      legalRefs: Array.from({ length: 6 }, (_, index) => ({
        statute: `法規 ${index}`,
        summaryZh: "摘要".repeat(800),
      })),
    };
    const messages = formatLineReplyMessages(huge);
    expect(messages.length).toBeLessThanOrEqual(LINE_MAX_MESSAGES);
    expect(messages.some((text) => text.includes(SHORT_DISCLAIMER_LINE))).toBe(true);
    const disclaimerMessage = messages.find((text) => text.includes(SHORT_DISCLAIMER_LINE));
    expect(disclaimerMessage).toContain(SHORT_DISCLAIMER_LINE);
    expect(messages.every((text) => text.length <= LINE_TEXT_LIMIT)).toBe(true);
    expect(fitLineText("短文")).toBe("短文");
  });

  it("keeps the short disclaimer line on analysis failures", () => {
    const messages = formatLineErrorMessages("目前無法完成分析，請稍後再試，或先使用範例情境。");
    expect(messages.join("\n")).toContain(SHORT_DISCLAIMER_LINE);
    expect(messages.join("\n")).toContain("分析未完成");
  });

  it("sends the full fixed disclaimer once in the welcome message", () => {
    const messages = formatLineWelcomeMessages();
    expect(messages.join("\n")).toContain(FIXED_DISCLAIMER);
  });
});

describe("LINE follow/join event parsing", () => {
  it("accepts follow and join events with a reply token, rejects everything else", () => {
    expect(isLineFollowOrJoinEvent({ type: "follow", replyToken: "r" })).toBe(true);
    expect(isLineFollowOrJoinEvent({ type: "join", replyToken: "r" })).toBe(true);
    expect(isLineFollowOrJoinEvent({ type: "follow" })).toBe(false);
    expect(isLineFollowOrJoinEvent({ type: "unfollow", replyToken: "r" })).toBe(false);
    expect(isLineFollowOrJoinEvent({ type: "message", replyToken: "r" })).toBe(false);
    expect(
      isLineFollowOrJoinEvent({ type: "follow", replyToken: "r", deliveryContext: { isRedelivery: true } }),
    ).toBe(false);
  });
});

describe("LINE webhook handling", () => {
  it("does not analyze invalid signatures", async () => {
    const analyze = vi.fn();
    const fetchImpl = vi.fn();
    const body = webhookBody([textEvent()]);
    const result = handleLineWebhook(body, sign(body, "wrong"), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    expect(result.status).toBe(401);
    expect(analyze).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns 503 when the channel secret is missing", () => {
    const analyze = vi.fn();
    const result = handleLineWebhook(webhookBody([]), "sig", {
      env: { LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: vi.fn(),
    });
    expect(result.status).toBe(503);
    expect(analyze).not.toHaveBeenCalled();
  });

  it("returns 200 for LINE's empty verification payload", async () => {
    const analyze = vi.fn();
    const result = handleLineWebhook(OFFICIAL_BODY, OFFICIAL_SIGNATURE, {
      env: { LINE_CHANNEL_SECRET: OFFICIAL_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: vi.fn(),
    });
    expect(result.status).toBe(200);
    await result.work;
    expect(analyze).not.toHaveBeenCalled();
  });

  it("ignores unsupported events without analyzing or throwing", async () => {
    const analyze = vi.fn();
    const fetchImpl = vi.fn();
    const body = webhookBody([
      { type: "unfollow" },
      { type: "follow", replyToken: "" },
      textEvent({ deliveryContext: { isRedelivery: true } }),
      textEvent({ message: { type: "image", id: "img" } }),
      textEvent({ message: { type: "sticker", id: "sticker" } }),
    ]);
    const result = handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    expect(result.status).toBe(200);
    await result.work;
    expect(analyze).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends a one-time full-disclaimer welcome reply on follow/join, without analyzing", async () => {
    const analyze = vi.fn();
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    const body = webhookBody([
      { type: "follow", replyToken: "follow-token" },
      { type: "join", replyToken: "join-token" },
    ]);
    const result = handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    expect(result.status).toBe(200);
    await result.work;
    expect(analyze).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const tokens = fetchImpl.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).replyToken);
    expect(tokens.sort()).toEqual(["follow-token", "join-token"]);
    for (const [, init] of fetchImpl.mock.calls) {
      const payload = JSON.parse(String(init?.body));
      expect(payload.messages[0].text).toContain(FIXED_DISCLAIMER);
    }
  });

  it("analyzes a valid text event once and sends a LINE reply", async () => {
    const analyze = vi.fn(async () => SAMPLE_ANALYZE_RESULT);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    const body = webhookBody([textEvent()]);
    const result = handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    expect(result.status).toBe(200);
    await result.work;
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(analyze).toHaveBeenCalledWith({
      text: plantedFixtures[0].message,
      locale: "zh-TW",
      mode: "fixture",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(LINE_REPLY_API_URL);
    const payload = JSON.parse(String(init?.body));
    expect(payload.replyToken).toBe("reply-token-1");
    expect(payload.messages[0].type).toBe("text");
    expect(
      payload.messages.some((message: { text: string }) => message.text.includes(SHORT_DISCLAIMER_LINE)),
    ).toBe(true);
    expect(JSON.stringify(payload)).not.toContain(FAKE_TOKEN);
  });

  it("uses live mode for non-fixture text", async () => {
    const analyze = vi.fn(async () => SAMPLE_ANALYZE_RESULT);
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const event = textEvent({ message: { type: "text", text: "明天會議改到下午三點。" } });
    const body = webhookBody([event]);
    const result = handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    await result.work;
    expect(analyze).toHaveBeenCalledWith({
      text: "明天會議改到下午三點。",
      locale: "zh-TW",
      mode: "live",
    });
  });

  it("replies with a safe failure when analysis throws, and survives LINE API errors", async () => {
    const analyze = vi.fn(async () => {
      throw new AnalysisError("ANALYSIS_UNAVAILABLE");
    });
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("nope", { status: 400 }));
    const body = webhookBody([textEvent({ message: { type: "text", text: "一般訊息" } })]);
    const result = handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    await expect(result.work).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));
    expect(payload.messages[0].text).toContain("目前無法完成分析");
    expect(
      payload.messages.some((message: { text: string }) => message.text.includes(SHORT_DISCLAIMER_LINE)),
    ).toBe(true);
  });

  it("skips reply when the access token is missing", async () => {
    const analyze = vi.fn(async () => SAMPLE_ANALYZE_RESULT);
    const fetchImpl = vi.fn();
    const body = webhookBody([textEvent()]);
    const result = handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    });
    expect(result.status).toBe(200);
    await result.work;
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not log message text, tokens, or the raw body", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const analyze = vi.fn(async () => SAMPLE_ANALYZE_RESULT);
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 500 }));
    const secretText = "今晚全組下班後再做四小時";
    const body = webhookBody([textEvent({ message: { type: "text", text: secretText } })]);
    await handleLineWebhook(body, sign(body), {
      env: { LINE_CHANNEL_SECRET: FAKE_SECRET, LINE_CHANNEL_ACCESS_TOKEN: FAKE_TOKEN },
      analyzeMessage: analyze,
      fetch: fetchImpl,
    }).work;
    const logged = info.mock.calls.map((call) => call.map(String).join(" ")).join("\n");
    expect(logged).not.toContain(secretText);
    expect(logged).not.toContain(FAKE_TOKEN);
    expect(logged).not.toContain(body);
  });
});

describe("LINE webhook route", () => {
  it("returns 401 for a missing signature and never reaches analysis", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", FAKE_SECRET);
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", FAKE_TOKEN);
    const response = await POST(signedRequest(webhookBody([textEvent()]), FAKE_SECRET, ""));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false });
  });

  it("returns 503 when credentials are not configured", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "");
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "");
    const body = webhookBody([]);
    const response = await POST(signedRequest(body));
    expect(response.status).toBe(503);
  });

  it("returns 200 for a valid empty webhook without the old 501 placeholder", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", OFFICIAL_SECRET);
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", FAKE_TOKEN);
    const response = await POST(signedRequest(OFFICIAL_BODY, OFFICIAL_SECRET, OFFICIAL_SIGNATURE));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
