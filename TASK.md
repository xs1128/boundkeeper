# Build Plan — 勞權濾網

這份計畫把 hackathon 開發拆成三條可以獨立進行的 workstream。需求一律以 [`SPEC.md`](SPEC.md) 與 [`ARCHITECTURE.md`](ARCHITECTURE.md) 為準；`docs/` 裡已淘汰的 Decision Ledger 文件不可作為實作依據。

## Repo 現況盤點（2026-09-04）

**Stream A 進度更新：**A1–A4 已實作；官方 corpus、5 組離線 fixtures、分析流程、安全分流及交接資料見 [`src/analysis/README.md`](src/analysis/README.md)。以下清單保留為開工前盤點；真實 OpenAI smoke test 仍需設定 API key 後手動執行，完整 MVP 仍待 B／C 與整合驗收。

**A／B 接線交接：**A 已提供可供瀏覽器匯入的 `fixtureOptions`（`id`／`label`／`text`）、成功／錯誤驗證格式、共用結果樣本，以及實際 API 的交接測試。B 可依 [Stream B wiring reference](src/analysis/README.md#stream-b-wiring-reference) 接線；頁面、元件、樣式、本機儲存與匯出仍由 B 負責。

目前 repository 是可以 compile 的 scaffold，還不是能實際使用的 MVP。

- `pnpm test`：有通過，但目前只執行 4 個 scaffold assertions，另有 4 個 test files 是 skipped/TODO。
- `pnpm lint` 與 `pnpm build`：皆通過。
- `/api/analyze` 會驗證 input，但因為 `analyzeMessage()` 還是 stub，目前只會回傳 `501`。
- Analysis pipeline、prompt、safety path、rules、post-validation 與 fixture data 目前不是空的，就是會拋出 `NotImplementedError`。
- Web page 可以送出文字，但只會顯示 status string；`AnalysisResult` 與 `FixturePicker` 都還沒有接進完整 flow。
- Legal assets 只有標題與 placeholder，尚無已抽取且可追溯來源的 corpus。
- Case log storage、JSON/PDF export、LINE 與 Gmail 都還是 placeholder。
- `next-env.d.ts` 已有一筆與本次工作無關的 generated change。請保留，不要放進 feature commit，除非 build 確實需要。

## Shared Contract — 開始平行開發前先 freeze

三條 workstream 都必須依照以下既有 contract 開發：

- Core entrypoint：`src/analysis/analyze-message.ts` 內的 `analyzeMessage(input: AnalyzeInput): Promise<AnalyzeResult>`。
- Result shape：`src/analysis/types.ts` 內的 `AnalyzeResult`，以及 `src/analysis/schemas/analyze-result.ts` 內的 `analyzeResultSchema`。
- Input limit：trim 後的文字長度為 1–8,000 個字元。
- Fixture call：`{ text, mode: "fixture" }` 絕對不可發出 network request，也不可依賴 `OPENAI_API_KEY`。
- 每一筆成功的 result，包括 fixture 與 crisis result，都必須包含完全一致的 `FIXED_DISCLAIMER`。
- 所有 transport 都必須呼叫 shared core。UI 或 LINE files 不可自行加入 legal classification、法規文案或 risk heuristics。
- User-facing copy 使用繁體中文，只能描述風險與一般資訊，不可宣稱已構成違法或做出確定的法律判斷。

若一定要修改 result contract，先建立一個小型、只修改 contract 的 commit，並在其他 workstream 繼續開發前通知所有人。優先新增 optional fields，不要在平行開發期間 rename 既有 fields。

## Workstream A — Analysis Core 與官方 Legal Data

**目標：**讓 `analyzeMessage()` 在線上能穩定運作，同時確保 demo fixtures 可 deterministic 執行，並使用可追溯的台灣官方法規來源。

**負責以下 paths：**

- `src/analysis/**`
- `assets/legal/**`
- `assets/fixtures/**`
- `tests/analysis/**`
- `package.json` / `pnpm-lock.yaml` 中與 AI 有關的 dependency additions

**避免修改：**`app/**`、`components/**`、`src/adapters/line.ts`、`src/case-log/**`。

### A1. 整理並 normalize legal corpus

- Primary source 一律使用官方且可公開取得的來源，例如全國法規資料庫，以及勞動部／職業安全衛生署的正式指引。
- 只處理 demo 必要的 categories：職場霸凌風險、加班、調動、解僱／逼退，以及嚴厲但合法的管理回饋。只有 planted fixture 確實會使用時，才加入《性別平等工作法》資料。
- 每一筆 excerpt record 都必須包含：官方名稱、條號／章節、簡短原文摘錄或忠實摘要、canonical URL、發布機關、last-verified date，以及適用的 effective date/version。
- 紀錄 source licensing 或 reuse notes。不可把第三方法律評論網站內容直接 scrape 進 product data，卻沒有標明來源。
- 在 `assets/legal/` 保留 human-readable source inventory，並新增一份 rules/prompts 可使用的小型 machine-readable corpus（JSON 或 TypeScript）。Test/build 時必須驗證必要 metadata。
- 如果加入 extraction/update automation，程式必須可重現，產出也必須方便人工 review；automation 不可取代法律內容檢查。
- 在 A1–A4 與完整 MVP 全部變綠之前，不要做 vector search 或 production RAG。

### A2. 建立 deterministic demo set

- 新增 5 組 fixtures：言語霸凌、違法／未付費加班、不合理調動、逼迫自願離職，以及嚴厲但合法的績效回饋。
- 每組 fixture 都要定義 expected primary category 與 minimum risk；合法回饋必須是 `none` 或 `low`。
- Fixture/rule behavior 不可呼叫 OpenAI。可以用 exact fixture matching 選擇 curated result，並用 lightweight rules 為相似訊息提供 hints。
- Rules 不可因為單一 hostile message 就斷言構成職場霸凌；result 必須附上多要件與持續性的 caveat。

### A3. 實作 single analysis pipeline

- 依照 `ARCHITECTURE.md` 的順序實作：normalization、crisis detection、rule prefilter、live LLM analysis、post-validation、output formatting。
- 加入 Vercel AI SDK + OpenAI integration，使用 Zod 驗證 structured output。Model 必須可設定，並提供安全的 default。
- Live prompt 只能使用 curated legal context 與 rule hints，並要求 calibrated uncertainty，以及能降溫、保留勞工立場的繁體中文 suggested reply。
- 偵測到 crisis phrases 時，short-circuit 到 1925／1995／1955 資源，跳過一般 legal analysis。
- Post-validation 必須補回 fixed disclaimer、reject/repair 不明 categories、降低極短 input 的 confidence，並避免 reply 或 next steps 為空。
- 絕對不要 log 原始訊息或完整 prompt。

### A4. Tests 與 handoff

- 將 `planted-fixtures.test.ts` 與 `legal-feedback.test.ts` 從 TODO 改為可離線執行的 tests。
- 為 normalization、crisis routing、disclaimer enforcement、short-input confidence、schema validation 與 legal-source metadata 加入 focused tests。
- Mock live model boundary；optional live smoke test 必須有明確名稱，且不能包含在 default test command 中。
- 提供一筆 sanitized `AnalyzeResult` fixture，讓 Web 與 LINE workstream 視需要在 tests 中共用。

**Acceptance Criteria：**

- `pnpm test` 不需 API key 即可執行所有 analysis tests。
- 至少 4/5 planted fixtures 回傳正確 primary category；合法回饋的 risk 不得高於 `low`。
- Fixture mode 不會發出任何 network request。
- 每筆 result 都含有 `FIXED_DISCLAIMER`；有法律風險時，需附具體法規來源。
- Live request 只能回傳符合 schema 的 result，或 privacy-safe 且對使用者友善的 failure；不可假造成功 response。

## Workstream B — 完成並 Polish Product Flow

**目標：**把 scaffold 完成為 mobile-first、可直接向評審展示的完整 journey：貼上訊息、理解分析、編輯回覆、儲存與匯出。

**負責以下 paths：**

- `app/page.tsx`、`app/log/page.tsx`、`app/globals.css`，以及 `app/layout.tsx` 中只影響 presentation 的修改
- `components/**`
- `src/case-log/**`
- UI/case-log tests；可視需要新增 `tests/components/**`，並負責 `tests/case-log/**`

**避免修改：**`src/analysis/**`、`assets/legal/**`、`assets/fixtures/**`、API analysis logic 與 LINE files。

### B1. 完成主要 analysis journey

**進度（2026-09-04）：已完成。**已接上五組 `fixtureOptions`、成功／錯誤 schema、完整結果區塊、可編輯回覆與複製回饋、30 秒逾時及手動重試。範例內容修改後會明確切換一般分析；所有狀態保留輸入訊息，送出前不分析，頁面說明伺服器預設不儲存訊息。結果保留法規來源、`elementsNote`、來源聲明及固定免責聲明。

**驗證：**`tests/components/analysis-journey.test.ts` 使用 mocked fetch 與 happy-dom，涵蓋範例選擇、輸入限制、loading、錯誤／重試、逾時、安全分流結果、區塊順序、風險中文標籤、回覆編輯／複製與失敗提示。全套 95 tests、lint、型別檢查、production build 及 diff check 通過。本機瀏覽器完成無薪加班範例、法規展開與編輯／複製，390 px viewport 未水平溢出。未執行真實 OpenAI 分析；B2 完整 polish、B3 儲存／匯出與其餘 B4 驗收仍待後續。

**遠端整合（2026-09-04，`4294266`）：**已整合 remote main 的案件紀錄、JSON 匯出與導覽，保留 B1 的輸入／HTTP schema 驗證、逾時重試、完整聲明及可編輯回覆。共用瀏覽器安全的 fixture export 與風險標籤，移除錯誤畫面上的獨立模擬分析入口；測試樣本改用 analysis core 的 sanitized fixture。儲存時保留編輯後的回覆，僅寫入 analysis snapshot、timestamp、id 與 browser hash；輸入修改會清除舊分析，避免儲存錯配的訊息指紋。全套 109 tests、lint、型別檢查、production build 通過，本機實測範例分析、儲存、案件紀錄及 JSON 下載。B3 功能已隨此次遠端更新接入，完整 B2／B4 驗收仍需依各節確認。

- 將 `FixturePicker` 接上 planted fixture export；選擇 demo fixture 後，送出 `mode: "fixture"`。
- 將成功的 `/api/analyze` response parse 為 `AnalyzeResult`；transport errors 與 legal results 必須分開呈現。
- 依指定順序完成所有 result sections：risk/categories、白話解釋、可收合的 legal references、可編輯且有 copy feedback 的 suggested reply、next steps、fixed disclaimer。
- Risk level 使用繁體中文 label，不可直接向使用者顯示 raw enum value。
- 完成 loading、timeout/retry、empty、API error 與 success states，而且不能清除使用者已貼上的訊息。
- 清楚說明只有送出後才會分析，以及預設不會在 server 儲存訊息。

### B2. 提高 3-minute demo 的穩定度

**已完成（2026-09-04）：**在 B1 上補強導覽、表單與法規展開控制的焦點對比、44 px 操作區、行距與小螢幕換行，保留 reduced-motion 支援。複製失敗時會依序使用瀏覽器備援與手動選取；備援會清除暫存欄位並恢復先前焦點。每筆結果獨立顯示完整固定聲明與其他 caveats。114 tests、lint、typecheck、production build 通過；五組 fixtures 已離線測試，三段展示情境與鍵盤編輯／複製／儲存／JSON 匯出已在 390 CSS px 瀏覽器驗證，分析頁與案件頁皆無水平捲動。展示步驟見 [`docs/web-demo.md`](docs/web-demo.md)。公開部署與真實 AI smoke test 不包含在此次驗證。

- 優先處理 mobile layout、可讀的字體、清楚的 hierarchy、accessible focus states 與 reduced-motion support。
- 沒有 OpenAI 時，fixture mode 仍必須能完整 demo。Fixture selector 應呈現為「範例情境」，不要像隱藏的 test infrastructure。
- 加入 copy-to-clipboard behavior，並處理 fallback/error state。
- 每筆 result 內都必須看得到 fixed disclaimer；如果 result 可以單獨截圖或分享，只放在 page footer 不夠。
- 不可使用尚未證實的 impact claims，也不可出現「違法確定」、「你會贏」或同等語意的 verdict copy。

### B3. Local-first case log 與單一 export path

- 在 `src/case-log/store.ts` 實作 browser-only storage；可使用 raw IndexedDB，避免產生 dependency conflicts。
- 只有使用者明確點擊儲存後才能寫入。保存 timeline 所需的 analysis snapshot 與 metadata，但不可儲存主管原始訊息。若需要 hash，必須在 browser 端產生。
- 完成 `/log` 的 empty、loading、populated 與 storage-error states。
- 先完成 user-initiated JSON download。JSON export 與完整 demo flow 完成前，PDF 都是 cut item。
- Export 必須包含 analysis、timestamp、fixed disclaimer，以及「本資料僅供諮詢整理，不是法律認定」的白話說明。

### B4. Tests 與 handoff

- 測試 loading/error/success rendering、所有必要 result sections、fixture selection、copy behavior、explicit-save behavior，以及 stored/exported records 中不存在原始訊息。
- 使用符合 frozen contract 的 mocked `/api/analyze` responses，不需等待 live LLM 上線。

**Acceptance Criteria：**

- 使用者可以選 fixture、執行分析、理解 result、編輯／複製 reply、儲存 result、打開 case log，並下載 JSON。
- 完整 journey 在 390 px viewport 可正常操作，支援 keyboard navigation，且不會水平捲動。
- Browser 或 server persistence 都不可寫入主管原始訊息。
- Result component 本身會獨立顯示 fixed disclaimer。

## Workstream C — LINE Integration

**目標：**透過 shared analysis core 完成一條安全的 LINE 使用路徑，不建立另一套 legal behavior。

**負責以下 paths：**

- `src/adapters/line.ts`
- `app/api/webhooks/line/route.ts`
- `tests/adapters/line.test.ts` 與 LINE route tests
- `.env.example` 與 LINE setup runbook（新增 `docs/line-integration.md`）

**避免修改：**`src/analysis/**`、Web UI/components、legal assets、case log 與 Gmail。除非所有 MVP 必要項目都完成，否則 Gmail 維持 cut。

### C1. 只選一條 integration path

- Default 採用 Messaging API bot，因為現有 webhook route 已經 scaffold，且 demo script 明確包含把訊息轉傳給 bot。
- 如果早期無法取得 channel credentials 或建立 public webhook，改用 LIFF embedding 並 reuse Web page。需在 runbook 記錄選擇與 demo steps；不要同時做兩條路線。

### C2. 實作 thin、secure adapter

- 必須使用 HMAC-SHA256 與 `LINE_CHANNEL_SECRET`，針對完全未修改的 raw request body 驗證 `x-line-signature`；驗證通過前不可 parse 或 acknowledge event。
- 只處理 text message events。Follow/unfollow、redelivery、image、sticker 與其他 unsupported events 應安全忽略。
- 將每個 supported event 轉為 `AdapterMessage`，呼叫一次 `analyzeMessage()`，再使用回傳 fields 組出精簡的繁體中文 reply。
- 遵守 LINE reply-token lifetime 與 text limits。依 section boundaries deterministic split，必要時限制輸出長度，但不可截掉 disclaimer 或產生 invalid payload。
- 使用 `LINE_CHANNEL_ACCESS_TOKEN` 呼叫 LINE Reply API；不可 log message text、raw webhook body、tokens 或完整 analysis response。
- Webhook HTTP response 要快速且一致。在 stateless deployment 可行的範圍內，避免 duplicate/redelivered events 造成重複分析與回覆。

### C3. 無 credentials 也能 test 與交接

- 使用固定的 fake secrets 與 raw payloads 測試 signature verification，需包含 invalid/missing signature cases。
- 加入 event parsing、unsupported event、message chunking/limit、API failure 與 missing-secret configuration tests。
- Mock `analyzeMessage()` 與 `fetch`；tests 不可呼叫 LINE 或 OpenAI。
- 文件需說明 LINE Developers console setup、必要 environment variables、webhook URL、verification command、local tunnel option，以及兩則訊息的 demo script。
- `.env.example` 應列出 `OPENAI_API_KEY`、Workstream A 若有使用的 optional model config、`LINE_CHANNEL_ACCESS_TOKEN`、`LINE_CHANNEL_SECRET`；只有選擇 LIFF path 時才加入 `LINE_LIFF_ID`。不可填入真實值。

**Acceptance Criteria：**

- Invalid signature 絕對不會執行到 `analyzeMessage()`。
- Valid text event 只呼叫 shared core 一次，並送出有效 reply。
- Unsupported events 會正常回 success，不會 throw 或洩漏資料。
- 所有 tests 都能使用 fake credentials 離線執行。
- 另一位 teammate 能只看 runbook 就重現 LINE demo。

## Integration Owner — Merge 與 Release Gate

這是一個短期 coordination role，不是第四條 feature workstream。指定一位 teammate 負責 merge order 與 contract/dependency conflict resolution。

1. 先合併已同意的 shared-contract changes。
2. Merge Workstream A，讓 API 與 offline fixtures 先實際可用。
3. Merge Workstream B，執行完整 browser demo path。
4. 最後 merge Workstream C；確認它只 import shared core，沒有自行實作 legal logic。
5. 移除過時的 `NotImplementedError` branches，並更新原本故意期待失敗的 scaffold tests。
6. 執行 `pnpm test`、`pnpm lint`、`pnpm build` 與 `git diff --check`。
7. 在 mobile viewport 與 deployed Vercel URL 上，實際走完 `SPEC.md` 的 3-minute flow。
8. 確認 deployment 只有必要 environment variables，且 logs 中沒有任何 message bodies。

## Shared Definition of Done

- Paste flow 在 live mode 與 offline fixture mode 都能運作。
- 已建立 5 組 planted fixtures；至少 4 組分類正確，合法回饋維持在 `none`/`low`。
- 每一筆 user-facing result 都包含 fixed disclaimer 與 calibrated language。
- 至少有一條 local-only save + JSON export path，而且不會保存主管原始訊息。
- 所有 channel 都使用 `analyzeMessage()`，沒有自行建立 legal rules。
- Crisis strings 直接導向 helplines，不進行一般 legal analysis。
- Web MVP 穩定後才 demo LINE；Gmail、PDF、RAG、auth、metrics 與 Postgres 維持明確的 cut items。
- Tests、lint、build 與 diff checks 全數通過；public preview 可在 mobile 完成 demo。

## 建議 Branch Names

- `feat/analysis-legal-corpus`
- `feat/web-product-flow`
- `feat/line-integration`

每個 branch 都應使用小而明確的 scoped commits，並在最後一筆 commit／PR note 中列出 verification commands。
