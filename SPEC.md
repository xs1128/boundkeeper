# SPEC — 勞權濾網 (Labor Filter)

Worker-side workplace communication copilot that analyzes **incoming** supervisor messages against Taiwan labor law, flags potential risks, and helps workers respond, document, and escalate safely. It creates a new operating layer for worker–manager communication and worker-support organizations. Optional stretch: connect to LINE, Gmail, or other channels.

**Hackathon:** FUTUREMODE BUILDMODE · Track 03 Future of Work · ~36h · Host: Vercel  
**Status:** Idea locked for build; integrations are stretch goals.

---

## 1. Problem

Workers often receive messages from managers that may be:

- **職場霸凌** (職安法 §22-1): abuse of position, beyond reasonable business scope, offensive/threatening/isolating language
- **勞基法 violations**: illegal overtime demands, unpaid work, improper 調動, pressure to resign
- **Other labor risks**: 性工法, unreasonable performance targets, withholding information

Most existing tools serve **employers** (compliance monitoring, HR case management) or help workers **after** harm (incident logs, lawyer referral). Nothing widely available helps a worker **at the moment a message arrives**.

Taiwan’s **職場霸凌防治專章** (effective **2026-07-01**) increases awareness and employer obligations but does not give workers a private, instant analysis layer.

---

## 2. Product vision

> **「主管傳來的每一句話，先經過你的勞權濾網。」**

A privacy-first filter between **higher-ups** and **workers**:

```
Manager message  →  Labor Filter  →  Worker sees: risk + law refs + suggested reply
                      (optional log for 申訴)
```

**We are not:** a lawyer, employer surveillance tool, or anonymous hotline replacement.  
**We are:** general information + structured risk flags + reply coaching, with clear disclaimers and referral to 1955 / 勞工局 / legal counsel for formal action.

### 2.1 Future of Work thesis

AI productivity tools usually optimize work for employers. Labor Filter applies AI to the other side of the workplace: giving workers an immediate, private layer for understanding management communication and taking the next safe action.

It changes a fragmented workplace workflow:

```
Before: receive message → guess the risk → search scattered sources → draft alone → seek help after harm
After:  receive message → structured risk screen → safe reply → local record → shareable consultation summary
```

This transforms how workers, unions, and labor-support organizations collaborate around workplace communication without creating an employer monitoring system.

**Track 03 fit:** workplace communication, knowledge access, and incident-response operations — not a generic legal Q&A chatbot.

---

## 3. Users

| Persona | Need |
|---------|------|
| **Primary — 一般受雇勞工** | Paste or forward boss LINE/email/chat; understand if wording crosses legal lines; draft a professional response |
| **Secondary — 工會 / 勞工團體** | Receive a consistent, structured case summary from members; reduce repeated intake and triage work (future B2B2C) |
| **Out of scope (MVP)** | HR/compliance buyers, enterprise admin dashboards |

---

## 4. MVP scope (must ship for demo)

### 4.1 Core flow

1. Worker pastes **one supervisor message** (Traditional Chinese; mixed EN ok).
2. Optional context: role, industry, prior messages count (for 「持續性」 hint only).
3. System returns:
   - **Risk level:** none / low / medium / high (UI labels, not legal verdict)
   - **Categories:** e.g. 職場霸凌風險, 加班違規, 違法調動, 解僱/逼退壓力, 其他
   - **Law references:** statute + plain-language summary (職安法, 勞基法, 性工法 as applicable)
   - **Explanation:** what the message implies in plain 中文
   - **Suggested reply:** de-escalating, rights-preserving draft (editable)
   - **Next steps:** when to document, 1955, internal 申訴, legal aid — not “you will win”
4. **Disclaimer** on every analysis screen.

### 4.2 Case log (local-first)

- Append analysis to an **on-device or user-exported** timeline (timestamp, original text hash optional, analysis snapshot).
- **Export** as PDF/JSON for potential 申訴 evidence pack (stretch: one-click template).
- Structure exports so a worker can bring the same summary to a union, 1955, internal grievance channel, or lawyer without retelling the case from scratch.

### 4.3 Demo fixtures

- Pre-loaded **planted messages** (3–5) covering: verbal bullying, illegal overtime, unreasonable transfer, “自己離職”, normal harsh but legal feedback.
- **Metric for judges:** correct category + doesn’t false-alarm on legal management message.

### 4.4 Explicit non-goals (MVP)

- User accounts / OAuth (unless time permits)
- LINE / Gmail live integration
- Multi-message pattern ML (“bullying over 6 months”)
- Storing messages on server by default
- Traditional Chinese labor corpus RAG at production quality (use curated prompt + few-shot; RAG if time)

### 4.5 Curated legal coverage (expanded 2026-09-04)

The shared analysis core also covers workplace sexual harassment, gender/pregnancy discrimination, employment discrimination and recruitment privacy, leave/rest rights, wage payment, complaint retaliation, and immediately dangerous work. The corpus contains 48 selected articles from six laws, five articles from the Regulations of Leave-Taking of Workers, and three official guidance records. The 22 fixed scenarios include reasonable-management counterexamples. Source scope, exceptions, and research rationale are recorded in [workplace risk coverage](docs/workplace-risk-coverage.zh-TW.md). Coverage is selective; it does not imply complete labor-law review or measured live-model accuracy.

---

## 5. Stretch goals (if time)

Priority order:

| Priority | Integration | Value |
|----------|-------------|--------|
| S1 | **LINE LIFF / Messaging API** | Taiwan distribution; forward-to-bot flow |
| S2 | **Gmail add-on or OAuth read** | Email-heavy workplaces |
| S3 | **Browser extension** | Select text on web mail → analyze |
| S4 | **Pattern view** | Same sender, N flagged messages → “持續性” note |

See [ARCHITECTURE.md](ARCHITECTURE.md) §6 for adapter design.

---

## 6. Functional requirements

### FR-1 Message intake

- Accept pasted text ≥ 1 char, ≤ 8,000 chars (configurable).
- Strip obvious PII from logs server-side if server path used; prefer client-side analysis path for MVP.

### FR-2 Analysis engine

- Classify into ≥ 1 category with confidence band (low/med/high).
- Cite **specific** legal bases when flagging (not vague “可能違法”).
- Distinguish **hard but legal** management from **likely problematic** wording.
- For 職場霸凌: note that legal definition requires multiple elements (權勢、逾越必要合理範圍、持續性、危害等); single message may be “risk signal” not “confirmed bullying”.

### FR-3 Reply coach

- Output reply in **繁體中文**, professional tone, avoids escalation, preserves worker position (e.g. request written confirmation, cite need to check labor rules).
- Optimize for continued workplace collaboration: clarify expectations, request written confirmation, and preserve boundaries without automatically accusing the sender of illegality.

### FR-4 Safety & compliance

- Fixed disclaimer: 本工具提供一般資訊，非法律意見；重大決定請諮詢律師或 1955。
- Crisis phrases (自傷/傷他): short-circuit to helpline resources (1925, 1995, 1955).
- No guarantee of outcome; no “file 申訴 now” automation without human confirmation.

### FR-5 Privacy

- **Default:** analyze in browser or ephemeral server session; do not persist message body in DB.
- If server LLM used: no training on user data; minimal retention (request ID + category only for demo metrics).
- The web form automatically keeps the draft and latest completed analysis, including its source text, in the current tab's `sessionStorage`. Navigation and reload restore them without rerunning analysis. Closing the tab ends this temporary session; persistent case-log saving remains explicit.
- Editing the draft keeps the last analysis visible with its original text. “清除對話” removes the draft and analysis from the temporary session and cancels any pending request; it does not delete saved case-log entries.

---

## 7. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Analysis p95 < 15s on demo Wi-Fi |
| NFR-2 | Works on mobile browser (primary demo device) |
| NFR-3 | Deployed on Vercel with public preview URL |
| NFR-4 | Demo works offline for fixtures (no LLM) as fallback |

---

## 8. Legal & product copy (fixed strings)

**Disclaimer (footer, every result):**

> 勞權濾網使用 AI 提供一般性勞動法資訊與溝通建議，不構成法律意見或律師代理。個案認定需綜合情境與證據。如需申訴或法律協助，請洽 1955 勞工諮詢申訴專線或專業律師。

**Category definitions:** maintain in `assets/legal/category-definitions.zh-TW.md` when implemented.

---

## 9. Success criteria (hackathon)

| Criterion | Target |
|-----------|--------|
| Demo time | ≤ 3 minutes |
| Planted fixtures | ≥ 4/5 correct primary category |
| False positive | Legal “ tough feedback” fixture → low/none risk |
| Workflow value | Message → risk explanation + editable reply in < 30s during demo |
| Handoff value | Saved case → structured consultation export in < 30s during demo |
| Judge story | AI changes workplace communication and worker-support operations; Taiwan law timing + privacy |
| Stretch | Live LINE or Gmail path shown end-to-end |

### 9.1 Impact hypothesis to validate

- Reduce time spent searching labor-law sources and drafting a first response.
- Improve consistency of case intake for unions and labor-support organizations.
- Help workers preserve written context earlier, before details are lost.
- Reduce unnecessary escalation by distinguishing harsh-but-legal feedback from genuine risk signals.

These are product hypotheses, not proven claims. Demo and user interviews should report observed time or feedback rather than invented market savings.

---

## 10. Demo script (3 min)

1. **Problem:** Boss LINE message → worker doesn’t know if it’s legal (10s).
2. **Paste** planted bullying message → flags 職場霸凌風險 + 職安法 ref + suggested reply (40s).
3. **Paste** illegal overtime demand → 勞基法 overtime ref (30s).
4. **Paste** legal performance feedback → low risk, explains difference (30s).
5. **Case log** export → same structured summary can be shared with a union / 1955 / counselor (20s).
6. **Stretch:** forward same message via LINE bot (30s).
7. Close: “Future of Work should improve worker agency, not only employer productivity.” **Worker-side**, Taiwan-specific, privacy-first (10s).

---

## 11. Out of scope (entire hackathon)

- Employer dashboard or sender-side coaching
- Team chat surveillance, employee scoring, or organization-wide message monitoring
- Replacing 1955 or 勞工局 processes
- Guaranteed legal outcomes
- English-first product (TW worker market first)
- Multi-agent orchestration as the product story

---

## 12. References

- 職安法職場霸凌專章 (2026-07-01): [lawplayer](https://lawplayer.com/act/6437d285e800e5f0b9305cbe/2)
- Market research: conversation notes in repo / team docs
- Adjacent products: SideNote (employer), In My Corner (worker UK/US), 飛騰 WGS (employer TW)
