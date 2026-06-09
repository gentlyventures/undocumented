# Competitor Profile: DashboardGenius: Manufacturing Production Scheduling Agent

## 1. Project Information
- **Problem Space**: Manufacturing operations, supply-chain coordination, and multi-source production scheduling.

---

## 2. Problem Statement
- Manufacturing planners spend hours manually reconciling demand, inventory levels, constraints, and exceptions across fragmented systems (Power BI, Snowflake, Google Sheets, ERP exports).
- Errors in schedules lead to stockouts, line conflicts, and excess inventory.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Source-Backed Scheduling: reads verified inputs, extracts planning horizons, and compiles reviewable schedules.
  - LLM Judgment: uses Gemini to parse unstructured sheet rows, reconcile demand/inventory constraints, and write planner caveats.
  - Deterministic Harness: enforces source permissions, runs evidence quality gates, checks candidate coverage, and persists runs.
  - Connectors: links to Power BI semantic models, Snowflake warehouses, Google Sheets, and custom ERP report uploads.
  - Stack: Next.js/TypeScript frontend and API; Python planning worker; MongoDB database storing runs, slices, and draft scheduling artifacts.

---

## 4. Business Case & ROI
- Consolidates scattered manufacturing data into a unified, auditable planning format.
- Prevents line conflicts and inventory expiry risks by checking source evidence.
- Maintains human-in-the-loop oversight by presenting a draft schedules review interface.
