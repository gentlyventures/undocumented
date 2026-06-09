# Competitor Profile: FastCV

## 1. Project Information
- **Testing Access (Prototype)**: [fastcv.co](https://www.fastcv.co/)
- **Demo Video**: [YouTube](https://www.youtube.com/watch?v=GSLIGpkFr9w)

---

## 2. Problem Statement
- The job market punishes generic applications, but manual tailoring of resumes and cover letters is highly time-consuming (45-90 mins per role).
- Generic AI tools produce boilerplate, hallucinated text that fails applicant tracking systems (ATS) and human screenings.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Structured career graph: canonical, queryable record of roles, skills, and quantified outcomes.
  - JD Analyzer: extracts keywords, tone, and requirements.
  - Multi-agent collaboration: orchestrates specialised agents (JD Analyzer, Profile Matcher, Resume Rewriter, Cover Letter Writer) collaborating via **Google A2A (Agent-to-Agent)** protocol.
  - Platform integration: integrates with job boards, user directories, and ATS tools via **Anthropic MCP (Model Context Protocol)**.
  - Document exporter: outputs tailored PDF, DOCX, and plain text.
  - Dynamic editing: feeds user revisions back into the canonical profile.

---

## 4. Business Case & ROI
- Generates tailored resumes and cover letters in under 60 seconds.
- Increases applicant throughput while maintaining custom-crafted document quality.
- Solves resume fatigue and recruiter-screening failures.
