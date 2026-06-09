# Competitor Profile: Personal Agent

## 1. Project Information
- **Prototype / Demo**: [pa-frontend-10498183023.us-east1.run.app](https://pa-frontend-10498183023.us-east1.run.app)
- **Demo Access**: [pa-frontend-demo-10498183023.us-east1.run.app](https://pa-frontend-demo-10498183023.us-east1.run.app/)
- **Code Repository**: [TykoDev/pa](https://github.com/TykoDev/pa) (Private)
- **Demo Video**: [YouTube 1](https://youtu.be/5LFxAVhuab0) / [YouTube 2](https://youtu.be/QyajO8Oyzas) / [YouTube 3](https://youtu.be/J1zAQhzullk) / [Webm](https://pa-frontend-10498183023.us-east1.run.app/about.webm)
- **Architecture Diagram**: [technical](https://pa-frontend-demo-10498183023.us-east1.run.app/technical) (User: `pa-demo`, Pass: `TechnicalGoogleAgentChallenge2026!`)
- **Presentation Slides**: [business](https://pa-frontend-demo-10498183023.us-east1.run.app/business) (User: `pa-demo`, Pass: `BusinessGoogleAgentChallenge2026!`)

---

## 2. Problem Statement
- **Fragmented Knowledge Work**: Toggle tax and SaaS sprawl across chat, email, calendars, files, and SaaS browser apps.
- **Cognitive Burden**: Users manually track updates, Summarize threads, copy data, and check schedules.

---

## 3. Technical Architecture & Google Cloud Integration
- **Backend Stack**: Deno 2.x, TypeScript, Hono, Zod, and shared contract modules.
- **Frontend Stack**: Angular 21, standalone components, signals, SSR (Server-Side Rendering), and relative API routing.
- **Google ADK & Agentic Platform**: ADK TypeScript SDK, Agent Platform, and Gemini models for gateway routing, workflows, human-in-the-loop review, and media generation.
- **Side-Effect Safety**: Actions pass through reviewed policy packs (boundaries for Gmail, Calendar, file operations) before commit. Proposes rather than silently executes.
- **GCP Native Deploy**: Deployed on Cloud Run (backend, frontend SSR, browser harness, and Workspace MCP service).
- **Data Persistence**: Google Cloud SQL PostgreSQL (Drizzle ORM) + Redis/Memorystore for locking, rate limiting, and state counters.
- **Infrastructure Tools**: Terraform, Docker, Cloud Build, Cloud Scheduler, Cloud Run Jobs, Secret Manager, Google Model Armor, Brave Search, Google Workspace MCP transport.
- **Access**: Private repository. Request via email to `challenge@tykotech.eu`.
