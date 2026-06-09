# Competitor Profile: ScriptSync

## 1. Project Information
- **Testing Access**: Simulated inside UnDocumented platform.
- **Problem Space**: Screenplay parsing, scene indexing, and editorial timeline exports.

---

## 2. Problem Statement
- Large screenplay documents are difficult to parse manually to track wardrobe, scene, and location details across a full production schedule.
- Visual continuity errors are costly and time-consuming to correct in post-production.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Long-Context Screenplay Parsing: **Gemini 1.5 Pro** parses screenplay documents to map locations, characters, and scene transitions.
  - Multi-Agent Orchestration: coordinates sub-agents to extract metadata and cross-verify continuity rules.
  - Timeline Exporter: generates structured FCPXML files mapping character clips and scene offsets.
  - Cloud Infrastructure: deployed as a series of serverless Cloud Run functions processing batches asynchronously.

---

## 4. Business Case & ROI
- Accelerates the pre-production process for film and media teams.
- Minimizes continuity mistakes during filming by establishing a verified metadata ledger early.
