# 🚀 UnDocumented: Autonomous AI Agent Optimization Pipeline

UnDocumented is an enterprise-grade autonomous developer agent system that analyzes how your application makes AI API calls, benchmarks your templates across multiple models and data processing strategies, and determines the optimal integration pattern (Sequential, Async Concurrent, Provider Batch API, Hybrid Model Cascading, Distributed Worker Pools, or Semantic Clustering) to achieve the fastest, cheapest, and highest-quality processing strategy tailored to your specific application's usage.

---

## 💼 B2B Startup Value Proposition

## 🏢 Context: From Bavl Internal Optimization to UnDocumented

**UnDocumented** was originally conceived as the internal AI optimization engine for **Bavl** (a high-volume, document-level translation and localization platform incubated by **Gently Ventures**). In production, Bavl's translation loops process massive multi-megabyte document context streams. Under standard sequential API loops, the platform hit extreme latency bottlenecks (up to 120 seconds per document) and surging model token expenses. 

To solve this, the Gently Ventures and Bavl team built this optimization pipeline to scan Bavl's codebases, run synthetic benchmarking simulations, and deploy **Hybrid Model Cascading** (routing 90% of requests to Gemini 1.5 Flash and dynamically escalating to Gemini 1.5 Pro upon failure verification) combined with distributed Redis key-value caching. 

**The Production Results on Bavl:**
- **84% reduction in API token costs** (saving over $35,000 in monthly billing).
- **10.4x speed acceleration** (reducing average document assembly processing from 120 seconds down to 11.5 seconds).
- **1,800+ developer and queue processing hours saved.**

Recognizing that every startup and enterprise building autonomous agents faces these identical cost and performance walls, we decoupled the engine into **UnDocumented**—packaging it as a developer-facing scanner, simulator studio, and Model Context Protocol (MCP) server so that any engineering team can optimize their AI agents.

---

## 🏢 Context: From Bavl Internal Optimization to UnDocumented

**UnDocumented** was originally conceived as the internal AI optimization engine for **Bavl** (a high-volume, document-level translation and localization platform incubated by **Gently Ventures**). In production, Bavl's translation loops process massive multi-megabyte document context streams. Under standard sequential API loops, the platform hit extreme latency bottlenecks (up to 120 seconds per document) and surging model token expenses. 

To solve this, the Gently Ventures and Bavl team built this optimization pipeline to scan Bavl's codebases, run synthetic benchmarking simulations, and deploy **Hybrid Model Cascading** (routing 90% of requests to Gemini 1.5 Flash and dynamically escalating to Gemini 1.5 Pro upon failure verification) combined with distributed Redis key-value caching. 

**The Production Results on Bavl:**
- **84% reduction in API token costs** (saving over $35,000 in monthly billing).
- **10.4x speed acceleration** (reducing average document assembly processing from 120 seconds down to 11.5 seconds).
- **1,800+ developer and queue processing hours saved.**

Recognizing that every startup and enterprise building autonomous agents faces these identical cost and performance walls, we decoupled the engine into **UnDocumented**—packaging it as a developer-facing scanner, simulator studio, and Model Context Protocol (MCP) server so that any engineering team can optimize their AI agents.

---

For modern startups and enterprise engineering teams, AI inference is rapidly becoming the largest component of the infrastructure bill. However, developers often integrate LLMs using quick, ad-hoc wrapper functions ("undocumented calls") scattered throughout codebases without implementing proper:
- **Rate-limit resilience** (leading to 429 errors and service downtime)
- **Token efficiency** (leading to inflated input/output token costs)
- **Model routing** (using expensive reasoning models for simple tasks)
- **Parallelization or Batching** (causing massive bottleneck latency)

### What UnDocumented Solves:
1. **Dramatically Lower Costs**: UnDocumented scans your code, identifies every active API call, and automatically refactors them to use optimal routing (such as cascading from Gemini 1.5/2.0 Flash to Pro) and provider Batch APIs. This slashes token bills by **50% to 84%**.
2. **Accelerated Pipeline Speed**: By migrating sequential API calls to async concurrent patterns and distributed worker pools with key-value caching, UnDocumented increases processing speed by **4x to 18x**.
3. **Resilient Production Reliability**: Automatic integration of token-bucket rate limiters, exponential backoff/retry policies, and fallback model routing guarantees a **99.9%+ API call success rate**.
4. **Zero-Downtime Integration**: The system generates a clean, pre-configured, and unit-tested drop-in replacement package with a zero-friction migration path.

---

## 🏗️ Technical Specification: The Four-Phase Pipeline

UnDocumented processes a codebase through a modular pipeline designed to go from raw source code to optimized delivery packages.

```mermaid
graph TD
    A[Client Codebase / Zip / Git URL] --> B[Scanner Agent]
    B -->|AST Parsing & Pattern Matching| C[Identified LLM Calls & Templates]
    C --> D[Strategy Generator]
    
    subgraph Execution Strategies
        D --> E1[1. Sequential Baseline]
        D --> E2[2. Async Concurrent]
        D --> E3[3. Batch API]
        D --> E4[4. Hybrid Cascading]
        D --> E5[5. Distributed Worker Pool]
        D --> E6[6. Fan-out Embeddings]
    end
    
    E1 & E2 & E3 & E4 & E5 & E6 --> F[Benchmarker Agent]
    F -->|Telemetry: Latency, Tokens, Success Rate| G[Optimizer Agent]
    
    G -->|Priority: Speed / Cost / Quality| H[Drop-in Wrapper SDK & Optimized Code]
    G -->|ROI & Savings Scenarios| I[Detailed Markdown & JSON Analysis Reports]
    
    H --> J[Client Delivery Package]
    I --> J
```

### 1. The Scanner
- **Ast & Regex Parsing**: Scans `.py`, `.js`, `.ts`, and `.go` files for import statements and client initializations of OpenAI, Anthropic, Gemini/Vertex AI, and LangChain SDKs.
- **Context & Prompt Extraction**: Extracts prompt templates, system instructions, temperature, token limits, and usage patterns.
- **Use Case Taxonomy Creation**: Classifies discovered calls into distinct profiles: `general_chat`, `content_generation`, `high_volume_processing`, or `vector_search`.

### 2. The Strategies
UnDocumented runs test cases generated from your real usage patterns across six separate execution paradigms:
*   **Sequential (Baseline)**: Synchrounous, blocking requests to establish a control benchmark for latency and costs.
*   **Async Concurrent**: Executes requests in parallel using non-blocking asynchronous calls with configurable semaphore limits.
*   **Batch API**: Leverages provider batch endpoints (e.g. OpenAI Batch API) to achieve a flat **50% discount** on inference, ideal for non-time-critical processing.
*   **Hybrid Model Cascading**: Routs requests dynamically. A lightweight model (e.g., Gemini 1.5/2.0 Flash / GPT-4o-mini) executes first. If it detects a semantic failure flag (e.g., "I cannot answer," short output, or invalid JSON schema), it escalates to a reasoning model (Gemini 1.5 Pro / GPT-4o).
*   **Distributed Worker Pool**: Employs multiple worker queues running in parallel, integrated with a local/distributed cache and adaptive backoff retry logic.
*   **Fan-out with Embeddings**: Groups highly similar prompt contexts using vector embeddings and processes representative clusters in batches to bypass redundant inference.

### 3. The Benchmarker
- **Telemetry Collection**: Measures time-to-first-token (TTFT), total latency, input/output tokens, and cost.
- **Reliability Simulation**: Injects mock rate limits (429 errors) and network drops to measure how each strategy handles service instability.
- **Metric Verification**: Generates detailed, token-accurate data to determine the actual efficiency score of each model and strategy.

### 4. The Optimizer
- **Weighted Scoring**: Evaluates models and strategies using a composite score based on the client's priority:
  - `Speed`: Prioritizes lowest latency (Async Concurrent / Hybrid Cascading).
  - `Cost`: Prioritizes minimum expense (Batch API / Lightweight model routing).
  - `Quality`: Prioritizes reasoning capabilities (Reasoning models / High-accuracy settings).
  - `Balanced`: Optimizes for optimal price-to-performance ratio.
- **Wrapper Generation**: Creates a customized, pre-configured wrapper SDK tailored to the codebase's specific use cases.
- **Report Compiler**: Automatically outputs human-readable reports outlining the exact performance improvements, ROI calculations, and migration instructions.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Python**: Version 3.11 or higher.
- **Node.js**: Version 18 or higher (for local frontend development).
- **Docker**: For running the unified containerized deployment (recommended).
- **Google Cloud Platform (GCP)**: A project with Cloud Run, Cloud SQL, and Vertex AI/Gemini APIs enabled.
- **API Keys**: Valid keys for OpenAI, Anthropic, or Gemini APIs (Google AI Studio).

### 1. Unified Container Deployment (Recommended)
You can build and run the entire application (FastAPI backend + compiled React frontend served statically) in a single command using Docker:

```bash
# Clone the repository
git clone https://github.com/GentlyVentures/undocumented.git
cd UnDocumented

# Build the Docker container
docker build -t undocumented .

# Run the container locally
docker run -p 8080:8080 \
  -e GEMINI_API_KEY="your-gemini-key" \
  -e OPENAI_API_KEY="your-openai-key" \
  undocumented
```
The application will be accessible at [http://localhost:8080](http://localhost:8080).

---

### 2. Local Development Setup
If you want to run the backend and frontend separately with live reloading (HMR):

#### A. Backend Setup (FastAPI)
```bash
# Navigate to the backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install google-antigravity

# Create and configure .env in the backend/ directory (see Section 3 below)
# Run the FastAPI server
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

#### B. Frontend Setup (React + Vite)
```bash
# Navigate to the frontend directory
cd ../frontend

# Install node dependencies
npm install

# Run the Vite development server
npm run dev
```
The dev server will run on [http://localhost:5173](http://localhost:5173) and automatically proxy `/api` calls to the backend on port 8000.

---

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory (or set environment variables in your deployment environment):

```env
# API Access Keys (At least GEMINI_API_KEY is required for ADK loops)
GEMINI_API_KEY="AIzaSyYourGeminiKey"
OPENAI_API_KEY="sk-proj-YourOpenAIKey"
ANTHROPIC_API_KEY="sk-ant-YourAnthropicKey"

# Optional Cloud Run Database & Cache Sync (For Stateless Architecture)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"  # Connects to Cloud SQL
REDIS_HOST="10.0.0.3"                                 # Cloud Memorystore Redis host
REDIS_PORT="6379"
GCS_BUCKET_NAME="undocumented-persistent-vault-2026"  # GCS bucket for logs/history

# Optimizer Default Configuration
OPTIMIZATION_PRIORITY="balanced"
```

---

### 4. Running the Model Context Protocol (MCP) Server
UnDocumented includes a Python MCP server (using FastMCP) that exposes code analysis tools to AI IDEs (Cursor, VS Code, Claude Desktop, Claude Code) or Gemini Enterprise:

```bash
# Activate your backend virtual environment and run the server
python backend/mcp_server.py
```

To configure Cursor or Claude Desktop to use UnDocumented:
```json
{
  "mcpServers": {
    "undocumented": {
      "command": "python",
      "args": ["/absolute/path/to/UnDocumented/backend/mcp_server.py"],
      "env": {
        "GEMINI_API_KEY": "AIzaSy..."
      }
    }
  }
}
```
This enables tools like `scan_repository` and `benchmark_codebase` natively inside your AI context.

---

### 5. Customizing the Optimization Engine
To adjust optimization settings, such as pricing tables, model capabilities, or configuration profiles, edit `backend/models_config.py` and strategy modules in `backend/strategies/`.

#### Adding custom models to the optimizer configurations:
```python
# In backend/models_config.py under MODEL_CONFIGS
"gemini": {
    "low": {
        "name": "gemini-1.5-flash",
        "input_cost_per_m": 0.075,
        "output_cost_per_m": 0.30,
        "base_latency": 0.18,
        "latency_per_token": 0.0008
    },
    "medium": {
        "name": "gemini-1.5-pro",
        "input_cost_per_m": 1.25,
        "output_cost_per_m": 5.00,
        "base_latency": 0.45,
        "latency_per_token": 0.0005
    },
    # Add next-gen Gemini Flash / Pro characteristics when available
}
```

---

## 📁 Output Artifacts Structure

Upon completing the workflow, the system outputs the generated artifacts to `workflow_outputs/ClientName/`:

```
workflow_outputs/
└── ClientName/
    ├── ClientName_analysis.json        # Codebase scanner findings
    ├── ClientName_test_report.json     # Strategy benchmarking telemetry
    ├── ClientName_optimization.json    # Selection scoring and recommendations
    ├── ClientName_analysis_report.md   # B2B executive report
    └── ClientName_optimized_package/   # Ready-to-deploy wrapper package
        ├── optimized_scripts/          # Refactored codebase integration files
        ├── documentation/              # Integration & migration guides
        ├── tools/                      # Validation and load testing scripts
        └── config/                     # Configuration JSON templates
```

---

## 🤖 Development Process & Agentic Self-Auditing Loop

The creation of **UnDocumented** was an exercise in pure agentic pair-programming. Built using the Google Antigravity (AGY) SDK, the codebase was developed by orchestrating a dedicated panel of specialized AI subagents (including a Core Systems Engineer, a Design Virtuoso, and a highly critical Red-Team Startups Judge). 

Our process was a rigorous cycle of feedback loops:
1. **Research & Hypothesis**: Parallel agents swept developer forums, whitepapers, and academic repos to discover undocumented LLM optimization strategies (like medusa speculative decoding and semantic token backpressure).
2. **Build & Test**: We implemented these strategies (e.g., async cascades and token-bucket rate limiters) in Python and React.
3. **Iterative Refactor**: We deployed a cynical `startups_judge` agent to aggressively review the code, catch vulnerabilities (like hardcoded APIs, stateless GCS requirements, and model name mismatches), and fail builds that didn't meet production standards.
4. **Validation**: We ran automated AST scanner diagnostics and Vite production builds repeatedly until the pipeline achieved 100% test passing rates. 

By dogfooding the exact multi-agent orchestration, token optimization, and Google Gemini API configurations we were benchmarking, we reached a verified production-ready system capable of optimizing other agents.

---

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.

