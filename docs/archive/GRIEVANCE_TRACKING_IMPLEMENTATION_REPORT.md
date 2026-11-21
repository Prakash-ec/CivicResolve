# CivicResolve — End-to-End Grievance Tracking Implementation Report

**Document Reference:** `CR-DOC-TRACK-2026-v1`  
**Phase:** Transparent Civic Accountability & Public Grievance Tracking  
**Status:** Implemented, Tested & Verified  
**Date:** November 2026  

---

## 1. Executive Summary

CivicResolve implements an end-to-end, multi-channel grievance tracking system that provides municipal transparency while strictly safeguarding citizen privacy. Every reported civic issue is assigned a unique immutable reference identifier (`CR-YYYY-XXXXXX`), validated across a 7-stage operational lifecycle, indexed in real-time, and made trackable via both the authenticated citizen dashboard (`/citizen/my-complaints`) and the public accountability tracking portal (`/track`).

---

## 2. Reference ID Generation Scheme & Uniqueness Guarantees

Every grievance submitted to CivicResolve is stamped with an immutable, human-readable public reference ID formatted as:

$$\text{CR-}[YYYY]\text{-}[NNNNNN]$$

- **CR:** Prefix designating CivicResolve.
- **YYYY:** 4-digit calendar year (e.g., `2026`).
- **NNNNNN:** 6-digit zero-padded monotonic sequence or high-entropy cryptographically secure pseudo-random number (e.g., `CR-2026-000123`).

### Implementation Reference:
- In `server/src/routes/citizenRoutes.ts`, reference IDs are generated via:
  ```typescript
  const publicId = `CR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  ```
- Uniqueness is validated against Firestore / in-memory indices prior to persistence.
- Verified in automated test suite `server/src/tests/newFeaturesTestSuite.ts` (`/^CR-\d{4}-\d{6}$/`).

---

## 3. End-to-End Tracking Architecture & Workflow

```
[Citizen Reports Issue] (/citizen/report)
          │
          ▼
[AI Analysis & Validation (Gemini Multimodal / Risk Engine)]
          │
          ▼
[Grievance Persisted in Database]
  - Internal ID: comp_xxxxx
  - Public ID: CR-2026-xxxxxx
  - Full address, exact GPS coordinates, user phone/email
  - Initial Timeline Event: SUBMITTED
          │
          ├────────────────────────┬────────────────────────┐
          ▼                        ▼                        ▼
[Public Tracker (/track)]   [Citizen Dashboard]      [Admin Governance]
- Safe fuzzed coordinates   - Full address           - Administrative triage
- Privacy radius (220m)     - 7 status filter tabs   - SLA monitoring
- Door/flat no. redacted    - Upvote & confirmations - Field officer dispatch
- Timeline stepper (7-step) - Reopen capability      - Resolution evidence upload
- Zero citizen PII exposed  - Verification rating
```

---

## 4. Public Tracking Portal (`/track`) Security & Privacy Controls

The public tracker at `frontend/src/pages/public/PublicTrackerPage.tsx` backed by `GET /api/complaints/track/:publicId` in `server/src/routes/publicRoutes.ts` allows any citizen or journalist to verify civic progress without requiring an account.

### Privacy Safeguards:
1. **Coordinate Fuzzing:** Exact GPS coordinates are rounded to 2 decimal places ($\approx 1.1\text{ km}$ precision):
   $$\text{lat}_{\text{safe}} = \frac{\lfloor \text{lat} \times 100 \rceil}{100}, \quad \text{lng}_{\text{safe}} = \frac{\lfloor \text{lng} \times 100 \rceil}{100}$$
2. **Neighborhood Privacy Circle:** The Leaflet map on `/track` renders a $220\text{m}$ circular buffer rather than a sharp pin, ensuring private residential plots cannot be identified.
3. **Address Sanitization:** House numbers, door numbers, plot numbers, and flat designations (e.g. `Door No. 42/B, #12`) are automatically stripped, displaying only the street, locality, and municipal ward.
4. **Zero PII Exposure:** Citizen name, phone number, email address, internal administrative investigation notes, and private KYC evidence are excluded from the public tracking API schema.

---

## 5. Citizen Dashboard & Filtering (`/citizen/my-complaints`)

Located in `frontend/src/pages/citizen/MyComplaintsPage.tsx`, the authenticated citizen portal provides complete visibility into all grievances filed by the logged-in user.

### Key Capabilities:
- **7 Status Filter Tabs:**
  1. `All Grievances` (comprehensive count)
  2. `Submitted` (`SUBMITTED`, `REPORTED`, `AI_ANALYSED`)
  3. `Under Review` (`UNDER_REVIEW`)
  4. `Assigned` (`ASSIGNED`)
  5. `In Progress` (`IN_PROGRESS`)
  6. `Resolved` (`RESOLVED`, `CITIZEN_VERIFIED`)
  7. `Reopened` (`REOPENED`)
- **Geographic Area Badges:** Displays resolved municipal hierarchy (`CCMC East Zone`, `Ward 50`, `Singanallur`).
- **Interactive Lifecycle Stepper:** 7-stage visual progress bar showing exact completed and pending milestones.
- **Before-After Resolution Comparison Card:** Compares the original citizen photograph against the field officer's post-repair evidence image.
- **Citizen Verification & Rating:** Citizens can confirm resolution by submitting a 1–5 star rating and feedback.
- **Reopen Flow:** If a repair is substandard, citizens can reopen the complaint with a mandatory explanation.

---

## 6. 7-Stage Lifecycle Progression & Timeline Events

Every complaint progresses through an immutable, append-only timeline:

```
[1. REPORTED] ──► [2. AI ANALYSED] ──► [3. UNDER REVIEW] ──► [4. ASSIGNED]
                                                                    │
                                                                    ▼
[7. CITIZEN VERIFIED] ◄── [6. RESOLVED] ◄─────────────────── [5. IN PROGRESS]
          │                     │
          │                     ▼ (Substandard work)
          └───────────────► [REOPENED] ──► Re-assigned to department
```

| Stage | Trigger / Actor | Database Status | Public Display Label |
|:---|:---|:---|:---|
| **1. Reported** | Citizen submits grievance | `SUBMITTED` | Grievance Filed |
| **2. AI Analysed** | Gemini multimodal validation & impact scoring | `AI_ANALYSED` | AI Analysis & Priority Assigned |
| **3. Under Review** | Municipal desk triage | `UNDER_REVIEW` | Under Department Review |
| **4. Assigned** | Assigned to nodal engineer / ward team | `ASSIGNED` | Assigned to Field Unit |
| **5. In Progress** | Work crew dispatched to site | `IN_PROGRESS` | Work in Progress On-Site |
| **6. Resolved** | Field officer uploads completion proof | `RESOLVED` | Resolved by Department |
| **7. Citizen Verified** | Citizen confirms satisfaction | `CITIZEN_VERIFIED` | Citizen Verified & Closed |

---

## 7. Reopen Workflow & Validation

When a complaint is marked `RESOLVED`, the citizen has the statutory right to contest the closure:
1. **Validation Rule:** The citizen must provide an explanatory rationale of at least 10 characters detailing why the issue remains unresolved.
2. **Audit Event Logging:** Appends an immutable timeline event:
   ```json
   {
     "status": "REOPENED",
     "timestamp": "2026-11-21T13:30:00.000Z",
     "actor": "Citizen (Complainant)",
     "description": "Complaint reopened by citizen. Reason: Pothole was only partially filled with loose gravel."
   }
   ```
3. **Escalation Notification:** Flags the grievance in the administrative governance queue with elevated SLA priority.

---

## 8. Real-Time Update Mechanism

The tracking system incorporates dual-mode real-time synchronization:
1. **Firestore OnSnapshot Listeners (Production Mode):** Subscribes to document changes for instant UI re-renders upon officer status update.
2. **Adaptive Polling Fallback:** On the citizen dashboard, a 20-second background poll (`fetchComplaints`) silently synchronizes local state without jarring page refreshes.
3. **Optimistic UI Updates:** Instant visual feedback when upvoting, confirming resolution, or reopening tickets.
