# Competitor Profile: Geneva

## 1. Project Information
- **Testing Access**: [Geneva Portal](https://geneva.ai) (Sign-in: hackathon@google.com / Password123)
- **Demo Video**: Narrated workflow video generating questionnaires.
- **Problem Space**: Third-party risk management (TPRM) and cybersecurity vendor auditing.

---

## 2. Problem Statement
- Statically defined, generic vendor risk assessment questionnaires generate low-quality compliance data and face high non-response rates.
- Risk analysts lack automation to tailor queries based on the vendor's actual cybersecurity posture, incidents, and software stack.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - One-Click Generation: compiles customized questionnaires matching target security profiles.
  - Justification and rubrics: appends rationale and target response expectations for every question.
  - Multi-source integration: pulls news, search alerts, and security publications via web scrapers.
  - Escalation routing: emails assessments or delivers them via B2B dashboard workflows with read receipts.
  - Stack: React frontend; Node and Rust microservices; Redis locks; n8n workflow integration; Pub/Sub events; Cloud Tasks queue; and MongoDB audit logging.
- **LLM Engine**: Gemini via Vertex AI.

---

## 4. Business Case & ROI
- Speeds up third-party risk management intake.
- Improves vendor compliance response rates by removing irrelevant questions.
- Automatically initiates plans of action (remediations) for identified security gaps.
- Grounding via audited justifications limits LLM hallucination.

---

## 5. Judge Scorecards & Evaluation

### Startups Challenge Auditor Evaluation

# Google for Startups AI Agents Challenge - Competitor Audit & Judge Scorecard
**Target Competitor:** Geneva (Project URL: https://devpost.team/google-cloud-for-startups/projects/17705)
**Reference Project:** UnDocumented
**Evaluator:** Google Cloud Principal Engineer & Veteran Startup VC

---

### Action Required by Main Agent:
Please write the following markdown content to the file:
`submission_materials/judge_scorecard.md`

---

# Competitor Audit Report: Geneva

## 📊 Scorecard Summary: Geneva

| Category | Weight | Score (0-10) | Weighted Score | Status / Critique |
| :--- | :---: | :---: | :---: | :--- |
| **Technical Implementation** | 30% | **4.8 / 10** | 1.44 / 3.00 | 🛑 Heavily over-engineered microservice mess; reliance on n8n is a production risk. |
| **Business Case & ROI** | 30% | **3.5 / 10** | 1.05 / 3.00 | 🛑 Fundamental misunderstanding of the GRC/TPRM market; bespoke questionnaires increase vendor friction. |
| **Innovation & Creativity** | 20% | **6.5 / 10** | 1.30 / 2.00 | 🟡 Creative use of multi-source news scraping, but practically useless due to hallucination risks. |
| **Deployment & Architecture** | 20% | **6.0 / 10** | 1.20 / 2.00 | 🟡 Uses standard GCP products, but misses stateless synchronization standards for n8n/microservices. |
| **OVERALL SCORE** | **100%** | **5.0 / 10** | **4.99 / 10.0** | **Rank #12-15 (Hackathon Prototype, Non-Viable B2B Business)** |

---

## 🔍 Hard Gaps & Discrepancies (Geneva)

### 1. The GRC Saturated Market & Bespoke Questionnaire Friction
* **The Reality:** Third-Party Risk Management (TPRM) is a mature, highly saturated market dominated by massive GRC players (OneTrust, SecurityScorecard, BitSight, Whistic). 
<truncated 4904 bytes>
he codebase, ensuring 100% accurate identification of API templates. Geneva relies on noisy, unverified web scraping that is prone to data poisoning and AI hallucinations.
2. **Unified, Lightweight Stack vs. Microservice Hell:** UnDocumented compiles down to a single stateless FastAPI/React container that starts instantly on Cloud Run and integrates a standard Python MCP server (FastMCP). Geneva uses a bloated, multi-language stack (Node, Rust, n8n, MongoDB) that is expensive to host and brittle to scale.
3. **Validated Production ROI:** UnDocumented proves $35,000 in token savings and a 10.4x speed acceleration over 12 months. Geneva presents theoretical GRC metrics that ignore vendor response friction.

---

## 🚀 Actionable Red-Team Remediation Plan (For UnDocumented to Win)

To solidify the Grand Prize, UnDocumented must implement the following non-negotiable enhancements to guard against competitor threats:

1. **Vertex AI Enterprise SDK Configuration:**
   * **Issue:** Google Cloud enterprise judges favor Vertex AI SDK endpoints (`google-cloud-aiplatform`) over Google AI Studio (`google-genai` keys) due to corporate IAM/OAuth security mandates.
   * **Remediation:** Add a runtime flag in `backend/models_config.py` to seamlessly switch authentication from direct API keys to Vertex AI Service Account OAuth2 credentials when deployed on Google Cloud.
2. **Identity-Aware Proxy (IAP) & VPC Service Controls:**
   * **Issue:** Cloud Run endpoints without access control represent a security vulnerability.
   * **Remediation:** Provide standard Terraform/deployment scripts in the `infrastructure/` folder configuring Google Cloud IAP and Cloud Armor to restrict FastAPI backend endpoints.
3. **Redis Connection Pool Management (`ConnectionPool`):**
   * **Issue:** High-throughput benchmarking runs can lead to Redis socket exhaustion in concurrent environments.
   * **Remediation:** Refactor Redis client initializations in the backend to utilize dedicated connection pool managers (`ConnectionPool`).

### Google Cloud Head of AI Evaluation

### Executive Audit Report: Geneva Competitor Assessment & UnDocumented Challenge Review
**Prepared by**: Google Cloud VP & Head of AI / Startup Challenge Lead Judge
**Target Evaluated**: Geneva (Competitor) & UnDocumented (Submission)

---

### PART I: GENEVA COMPETITOR EVALUATION

#### 1. Value Proposition & Moat
Geneva offers **custom vendor security assessment generation grounded in target company security posture**.
* **Moat**: Its primary moat is the automation of customized security questionnaire generation and response mapping. Instead of relying on generic templates, it dynamically ingests internal policies, infrastructure details, and past disclosures. This creates a high-fidelity context for evaluating a specific vendor's risk profile against the buyer's internal compliance thresholds.
* **VP AI Assessment**: Solid business-use case. Security compliance is a high-cost, manual bottleneck. However, the moat is relatively thin, as competitors can easily replicate the retrieval-augmented generation (RAG) mapping over ingested security documents.

#### 2. Architectural Design
Geneva's architecture is a microservices-heavy, event-driven, low-code hybrid model:
* **CI/CD & Compute**: Cloud Build builds container images, which run serverless on Cloud Run.
* **Queuing & Events**: Cloud Tasks manages rate-limited task queuing, while Pub/Sub acts as the event broker between services.
* **Orchestration**: n8n visual workflows orchestrate the processes, passing data to Node/Rust microservices.
* **Database & Caching**: MongoDB stores document metadata, and Redis caches transient sessions.
* **Inference**: Vertex AI Gemini API generates reasoning and text completions.

#### 3. Gaps and Compliance Concerns
From an enterprise AI audit pers
<truncated 3345 bytes>
lect pre-seeded repositories (like `/demo/compliance_guard`) and execute an AST scanner and strategy benchmark simulation in under 60 seconds without needing to provision API keys.

#### 2. Technical Integration Robustness (GCP, Gemini SDK, ADK, FastMCP)
* **GCP Architecture**: Scalable and serverless. Uses Cloud Run, flat GCS structures to persist runs without database lock race conditions, and synchronizes SQLite session databases with GCS.
* **Gemini SDK (`google-genai`)**: Confirmed compliance in `backend/models_config.py`. Uses `from google import genai` and `client = genai.Client(...)` async wrappers. Exponential backoff and random jitter are properly implemented to handle `429 ResourceExhausted` errors.
* **ADK (google-antigravity)**: Robust usage in `backend/adk_engine.py`. Employs Gemini 1.5 Pro for scanning codebases with its 2-million context window, using structured schemas (`SemanticScanResult` and `QualityGrade`) to ensure clean JSON outputs.
* **FastMCP Server**: The stdio MCP transport in `backend/mcp_server.py` is compliant and includes path-traversal whitelists to restrict directories to the authorized workspace root, preventing local sandbox breaches.

#### 3. Zero Trust Architecture Compliance
* **Verdict**: **Appropriate and compliant.**
* **Segmented Layout**: Public marketing/docs sit on `doc.fail` (`docs_page.html` served via FastAPI), while the dashboard app is hosted on `app.doc.fail`.
* **Access Policy**: Gated behind Cloudflare Access SSO, requiring OTP validation for `@google.com` or `@gentlyventures.com`. Bypassing with the query token allows challenge reviewers to test local configurations while validating the production-grade Zero Trust design.

#### 4. Competitive Ranking & Challenge Contender
* **Verdict**: **Rank 1-2 (Tied for Grand Prize Winner).**
* UnDocumented stands out due to its low friction setup, standard-compliant MCP tools, and verified production performance metrics ($35,000 saved for Bavl). It is a top-tier contender for the Grand Prize.

