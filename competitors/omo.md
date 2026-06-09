# Competitor Profile: omo

## 1. Project Information
- **Testing Access**: [omo.space](https://omo.space/)
- **Demo Video**: [Google Drive Video](https://drive.google.com/file/d/1cP51Ap6xkCgvzOQqt-eftcRYPpEaPSrp/view?usp=sharing)
- **Architecture Diagram**: [Google Drive Link](https://drive.google.com/file/d/1JZUPOj3Df7NOQMMjOjmvI7mBWLn2bESj/view?usp=sharing)
- **Code Repository**: [harrythentrepreneur/omo](https://github.com/harrythentrepreneur/omo)

---

## 2. Problem Statement
- Solo founders juggle multiple fragmented SaaS tabs (Stripe, Meta, Gmail, Drive, Calendar) causing cognitive load and toggle tax.
- 70% of solo founders are non-technical, locking them out of advanced terminal/coding CLI interfaces.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Voice-first holographic interface: users interact via natural speech-to-speech.
  - Multi-source tool keys: reads/writes to Stripe, Meta Ads, Gmail, Google Drive, Docs, Calendar, and GitHub.
  - Gemini Live loop: speech-to-speech WebSocket interface powered by **gemini-3.1-flash-live-preview** with server-minted tokens.
  - Isolated coding agents: dispatches named agents (Cinder, Reed) to perform tasks and write code inside isolated **git worktrees**.
  - Non-hallucinating metrics: maps data keys directly to charts (ECharts) instead of passing raw numbers through model context tokens.
  - 3D Holographic Rendering: utilizes THREE.js and Looking Glass WebXR for hologram displays.

---

## 4. Business Case & ROI
- Consolidates all founder business tabs into a single conversational interface.
- Enables non-technical entrepreneurs to code, inspect, and ship software updates via voice diff previews.
- Prevents database metric hallucination.

---

---

## 5. Judge Scorecards & Evaluation

### Startups Challenge Auditor Evaluation
I have completed a thorough, technical, and cynical audit of the competitor **omo** and directly benchmarked it against **UnDocumented** and the other top contenders in the Google for Startups AI Agents Challenge.

The complete audit, including the graded scorecard, gaps/vulnerabilities list, competitive benchmarking, and remediation plan, has been sent directly to the **main agent** (ID: `51b26154-0f36-4cc7-82dd-44932d925aaf`).

### Google Cloud Head of AI Evaluation
I have completed the detailed evaluation of the "omo" submission and conducted a comprehensive code audit of the "UnDocumented" onboarding journey and system architecture.

I have compiled the final evaluator report from the perspective of a Google Cloud VP & Head of AI and sent it back to the parent agent (main agent). The report covers:
1. **Competitive Analysis of omo**: Highlighting its tech stack, value proposition, and critical security and platform compliance concerns (such as model name hallucination, unsafe write API access, and third-party infrastructure dependencies).
2. **Onboarding Audit of UnDocumented**: Verifying its seamless bypass token mechanics, AST scanning/benchmarking routines, ADK agent structures, FastMCP tool integration, and Zero-Trust workspace restrictions.
3. **Competitive Scorecard**: Detailing why UnDocumented represents a top-tier contender for the Grand Prize.

