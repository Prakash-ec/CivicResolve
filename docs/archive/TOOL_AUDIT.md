# TOOL_AUDIT.md — CivicResolve Tool & Capability Audit

**Project:** CivicResolve  
**Date:** 2026-11-21  
**Environment:** Google Antigravity (Windows)  
**Workspace:** `D:\CivicResolve`

---

## 1. Inventory of Tools, Plugins, Skills & Integrations

| Tool / Skill / MCP | Available? | Category | Purpose | How It Will Be Used in CivicResolve |
|---|---|---|---|---|
| **Antigravity Guide (`antigravity_guide`)** | ✅ Yes | Builtin Skill | AGY platform docs, CLI references, configuration | Referencing best practices for Antigravity environment |
| **Generative UI (`generative_ui`)** | ✅ Yes | Builtin Skill | Rich HTML widgets and interactive artifact visualization | Used to design and preview structured components where needed |
| **Gemini API Docs MCP (`gemini-api_gemini-api-docs`)** | ✅ Yes | MCP Server (Eager) | Upstream documentation for official `@google/genai` SDK | Ensures current, non-deprecated SDK integration (`google-genai` / `@google/genai`) |
| **Inspo MCP (`inspo`)** | ✅ Yes | MCP Server (Lazy) | Design systems, screen references, layout patterns | UI inspiration and clean component composition |
| **Browser Subagent (`browser`)** | ✅ Yes | Subagent | Headless webview browsing & inspection | Used to reverse-engineer public e-Yantra reference portal |
| **Firebase CLI (`firebase`)** | ✅ Yes (v15.37.0) | CLI / Host Tool | Firebase management for project `civicresolve-969d3` | Auth, Firestore rules, and local development integration |
| **Node.js & npm** | ✅ Yes (Node v24.16.0, npm v11.13.0) | Host Runtime | Full-stack JavaScript/TypeScript runtime | Powers frontend (Vite/React) and backend (Express/Node) |
| **Leaflet & OpenStreetMap** | ✅ Available via npm | Mapping Library | Interactive map, reverse geocoding, coordinates | Citizen location selection and admin hotspot mapping |
| **Official Google GenAI SDK (`@google/genai`)** | ✅ Available via npm | AI SDK | Multimodal analysis, structured output with Zod | Complaint analysis (text + photo), priority factor extraction |
| **Figma Integration** | ❌ Not Installed | Plugin | Design system sync | Not available; custom Tailwind + shadcn/ui design implemented directly |
| **GSD (Get Shit Done) Workflow** | ❌ Not Installed | Plugin/Skill | Multi-agent execution methodology | Not available; disciplined manual phase execution followed |
| **REA (Reverse Engineer Anything)** | ❌ Not Installed | Plugin/Skill | Reverse engineering binary / web assets | Not available; live browser subagent used to inspect reference site |
| **Google Cloud / Paid Storage Plugin** | ❌ Not Installed | Cloud Integration | Direct cloud provisioning | Avoided; local-first build and standard Firebase client/admin libraries used |

---

## 2. Audit Observations & Constraints

1. **AI Primary Requirement**: Google Gemini is the mandatory primary AI. The official `@google/genai` SDK will be utilized on the backend with structured JSON schemas (`responseMimeType: "application/json"`). An optional Groq API key is noted for experimental/secondary comparisons, but never as a replacement for Gemini.
2. **Local-First Boundary**: All work is built and executed locally in `D:\CivicResolve`. No remote git pushes or cloud deployments will be executed without explicit user consent.
3. **Security of Secrets**: API keys (`GEMINI_API_KEY`, Firebase Admin credentials) must reside exclusively on the server side in environment files excluded by `.gitignore`.
