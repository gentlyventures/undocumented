# Competitor Profile: Gemini Tales

## 1. Project Information
- **Testing Access**: [Devpost Software Listing](https://devpost.com/software/gemini-tales)
- **Code Repository**: [gemini-tales-v2](https://github.com/vero-code/gemini-tales-v2)
- **Demo Video**: [YouTube](https://youtu.be/DCOfdM-uKt0)
- **Architecture Diagram**: [ARCHITECTURE.md](https://github.com/vero-code/gemini-tales-v2/blob/main/ARCHITECTURE.md)

---

## 2. Problem Statement
- **Passive Content Consumption**: Children spend hours passively consuming digital content.
- **Lack of Autonomy & Physical Verification**: Storytelling apps lack autonomous reasoning and real-time physical verification (checking user interaction/movement).
- **Scale Bottlenecks**: Scaling multimodal pipelines (live video, audio, image, and music) requires rigorous latency optimization, rate-limiting, and error-handling.

---

## 3. Technical Architecture & Google Cloud Integration
- **Track**: Track 2: Optimize
- **Multi-Agent Design**: Root agent `Puck` orchestrates specialized sub-agents (`Researcher`, `Guardian of Balance`, `Storysmith`) using Google's **Agent Development Kit (ADK)**.
- **Optimization Strategy**:
  1.  **Agent Simulation**: Stress-test reasoning against synthetic edge cases (video/audio failures, physical verification delays).
  2.  **Agent Observability**: Debug A2A (Agent-to-Agent) escalation loops and Pydantic schema mismatches.
  3.  **Low-Latency Telemetry**: Optimize 'Heroic Energy Tracker' telemetry integration for sub-100ms physical feedback verification.
  4.  **Semantic Grounding**: Ground narrative generation in educational databases to guarantee cultural and age-appropriateness.
- **Target Success Metrics**:
  - 99% task completion rate across 100+ classroom scenarios.
  - Zero missed physical movement verifications.
  - Sub-150ms end-to-end latency from camera input to feedback display.
