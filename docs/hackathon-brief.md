# BUILDMODE Track 03 — short brief

**Event:** FUTUREMODE BUILDMODE, Taipei Expo Dome, 4–6 Sep 2026. Team 1–5. Submit **11:00 6 Sep**. ~36h. [Official](https://www.futuremode.xyz/hackathon)

**Track:** 03 Future of Work. Judging = innovation, execution, vision, impact, UX. Sponsor tech only if bounty.

**Repo:** empty scaffold. No product.

## Locked / not locked

- Track 03: locked
- Product: **not locked**
- Default tonight: **Decision Ledger** iff demo = planted inversion + meeting-vs-chat conflict + human stamp
- Alt: **SME diagnostic** (“what to automate?”) iff real repeating job on team

## Landmines we already stepped on

1. **OECD 8% ≠ “Taiwan SMEs fully integrated AI.”** D4SME 2025 = 10 countries, **Taiwan not in list**. n=1,009 platform customers. 8% = transformative *digital-maturity* bucket. OECD **39%** ≠ global SME AI, ≠ Taiwan. [OECD](https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/04/sme-digitalisation-for-competitiveness_3116862a/197e3077-en.pdf)
2. **ITRI 7.4% = 實際導入**, not “introduced or planning.” iTALENT **heading ~4%**, body 7.4%. Also **63.9%** no use case, **84.5%** no talent. Cite [iTALENT](https://ipd.nat.gov.tw/italent/ePaperD/10/ePaper20260300008) not vendor blogs.
3. **Atlassian “4% ROI”** = transformational cluster (innovation 4% / efficiency 3% / quality 2%). Vendor. **42%** skip-check AI = same PDF, still vendor.
4. **Microsoft 275 pings / every 2 min** = **top 20% by ping volume**. **57–60% ad hoc** = **top 20% by meeting volume**, not average.
5. **Category occupied.** Otter-class recaps + Google Meet **Decisions** (Aligned / Disagreed / Shelved). Never tell judges nobody did this.

## Already exists (web + GitHub, 2026-09-02)

| Bucket | Who | Sell |
| --- | --- | --- |
| Meeting notes + actions | Otter, Fireflies, Granola, Fellow, Grain, Fathom, **Google Meet Decisions**, Copilot Recap | Recap, “decisions,” todos. Meet = Aligned/Disagreed/Shelved. No conflict object. |
| OSS notetaker | [Meetily](https://github.com/Zackriya-Solutions/meetily) ~30k★, [minutes](https://github.com/silverstein/minutes) ~1.5k★ | Local Whisper → summary / decisions |
| Enterprise register | [Decisions](https://www.meetingdecisions.com/), DecisionLedger AI, MagnaRix | Board/Teams governance |
| Agent decision VC | [Akashi](https://akashi.ai/) | Precedent check + semantic conflict for *agents* |
| Closest OSS, tiny | [meeting-align](https://github.com/chiwinzhong/meeting-align) 1★, py-context-graph, MoM conflict agents, ClawMem | Evidence / graph / handoff prototypes |

**Demo hole:** Recap grounds **transcript only**; Copilot Q&A **mixes chat + speech**, no conflict object. Google Meet notes = **one language**; bilingual **not supported**; spoken list **no zh-TW**. We plant inversion + meeting-vs-chat fight → UI refuse until named human stamps. Catch lie ≠ their product.

## Pain (cite, don’t sermon)

- Work chaotic: 48% employees / 52% leaders. [Microsoft Infinite Workday](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday)
- Taiwan SME: 7.4% actual intro / 63.9% / 84.5%. [iTALENT](https://ipd.nat.gov.tw/italent/ePaperD/10/ePaper20260300008) [白皮書 landing](https://www.sme.gov.tw/article-tw-2345-13928)
- PwC TW n=413: 64% used AI last year, 13% GenAI daily, **4% agentic daily**; L&D 20% non-mgr vs 83% exec. [PwC](https://www.pwc.tw/zh/news/press-release/press-20251112.html)
- HN: summaries invert decisions; fake tickets. [45670881](https://news.ycombinator.com/item?id=45670881) [46734069](https://news.ycombinator.com/item?id=46734069)

## 36h wedges

| ID | Build | Skip if |
| --- | --- | --- |
| A Ledger | Upload transcript+chat → decision objects + quotes + status proposed/confirmed/conflict → stamp → handoff. Plant inversion. | Pitch = “AI notes” |
| B Exception queue | Source vs draft. Flag numbers/dates/names. Human review flags + sample. | No one artifact type |
| C SME diagnostic | 3 files → one gated runbook. Refuse chatbot. | No real repeating job |
| D Hygiene map | Folder + planted conflicts → allow-list. Metric = found vs planted. | Looks like file classifier |

**Do not build:** ChatGPT wrapper, Slack/Notion OAuth, multi-agent OS, Cathay wallet, ElevenLabs Track 02, NOXCAT game.

**Stack:** OpenAI credits all participants. Recheck bounties at opening.

## Demo (3 min)

Messy ZH/EN inputs → cited objects not paragraph → catch conflict → metric moves → who owns record tomorrow.

## Docs

- Pain (extra cites): [track-03-pain.md](track-03-pain.md)
- Build: [ARCHITECTURE.md](ARCHITECTURE.md)

## Next

Persona + one event type. Synthetic bilingual dataset. Vertical slice. No live auth. Scaffold Next.js on Vercel per architecture.
