# Competitor Profile: Autonomous WhatsApp Sales Agent for Agribusiness

## 1. Project Information
- **Testing Access**: [test-platform](https://devpost.team/google-cloud-for-startups/projects/17086)
- **Demo Video**: [Video Demo](https://devpost.team/google-cloud-for-startups/projects/17086)
- **Architecture Diagram**: [Architecture](https://devpost.team/google-cloud-for-startups/projects/17086)
- **Code Repository**: orchestrator, rag, state manager

---

## 2. Problem Statement
- Latin American agribusinesses face high friction in sales of technical SKU products (crop protection, fertilizers, veterinary inputs).
- Messages get missed, recommendations vary, and leads die in follow-up loops.
- Human teams are too expensive to provide 24/7 service.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Chatservices: Multi-tenant, multi-agent agribusiness sales platform running in production.
  - Multi-agent turn pipeline: Capture, RAG Synthesizer, SmartForm, Router, Lead, Media, Follow-up, Payment Bridge.
  - Multimodal pest diagnosis via Gemini Files API.
  - Go + Bazel monorepo, Python/FastAPI analytics, MongoDB Atlas, Redis, promptfoo, DSPy, OPRO.
- **Ecosystem Integration**: Vertex AI (Gemini 3.5 Flash/Pro), Cloud Run, Cloud Scheduler, Secret Manager.

---

## 4. Business Case & ROI
- Automates pest diagnosis, SKUs recommendations, quoting, and payment links on WhatsApp.
- Autonomous closed sales: 35 sales closed (~$7,000 USD attributed revenue) in production.
- 5.8% conversation-to-sale rate.


---

## 5. Judge Scorecards & Evaluation

### Startups Challenge Auditor Evaluation
I have completed the technical and VC audit of the competitor project "Autonomous WhatsApp Sales Agent for Agribusiness". 

The full audit report and scorecard (grading them at a **3.5/10**) have been sent directly to the main agent. The scorecard details their critical failures—such as hallucinating a non-existent model name ("Gemini 3.5"), building an over-engineered Go+Bazel monorepo, exposing high-liability transaction bridges directly to unstructured LLM inputs, and introducing prompt drift risks via DSPy/OPRO mutations. Additionally, it highlights the comparative strengths of UnDocumented and outlines a 4-step red-team remediation plan to secure the Grand Prize win.

### Google Cloud Head of AI Evaluation
I have evaluated the competitor codebase 'Autonomous WhatsApp Sales Agent for Agribusiness' and performed a detailed "judge journey" audit of the UnDocumented codebase, comparing the two systems across value propositions, architectural design, potential security and compliance risks, and technical implementation details. 

The comprehensive, executive-ready evaluator report has been successfully compiled and sent back to the parent agent (`main agent`).

