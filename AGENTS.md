# Repository Guidelines — 勞權濾網 (Labor Filter)

Worker-side Taiwan labor-law message filter. Analyzes **incoming** supervisor messages, flags risks, suggests replies. MVP = paste-in web app; stretch = LINE / Gmail adapters.

**Read first:** [SPEC.md](SPEC.md) (product) · [ARCHITECTURE.md](ARCHITECTURE.md) (technical)

---

## Project summary

| Item | Value |
|------|--------|
| Codename | Labor Filter / 勞權濾網 |
| Track | FUTUREMODE BUILDMODE — Track 03 Future of Work |
| Host | Vercel |
| MVP | Paste message → analyze → risk + law refs + suggested reply |
| Stretch | LINE LIFF or Messaging API; Gmail add-on or copy-helper |
| Non-goals | Employer surveillance, legal advice claims, server-side message storage |

---

## Project structure

```
app/                 # Next.js App Router pages + API routes
src/                 # Application logic (preferred over scattered lib/)
  analysis/          # Core: analyzeMessage, prompts, schemas, rules
  case-log/          # IndexedDB timeline + export
  adapters/          # web, line, gmail — thin transports only
tests/               # Mirror src/; must run without OpenAI for fixtures
assets/
  legal/             # Statute excerpts, category definitions (zh-TW)
  fixtures/          # Planted supervisor messages for demo + tests
docs/                # Hackathon research (may include superseded ideas)
SPEC.md              # Product specification (canonical)
ARCHITECTURE.md      # System design (canonical)
```

Keep the root focused on config and top-level docs. Do not commit `node_modules/`, `.env`, or generated output.

---

## Architecture rules (do not violate)

1. **Single analysis core** — All channels call `analyzeMessage()`. No forked legal logic in LINE/Gmail handlers.
2. **Privacy default** — Do not persist supervisor message bodies in DB. Case log is client-side unless explicitly changed in SPEC.
3. **Disclaimers required** — Every user-facing analysis includes fixed disclaimer text from SPEC §8.
4. **Not legal advice** — Copy and UI must say 一般資訊, not 違法確定 or 你會贏.
5. **Adapters are thin** — `adapters/line.ts` verifies webhook + formats reply only.
6. **Demo reliability** — Planted fixtures must pass tests via rules or mocks without live LLM.

---

## Build, test, and development

When tooling is scaffolded, prefer:

- `pnpm dev` — local Next.js
- `pnpm test` — unit tests (fixtures first)
- `pnpm lint` — ESLint / typecheck
- `pnpm build` — production build

Until then: `git status` and `git diff --check` before commit.

**Env vars (document in `.env.example` only):**

- `OPENAI_API_KEY` — required for live analyze
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` — stretch
- `LINE_LIFF_ID` — stretch

Never commit secrets.

---

## Coding style

- TypeScript strict mode when scaffolded
- `PascalCase` types/components, `camelCase` functions, `kebab-case` doc filenames
- Traditional Chinese for user-facing product copy; English for code identifiers and internal docs
- Match existing patterns in each file; no drive-by refactors

---

## Testing guidelines

- Add tests with behavior changes
- **`tests/analysis/planted-fixtures.test.ts`** — each demo plant maps to expected primary category and minimum risk level
- **`tests/analysis/legal-feedback.test.ts`** — harsh but legal manager message → low/none risk
- Mock LLM in unit tests; one optional live smoke test before demo
- Crisis/safety strings route to helplines without legal analysis

---

## AI / LLM implementation notes

- Use Vercel AI SDK `generateObject` + Zod schema matching `AnalyzeResult` in ARCHITECTURE.md
- System prompt: zh-TW labor context, 職安法職霸五要件, 勞基法 common scenarios, uncertainty calibration
- Post-validate: always attach disclaimers; downgrade confidence when input is very short
- Do not log full prompts or user messages to third-party analytics

---

## Commit and PR guidelines

Short imperative subjects; Conventional Commits optional (`feat:`, `fix:`, `docs:`).

PRs should state: problem, solution, verification (tests + demo steps), env changes.

Hackathon submission: public Vercel preview URL + 3-min demo path from SPEC §10.

---

## Hackathon cuts (if behind schedule)

Keep: paste UI, analyze API, 4 planted fixtures, disclaimer, one export path.  
Cut: Gmail, RAG, PDF, Postgres, auth, metrics dashboard.  
LINE: prefer LIFF embedding over full bot if webhook time is tight.

---

## Superseded docs

`docs/ARCHITECTURE.md` and `docs/hackathon-brief.md` reference an earlier **Decision Ledger** concept. Do not implement that unless the team explicitly pivots back. Canonical product docs are **root** `SPEC.md` and `ARCHITECTURE.md`.
