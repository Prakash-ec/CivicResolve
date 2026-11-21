# ARCHITECTURE.md — CivicResolve System Architecture

**Project:** CivicResolve  
**Date:** 2026-11-21  
**Architecture Style:** Clean Modular Monorepo (Decoupled Frontend & Backend)

---

## 1. System Overview Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React (Vite + TypeScript) | Tailwind CSS | shadcn/ui | React Router | Leaflet   |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Citizen Experience |  | Public Tracking View |  | Admin Workspace          |  |
|  | - Landing Page     |  | - Anonymous Lookup   |  | - Triage Table & Filters  |  |
|  | - Report Form      |  | - Sanitized Timeline |  | - Complaint Review & Map  |  |
|  | - My Complaints    |  |                      |  | - Resolution & Audit Logs |  |
|  | - Verification UI  |  |                      |  | - Recharts Analytics      |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / REST (Bearer Firebase ID Token)
                                           v
+-----------------------------------------------------------------------------------+
|                                  SERVER LAYER                                     |
|  Node.js + Express + TypeScript | Helmet | CORS | Rate Limiting | Zod Validators  |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Auth Middleware    |  | Deterministic Engines|  | Service Coordinators      |  |
|  | - Firebase Admin   |  | - Priority Scorer    |  | - Complaint Lifecycle     |  |
|  | - Custom Claims    |  | - Dept Mapping Table |  | - Audit Logger            |  |
|  |   (token.admin)    |  | - Haversine 150m Dup |  | - Notification Dispatch   |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+----------------------+--------------------+---------------------------------------+
                       |                    |
        Multimodal API |                    | Firestore Admin SDK
                       v                    v
+-----------------------------+    +------------------------------------------------+
|       AI SERVICE LAYER      |    |               PERSISTENCE LAYER                |
|  Google Gemini Flash        |    |  Cloud Firestore & Firebase Storage            |
|  Official `@google/genai`   |    |  - users/{uid}                                 |
|  - Text & Image Analysis    |    |  - complaints/{complaintId}                    |
|  - Factor Detection         |    |    ├─ statusHistory/{eventId}                  |
|  - Confidence & Reasoning   |    |    └─ resolution/current                       |
|  - Tamil -> English Summary |    |  - departments/{deptId}                        |
|  - Structured JSON Output   |    |  - notifications/{notificationId}              |
|  - 20s Timeout & Retry      |    |  - auditLogs/{logId}                           |
+-----------------------------+    +------------------------------------------------+
```

---

## 2. Directory Structure

```text
D:\CivicResolve/
├── frontend/                     # React + Vite Client Application
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── app/
│       │   ├── router/          # Route definitions & guards (CitizenRoute, AdminRoute)
│       │   ├── providers/       # AuthProvider, LanguageProvider, ToastProvider
│       │   └── layouts/         # Navbar, Footer, Sidebar, PageContainer
│       ├── components/
│       │   ├── ui/              # Button, Input, Modal, Card, Badge, Alert, Tabs
│       │   ├── complaints/      # ComplaintCard, StatusBadge, PriorityBadge, Timeline
│       │   ├── forms/           # IssueReportForm, ResolutionForm, VerificationForm
│       │   ├── maps/            # LocationPickerMap, ComplaintMap, HotspotMap
│       │   └── shared/          # GeminiBadge, LanguageToggle, EmptyState, Loader
│       ├── pages/
│       │   ├── public/          # LandingPage, PublicTrackPage, NotFoundPage
│       │   ├── auth/            # LoginPage, RegisterPage, ForgotPasswordPage
│       │   ├── citizen/         # CitizenDashboard, ReportIssuePage, ComplaintDetailsPage
│       │   └── admin/           # AdminDashboard, AdminReviewPage, AdminAnalyticsPage
│       ├── features/
│       │   ├── auth/            # useAuth, authService (Firebase client)
│       │   ├── complaints/      # useComplaints, complaintApi
│       │   └── ai/              # AIAnalysisCard, GeminiStatusIndicator
│       ├── i18n/                # en.json, ta.json, i18n config
│       ├── types/               # Shared TypeScript schemas & interfaces
│       └── styles/              # globals.css, theme variables
│
├── server/                       # Node.js + Express Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts             # Express server entry point
│   │   ├── config/              # firebaseAdmin.ts, env.ts, constants.ts
│   │   ├── middleware/          # requireAuth.ts, requireAdmin.ts, validate.ts, rateLimiter.ts
│   │   ├── routes/
│   │   │   ├── healthRoutes.ts  # GET /api/health
│   │   │   ├── citizenRoutes.ts # POST /api/complaints, GET /mine, GET /:id, POST /verify
│   │   │   ├── adminRoutes.ts   # GET /complaints, PATCH /classify, POST /assign, /status, /resolve
│   │   │   ├── publicRoutes.ts  # GET /api/public/track/:publicId
│   │   │   └── aiRoutes.ts      # POST /api/ai/improve-description
│   │   ├── controllers/         # Request handling & orchestration
│   │   ├── services/
│   │   │   ├── geminiService.ts # Gemini multimodal calling via @google/genai
│   │   │   ├── priorityEngine.ts# Deterministic formula scoring
│   │   │   ├── departmentRouter.ts# Configurable category-to-department mapper
│   │   │   ├── duplicateDetector.ts# Haversine distance & candidate matching
│   │   │   └── auditService.ts  # Server-side tamper-proof audit logger
│   │   ├── repositories/        # Firestore database access objects (DAO)
│   │   ├── validators/          # Zod validation schemas
│   │   └── utils/               # idGenerator.ts (CR-2026-XXXXXX), haversine.ts
│
├── scripts/                      # Management & Seeding CLI Tools
│   ├── seedDepartments.ts       # Initialize municipal departments
│   ├── seedDemoData.ts          # Seed test complaints with "Demo data" tags
│   ├── clearDemoData.ts         # Remove demo data safely
│   └── makeAdmin.ts             # Assign custom claim token.admin == true
│
├── package.json                  # Root monorepo script coordinator
├── .env.example                  # Environment variable reference
├── .gitignore                    # Comprehensive secrets & artifact exclusion
├── TOOL_AUDIT.md
├── REFERENCE_ANALYSIS.md
├── PLAN.md
├── ARCHITECTURE.md
├── REQUIREMENTS_TRACEABILITY.md
├── SECURITY_PLAN.md
└── TEST_PLAN.md
```

---

## 3. Data Model Specifications (Cloud Firestore)

### `complaints/{complaintId}`
```typescript
interface ComplaintDocument {
  id: string;                         // Firestore Document ID
  publicId: string;                   // E.g., "CR-2026-000142" (Sequential / collision-safe)
  ownerUid: string;                   // Firebase Auth UID
  title: string;                      // Citizen-submitted title
  description: string;                // Detailed description (English or Tamil)
  userCategory: ComplaintCategory;    // Citizen-selected category hint
  
  location: {
    lat: number;
    lng: number;
    addressText: string;
    ward?: string;
  };
  
  imageUrls: string[];                // Citizen-uploaded evidence photos
  
  status: ComplaintStatus;            // Server-enforced internal status
  statusLabel: string;                // Citizen-facing public label
  
  department: {
    id: string;
    name: string;
    source: 'ai_recommended' | 'admin_assigned' | 'fallback';
  };
  
  priority: {
    level: 'critical' | 'high' | 'medium' | 'low';
    score: number;                    // 0 - 100
    breakdown: {
      safetyRisk: number;             // safetyRisk * 20
      electricalHazard: number;       // electricalHazard * 25
      healthHazard: number;           // healthHazard * 15
      trafficObstruction: number;     // trafficObstruction * 10
      affectedPeople: number;         // many=15, few=7, one=0
      locationSensitivity: number;    // school/hospital/main road=10
      hotspotBonus: number;           // +10 if nearby cluster
    };
    source: 'deterministic_engine' | 'admin_override';
  };
  
  aiStatus: 'pending' | 'success' | 'failed' | 'skipped';
  aiAnalysis?: {
    language: string;
    englishSummary: string;
    detectedCategory: ComplaintCategory;
    factors: {
      safetyRisk: number;
      trafficObstruction: boolean;
      healthHazard: boolean;
      electricalHazard: boolean;
      affectedPeopleEstimate: 'many' | 'few' | 'one' | 'unknown';
      locationSensitivity: 'main_road' | 'school_hospital' | 'residential' | 'other';
    };
    imageSupportsComplaint: 'yes' | 'no' | 'unclear' | 'no_image';
    reasoning: string;
    recommendedAction: string;
    keywords: string[];
    confidence: number;
  };
  
  needsHumanReview: boolean;
  duplicateCandidates?: Array<{
    candidateId: string;
    candidatePublicId: string;
    distanceMeters: number;
  }>;
  duplicateOf?: string;               // Public ID of primary complaint if linked
  
  assignedTo?: string;                // Department officer / team
  assignedAt?: string;
  startedAt?: string;
  resolvedAt?: string;
  verifiedAt?: string;
  version: number;                    // Optimistic concurrency locking
  
  createdAt: string;                  // ISO 8601
  updatedAt: string;
}
```

### Subcollections & Supporting Collections
1. `complaints/{complaintId}/statusHistory/{eventId}`:
   - Append-only event history: `{ from, to, actorUid, actorRole, publicNote, internalNote, createdAt }`.
2. `complaints/{complaintId}/resolution/current`:
   - Resolution record: `{ description, afterImageUrls: [], submittedBy, submittedAt }`.
3. `departments/{deptId}`:
   - Municipal department: `{ id, name, categories: [], active: true, slaHours: number }`.
4. `notifications/{notificationId}`:
   - In-app notification: `{ uid, complaintId, publicId, type, message, read: boolean, createdAt }`.
5. `auditLogs/{logId}`:
   - Server-only administrative audit record: `{ actorUid, action, targetId, before, after, timestamp }`.

---

## 4. State Machine & Status Lifecycle

```text
       [Citizen Submits]
               |
               v
           SUBMITTED
               |
               v
          AI_ANALYSED (or fallback to UNDER_REVIEW)
               |
               v
         UNDER_REVIEW (Admin Triage)
               |
         +-----+-----+
         |           |
         v           v
      ASSIGNED   REJECTED / DUPLICATE
         |
         v
    IN_PROGRESS <======+
         |             |
         v             | (Citizen Reopens)
      RESOLVED --------+
         |
         v (Citizen Verifies)
  CITIZEN_VERIFIED
```

### Server State Transitions
- **SUBMITTED** → `AI_ANALYSED`, `UNDER_REVIEW`, `REJECTED`
- **AI_ANALYSED** → `UNDER_REVIEW`, `ASSIGNED`
- **UNDER_REVIEW** → `ASSIGNED`, `REJECTED`, `DUPLICATE`
- **ASSIGNED** → `IN_PROGRESS`, `REJECTED`, `ESCALATED`
- **IN_PROGRESS** → `RESOLVED`, `ESCALATED`
- **RESOLVED** → `CITIZEN_VERIFIED`, `REOPENED`
- **REOPENED** → `IN_PROGRESS`, `UNDER_REVIEW`
- Any illegal transition rejected with **HTTP 409 Conflict**.
