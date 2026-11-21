// CivicResolve Master Constants & Enums

export const COMPLAINT_CATEGORIES = [
  'pothole_road_damage',
  'garbage_overflow',
  'illegal_dumping',
  'streetlight_failure',
  'water_leakage',
  'drainage_blockage',
  'sewage_overflow',
  'exposed_electrical_hazard',
  'public_infrastructure_damage',
  'other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = [
  'SUBMITTED',
  'AI_ANALYSED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CITIZEN_VERIFIED',
  'REOPENED',
  'REJECTED',
  'DUPLICATE',
  'ESCALATED',
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

// Citizen-facing public labels for statuses
export const PUBLIC_STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Reported',
  AI_ANALYSED: 'Reported',
  UNDER_REVIEW: 'Reported',
  ASSIGNED: 'Reported',
  IN_PROGRESS: 'In Progress',
  ESCALATED: 'In Progress',
  REOPENED: 'In Progress',
  RESOLVED: 'Resolved',
  CITIZEN_VERIFIED: 'Resolved',
  REJECTED: 'Rejected',
  DUPLICATE: 'Duplicate',
};

// Deterministic Department Mapping Table
export const DEPARTMENT_MAPPINGS: Record<ComplaintCategory, { id: string; name: string }> = {
  pothole_road_damage: {
    id: 'dept_roads',
    name: 'Roads & Highways (Public Works)',
  },
  garbage_overflow: {
    id: 'dept_sanitation',
    name: 'Sanitation & Solid Waste',
  },
  illegal_dumping: {
    id: 'dept_sanitation',
    name: 'Sanitation & Solid Waste',
  },
  streetlight_failure: {
    id: 'dept_lighting',
    name: 'Street Lighting (Electricity)',
  },
  water_leakage: {
    id: 'dept_water',
    name: 'Water Supply',
  },
  drainage_blockage: {
    id: 'dept_drainage',
    name: 'Drainage & Sewerage',
  },
  sewage_overflow: {
    id: 'dept_drainage',
    name: 'Drainage & Sewerage',
  },
  exposed_electrical_hazard: {
    id: 'dept_electricity',
    name: 'Electricity Board',
  },
  public_infrastructure_damage: {
    id: 'dept_public_works',
    name: 'Public Works',
  },
  other: {
    id: 'dept_human_review',
    name: 'Human Review & Triage',
  },
};
