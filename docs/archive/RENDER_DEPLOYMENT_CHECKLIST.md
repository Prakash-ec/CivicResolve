# CIVICRESOLVE — RENDER DEPLOYMENT CHECKLIST

## Pre-Deployment Verification

- [x] **`render.yaml` Configuration:** Blueprint configured with frontend static site and backend web service.
- [x] **Health Check Endpoint:** `GET /api/health` returns status `online` and integration checks.
- [x] **Frontend SPA Routing:** Single Page Application rewrite rule (`/* -> /index.html`) declared in `render.yaml`.
- [x] **CORS Configuration:** `server/src/index.ts` accepts origin from `FRONTEND_URL` environment variable.
- [x] **Environment Variables:** `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, and ports configured.
- [x] **Static Assets Path:** `staticPublishPath: ./frontend/dist`.
- [x] **Zero Build Errors:** `npm --prefix frontend run build` and `npm --prefix server run build` exit code 0.

---

## Render Deployment Steps

1. In Render Dashboard, click **New > Blueprint**.
2. Select the CivicResolve repository.
3. Review the two services detected (`civicresolve-frontend` and `civicresolve-backend`).
4. In the Environment Variables section for the backend:
   - Provide your Google Gemini API Key (`GEMINI_API_KEY`).
   - If using Firebase live credentials, provide `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.
5. Click **Apply**.
6. Deployment typically completes in under 2 minutes.
