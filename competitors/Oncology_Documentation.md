# Competitor Profile: ADK Reliability Slice for Oncology Documentation

## 1. Project Information
- **Testing Access**: [Live Web Application](https://notatnik-adk-slice-6fjc6wlk6a-ew.a.run.app/?token=1DNsMAtR6fpjIp1pjZbGK1nxN1qgHk9R)
- **Demo Video**: [YouTube Video Link](https://youtu.be/b_SkfPokvCA)
- **Architecture Diagram**: [Architecture diagram](https://raw.githubusercontent.com/kstawiski/notatnik-adk-slice-public/refs/heads/master/submission/architecture.svg)
- **Code Repository**: [kstawiski/notatnik-adk-slice-public](https://github.com/kstawiski/notatnik-adk-slice-public)

---

## 2. Problem Statement
- Oncology documentation is repetitive and high-stakes. Naive LLMs lack reliability, failing on inconsistencies across medical files (e.g. nodal status discrepant between report segments).

---

## 3. Technical Architecture & Google Cloud Integration
- **LLM Core**: Google ADK coordinating Document Parser, Evidence Extractor, and Clinician QC agents.\n- **Grounding Corpus**: Grounded in the NCI PDQ Treatment-Summary Corpus using a local NumPy-backed retrieval vector index.\n- **PII Protection**: Regex-based output scrubber to redact patient names and identifiers.\n- **Deployment**: FastAPI backend deployed on Google Cloud Run with FastMCP stdio tools.

---

## 4. Business Case & ROI
- Reduces clinic desk-admin burden. Highlights contradictions dynamically, requiring physician confirmation on medical discrepancies.

---

## 5. Judge Scorecards & Evaluation

### Startups Challenge Auditor Evaluation

# JUDGE AUDIT REPORT: COMPETITOR EVALUATION & BENCHMARKING
**Target Competitor**: ADK Reliability Slice for Oncology Documentation (Notatnik Medyczny)
**Target Project URL**: https://notatnik-adk-slice-6fjc6wlk6a-ew.a.run.app/?token=1DNsMAtR6fpjIp1pjZbGK1nxN1qgHk9R
**Target Repository**: https://github.com/kstawiski/notatnik-adk-slice-public
**Target Video**: https://youtu.be/b_SkfPokvCA

---

## 1. Scorecard Summary

### **Competitor Grade: 4.2 / 10** (Status: Brittle AI Wrapper / Non-Enterprise Prototype)

*   **VC / Business Perspective (2.0/10)**: This is an extremely narrow, niche tool targeting clinical oncology staging documentation. Hospital IT procurement cycles are notoriously long (12–18 months), require extensive security reviews, and have zero tolerance for regulatory errors. The risk of medical liability for false positives/negatives in staging (cT2 N0 vs cT3 N1) is immense. The startup has no defensible moat and a tiny initial TAM.
*   **Architecture & Engineering (4.0/10)**: While FastAPI, FastMCP, and Google ADK are modern choices, the execution details are amateur. Running a NumPy-backed retrieval index in a stateless Cloud Run container is a classic "toy" pattern. The safety scrubbing logic is deterministic/regex-based, which is a major compliance risk under HIPAA.
*   **Google Developer Guidelines Adherence (4.5/10)**: Claims of using Vertex AI and the 2M token Gemini context window are contradictory. They run local retrieval (RAG) over a tiny corpus instead of leveraging Gemini's massive context directly. Furthermore, their setup mixes up AI Studio developer keys with Vertex AI's enterprise VPC/IAM security requirements.

---

## 2. Hard Gaps & Discrepancies (Competitor Critique)

### **A. Codebase & Architectur
<truncated 3696 bytes>
rving complex layouts, structural hierarchies (headings, sidebars, footnotes), and custom typographic styles (DOCX -> DOCX, TEI XML, Sefaria JSON) is a massive technical barrier that no other wrapper matches.
*   **Scaling & Efficiency**: Our modulo-based segment slicing across GCP Batch spot instances ensures we can process 1000+ page documents in parallel at a fraction of the cost, fully aligning with Google’s scale-to-zero and spot compute guidelines.
*   **Enterprise-Ready Database & Telemetry**: We use Postgres for state tracking, user credits management, and live observability progress metrics, whereas competitors are relying on memory or basic local logs.

---

## 4. Actionable Red-Team Remediation Plan (To Guarantee a Grand Prize Win)

To ensure UnDocumented secures the Grand Prize, we must address our own gaps and make our technical submission bulletproof:

1.  **VPC Service Controls & Cloud SQL Auth Proxy**:
    *   Document and demonstrate our use of the lazy-retry connection pattern to Cloud SQL via secure sidecar proxies. This proves we follow enterprise-grade cloud architecture (zero public IP database connections).
2.  **Automated Style Regression Pipeline**:
    *   Build a lightweight testing script that compares the styles of the input DOCX against the output DOCX to verify that zero formatting characteristics (margins, spacing, footnote structures) are lost or corrupted during translation.
3.  **Demonstrate Gemini 2M Context Over RAG**:
    *   Highlight that unlike competitors who use toy vector databases (like NumPy), UnDocumented utilizes Gemini's native 1M+ token context window to load the entire source document, glossaries, and historical translation style guides simultaneously for zero-shot in-context learning.
4.  **Multi-Language Config Validation**:
    *   Showcase that our schemas and `LanguageConfig` modules are fully parameterizable, and demonstrate execution on a secondary language pair (e.g., Arabic or Spanish) to prove our system is not a single-market hack.

### Google Cloud Head of AI Evaluation

# Executive Evaluation & Red-Team Audit Report
**Evaluator:** Google Cloud VP & Head of AI
**Event:** Google for Startups AI Agents Challenge

---

## PART 1: UNDOCUMENTED CODEBASE & SUBMISSION AUDIT

### 1. Onboarding & Judge Journey Evaluation
- **Access & Friction**: The onboarding path is exceptionally clear. The implementation of the secure query bypass parameter (`?token=google-challenge-judge-bypass-2026`) in `frontend/src/App.tsx` allows reviewers to bypass the Cloudflare Zero Trust login page seamlessly, avoiding SSO setup friction.
- **2-Minute Target**: Fully validated. A judge can select a pre-seeded mock repo (e.g. `compliance_guard`, `script_sync`), trigger an AST scanner run, initiate the multi-strategy benchmark, and inspect the performance analytics dashboards in under 30 seconds.
- **Offline Simulation Mode**: The fallback mock simulation mode is excellent for offline/keyless evaluation, removing API key dependencies.

### 2. Technical Integration Audit
- **Google AI Studio (Gemini SDK)**: Uses the new `google-genai` SDK (`genai.Client` and `aio.models.generate_content`) with compliant model naming schemas.
- **ADK (Agent Development Kit)**: Integrates `google-antigravity` via structured Pydantic schema outputs (`response_schema` in `LocalAgentConfig`).
- **Model Context Protocol (FastMCP)**: Implements standard FastMCP tool decorators. Whitelists directory access to the authorized workspace root to prevent directory-traversal attacks.
- **Google Cloud Run & Storage**: Employs stateless database synchronization (downloading/uploading `benchmark_history.db` from GCS on connection initialization) and flat prefix logging (`runs/{run_id}.json`) to avoid multi-instance write-after-read race conditions on server
<truncated 770 bytes>
LITY SLICE FOR ONCOLOGY DOCUMENTATION' (NOTATNIK MEDYCZNY)

### 1. Value Proposition & Moat
- **Value Proposition**: High-fidelity clinical documentation highlighting contradictions and citations. Crucial for clinical decision support in oncology, where clinical data is unstructured and constantly evolving.
- **Moat**: **Medium**. While clinical oncology represents a high-pain vertical, relying on prompting general LLMs without custom medical fine-tuning or proprietary data partnerships makes the moat thin.

### 2. Architectural Design
- **Agents**: Doc, QC, and Evidence Agents cooperating via ADK.
- **RAG**: Local NumPy index for vector search.
- **Interfaces**: FastMCP tools.

### 3. Gaps and Compliance Concerns (VP-Level Red-Team Review)
- **HIPAA and Clinical Compliance Risks**: Hosting patient records (PHI) and processing unstructured clinical narratives on Cloud Run / Vertex AI without a signed Business Associate Agreement (BAA) and strict VPC Service Controls (VPC-SC) is an extreme compliance hazard.
- **Scalability Gaps (NumPy Index)**: The NumPy vector retriever is a toy implementation. Doing in-memory brute-force cosine similarity does not scale. It must be replaced by an enterprise-grade vector database like **Cloud SQL pgvector** or **Vertex AI Search**.
- **Data Privacy Violations (PII Regex)**: Custom PII regex sanitizers are highly fragile. Misclassifying medical terms or failing on complex unstructured clinical notes creates massive legal and financial liabilities. Must transition to **Google Cloud DLP (Data Loss Prevention) API**.

### 4. UnDocumented vs. Notatnik Medyczny
- UnDocumented is built on a robust enterprise-ready framework with stateless database sync, Redis caching, and dynamic 429 backoff.
- Notatnik Medyczny exhibits structural architectural gaps (NumPy, regex PII filters) that make it undeployable in a hospital setting.

### 5. Final Grade for Notatnik Medyczny
- **Overall Grade**: **6.0 / 10.0** (High-value concept, but structurally deficient and legally risky).

