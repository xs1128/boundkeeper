# 法規摘要索引

本次核對：2026-09-04。機器可讀的摘要、官方單條連結、版本及授權均在 `corpus.zh-TW.json`；來源細節見 `source-inventory.zh-TW.md`。這裡僅提供閱讀與人工核對順序，避免維護兩套不同摘要。

## 職場霸凌與合理管理

1. `osha-22-1`：定義、重大單次事件例外及雇主防治義務。
2. `osha-22-2`、`osha-22-3`：知悉後的處理及內外部申訴管道。
3. `osha-bullying-handbook`：認定因素及行為樣態的實務說明。
4. `mol-reasonable-management`：合理工作指導的負例，與法條重大例外一起使用。

## 加班與工資

1. `lsa-30`、`lsa-32`：正常／延長工時、例外及出勤紀錄。
2. `lsa-24`、`lsa-32-1`：加班費與自願選擇補休。
3. `lsa-42`、`lsa-84-1`：正當理由及特殊工時制度的限制。

## 調動

`lsa-10-1`：契約與調動五原則；需查明調動理由、條件、協助及生活影響。

## 解僱／逼退

1. `mol-forced-resignation`：不當要求自請離職的官方說明。
2. `lsa-11`、`lsa-12`、`lsa-14`：不同終止事由及權利行使條件。
3. `lsa-16`：特定終止事由的預告期間。
4. `lsa-17`、`pension-12`：舊制／新制資遣費不可混用。

分析核心由 record 的 `officialNameZh + articleOrSection`、`summaryZh`、`canonicalUrl` 組成既有 `legalRefs`，並在 `elementsNote` 保留該情境適用的 `caveatsZh`，在 `disclaimers` 保留固定免責聲明及來源顯名。模型只選擇來源 id，不生成法律摘要或網址。
