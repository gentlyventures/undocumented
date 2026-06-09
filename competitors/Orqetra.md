# Competitor Profile: Orqetra

## 1. Project Information
- **Testing Access (Demo)**: [orqetra-agents-demo-wowuwwbtrq-uc.a.run.app](https://orqetra-agents-demo-wowuwwbtrq-uc.a.run.app/demo/google-ai-agents-challenge)
- **Demo Video**: [Google Drive Video](https://drive.google.com/file/d/1bvXreUTQLQ-sqC9UmDoT-oSz_gMshYCy/view?usp=sharing)
- **Architecture Diagram**: [Google Drive Link](https://drive.google.com/file/d/1cfbcnkqiesczKMXGLNlq4fbPogRo6OV9/view?usp=sharing)
- **Code Repository**: [UtenaOS/orqetra-google-agents-challenge](https://github.com/UtenaOS/orqetra-google-agents-challenge)

---

## 2. Problem Statement
- Turning human workflows across browsers and desktop apps into automated AI scripts is fragile and presents security leaks.
- Blind automation risks generating thin or incorrect content without human judgment gates.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Teach-Once Workflow: records human actions, previews steps, requests human approval, executes, verifies, and exports artifacts.
  - Orqetra Windows Agent: client-side agent executing desktop-side instructions.
  - Browser Observation Hook: safely extracts visible webpage text without exposing raw cookies/session state.
  - Output Quality Gate: evaluates content sufficiency, missing sections, and placeholder omissions before formatting.
  - Structure Isolation: decouples runtime variables (URLs, file paths) from the reusable flow template.
- **Hosting & Infrastructure**: Deployed via Cloud Build to Google Cloud Run and Artifact Registry.

---

## 4. Business Case & ROI
- Speeds up back-office document processing pipelines.
- Guarantees safety and prevents automated execution mishaps via multi-stage human approval gates.
- Protects client credentials by keeping runtime values ephemeral.
