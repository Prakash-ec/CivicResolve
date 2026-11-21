# CIVICRESOLVE — DEPLOYMENT & OPERATIONS GUIDE

## 1. Local Development Setup

### Prerequisites
- Node.js version 20+ installed.
- Firebase CLI installed (`npm install -g firebase-tools`).

### Quick Start
```bash
# 1. Install root, frontend, and backend dependencies
npm install
npm --prefix frontend install
npm --prefix server install

# 2. Setup Hackathon Demo Accounts
npm --prefix server run setup:demo

# 3. Start Backend API Server (Port 5000)
npm --prefix server run dev

# 4. In a second terminal, start Frontend Vite Dev Server (Port 5173)
npm --prefix frontend run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 2. Cloud Deployment via Render

CivicResolve includes a turnkey `render.yaml` infrastructure-as-code blueprint:
1. Connect your repository to Render (`https://dashboard.render.com`).
2. Select **New > Blueprint** and choose the repository.
3. Render automatically provisions:
   - **Static Site:** `civicresolve-frontend`
   - **Web Service:** `civicresolve-backend`
4. Set your production environment variables:
   - `GEMINI_API_KEY`
   - `FIREBASE_PROJECT_ID` (`civicresolve-969d3`)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
5. Render deploys both services and connects the custom domain.
