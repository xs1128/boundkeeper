# LINE 整合設定（Workstream C）

這條路徑使用 **LINE Messaging API bot**，不是 LIFF。使用者把主管訊息轉傳或貼到官方帳號，webhook 會呼叫共用的 `analyzeMessage()`，再把精簡結果回到聊天室。法律判斷不在 LINE adapter 內重複實作。

公開 webhook：

```text
https://<your-vercel-host>/api/webhooks/line
```

本機開發時把 tunnel 網址接到同一個 path。

---

## 你已經有 LINE Developers 帳號之後

LINE 現在**不能**只在 Developers Console 直接開 Messaging API channel。要先有 LINE 官方帳號，再開啟 Messaging API。

### 1. 建立 LINE 官方帳號

1. 開啟 [LINE Official Account Manager](https://manager.line.biz/)。
2. 用同一個 Business ID / LINE 帳號登入。
3. 建立一個新的官方帳號（hackathon 可用個人／免費方案）。
4. 帳號名稱可暫用「勞權濾網」或「界線守門員」。這是使用者加好友時看到的名稱。

### 2. 開啟 Messaging API

1. 在 Official Account Manager 進入該帳號。
2. 開啟 **設定 → Messaging API**（或「Messaging API を利用する」）。
3. 依畫面啟用 Messaging API。這一步會建立 Developers Console 裡的 Messaging API channel，並綁到一個 provider。
4. 若系統要你選 provider：選你剛在 Developers Console 建立的 provider。選完後不能改。
5. 完成後到 [LINE Developers Console](https://developers.line.biz/console/) 確認該 provider 底下已出現 Messaging API channel。

### 3. 複製 Channel Secret 與 Channel Access Token

在 Developers Console 打開該 channel：

1. **Basic settings**
   - 複製 **Channel secret** → 填入 `LINE_CHANNEL_SECRET`
2. **Messaging API** 分頁
   - **Channel access token**：按 Issue（hackathon 可用 long-lived token）
   - 複製 token → 填入 `LINE_CHANNEL_ACCESS_TOKEN`
   - 只顯示一次時請立刻存到密碼管理或 Vercel env，不要提交到 git

這兩個值都是密鑰。不要貼進聊天室、截圖或 commit。

### 4. 關掉會搶回覆的自動訊息

在 Official Account Manager 的回應設定：

- **Webhook**：開啟
- **自動回應訊息**：關閉
- **加入好友歡迎訊息**：關閉（或只留一句「請直接貼上主管訊息」；不要同時讓 OA 與 bot 各回一次）
- **聊天（Chat）**：關閉。若開著，主控台可能先用掉 reply token，bot 就無法回覆

Developers Console → Messaging API 分頁也可看到 Greeting / Auto-reply 的 Edit 連結，會跳回 OA Manager。

### 5. 設定 webhook URL

部署完成後，在 Developers Console → Messaging API：

1. Webhook URL 填：

   ```text
   https://<your-vercel-host>/api/webhooks/line
   ```

2. 按 **Update**，再按 **Verify**。成功會顯示 Success。
3. 開啟 **Use webhook**。
4. **Webhook redelivery** 建議先關閉。程式會忽略 `deliveryContext.isRedelivery === true` 的事件，避免重複分析。

Verify 會送一筆 `events: []` 的 POST。本服務會先用 HMAC-SHA256 驗證 `x-line-signature`，通過才回 HTTP 200。

### 6. 把環境變數加到本機與 Vercel

本機 `.env.local`（不要 commit）：

```bash
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
```

一般分析仍需要既有模型憑證（Gemini／Vertex 或 OpenAI）。若使用者轉傳的文字與網站「範例情境」**完全相同**，LINE 路徑會走離線 fixture，不呼叫模型。

Vercel：

```bash
vercel env add LINE_CHANNEL_SECRET
vercel env add LINE_CHANNEL_ACCESS_TOKEN
```

或在 Vercel Dashboard → Project → Settings → Environment Variables 新增後重新部署。

確認 `.env.example` 只有空白佔位，沒有真實值。

### 7. 加好友並試傳訊息

1. Developers Console → Messaging API 分頁有官方帳號 QR code。
2. 用手機 LINE 掃碼加入。
3. 傳一則**文字**訊息。目前只處理文字；貼圖、圖片、語音會被忽略且不會回覆。

---

## 本機 webhook（tunnel）

LINE 只接受 HTTPS webhook，不能填 `http://localhost:3000`。

```bash
pnpm dev
# 另開一個終端
npx cloudflared tunnel --url http://localhost:3000
```

或：

```bash
npx ngrok http 3000
```

把 webhook URL 設成：

```text
https://<tunnel-host>/api/webhooks/line
```

每次 tunnel 網址變了就要回 Console 更新並再 Verify。展示請優先用已部署的 Vercel URL。

---

## 驗證 signature 的命令

LINE 官方文件的對照向量（僅供本機確認演算法，不是我們的 channel）：

```bash
echo -n '{"destination":"U8e742f61d673b39c7fff3cecb7536ef0","events":[]}' \
  | openssl dgst -sha256 -hmac '8c570fa6dd201bb328f1c1eac23a96d8' -binary \
  | openssl base64
# 預期：GhRKmvmHys4Pi8DxkF4+EayaH0OqtJtaZxgTD9fMDLs=
```

用自己的 channel 驗空 webhook：

```bash
BODY='{"destination":"U8e742f61d673b39c7fff3cecb7536ef0","events":[]}'
echo -n "$BODY" | openssl dgst -sha256 -hmac "$LINE_CHANNEL_SECRET" -binary | openssl base64
```

Verify 失敗時，先確認：

- URL 是 `https://.../api/webhooks/line`（沒有多餘斜線或 HTTP）
- Vercel 已有 `LINE_CHANNEL_SECRET` 且已重新部署
- 沒有 proxy 改寫 request body
- Channel secret 沒有被 Issue 成新值後還沒更新 env

---

## 行為摘要

| 事件 | 行為 |
|------|------|
| Console Verify（`events: []`） | 驗簽後 HTTP 200，不呼叫分析 |
| 文字訊息 | 呼叫一次 `analyzeMessage()`，以 Reply API 回覆（最多 5 則、每則 ≤ 5000 UTF-16 字元） |
| 與網站範例原文相同的文字 | `mode: "fixture"`，不呼叫模型 |
| 其他文字 | `mode: "live"`，需要模型憑證 |
| follow / unfollow / 圖片 / 貼圖 / redelivery / standby | 忽略，仍回 200 |
| 簽名錯誤或缺簽 | HTTP 401，**不會**呼叫 `analyzeMessage()` |
| 未設定 `LINE_CHANNEL_SECRET` | HTTP 503 |
| 分析失敗 | 回「分析未完成」＋固定免責聲明，不洩漏原文 |

Reply token 約 1 分鐘內有效、只能用一次。Webhook 會先回 200，分析在同一請求的背景工作完成後再呼叫 Reply API。請不要在 OA 主控台同時手動回覆。

日誌只會寫狀態碼這類中繼資料，不會寫訊息本文、raw body、token 或完整分析結果。

---

## 兩則訊息展示腳本（約 30 秒）

請直接轉傳或貼上**完整原文**，不要改字。改過會改走一般模型分析。

1. **言語羞辱與排擠**（高風險／職場霸凌風險）：

   > 你真是個沒用的廢物，這點事都做不好。以後部門會議不用參加，大家也不用再把工作資訊傳給你。

   預期：風險高、白話解釋、職安法相關參考、改進建議、固定免責聲明。

2. **嚴格但合理的績效回饋**（無明顯風險）：

   > 這份報告有三處數據錯誤，品質未達我們事先約定的標準。請在下週五前完成修正，依原有工作時段安排，有資源或時程問題今天提出，我們一起調整。

   預期：無明顯風險或低風險，說明這是合理管理回饋，不是違法判決。

現場備援：若 bot 沒回覆，改用網站 https://genai-hack-amber.vercel.app 的「評審展示」範例。若 Verify 失敗，先不要在評審前現場改 webhook。

---

## 環境變數

| 變數 | 必要 | 用途 |
|------|------|------|
| `LINE_CHANNEL_SECRET` | 是 | HMAC-SHA256 驗證 `x-line-signature` |
| `LINE_CHANNEL_ACCESS_TOKEN` | 是（實際回覆時） | 呼叫 LINE Reply API |
| `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_CLOUD_PROJECT` 或 `OPENAI_API_KEY` | 一般分析需要 | 非範例原文才會用到 |

這條路徑不使用 `LINE_LIFF_ID`。

---

## 離線測試

```bash
pnpm test tests/adapters/line.test.ts
```

測試使用假 secret 與假 payload，不會呼叫 LINE 或模型。
