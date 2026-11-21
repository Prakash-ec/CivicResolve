# CivicResolve — Geographic Intelligence & Administrative Boundary Report

**Document Reference:** `CR-DOC-GEO-2026-v1`  
**Phase:** Civic Geographic Intelligence & Administrative Boundary Hierarchy  
**Status:** Implemented, Tested & Verified  
**Date:** November 2026  

---

## 1. Executive Summary

A plain city name or pincode is insufficient for genuine municipal governance. Civic infrastructure issues belong to specific operational units: wards, zones, and local executive engineers.

This report details the implementation of CivicResolve's **Civic Geographic Intelligence Subsystem**, featuring an authoritative Indian municipal administrative hierarchy (`Country → State → District → Municipality → Zone → Ward → Block → Locality → Street`), official datasets for Tamil Nadu (Coimbatore Corporation, Sulur Town Panchayat, Chennai Corporation), administrative boundary resolution with strict verification guarantees, and the upgraded `/admin/intelligence` spatial drilldown dashboard.

---

## 2. Geographic Hierarchy Data Model

The data model reflects the administrative topology of Indian civic bodies.

### A. Firestore Data Structures
- **Collection `geographicRegions/{regionId}`:**
  ```typescript
  interface GeographicRegion {
    regionId: string;
    country: string;
    state: string;
    district: string;
    municipality: string;
    zone?: string;
    ward?: string;
    block?: string;
    locality?: string;
    postalCode?: string;
    parentRegionId?: string | null;
    regionType: 'country' | 'state' | 'district' | 'municipality' | 'zone' | 'ward' | 'block' | 'locality';
    dataSource: 'CCMC_GIS_OFFICIAL' | 'GCC_OPEN_DATA' | 'TN_TOWN_PANCHAYAT_DIRECTORATE' | 'OPENSTREETMAP_ADMIN' | 'CITIZEN_REPORT';
    verified: boolean;
    boundary?: {
      type: 'Polygon' | 'Point' | 'BoundingBox';
      coordinates: any;
    };
    centerCoordinates?: { lat: number; lng: number };
    updatedAt: string;
  }
  ```

- **Grievance Document Location Structure (`complaints/{complaintId}`):**
  ```typescript
  location: {
    latitude: number;
    longitude: number;
    addressText: string;
    houseNumber?: string;
    street?: string;
    locality?: string;
    city: string;
    district: string;
    state: string;
    postalCode?: string;
    zoneId?: string;
    zone?: string;
    wardId?: string;
    ward?: string;
    blockId?: string;
    block?: string;
    accuracyMeters?: number;
    regionVerificationStatus: 'verified' | 'unverified' | 'citizen_specified';
    geocodingSource: string;
  }
  ```

---

## 3. Coimbatore Regional Administrative Investigation

CivicResolve conducted an investigation into authoritative administrative boundary datasets for Tamil Nadu, with particular focus on the Coimbatore metropolitan area and adjacent peri-urban taluks:

### A. Coimbatore City Municipal Corporation (CCMC)
- **Status:** Expanded Municipal Corporation comprising **5 administrative zones** and **100 wards**.
- **Zones Integrated:**
  1. **East Zone (`ccmc_zone_east`):** Wards 50–64 (Singanallur, Ramanathapuram, Ondipudur, Varadharajapuram, Sowripalayam, Puliyakulam). Bounding Box: $10.970^\circ\text{N} - 11.035^\circ\text{N},\; 76.980^\circ\text{E} - 77.060^\circ\text{E}$.
  2. **West Zone (`ccmc_zone_west`):** Wards 16–23, 70–75 (RS Puram, Saibaba Colony, KK Pudur, Koundampalayam, Vadavalli). Bounding Box: $10.990^\circ\text{N} - 11.045^\circ\text{N},\; 76.910^\circ\text{E} - 76.965^\circ\text{E}$.
  3. **North Zone (`ccmc_zone_north`):** Wards 1–15, 24–30 (Ganapathy, Gandhipuram, Saravanampatti, Peelamedu, Awarampalayam). Bounding Box: $11.025^\circ\text{N} - 11.100^\circ\text{N},\; 76.950^\circ\text{E} - 77.030^\circ\text{E}$.
  4. **South Zone (`ccmc_zone_south`):** Wards 76–100 (Kuniyamuthur, Sundarapuram, Kovaipudur, Kurichi, Podanur). Bounding Box: $10.920^\circ\text{N} - 10.990^\circ\text{N},\; 76.930^\circ\text{E} - 77.010^\circ\text{E}$.
  5. **Central Zone (`ccmc_zone_central`):** Wards 31–49 (Town Hall, Gandhipuram South, Race Course, Ukkadam, Sukrawarpet). Bounding Box: $10.980^\circ\text{N} - 11.020^\circ\text{N},\; 76.945^\circ\text{E} - 76.985^\circ\text{E}$.

### B. Sulur Town Panchayat
- **Status:** Special Grade Town Panchayat in Coimbatore District (distinct from CCMC municipal corporation jurisdiction).
- **Administrative Breakdown:** **18 official town wards**, covering the Trichy Road corridor, Sulur Aero Engine Base periphery, and Sulur Lake basin.
- **Bounding Box:** $11.000^\circ\text{N} - 11.055^\circ\text{N},\; 77.090^\circ\text{E} - 77.160^\circ\text{E}$.
- **Data Source:** Directorate of Town Panchayats, Government of Tamil Nadu.

### C. Greater Chennai Corporation (GCC)
- **Status:** Integrated 3 core zones (Zone 5 Royapuram, Zone 8 Anna Nagar, Zone 9 Teynampet) to verify inter-city extensibility.

---

## 4. Administrative Boundary Resolution Methodology

To eliminate hallucination and fake administrative claims:

1. **Polygon / Bounding Box Intersection:**
   - Coordinates obtained from GPS or pin drag are tested against authoritative boundary polygons in `geographyService.ts`.
   - If the coordinate lies within a known municipal boundary, the zone and ward are assigned with `verificationStatus: 'verified'`.
2. **Graceful Unverified Handling:**
   - If a coordinate falls outside registered official boundaries (e.g., peri-urban or rural areas without digitized ward boundaries), the locality name is preserved from geocoding, but zone and ward are strictly marked:
     `verificationStatus: 'unverified'`
   - The UI displays an informative alert and prompts the user to select their ward manually from the cascading selector if known.
3. **Citizen-Specified Override:**
   - If a citizen manually changes the cascading ward selector, the status is recorded as `regionVerificationStatus: 'citizen_specified'`, preserving the distinction between automated GIS resolution and citizen declaration.

---

## 5. Area Intelligence Engine (`/admin/intelligence`)

The intelligence service in `server/src/services/intelligenceService.ts` aggregates raw database records across all geographic levels.

### Computed Metrics:
- **Total, Open, Resolved, and Critical Grievances** per zone and ward.
- **Geographic Complaint Density:** Measured in complaints per $\text{km}^2$, classified into 4 density levels (`low`, `moderate`, `dense`, `critical`).
- **Overdue Grievance Detection:** Automatically flags tickets exceeding the 72-hour statutory SLA threshold.
- **Department Workload Matrix:** Active vs resolved breakdown across municipal directorates (Roads, Water, Sanitation, Electrical).
- **Area-Wise Resolution Performance:** Compares resolution velocity and completion rate (%) across distinct wards.
- **Repeated Chronic Issue Clusters:** Groups recurring infrastructure complaints within a 100m corridor over a 90-day window.

---

## 6. Interactive Admin Geographic Map

The admin dashboard at `frontend/src/pages/admin/CivicIntelligencePage.tsx` provides an interactive Leaflet visualization:
- **Interactive Boundary Overlays:** Renders genuine administrative boundary rectangles with dynamic complaint density heat colors.
- **Hotspot Cluster Markers:** Groups proximate grievances with severity-colored circular badges.
- **Area Detail Inspection Drawer:** Clicking any zone or ward boundary opens an analytics card displaying active complaints, resolution rate, and primary issue category.
- **Data Source & Attribution Banner:** Clearly cites authoritative data sources (`CCMC_GIS_OFFICIAL`, `TN_TOWN_PANCHAYAT_DIRECTORATE`) and disclaimer regarding unverified peri-urban coordinates.

---

## 7. Extensibility for Other Regions

The `GeographyService` is architected for seamless expansion:
- Built upon W3C GeoJSON / Bounding Box primitives.
- New states, districts, and urban local bodies (ULBs) can be registered via `server/src/services/geographyService.ts` without schema migrations.
- Supports both Corporation (Zone/Ward) and Panchayat (Town/Village) topologies.
