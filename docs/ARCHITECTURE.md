# Superseded — Decision Ledger

> **Team pivot:** Canonical architecture is now **[../ARCHITECTURE.md](../ARCHITECTURE.md)** (界線守門員 / Labor Filter).  
> Product spec: **[../SPEC.md](../SPEC.md)**.

---

# Decision Ledger — architecture (MVP, archived)

Hackathon: FUTUREMODE BUILDMODE Track **03 Future of Work**. ~36h. Host: **Vercel**.

Pain + cites: [track-03-pain.md](track-03-pain.md). Constraints: [hackathon-brief.md](hackathon-brief.md).

## 1. What we ship

One **event** = one messy meeting. User uploads **text** sources (transcript, chat dump, optional “AI recap”). A **single tool-using agent** proposes decision objects with quotes. UI shows `proposed` / `conflict` / `confirmed`. Named human **stamps**. Conflict **blocks** handoff rows. Demo plants (1) recap inversion vs transcript (2) meeting-vs-chat fight.

**Not shipping:** Slack/Notion OAuth, Whisper (CSZS-zh-en WER ~29% on large-v2 — bilingual pain is ASR; we skip audio), multi-agent swarm, chatbot as the product, auto-Jira. Google already ships a Decisions block — we do **conflict + stamp**, not another Aligned/Shelved list.

## 2. Why this shape

| Constraint | Consequence |
| --- | --- |
| Judges have 3 min | Vertical slice: upload → objects → catch lie → stamp → 1-page handoff. One metric: planted conflicts found / planted. |
| Recap market is full | Google Meet Decisions + Otter exist. Product = refuse-to-act + human stamp. |
| Recap ≠ chat | Microsoft Recap = transcript only. Copilot Q&A mixes chat (≤24h) + speech, **no conflict object**. Demo = that split. |
| Meet bilingual = refuse | Gemini notes = one language, no zh-TW spoken. Fixtures = **zh-TW + EN code-switch text**, not “we beat Google ASR.” |
| Vercel Function body **4.5 MB** | Files go **browser → Blob**, not through the extract function. [Uploads](https://vercel.com/kb/guide/vercel-file-uploads) |
| Agent loop is I/O-bound (model + DB) | One Function + Fluid compute. Default **300s** is enough if sources are text + step cap. Do not start on Workflow/Queues. |
| Track 03, not Track 01 prize | Agent is plumbing. Pitch = how the team operates after the meeting. |
| No company tenant | Synthetic ZH/EN fixtures in repo. “Load demo event” button. |

## 3. Domain

```
Event
  id, title, createdAt
Source
  id, eventId, kind: transcript | chat | recap, blobUrl, text
Decision
  id, eventId, claim, owner?, due?
  quotes: { sourceId, span, text }[]
  status: proposed | conflict | confirmed | rejected
  planted?: boolean          # demo only
Stamp
  decisionId, actorName, at, note?
Conflict
  id, eventId, decisionIds[], reason, quoteA, quoteB
```

Invariant: **confirmed** only after stamp. Extract job may set `conflict`, never `confirmed`.

## 4. Runtime topology

```
Browser (Next.js App Router)
  upload ──token──► POST /api/blob          (tiny JSON)
  file   ─────────► Vercel Blob             (bypass 4.5MB)
  Run extract ────► POST /api/extract       (maxDuration 300)
                       │
                       ├─ read source text from Blob
                       ├─ ToolLoopAgent / generateText + tools
                       │    search_source
                       │    get_span
                       │    upsert_decision
                       │    flag_conflict
                       └─ write rows ──► Neon Postgres
  stamp ──────────► POST /api/decisions/:id/stamp
  handoff ────────► GET  /events/:id/handoff   (confirmed only)
```

One region for Function + DB (e.g. `iad1` or Tokyo if judges are TW — pick **one** close to team laptops for preview, `hnd1`/`nrt1` if available). Do not multi-region for MVP.

## 5. Tech stack (MVP)

| Layer | Pick | Why | Not |
| --- | --- | --- | --- |
| App | **Next.js App Router** (TS) | One repo, SSR pages + Route Handlers, Vercel native | SPA + separate API |
| UI | React + Tailwind (or shadcn if minutes left) | Fast. Ledger = table + quote drawer. | Fancy design system week |
| Agent | **Vercel AI SDK** + `@ai-sdk/openai` | OpenAI credits for all participants. `stopWhen` step cap. Tools = our loop. | LangGraph, CrewAI, raw fetch spaghetti |
| Model | `gpt-4.1-mini` or whatever the credit sheet names at opening | Cheap critic pass possible as 2nd `generateText` | Local LLM on laptop for the judged demo |
| DB | **Neon Postgres** via Vercel Marketplace + **Drizzle** | Preview DBs, SQL, stamps survive refresh | SQLite on Function (ephemeral), Prisma migrate drama |
| Files | **Vercel Blob** client upload | Transcripts can exceed 4.5MB; demo fixtures can stay in git | Multipart through Server Actions |
| Auth | **None.** Optional `DEMO_PIN` cookie if stage Wi-Fi is feral | 36h. Judges click a public preview URL | NextAuth, Clerk |
| Host | **Vercel** Git integration: `main` = prod, PR = preview | You already know CI. Use it. | Docker, Fly, self-host GPU |
| CI | Vercel build = typecheck. Optional GH Action: `pnpm lint && pnpm test` on PR | Catch schema drift before Demo Day | Fancy multi-env matrix |

Hobby plan: Function max **300s**. Keep `maxSteps` ~8–12, sources < ~100k chars combined. If extract still times out: split critic into `POST /api/critic` or bump Pro `maxDuration` (800s). [Duration](https://vercel.com/docs/functions/configuring-functions/duration)

## 6. Repo layout (when we scaffold)

```
app/
  page.tsx                      # upload + load demo
  events/[id]/page.tsx          # ledger
  events/[id]/handoff/page.tsx
  api/blob/route.ts
  api/extract/route.ts          # export const maxDuration = 300
  api/decisions/[id]/stamp/route.ts
lib/
  db/schema.ts
  agent/tools.ts
  agent/run-extract.ts
  fixtures/                     # planted ZH/EN event
tests/
  agent/conflict.test.ts        # planted strings → must flag
  stamp.test.ts                 # cannot confirm via extract
```

## 7. Agent (how / where)

**Where:** only `POST /api/extract` after sources exist. Not in stamp. Not in a chat widget.

**How:** one model, tools, hard cap.

```
system: Propose decisions. Every claim needs a quote span.
        If two sources disagree, flag_conflict. Never confirm.
tools:  search_source(sourceId, query)
        get_span(sourceId, start, end)
        upsert_decision(...)
        flag_conflict(...)
stop:   stepCountIs(N) or model yields
after:  optional second generateText: "attack these decisions;
        find inversion vs transcript" → extra flags
```

Seed the **recap** source with a known lie. Critic must surface it or the demo fails. Unit-test that fixture without calling OpenAI if we snapshot expected flags; one live eval before submit.

## 8. Hosting + CI/CD

1. `vercel` project on this GitHub repo. Preview URL on every push — that is the judge URL.
2. Env (Preview + Production): `OPENAI_API_KEY`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`. Never commit.
3. Neon: one `preview` branch per Vercel preview if Marketplace integration is on; else a single shared preview DB and wipe on extract of demo event.
4. Blob: private; app fetches server-side for the agent. Do not require public ACL for PII-shaped fixtures.
5. You know pipelines: optional `lint/test` GitHub Action as a required check so a broken extract test cannot merge to the branch you demo.

Local: `pnpm dev` + Neon branch or Docker Postgres. Blob `onUploadCompleted` webhook is flaky on localhost — for local, allow Server Action upload of **small** fixture `.txt` (<4.5MB) as a dev-only path.

## 9. 36h build order

1. Schema + seed fixture (planted inversion + chat conflict). Tests that encode the plant.
2. Pages: ledger table, quote drawer, stamp, handoff. Fixture load with no LLM.
3. Extract route + tools. Wire OpenAI.
4. Metric chip: `plantedCaught / plantedTotal`.
5. ZH/EN polish, 3-min script, freeze fixtures.

Cut if slipping: critic as a second call; Blob (use tiny files through the function); Drizzle polish (raw SQL).

## 10. Demo script (architecture must support)

1. Load demo event. Show messy ZH/EN sources.
2. Run extract. Rows appear as objects, not a paragraph.
3. Point at inversion + conflict. Metric moves.
4. Stamp one clean row. Show handoff **omits** unstamped + conflict.
5. One sentence: “Copilot mixes transcript + chat and still gives you a paragraph. We emit a conflict object and block the handoff.”
