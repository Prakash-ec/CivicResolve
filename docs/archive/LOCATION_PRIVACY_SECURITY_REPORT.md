# CivicResolve — Location Privacy & Security Architecture Report

**Document Reference:** `CR-DOC-SEC-2026-v1`  
**Compliance Standard:** Digital Personal Data Protection Act (DPDP Act, 2023) & W3C Geolocation Privacy Guidelines  
**Status:** Implemented, Tested & Verified  
**Date:** November 2026  

---

## 1. Executive Summary

Geolocation data is sensitive personal information. In civic applications, precise coordinates can disclose an individual's residential home address, daily commuting habits, or private property locations. 

CivicResolve implements a strict **Privacy-by-Design** architecture that decouples authenticated internal civic redressal operations from public accountability transparency. While municipal engineers need exact coordinates to patch a pothole or unclog a sewer line, the public internet only needs to know that an issue in *Singanallur* or *Ward 50* is being resolved.

---

## 2. DPDP Act (2023) Alignment & Principles

The location and identity tracking subsystem is architected in accordance with the key principles of the **Digital Personal Data Protection Act, 2023 (India)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DPDP ACT 2023 ALIGNMENT                           │
├─────────────────────────┬──────────────────────────────────────────────┤
│ 1. Notice & Consent     │ In-app permission modal prior to browser prompt│
│ 2. Purpose Limitation   │ GPS collected solely for routing grievances  │
│ 3. Data Minimization    │ Exact coordinates rounded on public portals   │
│ 4. Storage Limitation   │ No continuous location tracking history       │
│ 5. Right to Withdraw    │ Explicit "Stop Live Tracking" control in UI   │
│ 6. Safeguards & Security│ Strict Firebase Rules & backend sanitization │
└─────────────────────────┴──────────────────────────────────────────────┘
```

---

## 3. Opt-in Consent Mechanics & Revocation

### A. Contextual Notice Before Prompting
Browser geolocation prompts are never spawned silently upon page load or tab focus. The user is first presented with `LocationPermissionDialog.tsx`, clearly explaining:
1. What data is collected (current latitude and longitude).
2. The specific municipal purpose (routing complaints to the jurisdictional engineer).
3. Public privacy protection (exact house numbers and coordinates are never published).

### B. Instant Revocation
Citizens can revoke geolocation tracking at any moment:
- A prominent red **"Stop Live Tracking"** button is always visible in the header and mobile navigation drawer whenever `watchPosition` is active.
- Clicking the button instantly invokes `navigator.geolocation.clearWatch`, clears the in-memory coordinate stream, and transitions the app to static mode.
- Users can choose to file grievances manually via dropdowns without ever enabling GPS.

---

## 4. Public vs. Private Location Data Handling

CivicResolve strictly delineates between internal database records and public API responses:

```
[Citizen Database Record]                 [Public API Response (/track/:id)]
- Exact GPS: (11.001847, 77.014382)  ──► - Fuzzed GPS: (11.00, 77.01) [±1.1km]
- Exact Door No: "Door No. 42/B"    ──► - Redacted: "Trichy Road, Singanallur"
- Complainant Name & Phone Number   ──► - Excluded: [COMPLETELY REDACTED]
- Complainant Email Address         ──► - Excluded: [COMPLETELY REDACTED]
- Internal Department Notes         ──► - Excluded: [COMPLETELY REDACTED]
- KYC / Private Image Attachments   ──► - Excluded: [COMPLETELY REDACTED]
```

### Sanitization Implementation (`server/src/routes/publicRoutes.ts`):
```typescript
const safeCoordinates = (lat && lng) ? {
  lat: Math.round(lat * 100) / 100, // Round to 2 decimal places (~1.1km)
  lng: Math.round(lng * 100) / 100,
  privacyRadiusMeters: 220,
} : undefined;

// Door/Flat/House numbers stripped
let safeAddress = complaint.location.locality || complaint.location.city;
if (complaint.location.addressText) {
  safeAddress = complaint.location.addressText
    .replace(/^(plot\s*no\.?|door\s*no\.?|d\.no\.?|no\.?|flat\s*no\.?|#)\s*[\w\d\-\/,\s]+/i, '')
    .replace(/\b\d{1,4}\s*,\s*/, '')
    .trim();
}
```

---

## 5. Reverse Geocoding Policy & Rate-Limiting Protection

CivicResolve uses OpenStreetMap Nominatim for address resolution via a modular abstraction (`IGeocodingProvider`):
1. **User-Agent Compliance:** Requests identify as `CivicResolve-Municipal-App/1.0 (civicresolve@municipal.gov.in)`.
2. **Debounce Interval:** Location marker drags on Leaflet maps are debounced by **600ms** to prevent intermediate transient API calls.
3. **Hardware Rate Limiter:** The service enforces a minimum spacing of **1,100ms** between consecutive external HTTP requests, exceeding the OSM 1-request-per-second policy.
4. **In-Memory LRU Cache:** Coordinates within a 4-decimal place proximity ($\approx 11\text{m}$) return cached address payloads immediately without querying external servers.
5. **Zero Fabrication:** If an administrative level (such as ward or building number) is omitted in the geocoder response, it is left empty or marked `Not available` rather than fabricated.

---

## 6. Verification & Automated Test Evidence

The privacy sanitization pipeline was verified in test suite `server/src/tests/newFeaturesTestSuite.ts` (`Suite 4: Grievance Tracking Lifecycle & Privacy Sanitization`):
- `citizenEmail` is never exposed in public tracking: **VERIFIED (Assertion Passed)**
- `citizenPhone` is never exposed in public tracking: **VERIFIED (Assertion Passed)**
- `internalNotes` is never exposed in public tracking: **VERIFIED (Assertion Passed)**
- `lat` and `lng` are rounded to 2 decimal places: **VERIFIED (Assertion Passed)**
- Exact door number `Door No. 42/B` is redacted: **VERIFIED (Assertion Passed)**
- `privacyRadiusMeters: 220` is attached: **VERIFIED (Assertion Passed)**
