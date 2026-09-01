# Future of Work Track Research

> **Decision:** We are currently pursuing **Track 03 — Future of Work (未來工作)** for the FUTUREMODE BUILDMODE Gen-AI Hackathon 2026.
>
> **Status:** Active direction; the problem and product concept are not yet locked.
>
> **Last researched:** 2026-09-02

## Official Challenge

The organizer asks teams to “design AI solutions that transform how teams, businesses, creators, and organizations collaborate and operate.” Suggested areas are team productivity, knowledge management, sales and marketing, customer support, and operations.

The hackathon runs **September 4–6, 2026** at Taipei Expo Dome. Teams may have 1–5 members, and the final submission is due at 11:00 AM on September 6. Projects are judged on innovation, technical execution, product vision, real-world impact, user experience, and relevant use of sponsor technology. Sponsor tools are optional unless entering a sponsor-specific bounty. See the [official hackathon page](https://www.futuremode.xyz/hackathon).

## Problem Landscape

### 1. AI improves tasks, but work remains fragmented

Microsoft's 2025 study of 31,000 knowledge workers reports that 48% of employees and 52% of leaders describe work as chaotic and fragmented. Its Microsoft 365 telemetry found that workers in the highest-volume cohort receive 275 daily interruptions and are interrupted about every two minutes during core hours. This suggests that generating content faster does not fix coordination, prioritization, or attention fragmentation. ([Microsoft Work Trend Index](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday))

### 2. Adoption is ahead of organizational value

Atlassian surveyed 12,000 knowledge workers and 180 Fortune 1000 executives; only 4% of executives reported meaningful AI ROI. Its recommendations emphasize AI-ready data, workflow-specific experimentation, guardrails, and measuring work quality and organizational efficiency—not adoption alone. This is vendor-sponsored research, so treat the number as directional rather than universal. ([Atlassian AI Collaboration Index](https://www.atlassian.com/blog/cxo-ai-collaboration-report-2025))

Taiwan's 2025 SME White Paper reports that 39% of SMEs in the referenced OECD survey use AI, yet only 8% have fully integrated it into core business. Common barriers include implementation cost, limited training time and talent, organizational resistance, regulation, and security. ([Taiwan Ministry of Economic Affairs SME White Paper, pp. 63–64](https://www.sme.gov.tw/files/13847/EB0374F3-F6B7-48DB-8B4A-614F60A095F4))

### 3. There is a workforce enablement gap

PwC's 2025 workforce survey included 413 respondents in Taiwan. Although 64% had used AI at work during the prior year, only 13% used GenAI daily and 4% used agentic AI daily. Just 20% of non-managers said they had the learning and development resources they needed, compared with 83% of senior executives. ([PwC Taiwan](https://www.pwc.tw/zh/news/press-release/press-20251112.html))

Globally, the World Economic Forum found that 63% of employers see skills gaps as the main barrier to transformation. While 77% plan to upskill workers in response to AI, 41% also anticipate workforce reductions where tasks are automated. Useful products should therefore augment judgment and help people adapt—not merely hide replacement behind an automation layer. ([WEF Future of Jobs 2025](https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/))

## Working Problem Thesis

**Teams do not primarily need another chatbot. They need a shared coordination layer that turns scattered context into trusted decisions and actions while helping people learn how to supervise AI.**

A strong project should address at least one transition:

1. Scattered information → shared, traceable context.
2. Individual AI shortcuts → repeatable team workflows.
3. AI output → human-approved action with clear ownership.
4. One-off training → learning inside real work.
5. Claimed productivity → measurable team outcomes.

## Candidate Product Directions

| Rank | Direction | User and pain | Hackathon demo | Main risk |
| --- | --- | --- | --- | --- |
| 1 | **Decision & Handoff Memory** | Small product or operations teams lose the “why,” owner, and next action across chat, meetings, and docs. | Feed in a meeting transcript and chat thread; extract decisions with citations, flag conflicts, assign owners, and generate a handoff brief. | Crowded if presented as another meeting summarizer; differentiate on decision lifecycle and provenance. |
| 2 | **Human-in-the-loop Workflow Coach** | SMEs know AI tools exist but cannot turn a repeated process into a safe workflow. | Observe a support or operations task, propose an automation, run it with approval gates, and report time saved and exceptions. | Too broad unless limited to one role and workflow. |
| 3 | **AI Apprenticeship in the Flow of Work** | Non-managers lack practical, role-specific AI training. | Convert a real task into guided practice, explain what the agent did, test the user's judgment, and track skill growth. | Learning impact is harder to prove in a short demo. |
| 4 | **Cross-language Customer/Ops Triage** | Taiwan teams coordinate across Mandarin and English while routing requests between sales, support, and engineering. | Classify a bilingual request, retrieve evidence, draft a response, route ownership, and escalate uncertainty. | Many existing tools; needs a specific underserved workflow or dataset. |

### Current recommendation

Start validation with **Decision & Handoff Memory**. It is inherently team-level, easy to demonstrate end-to-end, and directly addresses collaboration and knowledge management. The wedge should be a narrow event such as a product decision, incident handoff, or customer escalation—not “search everything.”

## Product Principles

- **Show evidence:** Every extracted decision or recommendation links to its source.
- **Keep humans accountable:** The system proposes; a named person confirms consequential actions.
- **Close the loop:** Track whether an action was accepted, completed, superseded, or blocked.
- **Measure outcomes:** Demo time-to-handoff, missing-action rate, repeated-question count, or review accuracy.
- **Design for teams:** Shared state, roles, and handoffs matter more than a polished solo chat.
- **Minimize integration risk:** Prove the workflow with uploaded or synthetic data before adding live Slack, Notion, or email authentication.
- **Protect sensitive data:** Make retention, permissions, and deletion visible; never ingest workplace data without authorization.

## Questions to Validate Before Building

Interview at least five target users and ask for a recent example, not a hypothetical opinion:

1. “Tell me about the last handoff or decision that went wrong. Where was the missing context?”
2. “What do you reconstruct manually before acting, and how long does that take?”
3. “Which AI output would you never trust without checking? What evidence would change that?”
4. “Who owns the final decision, and where should the record live?”
5. “What measurable result would make your team use this next week?”

Proceed only if the team hears the same painful workflow at least three times, can obtain realistic demo data, and can define one before/after metric.

## Immediate Next Steps

- Choose one persona and one high-frequency handoff by September 3.
- Collect three anonymized examples or create a realistic bilingual synthetic dataset.
- Storyboard a three-minute demo: messy inputs → grounded decision → approved action → measurable result.
- Build the smallest vertical slice before adding integrations or multi-agent complexity.
- Recheck the official page at kickoff for bounty changes and final submission requirements.

## Sources

- [FUTUREMODE BUILDMODE Hackathon](https://www.futuremode.xyz/hackathon)
- [Microsoft: 2025 Work Trend Index](https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born)
- [Microsoft: Breaking Down the Infinite Workday](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday)
- [Atlassian: AI Collaboration Index](https://www.atlassian.com/blog/cxo-ai-collaboration-report-2025)
- [Taiwan Ministry of Economic Affairs: 2025 SME White Paper](https://www.sme.gov.tw/article-tw-2345-13928)
- [PwC Taiwan: 2025 Global Workforce Hopes & Fears](https://www.pwc.tw/zh/news/press-release/press-20251112.html)
- [World Economic Forum: Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/)
- [ILO–NASK: Generative AI and Jobs — 2025 Update](https://www.ilo.org/publications/generative-ai-and-jobs-2025-update)
