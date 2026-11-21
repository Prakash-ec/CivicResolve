# CIVICRESOLVE — ENVIRONMENT VARIABLES SPECIFICATION

## 1. Backend Server Variables (`server/.env`)

| Variable Name | Required | Default Value | Description |
|:---|:---|:---|:---|
| `PORT` | No | `5000` | Port for Express API server |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin for frontend client |
| `FIREBASE_PROJECT_ID` | Yes | `civicresolve-969d3` | Target Firebase project ID |
| `GEMINI_API_KEY` | Recommended | None | Google AI Studio Developer API Key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier |
| `FIREBASE_SERVICE_ACCOUNT_PATH`| Optional | None | Path to service account JSON key file |
| `FIREBASE_CLIENT_EMAIL` | Optional | None | Cloud service account email (for cloud hosting) |
| `FIREBASE_PRIVATE_KEY` | Optional | None | Cloud service account private key |
| `DEMO_CITIZEN_EMAIL` | No | `citizen@civicresolve.org` | Pre-configured citizen demo account |
| `DEMO_CITIZEN_PASSWORD` | No | `CitizenDemo@2026` | Citizen demo account password |
| `DEMO_ADMIN_EMAIL` | No | `admin@civicresolve.org` | Pre-configured municipal admin demo account |
| `DEMO_ADMIN_PASSWORD` | No | `AdminDemo@2026` | Admin demo account password |

---

## 2. Frontend Client Variables (`frontend/.env`)

| Variable Name | Required | Default Value | Description |
|:---|:---|:---|:---|
| `VITE_API_BASE_URL` | Yes | `/api` | Base URL for Express backend proxy/API |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `civicresolve-969d3` | Firebase project identifier |
| `VITE_FIREBASE_API_KEY` | Yes | Client API key | Firebase Web SDK API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `civicresolve-969d3.firebaseapp.com` | Firebase Auth domain |
| `VITE_FIREBASE_STORAGE_BUCKET`| Yes | `civicresolve-969d3.appspot.com` | Firebase Storage bucket domain |
| `VITE_FIREBASE_APP_ID` | Yes | `1:408037973858:web:...` | Firebase Web App Identifier |
