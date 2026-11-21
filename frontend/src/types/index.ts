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

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'AI_ANALYSED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CITIZEN_VERIFIED'
  | 'REOPENED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'ESCALATED';

export interface LocationData {
  lat: number;
  lng: number;
  addressText: string;
  ward?: string;
}

export interface Complaint {
  id: string;
  publicId: string;
  ownerUid: string;
  title: string;
  description: string;
  userCategory: ComplaintCategory;
  location: LocationData;
  imageUrls: string[];
  status: ComplaintStatus;
  statusLabel: string;
  department: {
    id: string;
    name: string;
    source: string;
  };
  priority: {
    level: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    breakdown?: {
      safetyRisk: number;
      electricalHazard: number;
      healthHazard: number;
      trafficObstruction: number;
      affectedPeople: number;
      locationSensitivity: number;
      hotspotBonus: number;
    };
  };
  aiStatus: 'pending' | 'success' | 'failed' | 'skipped';
  aiAnalysis?: {
    language: string;
    englishSummary: string;
    detectedCategory: ComplaintCategory;
    confidence: number;
    reasoning: string;
    recommendedAction: string;
  };
  evidenceVerification?: EvidenceVerification;
  communityConfirmationsCount?: number;
  phoneVerified?: boolean;
  needsHumanReview: boolean;
  duplicateCandidates?: Array<{
    candidateId: string;
    candidatePublicId: string;
    distanceMeters: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'citizen' | 'admin' | 'officer';
  preferredLanguage: 'en' | 'ta' | 'hi' | 'te' | 'kn';
  phoneNumber?: string;
  phoneVerified?: boolean;
}

export interface HotspotCluster {
  id: string;
  centroid: {
    lat: number;
    lng: number;
    approxAddress: string;
    ward: string;
  };
  radiusMeters: number;
  complaintCount: number;
  complaintIds: string[];
  publicIds: string[];
  dominantCategory: string;
  averageImpactScore: number;
  severityLevel: 'low' | 'moderate' | 'high' | 'critical';
  unresolvedCount: number;
  suggestedAction: string;
}

export interface WardMetric {
  wardName: string;
  totalComplaints: number;
  unresolvedCount: number;
  resolutionRatePercent: number;
  criticalClustersCount: number;
  averageImpactScore: number;
  dominantCategory: string;
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
}

export interface CivicRecommendation {
  id: string;
  title: string;
  ward: string;
  category: string;
  urgency: 'immediate' | 'medium_term' | 'preventive';
  impactScore: number;
  clusterId?: string;
  rationale: string;
  suggestedResourceDispatch: string;
}

export interface EvidenceVerification {
  authenticityScore: number;
  detectedCategory: ComplaintCategory;
  categoryMatch: boolean;
  tamperingDetected: boolean;
  tamperingSignals: string[];
  visualDamageSeverity: 'low' | 'medium' | 'high' | 'critical';
  sceneDescription: string;
  environmentalFactors: string[];
  safetyRisk: 'none' | 'moderate' | 'critical';
  confidenceScore: number;
  recommendedMunicipalAction: string;
}

export interface CommunityIssue {
  id: string;
  publicId: string;
  title: string;
  description: string;
  userCategory: ComplaintCategory;
  location: LocationData;
  imageUrls: string[];
  status: ComplaintStatus;
  statusLabel: string;
  priority: {
    level: string;
    score: number;
  };
  department?: {
    id: string;
    name: string;
  };
  communityConfirmationsCount: number;
  distanceMeters: number;
  userConfirmed: boolean;
  createdAt: string;
}
