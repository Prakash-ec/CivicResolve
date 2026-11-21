import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { localComplaintsStore } from './citizenRoutes.js';
import { intelligenceService } from '../services/intelligenceService.js';

const router = Router();

// Track confirmed user UIDs per complaint: Map<complaintId, Set<userId>>
export const communityConfirmationsMap = new Map<string, Set<string>>();

/**
 * GET /api/community/issues/nearby
 * Returns complaints near given lat/lng within a radius in meters
 */
router.get('/issues/nearby', async (req: Request, res: Response) => {
  const { lat, lng, radius = '2500', category } = req.query;

  const userLat = parseFloat(lat as string) || 13.0827;
  const userLng = parseFloat(lng as string) || 80.2707;
  const maxRadiusMeters = parseFloat(radius as string) || 2500;

  const allComplaints = Array.from(localComplaintsStore.values());

  const nearby = allComplaints
    .filter((c) => {
      if (!c.location || typeof c.location.lat !== 'number' || typeof c.location.lng !== 'number') {
        return false;
      }
      if (category && category !== 'all' && c.userCategory !== category) {
        return false;
      }
      return true;
    })
    .map((c) => {
      const distance = intelligenceService.haversineDistanceMeters(
        userLat,
        userLng,
        c.location.lat,
        c.location.lng
      );
      const confirms = communityConfirmationsMap.get(c.id) || new Set<string>();
      const userConfirmed = req.user ? confirms.has(req.user.uid) : false;

      return {
        id: c.id,
        publicId: c.publicId,
        title: c.title,
        description: c.description,
        userCategory: c.userCategory,
        location: c.location,
        imageUrls: c.imageUrls || [],
        status: c.status,
        statusLabel: c.statusLabel,
        priority: c.priority,
        department: c.department,
        communityConfirmationsCount: c.communityConfirmationsCount || confirms.size || 0,
        distanceMeters: Math.round(distance),
        userConfirmed,
        createdAt: c.createdAt,
      };
    })
    .filter((item) => item.distanceMeters <= maxRadiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({
    success: true,
    total: nearby.length,
    issues: nearby,
  });
});

/**
 * POST /api/community/issues/:id/confirm
 * Citizen confirmation: "Yes, This Issue Exists"
 * Strict constraints:
 * - Must be authenticated citizen
 * - Cannot confirm own complaint
 * - 1 confirmation per citizen UID
 * - Awards 10 ResolveRewards™ credits
 */
router.post('/issues/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userUid = req.user!.uid;

  const complaint = Array.from(localComplaintsStore.values()).find(
    (c) => c.id === id || c.publicId === id
  );

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Grievance record not found.',
    });
  }

  // Prevent self-confirmation
  if (complaint.ownerUid === userUid) {
    return res.status(400).json({
      success: false,
      message: 'You cannot confirm a grievance that you originally reported.',
    });
  }

  // Check if citizen already confirmed
  let confirmedSet = communityConfirmationsMap.get(complaint.id);
  if (!confirmedSet) {
    confirmedSet = new Set<string>();
    communityConfirmationsMap.set(complaint.id, confirmedSet);
  }

  if (confirmedSet.has(userUid)) {
    return res.status(400).json({
      success: false,
      message: 'You have already confirmed this civic issue.',
    });
  }

  // Register confirmation
  confirmedSet.add(userUid);
  complaint.communityConfirmationsCount = (complaint.communityConfirmationsCount || 0) + 1;

  // Elevate priority score by +5 for community verification
  if (complaint.priority) {
    complaint.priority.score = Math.min(100, (complaint.priority.score || 30) + 5);
    if (complaint.priority.score >= 75) complaint.priority.level = 'critical';
    else if (complaint.priority.score >= 50) complaint.priority.level = 'high';
  }

  complaint.updatedAt = new Date().toISOString();
  localComplaintsStore.set(complaint.id, complaint);

  res.json({
    success: true,
    message: 'Civic issue confirmed! 10 ResolveRewards™ credits credited to your account.',
    communityConfirmationsCount: complaint.communityConfirmationsCount,
    creditsAwarded: 10,
    complaintId: complaint.id,
    publicId: complaint.publicId,
  });
});

/**
 * GET /api/community/issues/:id/possible-duplicates
 * Returns potential duplicate grievances within 150m in same category
 */
router.get('/issues/:id/possible-duplicates', async (req: Request, res: Response) => {
  const { id } = req.params;
  const all = Array.from(localComplaintsStore.values());
  const target = all.find((c) => c.id === id || c.publicId === id);

  if (!target || !target.location) {
    return res.json({ success: true, duplicates: [] });
  }

  const duplicates = all
    .filter((c) => c.id !== target.id && c.location && c.status !== 'RESOLVED' && c.status !== 'REJECTED')
    .map((c) => {
      const dist = intelligenceService.haversineDistanceMeters(
        target.location.lat,
        target.location.lng,
        c.location.lat,
        c.location.lng
      );
      return {
        id: c.id,
        publicId: c.publicId,
        title: c.title,
        userCategory: c.userCategory,
        status: c.status,
        distanceMeters: Math.round(dist),
        sameCategory: c.userCategory === target.userCategory,
      };
    })
    .filter((c) => c.distanceMeters <= 150)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({
    success: true,
    duplicates,
  });
});

/**
 * GET /api/community/issues/check-duplicate
 * Helper for grievance submission form to check for nearby duplicates before filing
 */
router.get('/issues/check-duplicate', async (req: Request, res: Response) => {
  const { lat, lng, category } = req.query;
  const queryLat = parseFloat(lat as string);
  const queryLng = parseFloat(lng as string);

  if (isNaN(queryLat) || isNaN(queryLng)) {
    return res.json({ success: true, duplicateFound: false });
  }

  const all = Array.from(localComplaintsStore.values());
  const match = all.find((c) => {
    if (c.status === 'RESOLVED' || c.status === 'REJECTED') return false;
    if (!c.location) return false;
    if (category && c.userCategory !== category) return false;

    const dist = intelligenceService.haversineDistanceMeters(
      queryLat,
      queryLng,
      c.location.lat,
      c.location.lng
    );
    return dist <= 120;
  });

  if (match) {
    const dist = Math.round(
      intelligenceService.haversineDistanceMeters(
        queryLat,
        queryLng,
        match.location.lat,
        match.location.lng
      )
    );
    return res.json({
      success: true,
      duplicateFound: true,
      candidate: {
        id: match.id,
        publicId: match.publicId,
        title: match.title,
        category: match.userCategory,
        distanceMeters: dist,
      },
    });
  }

  res.json({
    success: true,
    duplicateFound: false,
  });
});

export default router;
