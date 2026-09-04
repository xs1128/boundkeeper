# LINE 整合設定（Workstream C）

這條路徑使用 **LINE Messaging API bot**，不是 LIFF。使用者把主管訊息轉傳或貼到官方帳號，webhook 會呼叫共用的 `analyzeMessage()`，再把精簡結果回到聊天室。法律判斷不在 LINE adapter 內重複實作。

**目前已部署的 webhook（評審／隊友測試用這個）：**

```text
https://genai-hack-amber.vercel.app/api/webhooks/line
```

不要加結尾斜線。`…/line/` 會被 Next.js 轉成 HTTP 308，LINE Verify 不會跟著走。

本機開發才需要 tunnel；展示請用上面的 Vercel URL。

---

## 隊友怎麼測（不需要 Vercel 權限）

1. 向有 Developers Console 權限的人要官方帳號 **QR code**（Messaging API 分頁），用自己的 LINE 掃碼加入。
2. 用手機 LINE 傳**文字**。不要傳貼圖／圖片／語音；那些會被忽略且不會回覆。
3. 不要從 Official Account Manager 的 **聊天** 視窗回訊息，那會用掉 reply token。
4. 貼上下列**完整原文**，一個字都不要改。與網站範例相同的文字走離線 fixture，不呼叫模型。

**高風險（言語羞辱與排擠）：**

```text
你真是個沒用的廢物，這點事都做不好。以後部門會議不用參加，大家也不用再把工作資訊傳給你。
```

預期：高風險、職場霸凌風險、白話解釋、法規、改進建議、固定聲明。可能等幾秒。

**無明顯風險（嚴格但合理的績效回饋）：**

```text
這份報告有三處數據錯誤，品質未達我們事先約定的標準。請在下週五前完成修正，依原有工作時段安排，有資源或時程問題今天提出，我們一起調整。
```

預期：無明顯風險或低風險，說明這是合理管理，不是違法判決，並附固定聲明。

只應收到 bot 的分析，不該出現 LINE 預設「感謝您的訊息！本帳號無法個別回覆…」。若出現，見下方「關掉會搶回覆的自動訊息」。

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
2. 開啟 **設定 → Messaging API**。
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

本機 `.env.local` 與 Vercel Production 必須是**同一組**、同一個 channel 的值。本機驗簽 200、Vercel 回 401，幾乎都是 Production 還沒設、或設成別組 secret。改 env 後要重新部署。

### 4. 關掉會搶回覆的自動訊息

這一步做錯時，使用者會先收到 LINE 預設罐頭：

> 感謝您的訊息！很抱歉，本帳號無法個別回覆用戶的訊息。敬請期待我們下次發送的內容喔

那不是我們的 bot。到 [Official Account Manager](https://manager.line.biz/)（請用 Chrome）→ 右上 **設定** → 左欄 **回應設定**：

| 項目 | 應設成 | 設錯會怎樣 |
|------|--------|------------|
| **回應模式** | **聊天機器人**（不要選「聊天」） | 「聊天」模式會關掉 webhook |
| **Webhook** | **開啟** | LINE 不會打 `/api/webhooks/line` |
| **自動回應訊息** | **關閉**；若仍有預設範本就刪掉 | 出現「無法個別回覆」罐頭 |
| **歡迎訊息** | **關閉** | 加好友時多一則罐頭 |
| **聊天** | **關閉** | OA 主控台可能先用掉 reply token，bot 不回 |

Developers Console → Messaging API 分頁的 Greeting / Auto-reply **Edit** 也會打開同一頁。Webhook 與歡迎／自動回應不能全部關閉；正確組合是 webhook 開、另外三個關。

### 5. 設定 webhook URL

在 Developers Console → Messaging API：

1. Webhook URL 填（不要結尾 `/`）：

   ```text
   https://genai-hack-amber.vercel.app/api/webhooks/line
   ```

2. 按 **Update**，再按 **Verify**。成功會顯示 Success。
3. 開啟 **Use webhook**。
4. **Webhook redelivery** 建議先關閉。程式會忽略 `deliveryContext.isRedelivery === true` 的事件，避免重複分析。

Verify 會送一筆帶 `x-line-signature`、`events: []` 的 POST。本服務驗簽通過才回 HTTP 200。

| HTTP | 意義 |
|------|------|
| 200 `{"ok":true}` | 驗簽通過（Verify 應顯示 Success） |
| 401 `{"ok":false}` | 缺簽、簽錯，或 Vercel 的 `LINE_CHANNEL_SECRET` 與這個 channel 不一致 |
| 503 | 未設定 `LINE_CHANNEL_SECRET` |
| 308 | URL 多了結尾 `/`，改成沒有斜線再 Verify |

### 6. 把環境變數加到本機與 Vercel

本機 `.env.local`（不要 commit）：

```bash
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
```

一般分析仍需要既有模型憑證（Gemini／Vertex 或 OpenAI）。若使用者轉傳的文字與網站「範例情境」**完全相同**，LINE 路徑會走離線 fixture，不呼叫模型。

Vercel Dashboard → Project → Settings → Environment Variables，加到 **Production**（必要時 Preview 也加），然後 **Redeploy**。或：

```bash
vercel env add LINE_CHANNEL_SECRET production
vercel env add LINE_CHANNEL_ACCESS_TOKEN production
```

確認 `.env.example` 只有空白佔位，沒有真實值。

### 7. 加好友並試傳訊息

1. Developers Console → Messaging API 分頁有官方帳號 QR code。
2. 用手機 LINE 掃碼加入。
3. 傳一則**文字**訊息。見上方「隊友怎麼測」。

---

## 本機 webhook（tunnel）

LINE 只接受 HTTPS webhook，不能填 `http://localhost:3000`。本機 `pnpm dev` 已在 3000 時：

```bash
npx cloudflared tunnel --url http://localhost:3000
```

把 webhook 暫改成 `https://<tunnel-host>/api/webhooks/line` 再 Verify。tunnel 網址每次重開都會變；測完改回 Vercel URL。展示不要依賴本機 tunnel。

---

## 驗證 signature 的命令

LINE 官方文件的對照向量（僅供本機確認演算法，不是我們的 channel）：

```bash
echo -n '{"destination":"U8e742f61d673b39c7fff3cecb7536ef0","events":[]}' \
  | openssl dgst -sha256 -hmac '8c570fa6dd201bb328f1c1eac23a96d8' -binary \
  | openssl base64
# 預期：GhRKmvmHys4Pi8DxkF4+EayaH0OqtJtaZxgTD9fMDLs=
```

Verify 失敗或訊息沒回覆時：

- URL 必須是 `https://genai-hack-amber.vercel.app/api/webhooks/line`（https、沒有結尾 `/`）
- Vercel Production 已有與 Console **同一組** `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN`，且已重新部署
- 回應設定已關自動回應／歡迎訊息／聊天，回應模式為聊天機器人
- 沒有人在 OA「聊天」視窗同時回覆

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

Reply token 約 1 分鐘內有效、只能用一次。Webhook 會先回 200，分析在同一請求的背景工作完成後再呼叫 Reply API。

日誌只會寫狀態碼這類中繼資料，不會寫訊息本文、raw body、token 或完整分析結果。

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
