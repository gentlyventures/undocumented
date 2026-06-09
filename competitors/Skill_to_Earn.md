# Competitor Profile: Skill-to-Earn @ Chip Design

## 1. Project Information
- **Testing Access**: [ccfoundry-agent-kit Portal](http://34.92.67.203:3000/)
- **Demo Video**: [YouTube](https://youtu.be/qok2V0zUF_A)
- **Architecture Diagram**: [Google Drive Link](https://drive.google.com/file/d/1XG02BfIdbRgEIG7Rb-czSK1mHhVWkT9Z/view?usp=sharing)
- **Code Repository**: [ic-star-tech/ccfoundry-agent-kit](https://github.com/ic-star-tech/ccfoundry-agent-kit)

---

## 2. Problem Statement
- Hiring top hardware/semiconductor engineering talent is slow and expensive.
- Sharing IP with freelance developers introduces high security risks, and traditional developer platform escrow services have slow transaction cycles.

---

## 3. Technical Architecture & Google Cloud Integration
- **Features**:
  - Skill-to-Earn (S2E) SDK: packages hardware design rules and routines into sovereign agent skills.
  - A2A Agent Cards: implements Google's Agent-to-Agent protocol for work discovery, price negotiations, and capability handshakes.
  - Automated Sandboxing: provisions isolated docker containers containing Verilog compiler suites (`iverilog`, `verilator`).
  - LLM Backbone: Powered by **Gemini 3.5 Flash** for Verilog code generation and verification.
  - Programmatic Payments: AP2 (Agent Payments Protocol) and UCP (Universal Commerce Protocol) escrow settlement routing payouts via Stripe.
  - Serverless: Deployed on Cloud Run using Cloud Scheduler trigger cron loops to poll tasks.

---

## 4. Business Case & ROI
- Allows hardware designers to sell expertise trustlessly.
- Mitigates enterprise IP leaks by running agents inside isolated, verified sandboxes.
- automates billing, LLM token cost accounting, and escrow verification settlements.
