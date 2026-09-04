# Build plan — 勞權濾網

This plan divides the hackathon build into three independently executable workstreams. The canonical requirements are [`SPEC.md`](SPEC.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md); do not use the superseded Decision Ledger documents under `docs/` as implementation guidance.

## Repository scout (2026-09-04)

The repository is a compiling scaffold, not a working MVP yet.

- `pnpm test`: passes, but only 4 scaffold assertions run; 4 test files are skipped/TODO.
- `pnpm lint` and `pnpm build`: pass.
- `/api/analyze` validates input, then returns `501` because `analyzeMessage()` is a stub.
- The analysis pipeline, prompt, safety path, rules, post-validation, and fixture data are empty or throw `NotImplementedError`.
- The web page can submit text but only renders a status string. `AnalysisResult` and `FixturePicker` are not wired into the flow.
- Legal assets contain headings/placeholders only; there is no extracted, source-traceable corpus.
- Case log storage, JSON/PDF export, LINE, and Gmail are placeholders.
- `next-env.d.ts` already has an unrelated local generated change. Preserve it; do not include it in feature commits unless intentionally required by the build.

## Shared contract — freeze before parallel work

All three workstreams must program against these existing contracts:

- Core entrypoint: `analyzeMessage(input: AnalyzeInput): Promise<AnalyzeResult>` in `src/analysis/analyze-message.ts`.
- Result shape: `AnalyzeResult` in `src/analysis/types.ts` and `analyzeResultSchema` in `src/analysis/schemas/analyze-result.ts`.
- Input limit: trimmed text from 1 to 8,000 characters.
- Fixture call: `{ text, mode: "fixture" }` must never require a network call or `OPENAI_API_KEY`.
- Every successful result, including fixture and crisis results, includes the exact `FIXED_DISCLAIMER`.
- All transports call the shared core. No legal classification, law-copy, or risk heuristics may be added to UI or LINE files.
- User-facing copy is Traditional Chinese and describes risk/general information, never a certain legal verdict.

If the result contract must change, make one small contract-only commit first and notify the other workstreams before building on it. Prefer additive optional fields; do not rename existing fields during parallel work.

## Workstream A — analysis core and official legal data

**Goal:** make `analyzeMessage()` reliable online and deterministic for the demo fixtures, backed by traceable Taiwan legal sources.

**Own these paths:**

- `src/analysis/**`
- `assets/legal/**`
- `assets/fixtures/**`
- `tests/analysis/**`
- AI-related dependency additions in `package.json` / `pnpm-lock.yaml`

**Avoid editing:** `app/**`, `components/**`, `src/adapters/line.ts`, and `src/case-log/**`.

### A1. Curate and normalize the legal corpus

- Use official, publicly accessible sources as the primary source: the national law database and Ministry of Labor / Occupational Safety and Health Administration guidance.
- Cover only the categories required for the demo: workplace-bullying risk, overtime, transfer, dismissal/pressure to resign, and harsh-but-lawful management feedback. Add Gender Equality in Employment Act material only if a planted fixture uses it.
- For every excerpt record: official title, article/section, short verbatim excerpt or faithful summary, canonical URL, issuing body, last-verified date, and applicable effective date/version.
- Record source/licensing or reuse notes. Do not silently scrape a third-party legal commentary site into product data.
- Keep a human-readable source inventory in `assets/legal/` and add a small machine-readable corpus (JSON or TypeScript) that rules/prompts can consume. Validate required metadata at test/build time.
- Keep extraction/update code reproducible if automation is added. Extraction must produce reviewable data; it must not replace legal review.
- Do not add vector search or production RAG unless A1–A4 and the full MVP are already green.

### A2. Plant the deterministic demo set

- Add five fixtures: verbal bullying, illegal/unpaid overtime, unreasonable transfer, pressure to resign, and harsh-but-legal performance feedback.
- Give each fixture an expected primary category and minimum risk. The lawful feedback fixture must be `none` or `low`.
- Implement fixture/rule behavior without an OpenAI call. Exact fixture matching may select a curated result, while lightweight rules can supply hints for similar messages.
- Ensure rules do not convert a single hostile message into a conclusive workplace-bullying finding; include the required multi-element/continuity caveat.

### A3. Implement the single analysis pipeline

- Implement normalization, crisis detection, rule prefilter, live LLM analysis, post-validation, and output formatting in the order documented in `ARCHITECTURE.md`.
- Add Vercel AI SDK + OpenAI integration using structured output validated by Zod. Keep the model configurable with a safe default.
- Feed only curated legal context and rule hints into the live prompt. Require calibrated uncertainty and a de-escalating, rights-preserving Traditional Chinese reply.
- Crisis phrases short-circuit to 1925/1995/1955 resources and skip ordinary legal analysis.
- Post-validation must restore the fixed disclaimer, reject/repair unknown categories, downgrade confidence for very short inputs, and prevent empty reply/next-step output.
- Never log the source message or full prompt.

### A4. Tests and handoff

- Convert `planted-fixtures.test.ts` and `legal-feedback.test.ts` from TODOs to offline tests.
- Add focused tests for normalization, crisis routing, disclaimer enforcement, short-input confidence, schema validation, and legal-source metadata.
- Mock the live model boundary; keep an optional, explicitly named live smoke test out of the default test command.
- Publish one sanitized `AnalyzeResult` fixture that the web and LINE workstreams can import in their tests if useful.

**Acceptance criteria:**

- `pnpm test` runs all analysis tests without an API key.
- At least 4/5 planted fixtures return the expected primary category; lawful feedback is not above low risk.
- Fixture mode makes zero network requests.
- Every returned result contains `FIXED_DISCLAIMER` and source-specific law references where relevant.
- A live request either returns schema-valid output or a privacy-safe, user-friendly failure; it never fabricates a success response.

## Workstream B — complete and polish the product flow

**Goal:** turn the scaffold into a mobile-first, judge-ready journey from paste to understanding, reply, save, and export.

**Own these paths:**

- `app/page.tsx`, `app/log/page.tsx`, `app/globals.css`, and presentation-only changes to `app/layout.tsx`
- `components/**`
- `src/case-log/**`
- UI/case-log tests (add `tests/components/**` as needed and own `tests/case-log/**`)

**Avoid editing:** `src/analysis/**`, `assets/legal/**`, `assets/fixtures/**`, API analysis logic, and LINE files.

### B1. Finish the primary analysis journey

- Wire `FixturePicker` to the planted fixture export and send `mode: "fixture"` for a selected demo fixture.
- Parse successful `/api/analyze` responses as `AnalyzeResult`; render transport errors separately from legal results.
- Implement all result sections in the specified order: risk/categories, plain-language explanation, collapsible legal references, editable suggested reply with copy feedback, next steps, and fixed disclaimer.
- Use Traditional Chinese labels for risk levels. Do not show raw enum values to users.
- Add loading, timeout/retry, empty, API error, and success states without erasing the pasted message.
- Make clear that analysis does not happen until the user submits and that the message is not stored server-side by default.

### B2. Make the 3-minute demo resilient

- Prioritize mobile layout, readable type, obvious hierarchy, accessible focus states, and reduced-motion support.
- Fixture mode must remain demoable without OpenAI. Make the fixture selector understandable as example scenarios, not hidden test infrastructure.
- Add copy-to-clipboard behavior with a fallback/error state.
- Keep the fixed disclaimer visible on every result; the page footer alone is insufficient if a result can be captured or shared independently.
- Do not make unproven impact claims or use “違法確定”, “你會贏”, or equivalent verdict language.

### B3. Local-first case log and one export path

- Implement browser-only storage in `src/case-log/store.ts` (raw IndexedDB is acceptable to avoid dependency conflicts).
- Save only after an explicit user action. Store the analysis snapshot and metadata needed by the timeline; do not store the original supervisor message body. If hashing is used, hash in the browser.
- Complete `/log` with empty, loading, populated, and storage-error states.
- Implement user-initiated JSON download first. PDF is a cut item until JSON export and the full demo flow work.
- Exports must include the analysis, timestamp, fixed disclaimer, and a plain note that the export is a consultation aid rather than a legal determination.

### B4. Tests and handoff

- Test loading/error/success rendering, all mandatory result sections, fixture selection, copy behavior, explicit-save behavior, and absence of message bodies in stored/exported records.
- Use mocked `/api/analyze` responses matching the frozen contract; do not wait for live LLM availability.

**Acceptance criteria:**

- A user can select a fixture, analyze it, understand the result, edit/copy a reply, save the result, open the case log, and download JSON.
- The complete journey works at a 390 px viewport with keyboard navigation and without horizontal scrolling.
- No original supervisor message body is written to browser or server persistence.
- The result component independently renders the fixed disclaimer.

## Workstream C — LINE integration

**Goal:** deliver one secure LINE path using the shared analysis core, without creating alternate legal behavior.

**Own these paths:**

- `src/adapters/line.ts`
- `app/api/webhooks/line/route.ts`
- `tests/adapters/line.test.ts` and route-focused LINE tests
- `.env.example` and the LINE setup/runbook (create `docs/line-integration.md`)

**Avoid editing:** `src/analysis/**`, web UI/components, legal assets, case log, and Gmail. Gmail remains cut unless every required MVP criterion is complete.

### C1. Choose the path once

- Default to a Messaging API bot because the existing webhook route is scaffolded and the demo script explicitly shows forwarding a message to a bot.
- If channel credentials or public webhook setup are unavailable early, switch to LIFF embedding and reuse the web page. Record the choice and demo steps in the runbook; do not attempt both paths.

### C2. Implement a thin, secure adapter

- Verify `x-line-signature` against the exact raw request body with HMAC-SHA256 and `LINE_CHANNEL_SECRET` before parsing or acknowledging events.
- Handle text message events only. Safely ignore follow/unfollow, redelivery, image, sticker, and unsupported events.
- Convert each supported event to `AdapterMessage`, call `analyzeMessage()` once, and format a concise Traditional Chinese reply from the returned fields.
- Respect LINE reply-token lifetime and text limits. Split deterministically on section boundaries and cap output rather than truncating the disclaimer or producing invalid payloads.
- Call LINE Reply API with `LINE_CHANNEL_ACCESS_TOKEN`; do not log message text, raw webhook bodies, tokens, or full analysis responses.
- Return webhook HTTP responses promptly and consistently. Handle duplicate/redelivered events without double analysis/reply if practical within the stateless deployment constraint.

### C3. Test and document without credentials

- Add signature verification tests using fixed secrets and raw payloads, including invalid/missing signatures.
- Add event parsing, unsupported-event, message chunking/limit, API failure, and no-secret configuration tests.
- Mock `analyzeMessage()` and `fetch`; tests must not call LINE or OpenAI.
- Document LINE Developers console setup, required environment variables, webhook URL, verification command, local tunnel option, and a two-message demo script.
- `.env.example` should list `OPENAI_API_KEY`, optional model configuration if used by Workstream A, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, and `LINE_LIFF_ID` only if the LIFF path was selected. Never add real values.

**Acceptance criteria:**

- Invalid signatures cannot reach `analyzeMessage()`.
- A valid text event calls the shared core exactly once and sends a valid reply.
- Unsupported events return success without throwing or leaking data.
- All tests run offline with fake credentials.
- The runbook lets another teammate reproduce the LINE demo.

## Integration owner — merge and release gate

This is a short coordination role, not a fourth feature workstream. One teammate should own merge order and resolve contract/dependency conflicts.

1. Land any agreed shared-contract change.
2. Merge Workstream A so the API and offline fixtures are real.
3. Merge Workstream B and run the complete browser demo path.
4. Merge Workstream C last; verify it only imports the shared core and contains no legal logic.
5. Remove obsolete `NotImplementedError` branches and update scaffold tests that intentionally expected failure.
6. Run `pnpm test`, `pnpm lint`, `pnpm build`, and `git diff --check`.
7. Test the exact 3-minute flow from `SPEC.md` on a mobile viewport and the deployed Vercel URL.
8. Confirm the deployment has only necessary environment variables and that logs contain no message bodies.

## Shared definition of done

- Paste flow works live and with offline fixtures.
- Five planted fixtures exist; at least four classify correctly and lawful feedback stays none/low.
- Every user-facing result contains the fixed disclaimer and calibrated language.
- One local-only save + JSON export path works without persisting original message text.
- No channel forks `analyzeMessage()` or embeds its own legal rules.
- Crisis strings route to helplines without ordinary legal analysis.
- LINE is demoed only after the web MVP is stable; Gmail, PDF, RAG, auth, metrics, and Postgres remain explicit cuts.
- Tests, lint, build, and diff checks pass; the public preview completes the demo on mobile.

## Suggested branch names

- `feat/analysis-legal-corpus`
- `feat/web-product-flow`
- `feat/line-integration`

Each branch should make small, scoped commits and include its verification commands in the final commit/PR note.
