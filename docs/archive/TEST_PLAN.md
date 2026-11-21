# TEST_PLAN.md — CivicResolve Quality Assurance & Test Plan

**Project:** CivicResolve  
**Date:** 2026-11-21  
**Target Coverage:** Complete End-to-End Civic Complaint Workflow

---

## 1. Acceptance Test Suite Matrix

| Test ID | Test Scenario | Preconditions | Steps to Execute | Expected Results | Pass / Fail Criteria |
|---|---|---|---|---|---|
| **TEST-01** | **Citizen Registration & Complaint Submission** | Fresh database, valid citizen credentials | 1. Register citizen `citizen@test.com`.<br>2. Submit pothole complaint with photo, address & map pin.<br>3. Inspect Gemini analysis output. | Complaint saved; Public ID generated (`CR-2026-XXXXXX`); Gemini classifies category as `pothole_road_damage`; Roads department assigned; Priority scored. | Real AI output parsed, record persisted in Firestore. |
| **TEST-02** | **Admin Review & Assignment** | Complaint from TEST-01 exists; Admin account authenticated | 1. Admin logs into dashboard.<br>2. Selects complaint.<br>3. Reviews AI reasoning.<br>4. Confirms department & moves to `IN_PROGRESS`. | Status changes to `IN_PROGRESS`; Append-only status history event written; Citizen timeline reflects update. | History event includes timestamp, admin UID, and new status. |
| **TEST-03** | **Resolution & Citizen Verification / Reopening** | Complaint is `IN_PROGRESS` | 1. Admin submits resolution notes & after-image.<br>2. Status updates to `RESOLVED`.<br>3. Citizen logs in, views resolution proof.<br>4. Citizen tests "Verify Resolution" and "Reopen Issue". | Resolves with after-image; Citizen can either confirm (`CITIZEN_VERIFIED`) or reopen with reason (`REOPENED` -> `IN_PROGRESS`). | Only owning citizen can verify/reopen; Admin cannot verify on behalf of citizen. |
| **TEST-04** | **Garbage Complaint & Department Routing** | Citizen authenticated | 1. Submit complaint: "Overflowing garbage dump on 4th cross road".<br>2. Upload waste photo. | Detected category: `garbage_overflow` or `illegal_dumping`; Department mapped: `Sanitation & Solid Waste`. | Deterministic routing matches mapping table. |
| **TEST-05** | **Duplicate Complaint Detection (Haversine 150m)** | Existing pothole complaint at `(13.0827, 80.2707)` | 1. Second citizen submits similar pothole at `(13.0830, 80.2710)` (< 100m away). | Both complaints saved; Second complaint flags candidate ID; Admin review view surfaces candidate duplicate; No auto-deletion. | Both records remain intact; Admin can link as `DUPLICATE`. |
| **TEST-06** | **Tamil Language Complaint & AI Translation** | Citizen selects Tamil language | 1. Submit complaint in Tamil: "எங்கள் தெருவில் சாக்கடை நீர் வழிந்தோடுகிறது" (Sewage overflowing). | Gemini detects Tamil language, returns English summary, identifies `sewage_overflow`, routes to Drainage & Sewerage. | AI produces concise English summary alongside detected Tamil category. |
| **TEST-07** | **Gemini AI Failure & Graceful Fallback** | Simulate invalid API key or timeout (20s) | 1. Submit valid complaint while Gemini key is invalid or disconnected. | Complaint saves successfully; `aiStatus` marked `failed`; `needsHumanReview: true`; UI displays: *"AI analysis unavailable — your complaint has been saved and queued for human review."* | Zero data loss; Complaint proceeds to human review queue. |
| **TEST-08** | **Input Validation & Payload Size Restrictions** | User attempts malformed request | 1. Submit empty title.<br>2. Submit description < 10 characters.<br>3. Upload file > 5 MB or `.exe` file.<br>4. Provide invalid coordinates. | Client and server return HTTP 400 / 422 with structured field errors; No server crash; No corrupt Firestore document. | Zod validation rejects bad payloads cleanly. |
| **TEST-09** | **Authorization & Security Boundaries** | Standard citizen and unauthenticated users | 1. Citizen attempts `GET /api/admin/complaints`.<br>2. Citizen attempts to view another citizen's private complaint.<br>3. User attempts self-elevation to admin.<br>4. Query public tracking endpoint. | Admin endpoints return 403 Forbidden; Private complaints return 403/404; Public tracking returns sanitized data without PII. | Security boundary intact; No privilege escalation. |
| **TEST-10** | **Concurrent Administrative Updates** | Single complaint under review | 1. Admin A and Admin B open same complaint.<br>2. Admin A updates status to `ASSIGNED`.<br>3. Admin B attempts stale update with old version number. | Admin A update succeeds; Admin B update is rejected with **HTTP 409 Conflict**; Admin B prompted to refresh. | Prevents silent data overwrites. |
| **TEST-11** | **UI Responsiveness & Persistence Stress Test** | Multiple devices / viewports | 1. Test responsive viewports: 360px, 390px, 768px, 1280px.<br>2. Hard-refresh browser on each dashboard.<br>3. Check for horizontal overflow or dead buttons. | Navigation adapts to hamburger; Tables reflow or show mobile cards; State persists after hard refresh; Zero dead buttons. | Responsive and accessible on all standard viewports. |

---

## 2. Testing Reporting Protocol

All test runs will be documented in `TEST_REPORT.md` with:
- Execution Date & Environment
- Test ID
- Actual Observed Output
- Status: `PASSED`, `FAILED`, `BLOCKED`, or `NOT RUN`
- Associated logs and resolution actions
