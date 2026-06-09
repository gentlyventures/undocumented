# Competitor Profile: ADV Strategy Pro: Sovereign Multi-Agent AEO Infrastructure

## 1. Project Information
- **Project URL / Demo**: [adv-it-performance.ca](https://adv-it-performance.ca/)
- **Code Repository**: [ADV-Strategy-Core](https://github.com/ADV-IT-Performance-Corp/ADV-Strategy-Core) (Private during judging)
- **Demo Video**: [YouTube](https://youtu.be/nlHLMV8n3KE) / [Alt YouTube](https://youtu.be/OaBtowIkwL0)
- **Presentation Slides**: [Google Drive](https://drive.google.com/file/d/12CLCKfDDEKMmn85TKFdnNlHl98POAFvW/view?usp=sharing)
- **Partner Registry**: [Google Partners](https://www.google.com/partners/agency?id=4913355960)
- **Documentation**: [Google Drive](https://drive.google.com/file/d/1CEzr19b0CE5f4bOgtLtV8KYAxJpWrhuh/view?usp=sharing)

---

## 2. Problem Statement
- **AI Overviews & Agentic Discovery (AEO)**: Shift from standard search result lists to LLM content extraction, requiring structured grounding and citation density.
- **Data Invisibility**: Most business data is semantically invisible to LLMs.
- **High Costs & Fragmented Tools**: Existing AI stacks are fragile, pay agencies $5K–$15K/month, and take 4–8 weeks.
- **Core Bottleneck**: Grounding, coordination, and fiscal discipline at the agent layer.

---

## 3. Technical Architecture & Google Cloud Integration

### Multi-Agent Pipeline
- Powered by **Google Agent Development Kit (ADK 1.23+)** and the open A2A (Agent-to-Agent) protocol.
- Models: **Gemini 3.1 Pro / Flash-Lite**, **Imagen 4**, **Nano Banana**, **Veo**, and **Gemini Live API**.
- **8-wave AEO Pipeline** with 13 critical-path agents:
  `Research` → `ICP` → `Campaign` → `Content` → `SEO` → `UX/Visual` → `Experience/Presentation` → `Deployment` → `Analytics`.

### Core Engineering Moats
1.  **A2A Agent Registry**:
    - Extends `BaseCoreAgent(LlmAgent)`.
    - Declares `AgentCard` with `produces`, `consumes`, `actions`, `tools`, `tier_pin`, and `cost_envelope`.
    - Composed of:
      - 325-LOC Pydantic v2 schema.
      - 365-LOC `DiscoveryService` with first-write-wins name-level deduplication.
      - 211-LOC inverted `CapabilityIndex` for $O(1)$ capability-to-agent lookup.
    - 44 total `AgentCards` (13 production tier-1 + 24 auto-generated tier-2 + 4 curated tier-2 + 3 agency hub).
    - `@adk_tool` decorator automatically registers tools.
2.  **Durable Execution DAG**:
    - Executes via a 1,436-LOC `DurableExecutor` that is resumable, idempotent, and recoverable.
    - Uses a `Director` factory routing to:
      - Deterministic LLM-free planner.
      - LLM planner with **NFKC-hardened Sandwich Defense** (safeguards brand symbols like ™, ½, Ⅰ, Ⅱ, Ⅲ).
    - HITL (Human-in-the-Loop) approval is queue-bound with cross-process advisory lock.
    - `SpendLedger` reservations have a `heartbeat()` daemon to auto-refresh long-running nodes (>10 min).
3.  **Two-Tier Memory**:
    - **Hippocampus**: Local ChromaDB storing per-agent vectors, client-scoped via `client_id` injection.
    - **Grimoire**: Shared Supabase pgvector store for brand voice, pricing, and campaign rules.
    - Memory Bank Phase 3.2 uses `LocalAiSessionService` with `asyncio.Lock` thread-safety, cross-tenant namespacing, bounded `MAX_EVENTS`, and strict fallback.
4.  **Quality Enforcement & Validation**:
    - 4 post-flight validators:
      - `AeoOutputValidator` (enforces score $\ge 70/100$).
      - `ConversionValidator`.
      - `PricingCanonValidator`.
      - `GoldStandardValidator` (8-feature structural similarity vs goldens).
5.  **Cost Defense System**:
    - **5-Layer Cost Defense**: `Research Lock` + `Intent Classifier` + `GroundingGuard` + `5-query cap` + `SpendGate`.
    - Uses GCS semantic execution cache and `ContextPruner` on every call.
    - Slashes cost significantly.
6.  **Production Infrastructure**:
    - Deployed on **6 Cloud Run services** (us-central1).
    - Uses **Memorystore Redis** as an event bus across instances via a VPC connector.
    - **10 internal MCP servers** over a unified ADK-native `MCPToolset` (shared 252-LOC stdio JSON-RPC module with auth fail-loud).
    - Stripe integration with signature verification.
    - `RevenueGate` freeze-not-die failsafe.
    - Verified via **7,976 automated tests** on main, 162K LOC Python code.

---

## 4. Business Case & ROI
- Integrates marketing spend, sales pipeline, and P&L margin.
- Stripe-live pricing canon (March 2026):
  - Free $0 AEO Live Audit (lead generation)
  - $197 AEO Intelligence Report
  - $697 Protocol-Ready Landing Page
  - $2,497 Multi-Page Semantic Site
  - $4,997 Scale Strategic Site
  - $10,000+ Enterprise Custom
- Monthly retainer offerings:
  - $1,497/mo AIO Maintenance
  - $1,497/mo Google Ads Management
  - $1,997/mo Growth Bundle
- Gemini Live API voice agents integrated into retainers.
