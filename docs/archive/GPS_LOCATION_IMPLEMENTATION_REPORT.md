# CivicResolve — Live GPS Location Implementation Report

**Document Reference:** `CR-DOC-GPS-2026-v1`  
**Phase:** Live GPS Location Integration & Website-Wide Geospatial Intelligence  
**Status:** Implemented, Tested & Verified  
**Date:** November 2026  

---

## 1. Executive Summary

This report documents the architectural design, implementation details, lifecycle controls, and privacy protections of the **Live GPS Location System** built for CivicResolve. The system provides unified, permission-based geolocation across the entire application — including header status indicators, interactive grievance mapping, automated address resolution, and dynamic administrative boundary identification.

GPS access is strictly **opt-in** with transparent user-facing disclosures, battery-conscious watcher lifecycle management, accuracy radius categorization, and graceful fallback to manual location selection.

---

## 2. Location Architecture

The location subsystem is structured into modular layers adhering to clean separation of concerns:

```
[Browser Geolocation API / W3C navigator.geolocation]
                           │
                           ▼
          [LocationService (Singleton Service)]
     - Browser capability detection
     - Permission state inspection (Permissions API)
     - Single-shot getCurrentPosition with timeout
     - Continuous watchPosition with ID tracking
     - Coordinate accuracy categorization
     - Error mapping & retry classification
                           │
                           ▼
      [LocationContext / LocationProvider (React)]
     - Global reactive location state
     - Permission dialog state & persistence
     - Live tracking toggle controls
     - Accuracy tier calculation
     - Reverse geocoding dispatch
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 [useCurrentLocation Hook]       [UI Components & Pages]
 - Declarative consumer API       - Header Location Pill (Navbar)
                                  - CurrentLocationCard
                                  - LocationPermissionDialog
                                  - LocationPickerMap (Leaflet)
                                  - ReportIssuePage (/citizen/report)
```

### Source File Directory Reference:
- **Location Service:** [`frontend/src/services/locationService.ts`](file:///d:/CivicResolve/frontend/src/services/locationService.ts)
- **Location Context & Provider:** [`frontend/src/contexts/LocationContext.tsx`](file:///d:/CivicResolve/frontend/src/contexts/LocationContext.tsx)
- **Custom React Hook:** [`frontend/src/hooks/useCurrentLocation.ts`](file:///d:/CivicResolve/frontend/src/hooks/useCurrentLocation.ts)
- **Permission Dialog:** [`frontend/src/components/location/LocationPermissionDialog.tsx`](file:///d:/CivicResolve/frontend/src/components/location/LocationPermissionDialog.tsx)
- **Location Card:** [`frontend/src/components/location/CurrentLocationCard.tsx`](file:///d:/CivicResolve/frontend/src/components/location/CurrentLocationCard.tsx)
- **Website Header Indicator:** [`frontend/src/components/layout/Navbar.tsx`](file:///d:/CivicResolve/frontend/src/components/layout/Navbar.tsx)
- **Interactive Map Picker:** [`frontend/src/components/maps/LocationPickerMap.tsx`](file:///d:/CivicResolve/frontend/src/components/maps/LocationPickerMap.tsx)

---

## 3. Permission Flow & User Experience

### A. Two-Tier Permission Model
CivicResolve does **not** trigger raw browser permission prompts unexpectedly upon page load. Instead, it uses a two-tier opt-in model:

1. **Contextual In-App Modal (`LocationPermissionDialog`):**
   - When the user clicks "Detect My Location", "Use Current Location", or the header location pill, an in-app explanatory dialog appears.
   - Explains *why* location is required: Pinpointing civic infrastructure grievances (potholes, water leaks, broken streetlights) and routing them to the correct municipal ward.
   - Outlines data protection guarantees: Coordinates are never sold or shared publicly; exact residential numbers are redacted on public portals.
2. **Standard Browser Geolocation Request:**
   - Only upon clicking **"Allow GPS Access"** does the app invoke `navigator.geolocation.getCurrentPosition`.
   - If the user selects "Cancel" or "Manual Entry", the dialog dismisses and manual entry fields (State, District, Municipality, Ward, Address) are activated without penalty.

### B. Geolocation State Machine

```
[IDLE / UNKNOWN]
       │
       ├─► User clicks "Detect Location" ──► [PROMPTING] ──► User declines ──► [DENIED (Manual Entry)]
       │                                         │
       │                                         ▼ User accepts
       │                             [ACQUIRING (GPS Sensor)]
       │                                         │
       │                    ┌────────────────────┴────────────────────┐
       │                    ▼                                         ▼
       │         [SUCCESS (Coordinates Acquired)]             [ERROR / TIMEOUT]
       │                    │                                         │
       │                    ▼                                         ▼
       │     [Accuracy Evaluation (±m)]                    [User Notified with Fallback]
       │                    │
       │                    ▼
       └────────► [WATCHING (Live Tracking Active)]
                            │
                            ▼ User clicks "Stop Live Tracking"
                   [IDLE / STATIC POSITION]
```

---

## 4. Watcher Lifecycle & Resource Management

Continuous GPS tracking can severely degrade device battery life, especially on mobile devices. CivicResolve implements strict lifecycle rules:

1. **Explicit Toggle Only:** Live tracking (`watchPosition`) is never initiated automatically. It requires explicit user activation (e.g. clicking the radar icon or "Enable Live Tracking" toggle).
2. **Active Watch ID Tracking:** The `locationService` maintains the active `watchId: number | null`. Initiating a new watcher clears any existing watcher before attaching a new one.
3. **Clean Teardown on Component Unmount:**
   ```typescript
   useEffect(() => {
     return () => {
       locationService.stopTracking();
     };
   }, []);
   ```
4. **Visibility & Background Suspension:** Watchers pause when the browser tab transitions to the background (`document.hidden`), preventing silent background location drain.
5. **No Persistent Location History:** GPS coordinates are stored only in memory for the active session and only persisted when the citizen explicitly submits a grievance report.

---

## 5. Accuracy Assessment & Fallback Strategy

The `locationService` computes the accuracy radius in metres and categorizes it into 4 actionable tiers:

| Accuracy Radius | Tier | UI Indication | Action Required |
|:---|:---|:---|:---|
| **$\le$ 15 metres** | **High Precision** | Green badge / "±Xm High Precision" | Map pin set automatically with high confidence. |
| **16 – 50 metres** | **Good** | Emerald badge / "±Xm Good" | Suitable for general street-level civic issues. |
| **51 – 150 metres** | **Moderate** | Amber badge / "±Xm Moderate" | Suggests user verify marker location on the map. |
| **> 150 metres** | **Poor / Low** | Red badge / "±Xm Poor Precision" | Displays warning alert: *"GPS precision is low (±Xm). Please drag the map pin to the exact location of the issue."* |

### Accuracy Circle on Leaflet Map
In `frontend/src/components/maps/LocationPickerMap.tsx`, a semi-transparent Leaflet `<Circle>` is rendered dynamically centered on the user's coordinates with the exact radius in metres. This visually communicates GPS uncertainty to citizens.

---

## 6. Website Location Indicator (Header)

Located in `frontend/src/components/layout/Navbar.tsx`:
- **Desktop Header Pill:** Compact, clickable status pill displaying:
  - Active location icon (green pulsating dot when live tracking is active; slate pin when idle).
  - Human-readable locality & district (e.g., `Sulur, Coimbatore` or `Singanallur, Coimbatore`).
  - GPS precision indicator (`±8m`).
  - Quick refresh action button to re-ping GPS.
- **Mobile Drawer Card (`CurrentLocationCard.tsx`):**
  - Expanded view in the mobile navigation drawer showing coordinates, accuracy badge, last refreshed timestamp (locale-formatted), and live tracking toggle.

---

## 7. Testing & Verification Summary

The location subsystem was verified across automated unit/integration suites and manual browser tests:

- **Automated Test Assertions (`server/src/tests/newFeaturesTestSuite.ts`):**
  - Coordinate range validator (-90..90, -180..180, NaN checks): **PASSED**
  - Accuracy tier classification (8.5m $\rightarrow$ excellent, 35m $\rightarrow$ good, 120m $\rightarrow$ fair, 350m $\rightarrow$ poor): **PASSED**
  - Permission error mapping (`PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, `TIMEOUT`): **PASSED**
  - Watcher lifecycle tracking (start, position callback, clean stop): **PASSED**
- **Browser Compatibility:** Verified on modern Chrome, Firefox, Safari, and Edge via W3C Geolocation standard.
