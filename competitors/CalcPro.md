# Competitor Profile: CalcPro

## 1. Project Information
- **Testing Access**: [calcpro.renxaa.com](https://calcpro.renxaa.com/)
- **Demo Video**: [Google Drive Video](https://drive.google.com/file/d/1CPT0H7Ohm31QRfPKZhj3Mv7qXeS5Vc-t/view?usp=drive_link)
- **Code Repository**: [calcpro.renxaa.com](https://calcpro.renxaa.com/) (Embedded or hosted)
- **Architecture Diagram**: [calcpro.renxaa.com](https://calcpro.renxaa.com/)

---

## 2. Problem Statement
- Accountants are stuck between basic calculators (fast but forgetful) and Excel sheets (slow, complex, error-prone for quick calculations).
- Managing dozens of temporary spreadsheets leads to fragmented desk math and lost audit trails.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Voice-to-table input: voice dictation to auto-fill tables.
  - Multi-input pasting: automatically strips formatting, commas, and dollar signs from copy-pasted PDF/email data.
  - Interactive ledgers: links calculator entry directly to spreadsheet tables (updating totals dynamically).
  - Scratchpad auto-saves: side drawer maintains calculations without needing named files.
  - LLM audit export: outputs structured clean text logs that can be analyzed directly by models like Claude for audit verification or client email drafting.
  - Pre-built templates: presets for common accounting scenarios (accruals, depreciation models).
- **Security & Privacy Focus**: Read-in-memory processing with no persistent storage, support for fully local/on-prem deployment options.

---

## 4. Business Case & ROI
- Reduces common accounting math jobs from 15 minutes to 10 seconds.
- Minimizes data entry errors.
- Shortens 4-hour audit review tasks into a 5-minute file audit.
- Returns approximately 4.5 hours per employee per week.
