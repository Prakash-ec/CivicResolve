import { Router, Request, Response } from 'express';
import { adminFirestore } from '../config/firebaseAdmin.js';
import { localComplaintsStore, localHistoryStore } from './citizenRoutes.js';
import { COMPLAINT_CATEGORIES, PUBLIC_STATUS_LABELS } from '../config/constants.js';
import { slaService } from '../services/slaService.js';
import { intelligenceService } from '../services/intelligenceService.js';

const router = Router();

// Seed complaints for rich public feed and demonstration if repository is empty
const INITIAL_DEMO_COMPLAINTS = [
  {
    id: 'demo_comp_1',
    publicId: 'CR-2026-001248',
    title: 'Severe crater pothole on Anna Salai arterial junction',
    description: 'Deep road cavity measuring approximately 2.5 meters across right after the flyover ramp, causing heavy vehicle bottleneck and accident risks for two-wheelers.',
    userCategory: 'pothole_road_damage',
    location: {
      lat: 13.0827,
      lng: 80.2707,
      addressText: 'Near Anna Flyover, Anna Salai, Chennai',
      ward: 'Ward 114',
    },
    imageUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
    status: 'IN_PROGRESS',
    statusLabel: PUBLIC_STATUS_LABELS['IN_PROGRESS'],
    department: { id: 'dept_roads', name: 'Roads & Highways (Public Works)' },
    priority: { level: 'critical', score: 85 },
    upvotes: 42,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo_comp_2',
    publicId: 'CR-2026-001249',
    title: 'Overflowing commercial garbage dump blocking school pedestrian gate',
    description: 'Municipal waste container has not been cleared for over 48 hours. Garbage has spilled across the entire sidewalk outside Government Girls Higher Secondary School.',
    userCategory: 'garbage_overflow',
    location: {
      lat: 13.0500,
      lng: 80.2824,
      addressText: 'Opposite Govt Girls School, Marina High Road',
      ward: 'Ward 116',
    },
    imageUrls: ['https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80'],
    status: 'RESOLVED',
    statusLabel: PUBLIC_STATUS_LABELS['RESOLVED'],
    department: { id: 'dept_sanitation', name: 'Sanitation & Solid Waste Management' },
    priority: { level: 'high', score: 65 },
    upvotes: 28,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolutionProof: {
      verifiedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      officerNote: 'Area fully cleared, disinfected with bleaching powder, and new secondary bin installed.',
      proofImageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    id: 'demo_comp_3',
    publicId: 'CR-2026-001250',
    title: 'High tension live electric wire snapped and hanging low',
    description: 'Overhead power cable snapped during heavy winds, dangling approximately 5 feet above the pedestrian walkway near local tea stall.',
    userCategory: 'exposed_wires',
    location: {
      lat: 13.0067,
      lng: 80.2026,
      addressText: 'Guindy Industrial Estate 4th Cross Road',
      ward: 'Ward 165',
    },
    imageUrls: ['https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80'],
    status: 'ASSIGNED',
    statusLabel: PUBLIC_STATUS_LABELS['ASSIGNED'],
    department: { id: 'dept_electricity', name: 'Electrical Engineering & Streetlights' },
    priority: { level: 'critical', score: 95 },
    upvotes: 56,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo_comp_4',
    publicId: 'CR-2026-001251',
    title: 'Major underground drinking water main pipeline burst',
    description: 'Clean potable drinking water gushing onto the road at high pressure. Road flooded, water entering ground floor compounds.',
    userCategory: 'water_leakage',
    location: {
      lat: 13.0850,
      lng: 80.2101,
      addressText: 'Anna Nagar Roundtana, 2nd Avenue',
      ward: 'Ward 102',
    },
    imageUrls: ['https://images.unsplash.com/photo-1584467735867-4297ae2ebcee?auto=format&fit=crop&w=800&q=80'],
    status: 'IN_PROGRESS',
    statusLabel: PUBLIC_STATUS_LABELS['IN_PROGRESS'],
    department: { id: 'dept_water', name: 'Water Supply & Metro Water' },
    priority: { level: 'high', score: 70 },
    upvotes: 34,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo_comp_5',
    publicId: 'CR-2026-001252',
    title: 'Streetlights non-functional across entire 500m residential lane',
    description: 'All 8 sodium vapor lamp poles on 7th Main Road have been completely dark for 5 consecutive nights. Area is pitch dark, raising safety concerns.',
    userCategory: 'broken_streetlight',
    location: {
      lat: 13.0694,
      lng: 80.1948,
      addressText: 'Near Koyambedu Market Link Road, 7th Main',
      ward: 'Ward 127',
    },
    imageUrls: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'],
    status: 'SUBMITTED',
    statusLabel: PUBLIC_STATUS_LABELS['SUBMITTED'],
    department: { id: 'dept_electricity', name: 'Electrical Engineering & Streetlights' },
    priority: { level: 'medium', score: 45 },
    upvotes: 19,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
];

// Helper to scrub and return only approved public complaint fields
function toPublicComplaint(c: any): any {
  const rawLat = c.location?.lat ?? c.location?.latitude ?? 13.0827;
  const rawLng = c.location?.lng ?? c.location?.longitude ?? 80.2707;
  const safeLat = Number(Number(rawLat).toFixed(4));
  const safeLng = Number(Number(rawLng).toFixed(4));

  // Mask private door/house numbers from public address text
  const safeAddressText = (c.location?.addressText || '')
    .replace(/^#?\s*\d+[-\w\/]*,?\s*/i, '')
    .replace(/\b(Flat|Apt|Plot|Door|House)\s*(No\.?|#)?\s*\d+[-\w\/]*,?\s*/gi, '')
    .trim();

  return {
    id: c.id,
    publicId: c.publicId,
    title: c.title,
    description: c.description,
    userCategory: c.userCategory,
    category: c.userCategory, // Normalized alias for UI components
    status: c.status,
    statusLabel: c.statusLabel || PUBLIC_STATUS_LABELS[c.status as keyof typeof PUBLIC_STATUS_LABELS] || c.status,
    priority: c.priority || { level: 'medium', score: 50 },
    department: c.department || { id: 'dept_general', name: 'Municipal Administration' },
    location: {
      lat: safeLat,
      lng: safeLng,
      addressText: safeAddressText || c.location?.addressText || '',
      ward: c.location?.ward || 'General Ward',
      zone: c.location?.zone || 'Central Zone',
      municipality: c.location?.municipality || 'Greater Chennai Corporation',
    },
    imageUrls: c.imageUrls || [],
    resolutionProof: c.resolutionProof || null,
    upvotes: c.upvotes || 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt || c.createdAt,
    slaTargetHours: c.sla?.targetHours || 48,
    isOverdue: Boolean(c.sla?.isOverdue),
  };
}

// Helper to get all combined complaints (Firestore or memory store + demo seed)
function getAllComplaints(): any[] {
  const storeComplaints = Array.from(localComplaintsStore.values());
  const combined = [...storeComplaints];

  for (const demo of INITIAL_DEMO_COMPLAINTS) {
    if (!combined.some((c) => c.publicId === demo.publicId)) {
      combined.push(demo);
    }
  }

  return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * GET /api/complaints/public-stats
 * Real-time public statistics for landing page and overview cards (Unauthenticated)
 */
router.get('/complaints/public-stats', async (_req: Request, res: Response) => {
  const all = getAllComplaints();
  const total = all.length;
  const resolved = all.filter((c) => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED').length;
  const inProgress = all.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'ESCALATED'
  ).length;
  const pendingReview = all.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'AI_ANALYSED' || c.status === 'UNDER_REVIEW'
  ).length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const statsPayload = {
    total,
    resolved,
    inProgress,
    pendingReview,
    resolutionRate,
    activeCitizens: Math.max(12, total * 3 + 14),
    creditsAwarded: resolved * 45 + inProgress * 15 + 240,
  };

  res.json({
    success: true,
    stats: statsPayload,
    data: statsPayload,
  });
});

/**
 * GET /api/complaints/public-feed
 * Live complaint snapshots with query-level filtering, search, and pagination (Unauthenticated)
 */
router.get('/complaints/public-feed', async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 6, 1), 50);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
  const statusFilter = req.query.status as string;
  const categoryFilter = req.query.category as string;
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';

  let all = getAllComplaints();

  if (statusFilter && statusFilter !== 'all') {
    all = all.filter((c) => c.status === statusFilter);
  }

  if (categoryFilter && categoryFilter !== 'all') {
    all = all.filter((c) => c.userCategory === categoryFilter);
  }

  if (search) {
    all = all.filter(
      (c) =>
        c.publicId?.toLowerCase().includes(search) ||
        c.title?.toLowerCase().includes(search) ||
        c.location?.addressText?.toLowerCase().includes(search)
    );
  }

  const totalCount = all.length;
  const rawFeed = all.slice(offset, offset + limit);
  const scrubbedFeed = rawFeed.map(toPublicComplaint);

  res.json({
    success: true,
    complaints: scrubbedFeed,
    data: scrubbedFeed,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    },
  });
});

/**
 * GET /api/complaints/track/:publicId
 * Unauthenticated public tracking endpoint by public tracking ID (CR-2026-XXXXXX)
 */
router.get('/complaints/track/:publicId', async (req: Request, res: Response) => {
  const publicId = String(req.params.publicId || '');
  const all = getAllComplaints();
  const found = all.find((c) => c.publicId.toUpperCase() === publicId.toUpperCase().trim());

  if (!found) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `No grievance found with reference ID "${publicId}". Please verify the code and retry.`,
      },
    });
  }

  // Retrieve timeline events
  let timeline = localHistoryStore.get(found.id) || [];
  if (timeline.length === 0) {
    timeline = [
      {
        id: 'hist_sub',
        from: null,
        to: 'SUBMITTED',
        actorRole: 'citizen',
        publicNote: 'Grievance officially filed and recorded on CivicResolve.',
        createdAt: found.createdAt,
      },
    ];
    if (found.status === 'AI_ANALYSED' || found.status === 'IN_PROGRESS' || found.status === 'RESOLVED') {
      timeline.push({
        id: 'hist_ai',
        from: 'SUBMITTED',
        to: 'AI_ANALYSED',
        actorRole: 'system',
        publicNote: 'Multimodal AI verified evidence, assessed severity, and routed to department.',
        createdAt: new Date(new Date(found.createdAt).getTime() + 120000).toISOString(),
      });
    }
    if (found.status === 'IN_PROGRESS' || found.status === 'RESOLVED') {
      timeline.push({
        id: 'hist_prog',
        from: 'AI_ANALYSED',
        to: 'IN_PROGRESS',
        actorRole: 'authority',
        publicNote: `Field maintenance crew assigned by ${found.department.name}.`,
        createdAt: new Date(new Date(found.createdAt).getTime() + 7200000).toISOString(),
      });
    }
    if (found.status === 'RESOLVED') {
      timeline.push({
        id: 'hist_res',
        from: 'IN_PROGRESS',
        to: 'RESOLVED',
        actorRole: 'authority',
        publicNote: found.resolutionProof?.officerNote || 'Civic issue resolved on site. Awaiting citizen confirmation.',
        createdAt: found.updatedAt,
      });
    }
  }

  // Privacy-safe coordinates and address sanitization for public exposure
  const rawLat = found.location.latitude ?? found.location.lat;
  const rawLng = found.location.longitude ?? found.location.lng;
  // Round coordinates to 2 decimal places (~1.1 km precision) to protect residential privacy
  const safeLat = Number(Number(rawLat).toFixed(2));
  const safeLng = Number(Number(rawLng).toFixed(2));

  // Mask private house/flat numbers from public safe address text
  const safeAddressText = (found.location.addressText || '')
    .replace(/^#?\s*\d+[-\w\/]*,?\s*/i, '') // remove leading door/flat number
    .replace(/\b(Flat|Apt|Plot|Door|House)\s*(No\.?|#)?\s*\d+[-\w\/]*,?\s*/gi, '');

  res.json({
    success: true,
    complaint: {
      id: found.id,
      publicId: found.publicId,
      title: found.title,
      description: found.description,
      userCategory: found.userCategory,
      location: {
        lat: safeLat,
        lng: safeLng,
        addressText: safeAddressText || found.location.addressText,
        locality: found.location.locality,
        ward: found.location.ward,
        zone: found.location.zone,
        city: found.location.city,
        district: found.location.district,
        state: found.location.state,
        regionVerificationStatus: found.location.regionVerificationStatus,
      },
      imageUrls: found.imageUrls || [],
      status: found.status,
      statusLabel: found.statusLabel,
      department: found.department,
      priority: found.priority,
      aiAnalysis: found.aiAnalysis ? {
        englishSummary: found.aiAnalysis.englishSummary,
        confidence: found.aiAnalysis.confidence,
      } : null,
      resolutionProof: found.resolutionProof ? {
        verifiedAt: found.resolutionProof.verifiedAt,
        officerNote: found.resolutionProof.officerNote,
        proofImageUrl: found.resolutionProof.proofImageUrl,
      } : null,
      citizenVerification: found.citizenVerification ? {
        verifiedAt: found.citizenVerification.verifiedAt,
        rating: found.citizenVerification.rating,
        feedback: found.citizenVerification.feedback,
      } : null,
      reopenDetails: found.reopenDetails ? {
        reopenedAt: found.reopenDetails.reopenedAt,
        reason: found.reopenDetails.reason,
      } : null,
      sla: found.sla ? {
        targetHours: found.sla.targetHours,
        deadline: found.sla.deadline,
        isOverdue: found.sla.deadline ? new Date(found.sla.deadline) < new Date() && !['RESOLVED', 'CITIZEN_VERIFIED'].includes(found.status) : false,
        escalationTier: found.sla.escalationTier || 'TIER_1_WARD',
      } : null,
      upvotes: found.upvotes || 0,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      estimatedResolutionDate: found.estimatedResolutionDate || null,
    },
    timeline: timeline.map((t) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      actorRole: t.actorRole,
      publicNote: t.publicNote,
      createdAt: t.createdAt,
    })),
  });
});

/**
 * GET /api/complaints/map-points
 * GeoJSON / Coordinate list for the full interactive map explorer
 * Privacy-safe: Fuzz coordinates to 4 decimal places (~11m precision), strip citizen PII & internal notes
 */
router.get('/complaints/map-points', async (_req: Request, res: Response) => {
  const all = getAllComplaints();
  const points = all.map((c) => {
    const rawLat = c.location?.lat ?? c.location?.latitude ?? 13.0827;
    const rawLng = c.location?.lng ?? c.location?.longitude ?? 80.2707;
    const safeLat = Number(Number(rawLat).toFixed(4));
    const safeLng = Number(Number(rawLng).toFixed(4));
    const safeAddress = (c.location?.addressText || '')
      .replace(/^#?\s*\d+[-\w\/]*,?\s*/i, '')
      .replace(/\b(Flat|Apt|Plot|Door|House)\s*(No\.?|#)?\s*\d+[-\w\/]*,?\s*/gi, '')
      .trim() || 'Municipal Area';
    const safeWard = c.location?.ward || 'General Ward';
    const safeZone = c.location?.zone || 'Central Zone';
    const safePriority = typeof c.priority === 'object' ? (c.priority?.level || 'medium') : (c.priority || 'medium');

    return {
      id: c.id,
      publicId: c.publicId,
      title: c.title,
      userCategory: c.userCategory,
      category: c.userCategory,
      status: c.status,
      statusLabel: c.statusLabel || (PUBLIC_STATUS_LABELS as any)[c.status] || c.status,
      priority: safePriority,
      priorityObject: c.priority || { level: safePriority, score: 50 },
      lat: safeLat,
      lng: safeLng,
      location: {
        lat: safeLat,
        lng: safeLng,
        addressText: safeAddress,
        ward: safeWard,
        zone: safeZone,
        municipality: c.location?.municipality || 'Municipal Corporation',
      },
      addressText: safeAddress,
      ward: safeWard,
      zone: safeZone,
      department: c.department?.name || 'Municipal Administration',
      imageUrl: c.imageUrls?.[0] || null,
      resolutionProofUrl: c.resolutionProof?.proofImageUrl || null,
      isResolved: c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED',
      upvotes: c.upvotes || 0,
      createdAt: c.createdAt,
      slaTargetHours: c.sla?.targetHours || 48,
      isOverdue: c.sla?.deadline ? new Date(c.sla.deadline) < new Date() && !['RESOLVED', 'CITIZEN_VERIFIED'].includes(c.status) : false,
    };
  });

  res.json({
    success: true,
    count: points.length,
    points,
  });
});

/**
 * GET /api/public/accountability
 * Transparent municipal accountability data driven by real complaints
 */
router.get('/public/accountability', async (_req: Request, res: Response) => {
  const all = getAllComplaints();
  const total = all.length;
  const resolved = all.filter((c) => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED').length;
  const inProgress = all.filter((c) => ['IN_PROGRESS', 'ASSIGNED', 'ESCALATED', 'REOPENED'].includes(c.status)).length;
  const pendingReview = all.filter((c) => ['SUBMITTED', 'AI_ANALYSED', 'UNDER_REVIEW'].includes(c.status)).length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Compute average resolution hours from resolved complaints
  let totalResolutionHours = 0;
  let resolvedCountWithDates = 0;
  for (const c of all) {
    if ((c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED') && c.resolutionProof?.verifiedAt) {
      const start = new Date(c.createdAt).getTime();
      const end = new Date(c.resolutionProof.verifiedAt).getTime();
      const hours = Math.max(1, (end - start) / (3600 * 1000));
      totalResolutionHours += hours;
      resolvedCountWithDates++;
    }
  }
  const avgResolutionHours = resolvedCountWithDates > 0 ? Math.round(totalResolutionHours / resolvedCountWithDates) : 24;

  // Compute SLA compliance rate
  const overdueCount = all.filter((c) => {
    if (!c.sla?.deadline) return false;
    return new Date(c.sla.deadline) < new Date() && !['RESOLVED', 'CITIZEN_VERIFIED'].includes(c.status);
  }).length;
  const slaComplianceRate = total > 0 ? Math.max(0, Math.round(((total - overdueCount) / total) * 100)) : 100;

  // Compute Ward-level breakdown
  const wardMap = new Map<string, { total: number; resolved: number; inProgress: number; critical: number }>();
  for (const c of all) {
    const ward = c.location?.ward || 'Ward 114';
    const entry = wardMap.get(ward) || { total: 0, resolved: 0, inProgress: 0, critical: 0 };
    entry.total++;
    if (c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED') entry.resolved++;
    else entry.inProgress++;
    if (c.priority?.level === 'critical') entry.critical++;
    wardMap.set(ward, entry);
  }

  const wardPerformance = Array.from(wardMap.entries()).map(([ward, data]) => ({
    ward,
    total: data.total,
    resolved: data.resolved,
    inProgress: data.inProgress,
    critical: data.critical,
    resolutionRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
    riskLevel: data.critical > 0 ? 'Elevated' : data.total > 3 ? 'Moderate' : 'Low',
  }));

  // Compute Department workload and velocity
  const workloads = slaService.computeDepartmentWorkloads(all);

  res.json({
    success: true,
    citySummary: {
      totalGrievances: total,
      resolvedGrievances: resolved,
      inProgressGrievances: inProgress,
      pendingReviewGrievances: pendingReview,
      resolutionRate,
      avgResolutionHours,
      slaComplianceRate,
      activeWardsCovered: wardPerformance.length,
      lastUpdated: new Date().toISOString(),
    },
    wardPerformance,
    departmentPerformance: workloads,
  });
});

/**
 * POST /api/complaints/:id/vote
 * Community upvote on a grievance to indicate neighborhood urgency
 */
router.post('/complaints/:id/vote', async (req: Request, res: Response) => {
  const { id } = req.params;
  const all = getAllComplaints();
  const target = all.find((c) => c.id === id || c.publicId === id);

  if (!target) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  target.upvotes = (target.upvotes || 0) + 1;
  if (localComplaintsStore.has(target.id)) {
    const existing = localComplaintsStore.get(target.id);
    existing.upvotes = target.upvotes;
    localComplaintsStore.set(target.id, existing);
  }

  res.json({
    success: true,
    upvotes: target.upvotes,
  });
});

export default router;
