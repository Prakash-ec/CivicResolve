# PLAN.md — CivicResolve Master Execution Plan

**Project:** CivicResolve — AI-Powered Civic Grievance Management Platform  
**Tagline:** Your City. Your Voice. Your Resolve.  
**Primary AI:** Google Gemini (Official `@google/genai` SDK)  
**Workspace:** `D:\CivicResolve`

---

## 1. Master Phase Roadmap

| Phase | Title | Primary Focus | Key Deliverables | Verification Checkpoint |
|---|---|---|---|---|
| **Phase 0** | **Discovery & Planning** | Tool audits, e-Yantra reverse engineering, architecture & security planning | `TOOL_AUDIT.md`, `REFERENCE_ANALYSIS.md`, `PLAN.md`, `ARCHITECTURE.md`, `REQUIREMENTS_TRACEABILITY.md`, `SECURITY_PLAN.md`, `TEST_PLAN.md` | All 7 planning documents written to disk in `D:\CivicResolve`. |
| **Phase 1** | **Foundation & Workspace Setup** | Monorepo layout, React + Vite + Tailwind frontend, Express backend, Firebase setup, unified `npm run dev` | `frontend/`, `server/`, shared configs, `.env.example`, health-check `/api/health`, responsive landing page skeleton | `npm run dev` starts both servers without error; health-check returns 200 OK. |
| **Phase 2** | **Authentication & Authorization** | Firebase Auth client & Admin SDK, custom claims, RBAC, protected routes | Citizen register/login, Admin login, `make-admin` script, token verification middleware | Citizens restricted to citizen routes; Admin verified via `token.admin == true`. |
| **Phase 3** | **Citizen Issue Reporting Flow** | 3-Section complaint form, Leaflet map coordinate picker, image upload preview | `ReportIssuePage`, Leaflet map component, image size/type validator, `/api/complaints` submission | Form validates, stores complaint in Firestore, generates public ID (`CR-2026-XXXXXX`). |
| **Phase 4** | **Google Gemini AI Integration** | Server-side multimodal Gemini integration (`@google/genai`), structured JSON schema | `geminiService.ts`, image + text analysis, confidence scoring, prompt injection defenses, graceful fallback | Real Gemini analysis executes; invalid API key falls back gracefully without data loss. |
| **Phase 5** | **Deterministic Priority & Department Engine** | Algorithmic scoring formula, department mapping table, duplicate candidate flags | Priority score calculation (`0-100`), department routing rules, Haversine 150m duplicate detection | Deterministic formula scores safety/traffic/health; department mapped predictably. |
| **Phase 6** | **Citizen Tracking & Timeline** | Citizen dashboard, status timeline, public tracking lookup without auth | `CitizenDashboard`, `ComplaintDetailPage`, `TimelineView`, `PublicTrackPage` | Citizen can monitor complaint lifecycle; public tracking sanitizes private data. |
| **Phase 7** | **Admin Workspace & Lifecycle Management** | Admin dashboard, triage table, filtering/search, review view, status state machine, resolution flow | `AdminDashboard`, `ComplaintReviewPage`, resolution modal, status update API, audit log writes | Admin reassigns, changes status, adds resolution photo; illegal transitions return 409. |
| **Phase 8** | **Analytics, Bilingual Support & Polish** | Recharts analytics, English/Tamil toggle (`i18next`), hotspot map, accessibility | `AnalyticsDashboard`, `HotspotMap`, Tamil translation files, WCAG AA compliance audit | Responsive on 360px/390px/desktop; language switcher dynamically updates UI. |
| **Phase 9** | **Full Verification & Demo Preparation** | End-to-end test execution, demo seed scripts, final reports | `seedDemo.ts`, `TEST_REPORT.md`, `DEMO.md`, `README.md` | All 11 acceptance tests executed and recorded. 3-minute hackathon demo verified. |

---

## 2. Priority Hierarchy

- **P0 (Must Work)**: Authentication, Citizen report submission, Image upload, Gemini multimodal analysis, Deterministic priority calculation, Department recommendation, Complaint persistence, Citizen tracking timeline, Admin review & assignment, State machine status transitions, Resolution verification, Security & secret protection.
- **P1 (Important)**: Citizen reopening flow, In-app notifications, Public tracking endpoint, Admin Recharts analytics, Haversine duplicate detection, Bilingual (English + Tamil) translations.
- **P2 (Enhancements)**: Interactive hotspot map, AI description improvement, Resolution before/after comparison card.
- **P3 (Optional)**: Department officer role, Advanced micro-animations.

---

## 3. Operational Rules

1. **Local-First**: Never push to remote Git or trigger unauthorized cloud deployments.
2. **Deterministic Rules Over AI Hallucination**: AI provides factor detection (safety, traffic, hazards); backend deterministic code calculates priority scores and assigns departments.
3. **Resilience**: A failure in external AI services must never result in losing a citizen's complaint. The system marks `aiStatus: "failed"` and routes to human review.
4. **Zero Secret Leaks**: All API keys, service accounts, and tokens must remain strictly on the backend.
