# 官方法律資料 — Workstream A1

核對日期：2026-09-04。原始 A1 範圍已擴充至職場性平與常見工作訊息風險。選用理由及限制見 `docs/workplace-risk-coverage.zh-TW.md`，分析核心的使用及驗證方式見 `src/analysis/README.md`。

## 已收錄

- `corpus.zh-TW.json`：56 筆執行時摘要，包含六部法律的 48 條、勞工請假規則的 5 條法規命令及 3 筆官方說明／手冊資料。
- `source-inventory.zh-TW.md`：官方來源、下載入口、版本差異、授權及選用理由。
- `statute-excerpts.zh-TW.md`：各情境的法條索引及容易誤用的限制。
- `category-definitions.zh-TW.md`：12 類情境與分類界線，包含一般管理回饋。
- `sources/moj-selected-2026-09-04.json`：法務部 ZIP 中三部法律的 16 條原文與沿革，附原始檔 SHA-256。這是選定條文的證據快照，不是完整資料庫，也不是 runtime prompt。
- `sources/moj-expansion-2026-09-04.json`：新增 32 條法律原文，保留原始快照不覆寫。
- `sources/moj-regulations-2026-09-04.json`：命令資料檔中選定的 5 條勞工請假規則原文；另有獨立 SHA-256。
- `tools/extract-law-snapshot.py`：從已下載 ZIP 重新抽取同一組條文。無網路呼叫，不產生法律摘要，也不更新核對日期。

## 使用約定

1. 使用摘要時連同 `caveatsZh`、版本、來源及授權顯名一起保留；不要只摘出結論句。
2. `sourceKind=statute` 是法律，`regulation` 是法規命令；兩者均可作相關風險的法規依據。`official_guidance` 是官方說明或指引，不能單獨支撐法律風險分類。
3. `version.date` 是版本日期，可精確到月；`effectiveDate` 只在另行核對後填入。`null` 不等於未生效，而是本次僅確認版本，或指引並無獨立法規生效日。
4. `lastVerified` 是本次來源核對日期，不是律師審閱、法院認定或未來持續更新的保證。
5. 法務部下載檔的 `UpdateDate` 為 2026-08-21；本次網頁所載整編截止為 2026-08-28。下載日、資料截止日、修正公布日、生效日不可混用。
6. 單則訊息只提供風險線索；必須保留職安法第 22-1 條「情節重大者不以持續發生為必要」的例外。一般績效要求的合理性仍需個案脈絡。
7. 僅需選取與訊息相關的數筆摘要。此階段不建立向量索引、RAG、資料庫或全量法律 prompt。

## 重現資料快照

由 [data.gov.tw 資料集 18289](https://data.gov.tw/dataset/18289) 取得 ZIP，將原始檔保存在工作目錄之外，再執行：

```sh
curl -L --fail 'https://sendlaw.moj.gov.tw/PublicData/GetFile.ashx?DType=XML&AuData=CF' -o /tmp/moj-laws.zip
python3 assets/legal/tools/extract-law-snapshot.py /tmp/moj-laws.zip /tmp/moj-selected.json
```

工具拒絕覆寫既有輸出。相同 ZIP 會產生相同結果；來源端更新後，SHA-256 與內容可能改變。比較新舊快照、官方單條條文及沿革後，再人工修改摘要與 `lastVerified`。不得只下載成功就宣稱法律內容已核對。

擴充資料沿用同一抽取工具，第三個參數選擇資料範圍：

```sh
python3 assets/legal/tools/extract-law-snapshot.py /tmp/moj-laws.zip /tmp/moj-expansion.json expansion
curl -L --fail 'https://sendlaw.moj.gov.tw/PublicData/GetFile.ashx?DType=XML&AuData=CM' -o /tmp/moj-regulations.zip
python3 assets/legal/tools/extract-law-snapshot.py /tmp/moj-regulations.zip /tmp/moj-regulations-selected.json regulations
```

兩份 ZIP 的 `UpdateDate` 均為 2026-08-21。最低工資法在上游的名稱含「（112.12.27制定）」，快照與引用保留此名稱；未收錄逐年最低工資金額，模型不得自行補造。性平法部分條文分項施行，不把整部法律的生效欄套用到所有條文。

## 驗證

```sh
pnpm test -- tests/analysis/legal-source-metadata.test.ts
```

測試離線驗證必要 metadata、日期格式、官方來源、分類涵蓋及法條摘要與原文快照的連結。它不驗證個案法律結論，也不取代法規內容審查。原有 `AnalyzeResult` contract 與 `FIXED_DISCLAIMER` 不變。
