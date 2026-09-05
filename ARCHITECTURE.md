# ARCHITECTURE — 界線守門員 (Labor Filter)

Technical architecture for the worker-side Taiwan labor-law message filter. MVP is **paste-in web app**; LINE / Gmail / other channels are **optional adapters** behind a shared analysis core.

**Product spec:** [SPEC.md](SPEC.md)

---

## 1. System context

```
┌─────────────────────────────────────────────────────────────────┐
│                         Worker devices                          │
│  Browser (MVP)  │  LINE (stretch)  │  Gmail (stretch)  │  …     │
└────────┬────────────────┬──────────────────┬────────────────────┘
         │                │                  │
         v                v                  v
┌────────────────────────────────────────────────────────────────┐
│                     Intake adapters (thin)                      │
│  Web form  │  LINE webhook  │  Gmail push/pull  │  Extension  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             v
┌────────────────────────────────────────────────────────────────┐
│                   Analysis core (shared)                        │
│  normalize → classify → cite laws → draft reply → format      │
└────────────────────────────┬───────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              v              v              v
        Local case log   Optional metrics   Export (PDF/JSON)
        (browser IDB)    (anon counts)      (client-side)
```

**Design principle:** adapters are dumb transports; all legal logic lives in one module so LINE and Gmail do not fork behavior.

---

## 2. MVP topology (hackathon)

```
Browser (Next.js App Router, mobile-first)
  │
  ├─ POST /api/analyze          ← primary path (maxDuration 60–120)
  │     ├─ validate input
  │     ├─ run analysis core (LLM + rules)
  │     └─ return structured JSON (no message persist)
  │
  ├─ GET  /api/health
  │
  └─ static fixtures            ← demo offline fallback

Optional (stretch):
  POST /api/webhooks/line       ← LINE Messaging API
  POST /api/webhooks/gmail      ← Gmail push notification → fetch snippet
```

No auth, no Postgres required for MVP. Case log stays in **IndexedDB** via client module.

---

## 3. Analysis core

Single entrypoint:

```ts
analyzeMessage(input: AnalyzeInput): Promise<AnalyzeResult>
```

### 3.1 Input

```ts
type AnalyzeInput = {
  text: string;                    // supervisor message
  locale?: "zh-TW";               // default zh-TW
  context?: {
    messageCountFromSender?: number;  // hint for 持續性, not verdict
    workerRole?: string;
    industry?: string;
  };
  mode?: "live" | "fixture";      // fixture skips LLM for demo plants
};
```

### 3.2 Output

```ts
type AnalyzeResult = {
  riskLevel: "none" | "low" | "medium" | "high";
  categories: Array<{
    id: string;                   // e.g. workplace_bullying, illegal_overtime
    labelZh: string;
    confidence: "low" | "medium" | "high";
  }>;
  legalRefs: Array<{
    statute: string;              // e.g. "職安法 §22-1"
    summaryZh: string;
    url?: string;
  }>;
  explanationZh: string;
  suggestedReplyZh: string;
  nextStepsZh: string[];
  disclaimers: string[];          // always included
  elementsNote?: string;          // e.g. 職霸五要件提醒
};
```

### 3.3 Pipeline stages

```
1. normalize(text)           trim, unify quotes, detect language mix
2. safetyCheck(text)         crisis → helplines, skip legal analysis
3. rulePrefilter(text)       fast regex/keyword → category hints (optional)
4. llmAnalyze(text, hints)   structured output via schema / tool call
5. postValidate(result)      require disclaimer; clamp confidence on thin input
6. format(result)            UI-ready payload
```

**LLM:** Vercel AI SDK + OpenAI (`gpt-4.1-mini` or hackathon credit sheet). Use `generateObject` with Zod schema for stable JSON.

**Rules layer:** lightweight patterns for demo reliability on planted fixtures (e.g. 「不准請假除非」「24小時 on call」「自己離職」). Rules augment, not replace, LLM.

**RAG (stretch):** embed chunks from `assets/legal/` (statute excerpts, 職霸指引手冊 summaries). MVP can use static few-shot examples in prompt.

---

## 4. Privacy architecture

| Data | MVP handling |
|------|----------------|
| Supervisor message body | Sent to LLM for analysis; **not** written to DB; draft and last analyzed text temporarily kept in the current tab's `sessionStorage` |
| Analysis result | Latest result temporarily kept alongside its source text in `sessionStorage`; persistent local case-log storage requires explicit saving |
| Case log | **IndexedDB** on device; export is user-initiated download |
| Server logs | Request ID + latency + category IDs only; no message text |
| LINE/Gmail tokens | Env vars; per-user tokens only if stretch OAuth implemented |

**Trust message for pitch:** “Your boss’s words don’t live on our server by default.”

For hackathon demo on shared Wi-Fi: offer **fixture mode** that never calls OpenAI.

---

## 5. Frontend architecture

```
app/
  page.tsx                      # paste + analyze + result cards
  log/page.tsx                  # local case timeline (stretch)
  api/analyze/route.ts
  api/webhooks/line/route.ts    # stretch
src/
  analysis/
    analyze-message.ts          # core orchestrator
    prompts/system.zh-TW.ts
    schemas/analyze-result.ts
    rules/prefilter.ts
    fixtures/planted.ts
  case-log/
    store.ts                    # IndexedDB wrapper
    export.ts                   # PDF/JSON
  adapters/
    types.ts                    # shared MessageAdapter contract
    web.ts
    line.ts                     # stretch
    gmail.ts                    # stretch
components/
  MessageInput.tsx
  AnalysisResult.tsx
  Disclaimer.tsx
  FixturePicker.tsx
```

UI sections for result:

1. Risk badge + categories  
2. “白話解釋”  
3. “可能涉及的法規” (collapsible)  
4. “建議回覆” (copy button)  
5. “你可以做的事”  
6. Fixed disclaimer  

---

## 6. Channel adapters (stretch)

Implement **`MessageAdapter`** interface:

```ts
interface MessageAdapter {
  id: "web" | "line" | "gmail";
  receive(raw: unknown): Promise<{ text: string; metadata: Record<string, string> }>;
  reply?(payload: AnalyzeResult, metadata: Record<string, string>): Promise<void>;
}
```

### 6.1 LINE (priority stretch)

**Options:**

| Approach | Effort | Demo fit |
|----------|--------|----------|
| **LIFF mini-app** | Medium | User opens LIFF → paste or share target message → same web UI |
| **Messaging API bot** | Medium–High | User forwards text to bot → bot replies with analysis |

**Flow (bot):**

```
User forwards message to bot
  → POST /api/webhooks/line
  → verify signature (LINE_CHANNEL_SECRET)
  → extract text from event
  → analyzeMessage()
  → reply via LINE Reply API (chunk if long)
```

**Env:** `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, optional `LINE_LIFF_ID`.

**Constraints:** Reply API text limits → split `suggestedReply` and `explanation` across bubbles or link to web result page with opaque ID (if we add ephemeral cache — prefer inline for hackathon).

### 6.2 Gmail (stretch)

**Options:**

| Approach | Effort | Notes |
|----------|--------|-------|
| **Google Apps Script add-on** | Medium | Sidebar paste/analyze; calls our `/api/analyze` |
| **Gmail API + Pub/Sub** | High | Watch inbox; heavy OAuth consent |

Hackathon recommendation: **Apps Script sidebar** or **manual paste in web app with “Gmail copy helper” UX** unless OAuth is already set up.

**Minimal Gmail path:** Web UI + instructions to copy boss email body (zero Google review).

### 6.3 Future adapters

- Microsoft Teams personal bot (cf. Rakshak POSH pattern)
- Browser extension (content script → `/api/analyze`)
- Slack DM (worker-owned workspace — rare)

---

## 7. Tech stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| App | **Next.js App Router** (TypeScript) | Vercel-native, fast SSR + API routes |
| UI | React + Tailwind | Mobile-first demo |
| AI | **Vercel AI SDK** + `@ai-sdk/openai` | Structured output, hackathon credits |
| Validation | **Zod** | API + LLM schema |
| Local storage | **idb-keyval** or raw IndexedDB | Case log without backend |
| DB | **None for MVP** | Privacy story |
| Blob | **Not needed** | Text-only |
| Auth | **None** (MVP) | 36h constraint |
| Host | **Vercel** | Preview URL for judges |

Function config:

```ts
// app/api/analyze/route.ts
export const maxDuration = 60; // bump to 120 if needed
```

---

## 8. Repo layout (target)

```
src/                            # or lib/ at root — pick one at scaffold
  analysis/
  case-log/
  adapters/
app/
  page.tsx
  api/analyze/route.ts
tests/
  analysis/planted-fixtures.test.ts
  analysis/post-validate.test.ts
assets/
  legal/                        # statute excerpts, few-shot examples
  fixtures/messages/            # planted supervisor messages
```

Mirror `tests/` to analysis paths. **Tests must run without OpenAI** for planted fixtures (rule path or mocked LLM).

---

## 9. Build order (36h)

1. **Schemas + fixtures + tests** — planted messages → expected categories (no LLM).
2. **Web UI** — paste, result cards, disclaimer, fixture picker.
3. **`/api/analyze`** — wire LLM + postValidate.
4. **Case log** — IndexedDB append + export JSON.
5. **Polish** — mobile layout, 3-min demo script, metric chip (fixtures passed).
6. **Stretch** — LINE webhook OR LIFF; Gmail only if (5) is done.

Cut if slipping: PDF export, RAG, Gmail, case log UI (keep export button only).

---

## 10. Observability (minimal)

- `/api/health` for judges
- Console timing on analyze route
- Optional: anon counter `POST /api/metrics` with `{ categoryId, riskLevel }` only — **no text**

---

## 11. Security

- Rate limit `/api/analyze` by IP (Vercel middleware or upstash if time)
- LINE webhook: verify `x-line-signature`
- Never commit `.env`; document in `.env.example`
- CORS: default same-origin for MVP

---

## 12. Relation to old docs

`docs/ARCHITECTURE.md` described an earlier **Decision Ledger** idea. **This file is canonical** for the Labor Filter build. See [SPEC.md](SPEC.md) for product requirements.
