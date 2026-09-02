# Track 03 pain — Decision Ledger

**Product (default, not locked):** after messy ZH/EN transcript + chat dump → decision objects with exact quotes → status `proposed` / `confirmed` / `conflict` → named human stamps. Agent proposes, never confirms. Demo = planted inversion + meeting-vs-chat conflict. No Slack OAuth, no multi-agent OS.

**Occupied:** recap + “decisions” + action items are commercial (Otter, Fireflies, Granola, Fellow, Grain, Fathom, Copilot Recap, Gemini notes, Zoom AI Companion) and OSS. Google Meet already extracts a **Decisions** section with statuses Aligned / Needs Further Discussions / Disagreed / Shelved. [Google](https://support.google.com/meet/answer/14754931?hl=en) Never tell judges the category is empty.

---

## Do not cite (landmines)

| Lie | Fact | Source |
| --- | --- | --- |
| OECD **8%** = Taiwan SMEs fully integrated AI | D4SME 2025 = **10 countries, Taiwan not in list**. n=1,009 platform customers (Amazon/Intuit/Kakao/Rakuten/Sage), **non-representative**. **8%** = *transformative digital-maturity* bucket (“blockchain and machine learning”), not AI-fully-integrated. Japan alone = 506/1,009. | [OECD PDF](https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/04/sme-digitalisation-for-competitiveness_3116862a/197e3077-en.pdf) |
| TW SME AI = OECD **39%** so Taiwan is “behind” | 39% = AI apps among **those platform-using SMEs**, not global SME population, not Taiwan. | [OECD](https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/04/sme-digitalisation-for-competitiveness_3116862a/197e3077-en.pdf) vs [iTALENT misuse](https://ipd.nat.gov.tw/italent/ePaperD/10/ePaper20260300008) |
| Microsoft **275 pings / every 2 min** = average | Footnote: **top 20% by ping volume**. 275 = 24h; 2 min = 8h workday. | [Infinite Workday](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday) |
| Microsoft **57–60% ad hoc meetings** = average | Body 57%; methodology **60%** and **top 20% by meeting volume**. | same page, methodology |
| Atlassian **“4% ROI”** | Vendor. **4%** = orgs seeing *transformational* cluster (innovation 4% / org efficiency 3% / work quality 2%). Not a separate ROI stat. | [AI Collaboration Index PDF](https://atlassianblog.wpengine.com/wp-content/uploads/2025/09/atlassian-ai-collaboration-report-2025.pdf) |
| iTALENT heading **“實際導入AI僅約有4%”** | Same article body: **7.4%**. Heading ≠ body. | [iTALENT](https://ipd.nat.gov.tw/italent/ePaperD/10/ePaper20260300008) |
| 7.4% = “introduced **or planning**” | iTALENT (ITRI IEK, citing SMEA-commissioned ITRI survey, firms 10–199 staff): **實際導入 AI 應用 = 7.4%**. Vendor blogs add “or planning.” | [iTALENT](https://ipd.nat.gov.tw/italent/ePaperD/10/ePaper20260300008) vs vendor [i-tech](https://www.i-tech.tw/news/taiwan-enterprise-ai-hardware-vs-application) |
| SBA **77% no use case** | Not used. No SBA primary fetched. | — |
| Recap inversion rate **X%** (Otter/Fireflies/Copilot) | No public benchmark. Vendor “85–90% accurate” blogs are **vendor**. | — |

White-paper PDF landing: [sme.gov.tw](https://www.sme.gov.tw/article-tw-2345-13928). Numbers below are from the **ITRI survey as quoted on MOEA iTALENT**, not extracted from the PDF binary.

---

## Chaos / volume (Microsoft, first-party)

[Infinite Workday](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday) (telemetry to 15 Feb 2025, excl. Edu + EU; survey Edelman, n=31,000 / 31 markets **incl. Taiwan**):

- **48%** employees / **52%** leaders: work feels chaotic and fragmented.
- Average worker: **117 emails/day**, **153 Teams messages/weekday**.
- **1 in 3** employees: pace of last 5 years makes it impossible to keep up.
- **Do not** cite 275 / 2 min / 60% ad hoc as averages (see landmines).

---

## (a) Recap inversion / invented actions

**Academic (primary):** LLM meeting summaries still hallucinate, omit, and invent. FRAME (EMNLP 2025 Findings): “often producing outputs with hallucinations, omissions, and irrelevancies.” [ACL](https://doi.org/10.18653/v1/2025.findings-emnlp.1094) · [arXiv MESA](https://arxiv.org/html/2411.18444)

**Vendors tell you to check, then ship the recap anyway:**

- Microsoft Recap: “Some AI-generated content might be inaccurate, incomplete, or inappropriate.” Share-to-email: “Edit the drafted email for accuracy.” [Recap](https://support.microsoft.com/en-gb/office/recap-in-microsoft-teams-c2e3a0fe-504f-4b2c-bf85-504938f110ef)
- Microsoft Copilot notes: “Be sure to verify your results because AI-generated content could be incorrect.” [Generate notes](https://support.microsoft.com/en-us/teams/meetings-events/generate-meeting-notes) · [Recap a meeting](https://support.microsoft.com/en-us/topic/recap-a-teams-meeting-2e62a761-5dd8-4315-8100-5b41bb2c8a41)
- Google Meet notes: “the meeting summary can be incomplete, inaccurate, or not generated.” [Take notes](https://support.google.com/meet/answer/14754931?hl=en)
- Gemini in Meet: “can make mistakes, including about people, so users should review its output.” [Ask Gemini](https://support.google.com/meet/answer/16024610?hl=en)

**Field reports (anecdote, not stats):** Gemini “claimed we had decided on something we had not”; PMs paste summaries into tickets that never happened. [HN 45670881](https://news.ycombinator.com/item?id=45670881)

**HITL as product, not sermon:** “check exceptions + random samples,” not check everything. [HN 46734069](https://news.ycombinator.com/item?id=46734069)

**Vendor blogs** (Coommit, MetaWhisp, Oakmeeting, GoTranscript) describe invented action items / inverted decisions. Use as *category existence*, not rates. [Coommit](https://coommit.com/blog/ai-meeting-summary-hallucinations-2026) [MetaWhisp](https://metawhisp.com/blog/ai-meeting-summary-invented-action-items/)

---

## (b) Handoff when people miss

Microsoft productizes skip-the-meeting: Recap / Copilot “even if you miss the meeting”; July 2026 **Meeting Recaps app** (past 30 days, audio recap). [Recap](https://support.microsoft.com/en-gb/office/recap-in-microsoft-teams-c2e3a0fe-504f-4b2c-bf85-504938f110ef) [Teams Jul 2026](https://techcommunity.microsoft.com/blog/microsoftteamsblog/what%E2%80%99s-new-in-microsoft-teams--july-2026/4542510) [Copilot catch-up](https://support.microsoft.com/en-us/teams/copilot/catch-up-on-meetings-with-microsoft-365-copilot-in-teams)

Google: late joiners get “Summary so far”; notes email goes to **invited guests**, not necessarily attendees. [Take notes](https://support.google.com/meet/answer/14754931?hl=en)

**Hole vs recap:** Recap is a paragraph for the absentee. Ledger is a **stampable object** the absentee can refuse. Recap notifications/notes **not available for ad-hoc events** (Microsoft), while heavy meeting users are mostly ad hoc (top-20% telemetry — don’t average it).

---

## (c) SME “no use case”

ITRI/SMEA survey (10–199 staff), quoted [iTALENT](https://ipd.nat.gov.tw/italent/ePaperD/10/ePaper20260300008):

| Stat | Meaning |
| --- | --- |
| **7.4%** | actual AI application introduction |
| **63.9%** | largest challenge = **尚無明確應用需求** |
| **26.8% / 25.5% / 21.3%** | don’t understand / cost / talent shortage (challenge list) |
| **84.5%** | no internal AI talent; **~3%** plan to hire in 2 years |
| **~70%** | prefer off-the-shelf genAI |

OECD (correct frame only): among platform SMEs, **61% of non-users** say they do not use AI; **44% of those** plan to start. Barriers for digitalisation = cost/time, not “no use case” as the headline. Do not mix with Taiwan 63.9%. [OECD](https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/04/sme-digitalisation-for-competitiveness_3116862a/197e3077-en.pdf)

PwC TW n=**413** (global n=49,843; field 7 Jul–18 Aug 2025): **64%** used AI at work last year; **13%** GenAI daily (global 14%); agentic daily **4%**; L&D resources **20%** non-mgr vs **83%** exec; **34%** weekly overload. [PwC TW](https://www.pwc.tw/zh/news/press-release/press-20251112.html)

---

## (d) Bilingual ZH/EN (real, but not “Taiwanese can’t English”)

**Product constraint (first-party):** Google Meet “Take notes for me” / Ask Gemini = **one language at a time**. “Multiple languages spoken in the same meeting aren't currently supported.” Spoken list = EN/FR/DE/IT/JA/KO/PT/ES — **no Mandarin / zh-TW**. [Take notes](https://support.google.com/meet/answer/14754931?hl=en) [Ask Gemini](https://support.google.com/meet/answer/16024610?hl=en)

Microsoft Recap **does** list Chinese (Traditional, Taiwan) among intelligent-recap languages; still “AI summaries might look different based on the event's transcription language.” [Recap](https://support.microsoft.com/en-gb/office/recap-in-microsoft-teams-c2e3a0fe-504f-4b2c-bf85-504938f110ef)

**ASR (primary):** Whisper-large-v2 auto-detect **WER 29.49%** on CSZS-zh-en code-switch vs **13.01%** for Taiwan-tuned Breeze/Twister (−55.88%). ASCEND-MIX 21.01% → 16.38%. [arXiv 2506.11130](https://arxiv.org/pdf/2506.11130) [Breeze README](https://github.com/mtkresearch/Breeze-ASR-25)

**Workplace English (academic, small-n, not a TAM):** NSYSU thesis on NNS anxiety in English-as-corporate-language; NKNU 2023 survey of TW trade staff in English meetings. [NSYSU](https://ethesys.lis.nsysu.edu.tw/ETD-db/ETD-search-c/view_etd?URN=etd-0530122-155329) [NCL](https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/login?o=dnclcdr&s=id%3D%22111NKNU5240013%22.&searchmode=basic)

**Vendor:** TutorABC case studies = **vendor**. Do not quote their CEFR lift numbers.

---

## (e) After notetakers became default (2025–2026)

- Recap is now a **sidebar app**, not a buried tab. Catch-up is the pitch. [Teams Jul 2026](https://techcommunity.microsoft.com/blog/microsoftteamsblog/what%E2%80%99s-new-in-microsoft-teams--july-2026/4542510)
- Recap **grounds on transcript**. Copilot Q&A **mixes chat + spoken transcript** (chat up to 24h pre-meeting) and cites sources — **does not emit a conflict object**. [Catch-up](https://support.microsoft.com/en-us/teams/copilot/catch-up-on-meetings-with-microsoft-365-copilot-in-teams)
- Atlassian (vendor, n=12k workers + execs): **42%** trust AI outputs without checking, due to time pressure; **37%** of execs say AI wasted time or led teams the wrong way. [PDF](https://atlassianblog.wpengine.com/wp-content/uploads/2025/09/atlassian-ai-collaboration-report-2025.pdf)
- State of Teams (vendor): “more information than ever… never been less informed”; **25%** of time searching for answers. [Atlassian](https://www.atlassian.com/blog/state-of-teams-2025)

---

## Adjacent Track 03 (only if pain sourced)

| Wedge | Sourced pain | Build | Skip if |
| --- | --- | --- | --- |
| **Exception queue** | Vendors: verify. Atlassian: 42% skip check. HN: exceptions + sample. Academic: flag uncertainty. | Source vs draft; flag numbers/dates/names/status flips; human reviews flags + sample. | No artifact type / becomes chatbot |
| **SME diagnostic** | 63.9% no use case; 84.5% no talent. | 3 files → one gated runbook. Refuse chatbot. | No real repeating job on team |
| **Hygiene map** | Recaps + chat + docs proliferate; Copilot mixes sources; 25% search time (vendor). | Folder + planted conflicts → allow-list. Metric = found vs planted. | Looks like file classifier |
| **SOP capture** | Weak as standalone. Closest = 63.9% can’t name a scene + Atlassian “meeting was the only way to find info” (vendor, 2024 recall). | Only as input to diagnostic, not a wiki product. | Pitch = “AI writes SOPs” |

---

## Demo implication (36h)

Messy **zh-TW + EN code-switch** transcript + chat (Google’s notetaker refuses this mix). Extract cited decision objects. Plant (1) inverted decision in recap-shaped prose, (2) meeting-says-X / chat-says-not-X. UI **refuses task** until named human stamps. Metric = planted caught / false confirms blocked. Agent never auto-confirms.
