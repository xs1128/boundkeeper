# Analysis Core — Stream A handoff

Implemented against root `TASK.md` A1–A4. The public `AnalyzeInput`, `AnalyzeResult`, `analyzeResultSchema`, and fixed disclaimer remain compatible with the scaffold.

## Entry point and behavior

All adapters call `analyzeMessage(input)`. The core validates the same input schema as the Web adapter, normalizes text, checks crisis phrases, collects rule hints, chooses the fixture or live path, validates the result, and returns a fresh object matching the public schema.

- Input: 1–8,000 characters after trimming. Normalization standardizes Unicode width, quotes and line endings, removes selected invisible separators, and checks length again. Mixed Chinese/English text is retained.
- Fixture mode: only normalized exact matches of the 22 curated scenarios succeed. Unknown messages return `FIXTURE_NOT_FOUND`; there is no live fallback or generated guess. This path never loads the model module or needs credentials.
- Crisis: conservative phrase detection precedes both modes, rules and model calls. It returns `crisis`, no legal references, safety steps and 1925/1995/1955 resources. It includes quoted threats and may trigger on educational or negated phrases; it is not a clinical assessment and cannot detect every crisis.
- Live: Vercel AI SDK `generateObject` and `@ai-sdk/openai`, with a Zod provider schema. The model chooses curated source ids; the core supplies the actual legal names, summaries, URLs, caveats and attribution. User text and context are treated as untrusted data.
- Post-validation: unknown categories, missing/irrelevant legal sources, contradictory high-risk management-only classifications, invalid structure and selected verdict phrases fail safely. Missing reply/next steps are repaired with neutral text. Inputs shorter than 20 non-whitespace characters receive low category confidence. Bullying references always retain the multi-element and serious single-event caveat.

The phrase checks and structured-output validation do not prove semantic correctness. The curated fixture results are deterministic curated examples, not a measured live-model accuracy rate.

## Web and LINE integration

```ts
import { analyzeMessage } from "@/src/analysis/analyze-message";
import { plantedFixtures } from "@/src/analysis/fixtures/planted";

const fixture = plantedFixtures[0];
const result = await analyzeMessage({ text: fixture.message, mode: "fixture" });
```

`plantedFixtures` retains `id`, `label`, `message`, `expectedPrimaryCategory` and `minimumRiskLevel`. Its additional `result` field contains curated fixture content. Server adapters and core tests may use this export. For the Web picker, use the browser-safe `fixtureOptions` export below; its `text` field already matches the existing component.

`assets/fixtures/sanitized-analysis-result.json` is a complete, fictional overtime result for consumer tests. A test compares it with the actual core output. It includes no original message, contact details or identifying information.

Categories: the 12 corpus categories plus `other` for insufficient/unclear information and `crisis` for the safety path. The model cannot choose `crisis`. UI and LINE should render returned labels instead of inventing their own legal labels or heuristics.

The API route received a narrow integration change to remove the obsolete 501 branch and format safe failures. The Web adapter now imports the core input schema. `.env.example` documents the model override. The test alias mirrors the existing TypeScript alias. These small changes outside the main A paths are needed for a usable shared entry point and failure contract; no UI, LINE, case log or result-contract implementation was added.

`AnalysisError` carries only a fixed `code`, `status`, and `messageZh`, with no provider cause or original message. Other adapters should map it to their transport without logging the source exception. HTTP behavior:

| Code | HTTP status | Meaning |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | Invalid input or context |
| `FIXTURE_NOT_FOUND` | 422 | Offline input is not a curated fixture |
| `INVALID_ANALYSIS` | 502 | Output failed validation |
| `ANALYSIS_UNAVAILABLE` | 503 | Missing configuration, provider failure, refusal or other unavailable result |
| `ANALYSIS_TIMEOUT` | 504 | Model request exceeded its deadline |

The existing `INVALID_JSON` response remains 400. Every failure response includes the fixed disclaimer. Successes always contain that exact disclaimer; legal references also add source attribution in the disclaimer array and applicable caveats in `elementsNote`.

### Stream B wiring reference

These exports are ready for B; this handoff does not connect or modify the page, components, styles or case log.

```ts
import { fixtureOptions } from "@/src/analysis/fixtures/options";
import { analyzeInputSchema } from "@/src/analysis/schemas/analyze-input";
import { analyzeResultSchema } from "@/src/analysis/schemas/analyze-result";
import { analyzeFailureSchema } from "@/src/analysis/schemas/analyze-failure";
import type { AnalyzeInput, AnalyzeResult } from "@/src/analysis/types";
```

The fixture choices contain `{ id, label, text }` and depend only on the synthetic fixture JSON, not the core, legal context or model SDK. Client components must not import `analyzeMessage`, `llm-analyze` or the server-oriented `plantedFixtures` module. No new endpoint or dependency is required.

Minimal request/response example, to adapt inside B's submit handler:

```ts
const input: AnalyzeInput = { text: fixtureOptions[0].text, mode: "fixture" };
const response = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(analyzeInputSchema.parse(input)),
});
const body: unknown = await response.json();
if (!response.ok) {
  const failure = analyzeFailureSchema.parse(body);
  // Show failure.error.messageZh and failure.disclaimer in the error state.
  // Preserve the input. Do not pass this body to the result component.
} else {
  const result: AnalyzeResult = analyzeResultSchema.parse(body);
  // Pass result directly to the result component; there is no { result } wrapper.
}
```

The example shows the wire contract only. B owns input-validation messages, pending state, cancellation, retry controls, and handling fetch/JSON/schema failures (a proxy may return non-JSON). Do not log the request, body or caught provider details.

- Pass `fixtureOptions` to `FixturePicker.fixtures`. Selection supplies `text`; submit it with `mode: "fixture"`. An empty selection is not a valid request. If the user edits the message, switch to live mode explicitly; edited text is not guaranteed to match a fixture. Omitted `mode` means live.
- Fixture analysis needs no OpenAI key or provider access. Calling `/api/analyze` still requires a reachable app server; this is not an airplane-mode Web implementation.
- The model deadline is 45 seconds, excluding network/cold-start overhead. A browser timeout is a separate transport failure. Do not silently retry or replace a failed live result with demo data.
- Success uses `disclaimers: string[]`; failure uses `disclaimer: string`. Display every returned success disclaimer, including attribution. Preserve `elementsNote` when present.
- A crisis is HTTP 200 with category `crisis` and empty `legalRefs`; render its explanation and resources without requiring a legal reference. `other` is also a valid category. Display `categories[].labelZh` from the response; B owns localized risk-level labels.
- For component tests, import `assets/fixtures/sanitized-analysis-result.json` and parse with `analyzeResultSchema`. Clone before editing test data. B owns rendering tests and user-initiated local save/export; never append the submitted `text` to stored/exported records.

`tests/analysis/web-handoff.test.ts` exercises all 22 picker options against the actual POST handler without credentials/provider calls, validates success and failure schemas, and covers the crisis response. The original `AnalyzeInput` / `AnalyzeResult` and HTTP response shapes are unchanged.

## Configuration and privacy

Environment variable names and example values are documented in `.env.example`. The model defaults to the pinned `gpt-4.1-mini-2025-04-14` snapshot and can be overridden. The model must support structured output. Runtime requires Node.js 22 or newer for the installed AI SDK; this work was tested with Node.js 24.

Live requests use a 45-second abort deadline, zero SDK retries and a 2,200-token output limit. Telemetry and input/output recording are disabled, OpenAI request storage is set to false, and the core does not write message bodies, prompts, responses or provider errors to logs or persistence. This is not a claim of zero provider-side retention. There is no automatic switch to fixture data when a live request fails.

## Verification

```sh
pnpm test
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm build
git diff --check
```

Verified 2026-09-04: 61 tests passed across 8 test files; the 2 pre-existing non-analysis placeholders remain skipped. All five fixture categories matched, and the management fixture returned `none`. Type checking, lint, production build and whitespace checks passed. The pre-existing `next-env.d.ts` change was preserved after the build.

Default tests require no API key and never contact OpenAI. They cover all curated fixtures, false-positive management feedback, normalization, crisis routing, post-validation, legal metadata, the API route and the real SDK with a mocked HTTP boundary (including structured output, storage settings, model override, errors and timeout).

Optional paid live smoke test, excluded from the default `*.test.ts` pattern:

```sh
pnpm exec vitest run --config tests/analysis/live-smoke.config.ts
```

Provide the API key through the environment before invoking it. It uses one fictional fixture, never a real supervisor message, and fails explicitly when credentials are absent. It was not run during this handoff because no key was configured. Consequently live account access, live latency and live classification quality are not yet measured.

The remaining skipped Web-adapter and case-log test placeholders belong to later workstreams. Stream A completion does not mean the complete MVP or mobile demo is finished. Vector search and production RAG remain out of scope.

## Sources checked

- [Official OpenAI documentation: GPT-4.1 Mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) confirms the snapshot and structured-output support. SDK behavior was verified against installed package definitions and the mocked HTTP integration test.
- [衛福部 1925 安心專線](https://www.mohw.gov.tw/cp-2704-50587-1.html) and [衛福部心理支持資源](https://mohw.gov.tw/cp-2626-19209-1.html) support the 1925 and 1995 referral copy; [勞動部 1955 說明](https://www.mol.gov.tw/1607/1632/1640/44053/post) confirms coverage of local workers. Checked 2026-09-04.
- Legal sources, effective dates, licensing and reproducible source extraction remain in `assets/legal/`.


## Legal coverage expansion (2026-09-04)

Seven added categories cover sexual harassment, gender/pregnancy discrimination, employment discrimination/recruitment privacy, leave/rest rights, wage payment, retaliation, and immediate workplace danger. The existing API shape and browser-safe fixture option mapping are unchanged. The corpus now has 56 records: 48 statutory articles, five binding regulation articles, and three guidance records. Post-validation requires a relevant statute or regulation for each risk category; guidance alone is insufficient.

Sexual-harassment results always carry their own scope caveat instead of inheriting the bullying persistence test. The system prompt distinguishes ordinary sick-leave half pay and proportional attendance-bonus deductions from adverse treatment, recognizes reasonable-documentation and prevention-notice counterexamples, and forbids inventing annual minimum-wage amounts. Rule hints remain nondeterminative.

The 17 additional fixtures run without credentials through both the core and actual API handler. Mocked SDK tests check source/category compatibility and prompt wiring; they do not measure real-model classification. See `docs/workplace-risk-coverage.zh-TW.md` for official sources and omitted areas. No new dependency, provider, environment variable, storage, or external complaint action is introduced.
