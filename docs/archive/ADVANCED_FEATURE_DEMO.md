# CIVICRESOLVE — ADVANCED FEATURE DEMONSTRATION SCRIPT

## Demo Duration: 5–7 Minutes
## Target Audience: Hackathon Judges, Civic Leaders, and Technical Evaluators

---

### Step 1: Portal Landing & 1-Click Demo Login (0:00 - 1:00)
1. Open `http://localhost:5173/`.
2. Point out the **CivicLens-inspired Deep Navy (`#0F2854`) and Saffron Orange (`#F97316`)** official municipal aesthetic.
3. Show the **5-Language Regional Selector** in the top bar (toggle between English, தமிழ், हिन्दी, తెలుగు, and ಕನ್ನಡ).
4. Click **Sign In** &rarr; Arrive at `/login` portal switcher.
5. Select **Citizen Portal** (`/citizen/login`).
6. Click the orange badge **"Autofill Citizen Demo"** &rarr; Instant 1-click credential population.
7. Click **Sign In as Citizen** &rarr; Enters Citizen Dashboard in under 150ms!

---

### Step 2: Voice Dictation & Multimodal Reporting (1:00 - 2:30)
1. From Citizen Dashboard, click **Report Grievance** (`/citizen/report`).
2. Show the **Phone Verification Notice**:
   - If verified: Shows green priority queue active badge.
   - If unverified: Shows subtle recommendation to verify for SMS dispatch.
3. Enter Issue Title: *"Deep crater pothole causing vehicle skid"*.
4. Select Category: **Pothole / Road Damage**.
5. Demonstrate **Voice Dictation**:
   - Click **Voice Dictation** button.
   - Speak in English or Tamil.
   - Point out the real-time interim speech transcription visualizer!
6. Click **AI Assist** to illustrate Gemini structured context expansion.
7. Pick location on the **Leaflet map**:
   - Notice the **Nearby Duplicate Detection banner** alerting if a similar issue was reported within 120m!
8. Attach photo evidence and click **Submit Grievance for Resolution**.
9. Show the **Grievance Registered Success Screen**:
   - Public Reference ID (e.g. `CR-2026-XXXXXX`)
   - Instant Multimodal AI triage summary with department routing and priority score.

---

### Step 3: Phone OTP Verification & ResolveRewards™ (2:30 - 3:45)
1. Click **Profile & Rewards** (`/citizen/profile`).
2. Point out the **ResolveRewards™ Balance** earned from active civic participation.
3. Demonstrate **Phone OTP Verification**:
   - Enter test mobile number: `9999999999` (`+91`).
   - Click **Send 6-Digit Verification Code** (reCAPTCHA runs invisibly).
   - Enter test code: `123456`.
   - Click **Verify & Secure Account**.
   - Show instant **"Phone Verified"** emerald shield badge linked to the existing Firebase UID via `linkWithCredential`!
4. Show the **Utility Vouchers Store**: Redeem credits for Metro Rail recharges, property tax rebates, or tree plantations!

---

### Step 4: Community Issues & Citizen Validation Hub (3:45 - 4:45)
1. Click **Community** in top navigation (`/community/issues`).
2. Demonstrate **Radial Discovery**:
   - Toggle radius from 500m to 1km to 2.5km.
   - Switch between **Split Map & List** view and **Card Grid** view.
3. Find an active issue filed by a neighbor.
4. Click **"Yes, This Issue Exists"**:
   - Live confirmation count increments.
   - Citizen earns **+10 ResolveRewards™ credits**.
   - Priority score automatically escalates in the municipal queue!

---

### Step 5: Admin Command & Civic Intelligence (4:45 - 6:30)
1. Sign out and click **Admin Portal** (`/admin/login`).
2. Click **"Autofill Admin Demo"** and log in.
3. Navigate to **Civic Intelligence Center** (`/admin/intelligence`):
   - **City Health Index (0-100)**
   - **Haversine Geospatial Hotspots Map**: Show color-coded cluster radii (Red = Critical, Orange = High).
   - Click on a hotspot cluster: view incident count, dominant category, collective impact score, and public IDs.
   - Review **Automated Municipal Engineering Recommendations**.
   - Click **"Authorize Rapid Intervention Crew"** to simulate field dispatch.
4. Navigate to **Photo Evidence Review** (`/admin/image-evidence`):
   - Inspect citizen uploaded photographs side-by-side with **Gemini Multimodal Forensic Analysis**.
   - Show Authenticity Score, Tampering Detection, and Visual Damage Severity.
   - Click **Approve Evidence & Elevate Priority**.

---

### Step 6: Closing Summary for Judges
- Conclude with the tagline: *"CivicResolve: Your City. Your Voice. Your Resolve."*
- Highlight: 100% functional full-stack architecture, 52/52 automated tests passing, resilient zero-cost Firebase Spark hosting, and genuine multimodal intelligence.
