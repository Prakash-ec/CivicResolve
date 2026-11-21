# REQUIREMENTS_TRACEABILITY.md — Requirements Traceability Matrix

**Project:** CivicResolve  
**Date:** 2026-11-21

---

## 1. Mandatory Competition Requirements

| ID | Requirement | Implementation Target | Associated Test Case | Status | Evidence / Verification Notes |
|---|---|---|---|---|---|
| **R01** | **Citizen Issue Reporting** (Title, description, location, category, optional image) | `frontend/src/pages/citizen/ReportIssuePage.tsx`<br>`server/src/routes/citizenRoutes.ts` | Phase 3 Test Suite (16 tests) | **IMPLEMENTED AND VERIFIED** | Complete 3-section form with Leaflet + Google Maps Satellite Hybrid, smart reverse geocoding auto-detect, 5MB image upload, concurrency-safe `CR-2026-XXXXXX` ID. |
| **R02** | **Gemini AI Classification** (Genuine multimodal AI classification) | `server/src/services/aiService.ts`<br>`server/src/routes/citizenRoutes.ts` | Test-P3-01, Test-P3-14, Phase 4 Suite | **IMPLEMENTED AND VERIFIED (Basic Triage)** (Phase 4 deepening) | Post-save multimodal Gemini call using `@google/genai` v3.6.1 with structured factors, category, and Groq fallback. |
| **R03** | **Priority Detection** (Deterministic score based on AI factors & location) | `server/src/routes/citizenRoutes.ts`<br>`server/src/services/priorityEngine.ts` | Test-P3-01, Phase 5 Suite | **IMPLEMENTED AND VERIFIED (Baseline)** | Formula: `safetyRisk*20 + electrical*25 + health*15 + traffic*10 + people + location + hotspot` enforced on server. |
| **R04** | **Department Recommendation** (Deterministic category-to-department mapping) | `server/src/config/constants.ts`<br>`server/src/routes/citizenRoutes.ts` | Test-P3-01, Test-P3-15 | **IMPLEMENTED AND VERIFIED (Baseline)** | Category-to-department deterministic routing table with AI recommendation upgrade if confidence >= 75%. |
| **R05** | **Issue Tracking** (Reported, In Progress, Resolved status lifecycle) | `frontend/src/pages/citizen/CitizenDashboard.tsx`<br>`server/src/routes/citizenRoutes.ts` | Test-P3-10, Test-P3-13 | **PARTIALLY IMPLEMENTED (Citizen View)** | Citizen dashboard displays status badges, timeline count, and Google Maps modal preview. Full public timeline in Phase 6. |
| **R06** | **Admin Dashboard** (Review, manage, assign, and update complaints) | `frontend/src/pages/admin/AdminDashboard.tsx`<br>`frontend/src/pages/admin/AdminReviewPage.tsx` | Phase 7 Suite | **PLANNED** (Phase 7) | Administrative triage table, filter controls, assignment modal planned. |
| **R07** | **End-to-End Workflow** (Submission through resolution and citizen verification) | End-to-end integration across frontend and backend | Phase 7/9 Suite | **IN PROGRESS** (Submission verified) | Full submission through AI triage verified. Resolution transitions in Phase 7. |
| **R08** | **Authentication** (Protected citizen and admin experiences) | `frontend/src/features/auth/AuthProvider.tsx`<br>`server/src/middleware/authMiddleware.ts` | Auth Acceptance Suite (13 tests) | **IMPLEMENTED AND VERIFIED** | Firebase Auth email/pass + custom claim `token.admin == true`, 13/13 tests passed. |
| **R09** | **Persistence** (Data persists after refresh and login) | Cloud Firestore + Local Resilient Fallback | Test-P3-11, Test-P3-13 | **IMPLEMENTED AND VERIFIED** | Firestore documents and append-only `statusHistory` records verified. |
| **R10** | **Responsive Interface** (Mobile 360/390px, tablet, desktop) | Tailwind CSS mobile-first responsive classes | Test-P3-16 | **IMPLEMENTED AND VERIFIED** | Verified responsive breakpoints (360px grid-cols-2, sm: flex-row, lg: grid-cols-4), zero horizontal overflow. |

---

## 2. Additional Core Requirements & Features

| ID | Feature | Implementation Target | Associated Test | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **F01** | Duplicate Complaint Detection (150m Haversine) | `server/src/services/duplicateDetector.ts` | Test 5 | Planned (Phase 5) | Haversine distance formula ready for implementation. |
| **F02** | Tamil Language Support & AI Summary | `frontend/src/i18n/` & `ReportIssuePage.tsx` | Test-P3-15 | **IMPLEMENTED AND VERIFIED** | UTF-8 encoded Tamil grievance submitted, routed to `dept_drainage`, and verified in test suite. |
| **F03** | Gemini Failure Graceful Fallback | `server/src/services/aiService.ts` & `citizenRoutes.ts` | Test-P3-14 | **IMPLEMENTED AND VERIFIED** | Grievance safely preserved with `needsHumanReview: true` when AI is offline. |
| **F04** | Input Validation & Size Restrictions | Zod schemas + Multer 5MB filter | Test-P3-02 to Test-P3-07 | **IMPLEMENTED AND VERIFIED** | 6 validation test cases passing (length, coordinates, MIME types, file size). |
| **F05** | Optimistic Concurrency Control | Version checking in status transitions | Test 10 | Planned (Phase 7) | `version: 1` field initialized on complaint documents. |
| **F06** | Recharts Analytics & Hotspot Mapping | `frontend/src/pages/admin/AdminAnalyticsPage.tsx` | Test 11 | Planned (Phase 8) | Analytical dashboard and heatmap views planned. |
