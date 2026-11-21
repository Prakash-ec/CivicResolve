# CivicResolve

<div align="center">

### **Your City. Your Voice. Your Resolve.**

*An AI-powered municipal grievance intelligence and community co-resolution platform.*

[![Tests Passing](https://img.shields.io/badge/Tests-119%2F119%20Passing%20(100%25)-success?style=for-the-badge&logo=checkmarx)](file:///d:/CivicResolve/NEW_FEATURE_TEST_REPORT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v11%20Modular-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com/)

---

[Problem Statement Matrix](#-problem-statement-alignment-matrix) • [Key Capabilities](#key-capabilities) • [Live Demo Workflow](#live-demo-workflow) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Automated Tests](#automated-tests)

</div>

---

## 🎯 Problem Statement Alignment Matrix

This application was engineered specifically for **PromptWars x GDG on-Campus PSG iTech** under the problem statement: **"CivicResolve: AI-Powered Citizen Grievance Management and Resolution"**. Every expected feature and outcome is directly implemented, verified, and mapped below:

| # | Expected Feature (Verbatim from Challenge) | Implementation Status | Core Technical Evidence & Source Links |
| :-: | :--- | :---: | :--- |
| **1** | **Citizen Issue Reporting**<br>*"Allow users to submit civic complaints with a title, description, location, category, and optional image."* | **100% Completed** | • Form UI: [ReportIssuePage.tsx](file:///d:/CivicResolve/frontend/src/pages/citizen/ReportIssuePage.tsx#L575-L890)<br>• GPS Map Picker: [LocationPickerMap.tsx](file:///d:/CivicResolve/frontend/src/components/maps/LocationPickerMap.tsx)<br>• File Upload & Canvas Resizing: [ImageUploadZone.tsx](file:///d:/CivicResolve/frontend/src/components/forms/ImageUploadZone.tsx)<br>• Backend Validation: [citizenRoutes.ts](file:///d:/CivicResolve/server/src/routes/citizenRoutes.ts#L50-L100) (`createComplaintSchema`) |
| **2** | **AI-Powered Classification**<br>*"Use Google Gemini to analyze complaints and automatically identify the issue category."* | **100% Completed** | • Primary Engine: Google Gemini 3.8 Flash via official `@google/genai` SDK in [aiService.ts](file:///d:/CivicResolve/server/src/services/aiService.ts#L61-L103)<br>• Multimodal Analysis: Base64 image + structured civil engineering JSON schema (`aiAnalysisOutputSchema`)<br>• Zero-crash multi-tier fallback: Gemini &rarr; Groq &rarr; Local Deterministic Municipal Engine |
| **3** | **Priority Detection**<br>*"Classify issues based on urgency and potential public impact."* | **100% Completed** | • Objective Hazard Scoring: [citizenRoutes.ts](file:///d:/CivicResolve/server/src/routes/citizenRoutes.ts#L308-L330)<br>• Weights: Safety risk, electrical hazards, biological contamination, traffic obstruction, population density, and school/hospital zone proximity &rarr; `critical` / `high` / `medium` / `low` |
| **4** | **Department Recommendation**<br>*"Suggest the appropriate department based on the reported issue."* | **100% Completed** | • Smart Department Routing: [routingService.ts](file:///d:/CivicResolve/server/src/services/routingService.ts#L1-L120) & [constants.ts](file:///d:/CivicResolve/server/src/config/constants.ts#L35-L65)<br>• Multi-department alerts (e.g. electrical board notified during storm drainage) |
| **5** | **Issue Tracking Dashboard**<br>*"Display submitted complaints with their status, such as Reported, In Progress, and Resolved."* | **100% Completed** | • Public Citizen Tracking Portal: [PublicTrackerPage.tsx](file:///d:/CivicResolve/frontend/src/pages/public/PublicTrackerPage.tsx)<br>• 7-Stage Status Stepper: `Reported` (`SUBMITTED`), `In Progress`, `Resolved`, `Citizen Verified`<br>• Real-time Timeline, Before/After photo proof, and SHA-256 Digital Municipal Receipt |
| **6** | **Admin Dashboard**<br>*"Provide an interface for administrators to review complaints, update statuses, and manage reported issues."* | **100% Completed** | • Municipal Cockpit: [AdminDashboard.tsx](file:///d:/CivicResolve/frontend/src/pages/admin/AdminDashboard.tsx)<br>• Triage Management & Bulk Actions: [AdminComplaintManagementPage.tsx](file:///d:/CivicResolve/frontend/src/pages/admin/AdminComplaintManagementPage.tsx)<br>• Protected Endpoints: [adminRoutes.ts](file:///d:/CivicResolve/server/src/routes/adminRoutes.ts) (`requireAuth`, `requireAdmin`) |

---

## 🌟 Overview

**CivicResolve** transforms the relationship between citizens and municipal authorities. Instead of traditional bureaucratic black holes where complaints disappear, CivicResolve introduces:

1. **Live GPS & Geographic Intelligence:** Opt-in browser Geolocation API with accuracy circles ($\le$15m precision), battery-conscious watcher lifecycle, and header location pills.
2. **Authoritative Indian Municipal Hierarchy:** Hierarchical navigation (`Country → State → District → Municipality → Zone → Ward → Block → Locality`) with verified boundary datasets for Coimbatore (CCMC 5 zones, 100 wards), Sulur Town Panchayat (18 wards), and Chennai (GCC).
3. **Transparent Grievance Tracking (`CR-YYYY-XXXXXX`):** 7-stage operational lifecycle stepper (`Reported → AI Analysed → Under Review → Assigned → In Progress → Resolved → Citizen Verified`) with privacy-safe coordinate fuzzing (~1.1km) and door number redaction on public portals (`/track`).
4. **Complete 5-Language Regional Localization:** 100% translation key parity (296 keys) across English, தமிழ் (Tamil), हिन्दी (Hindi), తెలుగు (Telugu), and ಕನ್ನಡ (Kannada), complete with W3C `Intl` Indian number grouping (Lakhs/Crores), INR (₹) notation, regional typography font stacks, and voice input across all 5 locales.
5. **Multimodal AI Grievance Triage:** Evaluates photo evidence and issue context using Google Gemini 2.5 Flash with structured civil engineering schemas.
6. **Civic Impact Intelligence Center:** Geospatial clustering, density heatmaps, 72-hour overdue SLA tracking, and area-wise municipal performance tables.

---

## 🚀 Key Capabilities

### 🏛️ Municipal Visual Identity (CivicLens-Inspired)
- Built with authoritative Deep Navy (`#0F2854`) and Saffron Orange (`#F97316`) styling.
- Government utility top bar with toll-free helpline, screen-reader jump links, font resizer (`A-`, `A`, `A+`), and 5-language selector.

### 📱 Authentic Phone OTP Authentication
- Genuine SMS OTP verification supporting Indian mobile numbers (`+91`).
- Preserves citizen history and rewards by linking phone credentials to the existing Firebase UID using `linkWithCredential`.
- Backend verifies `decodedToken.phone_number` cryptographically via Firebase Admin SDK.
- Includes pre-whitelisted test numbers (`+91 9999999999` with code `123456`) bypassing SMS quotas for seamless judging.

### 🧠 Civic Impact Intelligence Command Center (`/admin/intelligence`)
- **Haversine Geospatial Clustering:** Groups proximate complaints within 150m into Hotspot clusters.
- **Civic Impact Score (0–100):** Deterministic algorithm weighting unresolved backlog (30%), hazard severity (25%), cluster density (20%), community confirmations (15%), and overdue SLA age (10%).
- **Interactive Leaflet Map:** Displays color-coded radiation zones (Red &ge; 75, Orange &ge; 50, Blue Moderate).
- **Explainable Directives:** Auto-synthesizes municipal work orders (e.g. *"Dispatch asphalt resurfacing vehicle for area sweep"*) with 1-click crew authorization.

### 👥 Community Grievance Confirmation Hub (`/community/issues`)
- Discovers nearby active grievances within 500m, 1km, 2.5km, and 5km radials.
- **"Yes, This Issue Exists" Action:** Lets citizens confirm issues in their neighborhood.
- Enforces strict anti-fraud rules (1 confirmation per UID, blocks self-confirmation).
- Awards **+10 ResolveRewards™ credits** per verified confirmation.
- Pre-submission duplicate detection alerts citizens if a similar issue exists within 120m before filing.

### 🔍 Multimodal AI Photo Evidence Verification (`/admin/image-evidence`)
- Side-by-side inspection console comparing citizen photos against Gemini Multimodal AI forensic analysis.
- Evaluates **Authenticity Score (0–100%)**, **Tampering Detection**, **Visual Damage Severity**, and **Environmental Context**.
- 1-Click administrative priority escalation for verified physical damage.

### 🎙️ Trilingual Voice-Based Complaint Assistant
- Web Speech API integration in `ReportIssuePage.tsx`.
- Supports Tamil (`ta-IN`), Hindi (`hi-IN`), and English (`en-IN`).
- Displays live animated soundwaves, interim speech previews, and instant form injection.

---

## 📸 Live Demo Workflow

For hackathon judges and evaluators, CivicResolve provides 1-click demo autofill portals:

| Portal | URL | Demo Feature |
|:---|:---|:---|
| **Portal Switcher** | `http://localhost:5173/login` | Select Citizen or Admin portal |
| **Citizen Portal** | `http://localhost:5173/citizen/login` | Click **"Autofill Citizen Demo"** to log in instantly |
| **Admin Portal** | `http://localhost:5173/admin/login` | Click **"Autofill Admin Demo"** for municipal command |

---

## 🏗️ Architecture

```
+---------------------------------------------------------------------------------+
|                                CIVICRESOLVE CLIENT                              |
|   React 19 • Vite 6 • TypeScript • Tailwind CSS • Leaflet • Recharts • i18n     |
+---------------------------------------+-----------------------------------------+
                                        |
           +----------------------------+----------------------------+
           | (Firebase Web SDK)                                      | (REST API via fetch)
           v                                                         v
+-----------------------+                         +-----------------------------------+
|  GOOGLE FIREBASE AUTH |                         |      NODE.JS / EXPRESS BACKEND    |
| - Phone OTP Provider  |                         | - Helmet, CORS, Rate Limiters     |
| - Email / Pass Auth   |                         | - Multer Image Upload Middleware  |
| - Custom Claims JWT   |                         | - Firebase Admin SDK Verification |
+-----------+-----------+                         +-----------------+-----------------+
            |                                                       |
            | ID Token (Bearer)                                     |
            +-------------------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |            BUSINESS LOGIC SERVICES          |
                 | - intelligenceService (Haversine & Scoring) |
                 | - imageAnalysisService (Gemini Multimodal)  |
                 | - idGenerator (CR-2026-XXXXXX Entropy)      |
                 | - storageService (Bucket / Local Fallback)  |
                 +----------------------+----------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
       +-----------------------+                 +-----------------------+
       |   GOOGLE CLOUD GEMINI |                 |   CLOUD FIRESTORE     |
       | - gemini-2.5-flash    |                 | - complaints / users  |
       | - Multimodal Forensic |                 | - statusHistory       |
       | - Structured JSON     |                 | - (In-memory Fallback)|
       +-----------------------+                 +-----------------------+
```

---

## ⚡ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/CivicResolve.git
cd CivicResolve

# Install root, frontend, and backend packages
npm install
npm --prefix frontend install
npm --prefix server install
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and `frontend/.env`:
```bash
cp .env.example server/.env
```
*(Ensure `GEMINI_API_KEY` is provided from [Google AI Studio](https://aistudio.google.com/)).*

### 3. Initialize Demo Accounts
```bash
npm --prefix server run setup:demo
```

### 4. Start Development Servers
```bash
# Terminal 1: Start Backend API (Port 5000)
npm --prefix server run dev

# Terminal 2: Start Frontend Application (Port 5173)
npm --prefix frontend run dev
```

Open `http://localhost:5173/` in your browser.

---

## 🧪 Automated Tests

CivicResolve includes an automated test suite verifying **119 critical security, mathematical, geospatial, and localization invariants**:

```bash
# Run new capabilities automated suite (GPS, Geocoding, Geographic Hierarchy, Tracking, 5-Language Localization)
npm --prefix server run test:new

# Run advanced features suite (Haversine, Hotspot Clustering, Impact Score, Anti-fraud, Gemini)
npm --prefix server run test:advanced

# Run all test suites
npm --prefix server test
```

### Test Coverage Highlights:
- **New Capabilities Suite (96/96 Passed):** GPS accuracy assessment, watcher lifecycle, reverse-geocoding rate-limiting & caching, CCMC 5-zone & Sulur 18-ward hierarchy, cascading parent-child resets, public tracking PII/coordinate sanitization, 100% key parity across all 5 languages, Indian number formatting (Lakhs/Crores), INR (₹) notation, and Tamil Unicode NFC integrity.
- **Advanced Features Suite (23/23 Passed):** Haversine distance accuracy, hotspot clustering, Civic Impact Score bounds, community anti-fraud, and Gemini multimodal structured output.

---

## 📖 Master Implementation Reports

| Document | Purpose |
|:---|:---|
| [GPS_LOCATION_IMPLEMENTATION_REPORT.md](file:///d:/CivicResolve/GPS_LOCATION_IMPLEMENTATION_REPORT.md) | Live GPS service, React context, hooks, permission UX, accuracy radius, watcher lifecycle |
| [GRIEVANCE_TRACKING_IMPLEMENTATION_REPORT.md](file:///d:/CivicResolve/GRIEVANCE_TRACKING_IMPLEMENTATION_REPORT.md) | End-to-end tracking, `CR-YYYY-XXXXXX` format, 7-stage lifecycle stepper, public privacy sanitization |
| [GEOGRAPHIC_INTELLIGENCE_REPORT.md](file:///d:/CivicResolve/GEOGRAPHIC_INTELLIGENCE_REPORT.md) | CCMC & Sulur boundary datasets, administrative resolution (`verified` vs `unverified`), spatial analytics |
| [REGIONAL_LANGUAGE_COMPLETENESS_REPORT.md](file:///d:/CivicResolve/REGIONAL_LANGUAGE_COMPLETENESS_REPORT.md) | 100% translation key parity (296 keys across en, ta, hi, te, kn), Indian notation, font stacks, voice input |
| [LOCATION_PRIVACY_SECURITY_REPORT.md](file:///d:/CivicResolve/LOCATION_PRIVACY_SECURITY_REPORT.md) | DPDP Act 2023 alignment, coordinate fuzzing (~1.1km), privacy buffer radius, rate-limiting policy |
| [NEW_FEATURE_TEST_REPORT.md](file:///d:/CivicResolve/NEW_FEATURE_TEST_REPORT.md) | Complete automated test execution records (119/119 passed), failure modes, build verification |
| [FINAL_INTEGRATION_REPORT.md](file:///d:/CivicResolve/FINAL_INTEGRATION_REPORT.md) | Executive architecture diagram, user journey walkthroughs, performance & future recommendations |

---

## 📚 Complete Historical Documentation Index

| Document | Purpose |
|:---|:---|
| [FINAL_REPOSITORY_AUDIT.md](file:///d:/CivicResolve/FINAL_REPOSITORY_AUDIT.md) | Comprehensive code audit & system inventory |
| [FIREBASE_PHONE_AUTH_SETUP.md](file:///d:/CivicResolve/FIREBASE_PHONE_AUTH_SETUP.md) | Phone OTP architecture, zero-cost test numbers |
| [ADVANCED_FEATURE_REPORT.md](file:///d:/CivicResolve/ADVANCED_FEATURE_REPORT.md) | Technical report on intelligence & multimodal features |
| [ADVANCED_FEATURE_TEST_REPORT.md](file:///d:/CivicResolve/ADVANCED_FEATURE_TEST_REPORT.md) | Automated testing evidence & validation records |
| [ADVANCED_FEATURE_SECURITY_REVIEW.md](file:///d:/CivicResolve/ADVANCED_FEATURE_SECURITY_REVIEW.md) | OWASP API threat audit & mitigation verification |
| [JUDGE_DEMO_SCRIPT.md](file:///d:/CivicResolve/JUDGE_DEMO_SCRIPT.md) | Word-for-word 3-minute hackathon presentation script |
| [HACKATHON_WINNING_STRATEGY.md](file:///d:/CivicResolve/HACKATHON_WINNING_STRATEGY.md) | Scoring rubric alignment & competitive strategy |
| [PROJECT_ARCHITECTURE.md](file:///d:/CivicResolve/PROJECT_ARCHITECTURE.md) | Full architectural diagrams and folder schemas |
| [DEPLOYMENT_GUIDE.md](file:///d:/CivicResolve/DEPLOYMENT_GUIDE.md) | Production deployment steps for Render and cloud |
| [RENDER_DEPLOYMENT_CHECKLIST.md](file:///d:/CivicResolve/RENDER_DEPLOYMENT_CHECKLIST.md) | Render blueprint verification checklist |
| [GITHUB_RELEASE_CHECKLIST.md](file:///d:/CivicResolve/GITHUB_RELEASE_CHECKLIST.md) | Open-source release and security hygiene checklist |
| [ENVIRONMENT_VARIABLES.md](file:///d:/CivicResolve/ENVIRONMENT_VARIABLES.md) | Complete environment variable specification |

---

## 📜 License

CivicResolve is released under the [MIT License](LICENSE).

<div align="center">
<strong>CivicResolve — Your City. Your Voice. Your Resolve.</strong>
</div>
