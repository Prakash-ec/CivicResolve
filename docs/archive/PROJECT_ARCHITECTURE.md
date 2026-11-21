# CIVICRESOLVE — FULL SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION

## 1. High-Level Architecture Diagram

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

## 2. Directory Structure

```
D:\CivicResolve\
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI automated pipeline
├── frontend/                      # React SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── layouts/           # Navbar, Footer, MainLayout
│   │   │   └── router/            # React Router v6 route definitions
│   │   ├── components/
│   │   │   ├── forms/             # ImageUploadZone, VoiceInputButton
│   │   │   ├── maps/              # LocationPickerMap
│   │   │   ├── shared/            # LanguageToggle, AuthLoading
│   │   │   └── ui/                # Button and UI primitives
│   │   ├── features/auth/         # AuthContext, ProtectedRoute, AdminRoute
│   │   ├── i18n/                  # i18n setup & 5 language locale files
│   │   ├── pages/
│   │   │   ├── admin/             # Dashboard, Complaints, Review, Intelligence, Evidence
│   │   │   ├── auth/              # Central Login, Citizen Login, Admin Login, Register
│   │   │   ├── citizen/           # Dashboard, Report, MyComplaints, Profile, Community
│   │   │   └── public/            # Landing, Tracker, Live Map, News, 404
│   │   ├── services/              # api.ts (apiClient), firebase.ts
│   │   ├── styles/                # globals.css (Deep Navy & Saffron)
│   │   └── types/                 # TypeScript interfaces
│   └── vite.config.ts
├── server/                        # Express API Backend
│   ├── src/
│   │   ├── config/                # constants.ts, env.ts, firebaseAdmin.ts
│   │   ├── middleware/            # authMiddleware.ts, uploadMiddleware.ts, errorHandler.ts
│   │   ├── routes/                # authRoutes, citizenRoutes, adminRoutes, communityRoutes
│   │   ├── scripts/               # setupDemoAccounts.ts, makeAdmin.ts
│   │   ├── services/              # intelligenceService, imageAnalysisService, storageService
│   │   ├── tests/                 # authTestSuite, phase3TestSuite, advancedFeaturesTestSuite
│   │   └── utils/                 # idGenerator.ts
│   └── package.json
├── render.yaml                    # Multi-service Render deployment blueprint
├── firebase.json                  # Firebase configuration
├── firestore.rules                # Firestore security rules
└── storage.rules                  # Storage security rules
```
