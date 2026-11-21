# CIVICRESOLVE_PAGE_INVENTORY.md — Complete Application Page & Route Inventory

**Project:** CivicResolve  
**Date:** 2026-11-21

---

## 1. Route & Page Matrix

| Route Path | Page Component | Access Scope | Key Features & Modules | Backend APIs Used | Status |
|---|---|:---:|---|---|:---:|
| `/` | `LandingPage.tsx` | Public | 15 Comprehensive Sections: Hero, Quick Action Search/Track, Live Counters, About, How It Works, Grievance Live Feed, Dual-Engine Map Preview, Categories, Multimodal AI Explainer, Resolution Transparency, Analytics Preview, Civic Updates, Community Upvoting Banner, Pre-Footer CTA, Accessible Footer | `GET /api/complaints/public-stats`, `GET /api/complaints/recent-feed` | **TO UPGRADE (Phase 3)** |
| `/track` | `PublicTrackerPage.tsx` | Public | Instant Public Grievance Tracker by Public ID (`CR-2026-XXXXXX`), QR scan lookup, full audit history timeline, photo evidence comparison | `GET /api/complaints/track/:publicId` | **NEW (Phase 4)** |
| `/complaints/:id` | `PublicComplaintDetailPage.tsx` | Public | Complete public complaint dossier: photos, location map, status timeline, official response, citizen verification status | `GET /api/complaints/public/:id` | **NEW (Phase 4)** |
| `/map` | `PublicMapExplorerPage.tsx` | Public | Full-screen interactive civic map with category filters, cluster pins, heatmap overlay, search area, and direct Google Maps / Street View links | `GET /api/complaints/map-points` | **NEW (Phase 6)** |
| `/news` | `CivicNewsPage.tsx` | Public | Municipal press bulletins, resolution announcements, ward cleanup drives, seasonal alerts (monsoon waterlogging, heatwave) | Client / Mock Seed | **NEW (Phase 8)** |
| `/login` | `LoginPage.tsx` | Public (Guest) | Firebase Email/Password auth, validation, remember me, error alerts, direct dashboard redirection | Firebase Auth Client SDK | **IMPLEMENTED (Phase 2)** |
| `/register` | `RegisterPage.tsx` | Public (Guest) | Citizen registration, full name, email, password, terms agreement, default `CITIZEN` role | Firebase Auth + Firestore Profile | **IMPLEMENTED (Phase 2)** |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Public (Guest) | Firebase password reset email dispatch with status feedback | Firebase Auth Client SDK | **IMPLEMENTED (Phase 2)** |
| `/dashboard` | `CitizenDashboard.tsx` | Protected (Citizen) | Live personal statistics, status filter tabs, search complaints, Google Maps preview modal, copy public ID, fast action button | `GET /api/complaints/mine` | **IMPLEMENTED & POLISHED (Phase 3)** |
| `/report` | `ReportIssuePage.tsx` | Protected (Citizen) | 3-Section reporting workflow: Section A (Title, Category, Description, AI Assist), Section B (Google Maps Satellite Hybrid, auto-address, GPS, manual address), Section C (5MB image dropzone), Post-save Multimodal AI triage | `POST /api/complaints`, `POST /api/ai/improve-description` | **IMPLEMENTED & VERIFIED (Phase 3)** |
| `/my-complaints` | `MyComplaintsPage.tsx` | Protected (Citizen) | Full-width dedicated table and card list of citizen's grievances with search, status filters, sorting, and pagination | `GET /api/complaints/mine` | **NEW (Phase 4)** |
| `/notifications` | `NotificationsPage.tsx` | Protected (Citizen) | Real-time notification center: status update alerts, assigned department notices, resolution verification requests | `GET /api/notifications` | **NEW (Phase 4)** |
| `/profile` | `UserProfilePage.tsx` | Protected (Citizen) | Citizen user profile, contact information, civic activity stats, badges earned, language preference | `GET /api/users/me`, `PUT /api/users/me` | **NEW (Phase 4)** |
| `/admin` | `AdminDashboard.tsx` | Protected (Admin Only) | Administrative overview, live metric cards, pending triage queue, department workload, quick review actions | `GET /api/admin/overview`, `GET /api/admin/complaints` | **UPGRADE (Phase 5)** |
| `/admin/complaints` | `AdminComplaintManagementPage.tsx` | Protected (Admin Only) | Advanced complaint management table: search, multi-filter (status, priority, department, ward), column sorting, pagination, batch actions | `GET /api/admin/complaints` | **NEW (Phase 5)** |
| `/admin/review/:id` | `AdminReviewPage.tsx` | Protected (Admin Only) | Full triage console: AI factor inspector, category override, department re-assignment, priority adjustment, rejection modal, resolution photo submission | `GET /api/admin/complaints/:id`, `PATCH /api/admin/complaints/:id` | **NEW (Phase 5)** |
| `/admin/analytics` | `AdminAnalyticsPage.tsx` | Protected (Admin Only) | Recharts data analytics: category breakdown, status distribution, monthly trends, resolution turnaround time, ward performance | `GET /api/admin/analytics` | **NEW (Phase 7)** |
| `*` | `NotFoundPage.tsx` | Public | Branded 404 error page with quick links back to Home, Dashboard, and Tracker | Client Navigation | **IMPLEMENTED (Phase 1)** |

---

## 2. Navigation Architecture

### Header Navigation (`Navbar.tsx`):
- **Logo:** CivicResolve Shield badge + Title + Tagline
- **Public Navigation Links:** Home (`/`), Track Issue (`/track`), Live Map (`/map`), News (`/news`)
- **Citizen Links (When Logged In):** Dashboard (`/dashboard`), Report Issue (`/report`), My Complaints (`/my-complaints`), Notifications Bell (`/notifications`)
- **Admin Link (When Role = Admin):** Admin Console (`/admin`)
- **Utility Actions:** Language Switcher (`EN` / `தமிழ்`), Login / Register or User Avatar Dropdown (Profile, Logout)

### Footer Navigation (`Footer.tsx`):
- **Column 1 (CivicResolve Mission):** Purpose statement, verified transparency, municipal integration notice
- **Column 2 (Citizens):** Report an Issue, Track Complaint, Live Map Explorer, Civic News
- **Column 3 (Administration):** Admin Portal, Department Triage, Analytics & Reports, Developer API
- **Column 4 (Emergency & Contact):** Civic Helpline `1800-425-1333`, Municipal Corporation Office, support email
- **Bottom Bar:** Copyright, Privacy Policy, Terms of Service, Public Accountability Charter, Language Toggle
