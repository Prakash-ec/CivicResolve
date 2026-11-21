# CIVICRESOLVE_IMPLEMENTATION_PLAN.md — Systematic Transformation Plan

**Project:** CivicResolve  
**Date:** 2026-11-21  
**Goal:** Transform CivicResolve into a premier, competition-grade civic-tech SaaS platform inspired by the CivicLens forensic analysis, elevating UI polish, backend integration, real-time tracking, multimodal AI, and administrative triage.

---

## 1. Execution Stages & Priority Phases

```
+---------------------------------------------------------------------------------------+
| STAGE 1: BACKEND ROUTE & DATA ARCHITECTURE (P0)                                       |
| - Implement Public Tracking API: GET /api/complaints/track/:publicId                  |
| - Implement Public Stats & Feed: GET /api/complaints/public-stats                     |
| - Implement Map Data: GET /api/complaints/map-points                                  |
| - Implement Admin Management APIs: GET /api/admin/overview, PATCH /api/admin/...      |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 2: PUBLIC WEBSITE & LANDING PAGE UPGRADE (P1)                                   |
| - 15 Rich Sections on LandingPage.tsx with Live Stats & Feed                          |
| - Brand Navbar with Navigation, Language Switcher, and Mobile Drawer                  |
| - Comprehensive 4-Column Footer with working policy dialogs                           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 3: PUBLIC GRIEVANCE TRACKER & MAP EXPLORER (P1)                                 |
| - Instant Public Tracker (/track) with Timeline & Evidence Cards                      |
| - Public Complaint Dossier (/complaints/:id)                                          |
| - Full-Screen Map Explorer (/map) with Category Layers & Heatmap Toggle               |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 4: CITIZEN WORKSPACE COMPLETION (P2)                                            |
| - My Complaints Dedicated View (/my-complaints)                                        |
| - Notifications Center (/notifications)                                               |
| - User Profile & Civic Score (/profile)                                               |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 5: ADMIN WORKSPACE & REJECTION/RESOLUTION WORKFLOW (P2)                         |
| - Admin Overview Dashboard (/admin)                                                   |
| - Management Table with Filter, Search, Sort, Pagination (/admin/complaints)          |
| - Full Triage Console (/admin/review/:id) with AI Inspection & Duplicate Linking      |
| - Recharts Analytics (/admin/analytics)                                               |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 6: VERIFICATION, TESTING & BUILD AUDIT                                          |
| - Comprehensive Frontend & Backend acceptance testing                                 |
| - Production builds: npm run build (Frontend + Server)                                |
| - Deliverables: CIVICRESOLVE_FRONTEND_TEST_REPORT.md, GAP_ANALYSIS                    |
+---------------------------------------------------------------------------------------+
```

---

## 2. Detailed Technical Breakdown

### Stage 1: Backend API Additions (`server/src/routes/`)
1. Create `server/src/routes/publicRoutes.ts`:
   - `GET /api/complaints/public-stats`: Returns count of Total, Resolved, In Progress, Submitted, and Resolution Rate %.
   - `GET /api/complaints/public-feed`: Returns latest 6 resolved/in-progress grievances for homepage carousel.
   - `GET /api/complaints/track/:publicId`: Unauthenticated public lookup returning public dossier, status timeline, and photos.
   - `GET /api/complaints/map-points`: GeoJSON-compatible coordinate list with category and status for map pins.
2. Create `server/src/routes/adminRoutes.ts`:
   - `GET /api/admin/overview`: Summary stats for triage officers.
   - `GET /api/admin/complaints`: Paginated, filterable complaint list.
   - `PATCH /api/admin/complaints/:id`: Update status, assign department/officer, confirm resolution with evidence, or mark duplicate with link.
3. Update `server/src/index.ts` to register `publicRoutes` and `adminRoutes`.

### Stage 2: Public Landing Page (`LandingPage.tsx`)
Incorporate all 15 sections:
1. **Government Utility Bar & Header**: Helpline, date, bilingual toggle, screen reader accessibility.
2. **Hero Section**: Headline *"Every Civic Issue Deserves a Resolution."*, subtitle, CTA *Report an Issue*, CTA *Track a Complaint*.
3. **Live Stats Strip**: Real-time counts (Complaints Reported, Resolved, In Progress, Resolution %).
4. **Quick Tracking Box**: Input for Public ID (`CR-2026-XXXXXX`) for 1-click status lookup.
5. **About CivicResolve**: Core values (100% transparency, citizen verification, AI objectivity).
6. **How It Works**: 4-step municipal workflow.
7. **Recent Complaint Feed / Snapshots**: Interactive carousel of real complaints with status pills and locations.
8. **Interactive Dual-Engine Map Preview**: Live preview with Google Satellite Hybrid / OSM toggle and link to `/map`.
9. **Complaint Categories Grid**: Visual cards for all 8 categories with issue counters.
10. **Multimodal AI Explainer**: Explaining how Gemini & vision analysis assesses safety, electrical hazards, and auto-routes issues.
11. **Resolution Transparency & Citizen Verification**: Explaining the two-way closure lock.
12. **Analytics & Performance Highlights**: Visual charts showing municipal resolution turnaround.
13. **Civic News & Bulletins**: Local municipal press updates.
14. **Pre-Footer Action Banner**: Civic engagement call-to-action.
15. **Footer**: 4-column layout with direct links and working policy modals.

### Stage 3: Public Tracker & Map Explorer
- `PublicTrackerPage.tsx`: Fast search input, status badge, 4-step visual progress bar (`Reported` -> `Triage` -> `In Progress` -> `Resolved`), timeline events, and before/after photos.
- `PublicMapExplorerPage.tsx`: Interactive full-bleed Leaflet + Google Maps Satellite Hybrid map with category filters and popup cards.

### Stage 4: Citizen Experience Pages
- `MyComplaintsPage.tsx`: Filterable list of logged-in user's grievances with status badges, direct tracking link, and Google Maps view.
- `NotificationsPage.tsx`: Notification cards for status changes and verification requests.
- `UserProfilePage.tsx`: Profile details, avatar, stats, language selector.

### Stage 5: Admin Workspace
- `AdminDashboard.tsx`: High-level operations overview, KPI cards, quick actions.
- `AdminComplaintManagementPage.tsx`: Data table with search, category/status filters, priority badges, actions.
- `AdminReviewPage.tsx`: Triage console with AI factors, category override, rejection panel with custom reasons, duplicate search and linking, and resolution photo submission.
- `AdminAnalyticsPage.tsx`: Recharts charts for category distribution, status breakdown, and monthly volume.
