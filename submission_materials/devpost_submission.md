# Google for Startups AI Agents Challenge Submission

## 1. Submission Details
- **Project Name**: UnDocumented
- **Tagline**: Autonomous optimization pipeline that audits LLM agent calls, benchmarks templates, and refactors configurations to minimize costs and maximize throughput.
- **Track**: Track 2: Optimize (Existing Agents)

---

## 2. Inspiration (Problem)
Deploying production AI agents leads to spiraling inference costs and latency bottlenecks. Running translation pipelines for Bavl.pro (incubated by Gently Ventures), we hit these exact walls. AI calls are often ad-hoc, un-monitored integrations ("undocumented calls") without rate-limiting, caching, or model routing. Traditional APM tools detect latency spikes but cannot parse code, count tokens, or refactor agent calls, leaving engineering teams with unpredictable bills and scaling blockers.

---

## 3. What it Does (Our Solution)
UnDocumented is a production-proven optimization pipeline that automatically audits, benchmarks, and refactors LLM usage. Ingesting repositories via Git, ZIP, or local path, it executes four stages:
1. **Scanner**: AST parses code files to discover every LLM call, prompt template, model parameter, and context setup.
2. **Strategies**: Generates 6 execution configurations (Concurrent, Batch API, Hybrid Cascading, Worker Pools with Caching, etc.).
3. **Benchmarker**: Simulates these configurations against real-world inputs, gathering token-accurate telemetry on speed, cost, and reliability.
4. **Optimizer**: Evaluates results against developer priorities to generate a production-ready, drop-in integration wrapper.

---

## 4. How We Built It (Technologies Used)
- **Antigravity IDE**: Development workspace where a multi-agent loop built and stabilized the platform.
- **Gemini API & AI Studio**: Gemini 1.5 Pro powers AST Scanner/Optimizer (2M context); Gemini Flash runs simulations.
- **Cloud Run**: Hosts the serverless API/frontend, scaling to zero when idle.
- **ADK / google-antigravity**: SDK managing multi-agent logic and state.
- **MCP / FastMCP**: Standard server exposing tools to Cursor and Gemini Enterprise.
- **GCS & Redis**: Handles telemetry artifacts and distributed cache sync.

---

## 5. Data Sources & Real-World Validation
UnDocumented is backed by 12 months of production data from Bavl's systems and Gently Ventures' Support flows:
- **Total Files Analyzed**: 1,200+ codebase files.
- **API Token Cost Savings**: Cut token costs by **84%** for Bavl translation, saving **$35,000+**.
- **Latency Acceleration**: Reduced document assembly times from 120s down to 11.5s (**10.4x speedup**).
- **Time Saved**: Saved over 1,800 hours of queue wait times.
- **Quality Guard**: Boosted output format consistency by 10x via the cascading strategy.
- **Validation Codebases**: Shipped 6 mock repositories under `demo/` for offline testing: `customer_support_flow` (GPT-4o-mini), `financial_summarizer` (Claude 3.5 Sonnet), `educational_tutor` (Gemini 1.5 Flash), `compliance_guard` (Gemini 1.5 Flash HR Risk), `script_sync` (Gemini 1.5 Pro screenplay), and `ledger_audit` (Llama3-70b & Gemini Flash audit).

---

## 6. What We Learned (Findings & Latency Breakdown)
Benchmarking our six strategies against the sequential baseline (~120s):
- **Caching + Worker Pool**: Prevents duplicate queries, speeding up tasks 8.8x and cutting costs 50%.
- **Hybrid Cascading**: Routing calls to Gemini Flash, escalating to Gemini Pro on failure, achieves Pro-level quality while operating 10x faster and 46% cheaper.
- **Gemini Sweet Spot**: 2M context ingests entire directories; Flash-to-Pro routing provides native cost-performance balance; next-gen model strings (`gemini-2.0-flash-thinking-exp`) ensure seamless SDK transitions.

---

## 7. Challenges & Accomplishments
- **SSE Logs in Stateless Architectures**: Solved live SSE log streaming from Cloud Run using Redis Pub/Sub channels to sync concurrent worker logs to the SSE handler.
- **Rate Limit Simulation**: Fine-tuned our simulation engine to mimic provider rate limits (RPM/TPM) for accurate offline prediction.
- **Accomplishments**: Exposing optimization tools directly inside Cursor via FastMCP; verifying over $35,000 saved in production token billing.

---

## 8. What's Next & Third-Party Integrations
- **Refactoring PRs**: Automatically branching codebases and opening pull requests.
- **Stripe & JWT**: Subscription billing and pay-as-you-go credits; secure JWT handshakes on FastMCP endpoints.
- **Integrations**: Stripe, GitHub/GitLab APIs, OpenAI, Anthropic, Groq APIs, GCP Secret Manager, and Slack Webhooks.

---

## 9. References & Repositories
- **Code Repository**: https://github.com/GentlyVentures/undocumented.git
- **Backend App**: `backend/app.py` | **MCP Server**: `backend/mcp_server.py`
- **ADK Orchestration**: `backend/adk_engine.py` | **Strategies**: `backend/strategies/`
- **Frontend App**: `frontend/src/`

---## 12. Official Submission Questions & Answers

### Q1: On a scale from 1-5, how familiar are you with Google Cloud products? (1=none, 5=expert) *
**Answer:** 5 (Expert)

### Q2: On a scale from 1-5, how familiar are you with Google AI Studio? (1=none, 5=expert) *
**Answer:** 5 (Expert)

### Q3: Describe the readiness of your project for launch. *
**Answer:**
**Production-Ready / Deployed**. UnDocumented is a fully completed application with a production FastAPI backend, local AST analyzer, parallel simulation engines, and an MCP server integration. It has been active in production for nearly a year optimizing Bavl and Gently Ventures' workflows.

### Q4: Which specific feature of Agent Platform was most critical to your project's impact, and what thing it's currently missing? *
**Answer:**
**The multi-agent orchestration and state sharing.** The ability to pass structured execution context and tasks dynamically between our specialized AI agents (Scanner, Benchmarker, and Optimizer) was critical to delivering an automated, seamless audit-to-synthesis flow. 
*What is currently missing:* Out-of-the-box support for parallel speculative execution loops of strategy benchmarks, and native client-side hooks to handle SSE data structures cleanly without manual stream-decoding.

### Q5: If you could add one specific API capability or integration that would have saved you 2+ hours of work, what would it be? *
**Answer:**
**A standardized EventSource / SSE POST stream helper in the Google AI SDK client-side.** This would eliminate the need for manual, low-level stream reader byte-decoding, chunk splitting, and event parser routines to stream logs from uvicorn background processes to React dashboards.

### Q6: If you have any additional information on your project, please include it here.
**Answer:**
UnDocumented was born out of Bavl's document translation system rebuild. Facing 1M+ token context structures, we built UnDocumented to automatically audit client codebases and transition sequential completions to high-concurrency Gemini Flash worker pools with structured caching—resulting in an 84% reduction in API token expenses ($35,000+ saved) and a 10.4x latency drop on Google Cloud Run.
