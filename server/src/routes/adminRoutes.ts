import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { localComplaintsStore, localHistoryStore } from './citizenRoutes.js';
import { DEPARTMENT_MAPPINGS, PUBLIC_STATUS_LABELS } from '../config/constants.js';
import { intelligenceService } from '../services/intelligenceService.js';
import { imageAnalysisService } from '../services/imageAnalysisService.js';
import { slaService } from '../services/slaService.js';
import { routingService } from '../services/routingService.js';

const router = Router();

// Helper to access all complaints
function getComplaintsArray(): any[] {
  return Array.from(localComplaintsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * GET /api/admin/overview
 * Overview metrics for the municipal administrative triage center
 */
router.get('/overview', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();
  const total = all.length;
  const critical = all.filter((c) => c.priority?.level === 'critical').length;
  const inProgress = all.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolved = all.filter((c) => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED').length;
  const unassigned = all.filter((c) => c.status === 'SUBMITTED' || c.status === 'AI_ANALYSED').length;

  res.json({
    success: true,
    overview: {
      total,
      critical,
      inProgress,
      resolved,
      unassigned,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgResolutionHours: 28,
    },
  });
});

/**
 * GET /api/admin/complaints
 * Filterable, searchable, and paginated complaint management table
 */
router.get('/complaints', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { status, priority, department, search, page = '1', limit = '10' } = req.query;
  let list = getComplaintsArray();

  if (status && status !== 'all') {
    list = list.filter((c) => c.status === status);
  }
  if (priority && priority !== 'all') {
    list = list.filter((c) => c.priority?.level === priority);
  }
  if (department && department !== 'all') {
    list = list.filter((c) => c.department?.id === department);
  }
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.publicId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location?.addressText?.toLowerCase().includes(q)
    );
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / limitNum) || 1;
  const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    complaints: paginated,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      pageSize: limitNum,
    },
  });
});

/**
 * GET /api/admin/complaints/:id
 * Single complaint inspection with AI analysis details and full timeline
 */
router.get('/complaints/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const list = getComplaintsArray();
  const found = list.find((c) => c.id === id || c.publicId === id);

  if (!found) {
    return res.status(404).json({ success: false, message: 'Complaint not found.' });
  }

  const timeline = localHistoryStore.get(found.id) || [];

  res.json({
    success: true,
    complaint: found,
    timeline,
  });
});

/**
 * PATCH /api/admin/complaints/:id
 * Administrative action: update status, assign department/officer, confirm resolution, or mark duplicate
 */
router.patch('/complaints/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const {
    status,
    departmentId,
    officerName,
    priorityLevel,
    note,
    resolutionProofUrl,
    rejectionReason,
    duplicateOfPublicId,
  } = req.body;

  const found = localComplaintsStore.get(id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Complaint not found.' });
  }

  const nowIso = new Date().toISOString();
  const oldStatus = found.status;

  if (status) {
    found.status = status;
    found.statusLabel = (PUBLIC_STATUS_LABELS as any)[status] || status;
  }

  if (departmentId && (DEPARTMENT_MAPPINGS as any)[departmentId]) {
    found.department = {
      id: departmentId,
      name: (DEPARTMENT_MAPPINGS as any)[departmentId].name,
      source: 'admin_override',
    };
  }

  if (priorityLevel) {
    found.priority = {
      ...found.priority,
      level: priorityLevel,
      source: 'admin_override',
    };
  }

  if (officerName) {
    found.assignedOfficer = officerName;
  }

  if (status === 'RESOLVED') {
    found.resolutionProof = {
      verifiedAt: nowIso,
      officerNote: note || 'Issue successfully rectified on site.',
      proofImageUrl: resolutionProofUrl || null,
    };
  }

  if (status === 'REJECTED') {
    found.rejectionInfo = {
      reason: rejectionReason || 'Standard municipal closure',
      duplicateOf: duplicateOfPublicId || null,
      rejectedAt: nowIso,
    };
  }

  found.updatedAt = nowIso;
  found.version = (found.version || 1) + 1;
  localComplaintsStore.set(id, found);

  // Append to status history
  const history = localHistoryStore.get(id) || [];
  history.push({
    id: `hist_${Date.now()}`,
    from: oldStatus,
    to: found.status,
    actorUid: req.user!.uid,
    actorRole: 'admin',
    publicNote:
      note ||
      (status === 'RESOLVED'
        ? 'Resolution confirmed by authority'
        : 'Status updated by municipal triage'),
    createdAt: nowIso,
  });
  localHistoryStore.set(id, history);

  res.json({
    success: true,
    complaint: found,
    message: 'Complaint successfully updated.',
  });
});

/**
 * GET /api/admin/analytics
 * Aggregated metric datasets for Recharts visualization
 */
router.get('/analytics', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const c of all) {
    const cat = c.userCategory || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryData = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat.replace(/_/g, ' '),
    count,
  }));

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const c of all) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }
  const statusData = Object.entries(statusCounts).map(([stat, count]) => ({
    status: stat.replace(/_/g, ' '),
    count,
  }));

  // Priority distribution
  const priorityCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const c of all) {
    const p = c.priority?.level || 'low';
    priorityCounts[p] = (priorityCounts[p] || 0) + 1;
  }
  const priorityData = Object.entries(priorityCounts).map(([level, count]) => ({
    priority: level.toUpperCase(),
    count,
  }));

  res.json({
    success: true,
    data: {
      categoryData,
      statusData,
      priorityData,
      totalGrievances: all.length,
    },
  });
});

/**
 * ============================================================================
 * CIVIC IMPACT INTELLIGENCE ENDPOINTS (/api/admin/intelligence/*)
 * ============================================================================
 */

/**
 * GET /api/admin/intelligence/overview
 * Executive summary indicators for municipal commanders
 */
router.get('/intelligence/overview', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();
  const clusters = intelligenceService.clusterComplaints(all, 150);
  const wardMetrics = intelligenceService.computeWardMetrics(all, clusters);
  const recommendations = intelligenceService.generateRecommendations(clusters, wardMetrics);

  const criticalClusters = clusters.filter(
    (c) => c.severityLevel === 'critical' || c.severityLevel === 'high'
  );

  let totalCityScore = 0;
  if (clusters.length > 0) {
    totalCityScore = Math.round(
      clusters.reduce((acc, c) => acc + c.averageImpactScore, 0) / clusters.length
    );
  }

  // City Health Index (100 - Avg City Impact Score)
  const cityHealthIndex = Math.max(0, 100 - totalCityScore);

  res.json({
    success: true,
    overview: {
      cityHealthIndex,
      activeClustersCount: clusters.length,
      criticalHotspotsCount: criticalClusters.length,
      activeWardsCount: wardMetrics.length,
      recommendationsCount: recommendations.length,
      totalUnresolvedIssues: all.filter((c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length,
    },
  });
});

/**
 * GET /api/admin/intelligence/hotspots
 * Geospatial Haversine clusters with coordinates, radii, and impact scores
 */
router.get('/intelligence/hotspots', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const radius = parseInt(req.query.radius as string, 10) || 150;
  const all = getComplaintsArray();
  const clusters = intelligenceService.clusterComplaints(all, radius);

  res.json({
    success: true,
    radiusMeters: radius,
    totalClusters: clusters.length,
    clusters,
  });
});

/**
 * GET /api/admin/intelligence/geographic
 * Detailed geographic intelligence by State, District, Municipality, Zone, Ward, Locality
 */
router.get('/intelligence/geographic', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { state, district, municipality, zone, ward, block, locality } = req.query;
  const all = getComplaintsArray();

  const analytics = intelligenceService.computeGeographicAnalytics(all, {
    state: state ? String(state) : undefined,
    district: district ? String(district) : undefined,
    municipality: municipality ? String(municipality) : undefined,
    zone: zone ? String(zone) : undefined,
    ward: ward ? String(ward) : undefined,
    block: block ? String(block) : undefined,
    locality: locality ? String(locality) : undefined,
  });

  res.json({
    success: true,
    analytics,
  });
});

/**
 * GET /api/admin/intelligence/wards
 * Ward-level performance indicators, resolution velocity, and risk ratings
 */
router.get('/intelligence/wards', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();
  const clusters = intelligenceService.clusterComplaints(all, 150);
  const wardMetrics = intelligenceService.computeWardMetrics(all, clusters);

  res.json({
    success: true,
    totalWards: wardMetrics.length,
    wards: wardMetrics,
  });
});

/**
 * GET /api/admin/intelligence/recommendations
 * Explainable, rule-synthesized municipal engineering recommendations
 */
router.get(
  '/intelligence/recommendations',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const all = getComplaintsArray();
    const clusters = intelligenceService.clusterComplaints(all, 150);
    const wardMetrics = intelligenceService.computeWardMetrics(all, clusters);
    const recommendations = intelligenceService.generateRecommendations(clusters, wardMetrics);

    res.json({
      success: true,
      total: recommendations.length,
      recommendations,
    });
  }
);

/**
 * ============================================================================
 * MULTIMODAL AI IMAGE EVIDENCE VERIFICATION ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/admin/complaints/:id/verify-evidence
 * Triggers forensic multimodal inspection of citizen-uploaded photo
 */
router.post(
  '/complaints/:id/verify-evidence',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const all = getComplaintsArray();
    const complaint = all.find((c) => c.id === id || c.publicId === id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const analysis = await imageAnalysisService.verifyImageEvidence({
      complaintId: complaint.id,
      userCategory: complaint.userCategory,
      complaintTitle: complaint.title,
      complaintDescription: complaint.description,
      imageUrl: complaint.imageUrls?.[0],
    });

    // Cache verification on complaint record
    complaint.evidenceVerification = analysis;
    complaint.updatedAt = new Date().toISOString();
    localComplaintsStore.set(complaint.id, complaint);

    res.json({
      success: true,
      complaintId: complaint.id,
      publicId: complaint.publicId,
      verification: analysis,
    });
  }
);

/**
 * GET /api/admin/complaints/:id/evidence-analysis
 * Retrieves cached or freshly inspected evidence verification
 */
router.get(
  '/complaints/:id/evidence-analysis',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const all = getComplaintsArray();
    const complaint = all.find((c) => c.id === id || c.publicId === id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.evidenceVerification) {
      return res.json({
        success: true,
        complaintId: complaint.id,
        publicId: complaint.publicId,
        verification: complaint.evidenceVerification,
      });
    }

    // Generate fresh verification if not already stored
    const analysis = await imageAnalysisService.verifyImageEvidence({
      complaintId: complaint.id,
      userCategory: complaint.userCategory,
      complaintTitle: complaint.title,
      complaintDescription: complaint.description,
      imageUrl: complaint.imageUrls?.[0],
    });

    complaint.evidenceVerification = analysis;
    localComplaintsStore.set(complaint.id, complaint);

    res.json({
      success: true,
      complaintId: complaint.id,
      publicId: complaint.publicId,
      verification: analysis,
    });
  }
);

/**
 * ============================================================================
 * BULK ASSIGNMENT, AUDIT LOGS, CSV EXPORT & WORKLOAD INTELLIGENCE
 * ============================================================================
 */

/**
 * POST /api/admin/complaints/bulk-assign
 * Atomically updates and assigns multiple complaints at once
 */
router.post('/complaints/bulk-assign', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { complaintIds, status, departmentId, officerName, priorityLevel, note } = req.body;

  if (!Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of at least one complaint ID to perform bulk action.',
    });
  }

  const nowIso = new Date().toISOString();
  const updatedComplaints: any[] = [];

  for (const id of complaintIds) {
    const complaint = localComplaintsStore.get(id);
    if (!complaint) continue;

    const oldStatus = complaint.status;
    if (status) {
      complaint.status = status;
      complaint.statusLabel = (PUBLIC_STATUS_LABELS as any)[status] || status;
    }

    if (departmentId && (DEPARTMENT_MAPPINGS as any)[departmentId]) {
      complaint.department = {
        id: departmentId,
        name: (DEPARTMENT_MAPPINGS as any)[departmentId].name,
        source: 'bulk_admin_override',
      };
    }

    if (officerName) {
      complaint.assignedOfficer = officerName;
    }

    if (priorityLevel) {
      complaint.priority = {
        ...complaint.priority,
        level: priorityLevel,
        source: 'bulk_admin_override',
      };
    }

    complaint.updatedAt = nowIso;
    complaint.version = (complaint.version || 1) + 1;
    localComplaintsStore.set(complaint.id, complaint);

    // Timeline event
    const history = localHistoryStore.get(complaint.id) || [];
    history.push({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      from: oldStatus,
      to: complaint.status,
      actorUid: req.user!.uid,
      actorRole: 'admin',
      publicNote: note || `Bulk administrative assignment: ${departmentId ? `Assigned to ${(DEPARTMENT_MAPPINGS as any)[departmentId]?.name || departmentId}. ` : ''}${officerName ? `Officer: ${officerName}. ` : ''}`,
      createdAt: nowIso,
    });
    localHistoryStore.set(complaint.id, history);

    updatedComplaints.push(complaint);
  }

  return res.json({
    success: true,
    updatedCount: updatedComplaints.length,
    complaints: updatedComplaints,
    message: `Successfully updated ${updatedComplaints.length} complaints.`,
  });
});

/**
 * GET /api/admin/complaints/export/csv
 * Generates an RFC 4180 compliant CSV export of all filtered complaints
 */
router.get('/complaints/export/csv', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Public ID',
    'Title',
    'Category',
    'Department',
    'Priority Level',
    'Priority Score',
    'Status',
    'Ward',
    'Zone',
    'Address',
    'Latitude',
    'Longitude',
    'Created At',
    'SLA Target Hours',
    'SLA Deadline',
    'Is Overdue',
    'Escalation Tier',
    'Assigned Officer',
    'Upvotes',
  ];

  const rows = all.map((c) => {
    const isOverdue = c.sla?.deadline ? new Date(c.sla.deadline) < new Date() && !['RESOLVED', 'CITIZEN_VERIFIED'].includes(c.status) : false;
    return [
      escapeCsv(c.publicId),
      escapeCsv(c.title),
      escapeCsv(c.userCategory),
      escapeCsv(c.department?.name || 'Unassigned'),
      escapeCsv(c.priority?.level || 'medium'),
      escapeCsv(c.priority?.score ?? 50),
      escapeCsv(c.status),
      escapeCsv(c.location?.ward || 'Unassigned'),
      escapeCsv(c.location?.zone || 'Unassigned'),
      escapeCsv(c.location?.addressText || ''),
      escapeCsv(c.location?.lat ?? c.location?.latitude ?? ''),
      escapeCsv(c.location?.lng ?? c.location?.longitude ?? ''),
      escapeCsv(c.createdAt),
      escapeCsv(c.sla?.targetHours || ''),
      escapeCsv(c.sla?.deadline || ''),
      escapeCsv(isOverdue ? 'YES' : 'NO'),
      escapeCsv(c.sla?.escalationTier || 'TIER_1_WARD'),
      escapeCsv(c.assignedOfficer || 'Unassigned'),
      escapeCsv(c.upvotes || 0),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="civicresolve-export-${dateStr}.csv"`);
  return res.status(200).send(csvContent);
});

/**
 * GET /api/admin/audit-logs
 * System-wide audit log of all administrative actions and status history
 */
router.get('/audit-logs', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const allLogs: any[] = [];

  for (const [complaintId, history] of localHistoryStore.entries()) {
    const comp = localComplaintsStore.get(complaintId);
    for (const h of history) {
      allLogs.push({
        ...h,
        complaintId,
        publicId: comp?.publicId || 'UNKNOWN',
        title: comp?.title || 'Unknown Issue',
        category: comp?.userCategory || 'other',
        ward: comp?.location?.ward || 'General',
      });
    }
  }

  allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    totalLogs: allLogs.length,
    logs: allLogs.slice(0, 100),
  });
});

/**
 * GET /api/admin/intelligence/recurring
 * Geographic clustering & 90-day recurring pattern detection
 */
router.get('/intelligence/recurring', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();
  const recurringPatterns = intelligenceService.detectRecurringIssues(all);

  return res.json({
    success: true,
    totalRecurringClusters: recurringPatterns.length,
    patterns: recurringPatterns,
  });
});

/**
 * GET /api/admin/intelligence/risk-index
 * Explainable Infrastructure Risk Index (0-100)
 */
router.get('/intelligence/risk-index', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const all = getComplaintsArray();
  const wardParam = req.query.ward ? String(req.query.ward) : undefined;
  const assessment = intelligenceService.computeInfrastructureRiskIndex(all, wardParam);

  return res.json({
    success: true,
    assessment,
  });
});

/**
 * GET /api/admin/workload
 * Department capacity, SLA compliance, and dispatch distribution
 */
router.get('/workload', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const all = getComplaintsArray();
  const workloads = slaService.computeDepartmentWorkloads(all);

  return res.json({
    success: true,
    workloads,
  });
});

export default router;
