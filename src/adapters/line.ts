import { createHmac, timingSafeEqual } from "node:crypto";
import { analyzeMessage } from "../analysis/analyze-message";
import { FIXED_DISCLAIMER } from "../analysis/disclaimer";
import { AnalysisError } from "../analysis/errors";
import { plantedFixtures } from "../analysis/fixtures/planted";
import { normalizeMessage } from "../analysis/normalize";
import type { AnalyzeResult } from "../analysis/types";
import type { AdapterMessage, MessageAdapter } from "./types";

export const LINE_REPLY_API_URL = "https://api.line.me/v2/bot/message/reply";
export const LINE_TEXT_LIMIT = 5000;
export const LINE_MAX_MESSAGES = 5;

const SECTION_GAP = "\n\n";
const RISK_LABELS: Record<AnalyzeResult["riskLevel"], string> = {
  none: "無明顯風險",
  low: "低風險",
  medium: "中等風險",
  high: "高風險",
};
const RISK_EMOJI: Record<AnalyzeResult["riskLevel"], string> = {
  none: "🟢",
  low: "🟡",
  medium: "🟠",
  high: "🔴",
};
export const SHORT_DISCLAIMER_LINE = "⚠️ 僅供一般資訊，非法律意見；完整聲明見加好友訊息或網站。";

export class LineUnsupportedEventError extends Error {
  constructor() {
    super("LINE event is not a supported text message.");
    this.name = "LineUnsupportedEventError";
  }
}

export type LineWebhookHandleResult = {
  status: number;
  body: { ok: boolean };
  work?: Promise<void>;
};

export type LineWebhookDeps = {
  env?: NodeJS.Dict<string>;
  analyzeMessage?: typeof analyzeMessage;
  fetch?: typeof fetch;
};

type LineTextEvent = {
  type: "message";
  mode?: string;
  replyToken: string;
  webhookEventId?: string;
  deliveryContext?: { isRedelivery?: boolean };
  message: { type: "text"; text: string };
};

type LineFollowOrJoinEvent = {
  type: "follow" | "join";
  replyToken: string;
  webhookEventId?: string;
  deliveryContext?: { isRedelivery?: boolean };
};

export function verifyLineSignature(
  rawBody: string,
  signature: string | null | undefined,
  channelSecret: string,
): boolean {
  if (!channelSecret || !signature) return false;
  const expected = createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function truncateUtf16(text: string, maxChars: number): string {
  if (maxChars <= 0) return "";
  if (text.length <= maxChars) return text;
  let end = maxChars;
  const last = text.charCodeAt(end - 1);
  if (last >= 0xd800 && last <= 0xdbff) end -= 1;
  return text.slice(0, Math.max(0, end));
}

export function fitLineText(text: string, maxChars = LINE_TEXT_LIMIT): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return "（無內容）";
  if (trimmed.length <= maxChars) return trimmed;
  const ellipsis = "…";
  return `${truncateUtf16(trimmed, maxChars - ellipsis.length).trimEnd()}${ellipsis}`;
}

function disclaimerSection(result?: AnalyzeResult): string {
  const extras = result?.disclaimers.filter((text) => text !== FIXED_DISCLAIMER) ?? [];
  const fixed = `【聲明】\n${FIXED_DISCLAIMER}`;
  if (!extras.length) return fitLineText(fixed);
  const combined = `${fixed}\n${extras.join("\n")}`;
  if (combined.length <= LINE_TEXT_LIMIT) return combined;
  const budget = LINE_TEXT_LIMIT - fixed.length - 1;
  if (budget < 1) return fitLineText(fixed);
  return `${fixed}\n${fitLineText(extras.join("\n"), budget)}`;
}

export function packLineMessages(sections: string[], disclaimer: string): string[] {
  const fittedDisclaimer = fitLineText(disclaimer);
  const packed: string[] = [];
  let current = "";

  const flush = () => {
    if (current) packed.push(current);
    current = "";
  };

  for (const section of sections.filter(Boolean)) {
    const piece = fitLineText(section);
    if (!current) {
      current = piece;
      continue;
    }
    if (current.length + SECTION_GAP.length + piece.length <= LINE_TEXT_LIMIT) {
      current += `${SECTION_GAP}${piece}`;
    } else {
      flush();
      current = piece;
    }
  }
  flush();

  while (packed.length > LINE_MAX_MESSAGES - 1) {
    packed.splice(0, 2, fitLineText(`${packed[0]}${SECTION_GAP}${packed[1]}`));
  }

  const last = packed.at(-1);
  if (last && last.length + SECTION_GAP.length + fittedDisclaimer.length <= LINE_TEXT_LIMIT) {
    packed[packed.length - 1] = `${last}${SECTION_GAP}${fittedDisclaimer}`;
  } else {
    packed.push(fittedDisclaimer);
  }

  while (packed.length > LINE_MAX_MESSAGES) {
    packed.splice(0, 2, fitLineText(`${packed[0]}${SECTION_GAP}${packed[1]}`));
  }

  return packed.map((text) => fitLineText(text)).filter(Boolean);
}

function firstSentence(text: string): string {
  const match = text.match(/^[^。！？\n]*[。！？]/);
  return match ? match[0] : text;
}

export function formatLineReplyMessages(result: AnalyzeResult): string[] {
  const primaryCategory = result.categories[0]?.labelZh ?? "未分類";
  const extraCategories = result.categories.length - 1;
  const categoryLine = extraCategories > 0 ? `${primaryCategory} 等 ${result.categories.length} 項` : primaryCategory;
  const headline = firstSentence(result.explanationZh);
  const actionLine = result.nextStepsZh[0] ? `📌 ${result.nextStepsZh[0]}` : "";

  const topLaw = result.legalRefs[0];
  const extraLaws = result.legalRefs.length - 1;
  const lawLine = topLaw
    ? `📖 ${topLaw.statute}${topLaw.url ? `\n${topLaw.url}` : ""}${extraLaws > 0 ? `（另有 ${extraLaws} 項法規，網站查看）` : ""}`
    : "";

  return packLineMessages(
    [
      `${RISK_EMOJI[result.riskLevel]} ${RISK_LABELS[result.riskLevel]}｜${categoryLine}\n${headline}`,
      actionLine,
      lawLine,
      "更多建議與完整分析請至網站查看。",
    ],
    SHORT_DISCLAIMER_LINE,
  );
}

export function formatLineErrorMessages(messageZh: string): string[] {
  return packLineMessages(
    [`【分析未完成】\n${messageZh}`],
    SHORT_DISCLAIMER_LINE,
  );
}

export function formatLineWelcomeMessages(): string[] {
  return packLineMessages(
    ["您好，我是勞權濾網。貼上主管訊息，我會分析風險，附上法規來源與回覆建議。"],
    disclaimerSection(),
  );
}

export function isLineFollowOrJoinEvent(raw: unknown): raw is LineFollowOrJoinEvent {
  if (!raw || typeof raw !== "object") return false;
  const event = raw as Record<string, unknown>;
  if (event.type !== "follow" && event.type !== "join") return false;
  if (typeof event.replyToken !== "string" || !event.replyToken) return false;
  const delivery = event.deliveryContext;
  if (delivery && typeof delivery === "object" && (delivery as { isRedelivery?: unknown }).isRedelivery === true) {
    return false;
  }
  return true;
}

export function isSupportedLineTextEvent(raw: unknown): raw is LineTextEvent {
  if (!raw || typeof raw !== "object") return false;
  const event = raw as Record<string, unknown>;
  if (event.type !== "message") return false;
  if (event.mode === "standby") return false;
  if (typeof event.replyToken !== "string" || !event.replyToken) return false;
  const delivery = event.deliveryContext;
  if (delivery && typeof delivery === "object" && (delivery as { isRedelivery?: unknown }).isRedelivery === true) {
    return false;
  }
  const message = event.message;
  if (!message || typeof message !== "object") return false;
  const payload = message as Record<string, unknown>;
  return payload.type === "text" && typeof payload.text === "string" && payload.text.trim().length > 0;
}

function analysisModeFor(text: string): "live" | "fixture" {
  try {
    const normalized = normalizeMessage(text);
    return plantedFixtures.some((item) => normalizeMessage(item.message) === normalized)
      ? "fixture"
      : "live";
  } catch {
    return "live";
  }
}

export const lineAdapter: MessageAdapter = {
  id: "line",
  async receive(raw) {
    if (!isSupportedLineTextEvent(raw)) throw new LineUnsupportedEventError();
    return {
      text: raw.message.text,
      metadata: {
        replyToken: raw.replyToken,
        ...(typeof raw.webhookEventId === "string" ? { webhookEventId: raw.webhookEventId } : {}),
      },
    };
  },
  async reply(payload, metadata) {
    const replyToken = metadata.replyToken;
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() ?? "";
    if (!replyToken || !accessToken) return;
    await sendLineReply(replyToken, formatLineReplyMessages(payload), accessToken, fetch);
  },
};

async function sendLineReply(
  replyToken: string,
  texts: string[],
  accessToken: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  const messages = texts
    .map((text) => fitLineText(text))
    .filter(Boolean)
    .slice(0, LINE_MAX_MESSAGES)
    .map((text) => ({ type: "text" as const, text }));
  if (!messages.length) return;

  const response = await fetchImpl(LINE_REPLY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!response.ok) {
    console.info(`[line-webhook] reply failed status=${response.status}`);
  }
}

async function processWelcomeEvent(
  event: LineFollowOrJoinEvent,
  deps: { accessToken: string; fetch: typeof fetch },
): Promise<void> {
  if (!deps.accessToken) {
    console.info("[line-webhook] welcome reply skipped: missing access token");
    return;
  }
  try {
    await sendLineReply(event.replyToken, formatLineWelcomeMessages(), deps.accessToken, deps.fetch);
  } catch {
    console.info("[line-webhook] welcome reply request failed");
  }
}

async function processSupportedEvent(
  event: LineTextEvent,
  deps: Required<Pick<LineWebhookDeps, "analyzeMessage" | "fetch">> & { accessToken: string },
): Promise<void> {
  const received: AdapterMessage = await lineAdapter.receive(event);
  let messages: string[];
  try {
    const result = await deps.analyzeMessage({
      text: received.text,
      locale: "zh-TW",
      mode: analysisModeFor(received.text),
    });
    messages = formatLineReplyMessages(result);
  } catch (error) {
    const messageZh = error instanceof AnalysisError
      ? error.messageZh
      : new AnalysisError("ANALYSIS_UNAVAILABLE").messageZh;
    messages = formatLineErrorMessages(messageZh);
  }

  if (!deps.accessToken) {
    console.info("[line-webhook] reply skipped: missing access token");
    return;
  }
  try {
    await sendLineReply(received.metadata.replyToken, messages, deps.accessToken, deps.fetch);
  } catch {
    console.info("[line-webhook] reply request failed");
  }
}

export function handleLineWebhook(
  rawBody: string,
  signature: string | null | undefined,
  deps: LineWebhookDeps = {},
): LineWebhookHandleResult {
  const env = deps.env ?? process.env;
  const channelSecret = env.LINE_CHANNEL_SECRET?.trim() ?? "";
  const accessToken = env.LINE_CHANNEL_ACCESS_TOKEN?.trim() ?? "";
  const analyze = deps.analyzeMessage ?? analyzeMessage;
  const fetchImpl = deps.fetch ?? fetch;

  if (!channelSecret) {
    return { status: 503, body: { ok: false } };
  }
  if (!verifyLineSignature(rawBody, signature, channelSecret)) {
    return { status: 401, body: { ok: false } };
  }

  let events: unknown[] = [];
  try {
    const payload = JSON.parse(rawBody) as { events?: unknown };
    events = Array.isArray(payload.events) ? payload.events : [];
  } catch {
    return { status: 200, body: { ok: true } };
  }

  const supported = events.filter(isSupportedLineTextEvent);
  const welcomes = events.filter(isLineFollowOrJoinEvent);
  const work = Promise.allSettled([
    ...supported.map((event) => processSupportedEvent(event, {
      accessToken,
      analyzeMessage: analyze,
      fetch: fetchImpl,
    })),
    ...welcomes.map((event) => processWelcomeEvent(event, { accessToken, fetch: fetchImpl })),
  ]).then(() => undefined);

  return { status: 200, body: { ok: true }, work };
}
