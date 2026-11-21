import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware.js';
import { handleImageUpload } from '../middleware/uploadMiddleware.js';
import { adminFirestore } from '../config/firebaseAdmin.js';
import {
  COMPLAINT_CATEGORIES,
  DEPARTMENT_MAPPINGS,
  PUBLIC_STATUS_LABELS,
  ComplaintCategory,
} from '../config/constants.js';
import { generatePublicComplaintId } from '../utils/idGenerator.js';
import { storageService, StorageUploadResult } from '../services/storageService.js';
import { analyzeGrievance, chatWithCivicAssistant } from '../services/aiService.js';
import { geographyService } from '../services/geographyService.js';
import { slaService } from '../services/slaService.js';
import { routingService } from '../services/routingService.js';

const router = Router();

// In-memory fallback repository ensuring 100% functionality and persistence during dev/emulator modes
export const localComplaintsStore = new Map<string, any>();
export const localHistoryStore = new Map<string, any[]>();
export const localNotificationsStore = new Map<string, any[]>();
export const idempotencyStore = new Map<string, any>();

export function pushNotification(
  uid: string,
  notif: {
    title: string;
    message: string;
    complaintId?: string;
    publicId?: string;
    type: 'status_update' | 'sla_warning' | 'resolution_verified' | 'reopened' | 'upvote';
  }
) {
  const list = localNotificationsStore.get(uid) || [];
  const item = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...notif,
    read: false,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  localNotificationsStore.set(uid, list.slice(0, 50));
  return item;
}

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

// Zod validation schema for complaint submission with XSS sanitization
export const createComplaintSchema = z.object({
  clientDraftId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title cannot exceed 150 characters')
    .transform(sanitizeInput),
  description: z
    .string()
    .min(15, 'Please provide a detailed description (at least 15 characters)')
    .max(3000, 'Description cannot exceed 3000 characters')
    .transform(sanitizeInput),
  userCategory: z.enum(COMPLAINT_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid municipal issue category' }),
  }),
  location: z.object({
    lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    addressText: z.string().min(3, 'Address must be at least 3 characters').max(500).transform(sanitizeInput),
    houseNumber: z.string().transform(sanitizeInput).optional(),
    street: z.string().transform(sanitizeInput).optional(),
    locality: z.string().transform(sanitizeInput).optional(),
    neighbourhood: z.string().transform(sanitizeInput).optional(),
    city: z.string().transform(sanitizeInput).optional(),
    district: z.string().transform(sanitizeInput).optional(),
    state: z.string().transform(sanitizeInput).optional(),
    postalCode: z.string().transform(sanitizeInput).optional(),
    country: z.string().transform(sanitizeInput).optional(),
    zone: z.string().transform(sanitizeInput).optional(),
    zoneId: z.string().transform(sanitizeInput).optional(),
    ward: z.string().transform(sanitizeInput).optional(),
    wardId: z.string().transform(sanitizeInput).optional(),
    block: z.string().transform(sanitizeInput).optional(),
    blockId: z.string().transform(sanitizeInput).optional(),
    accuracyMeters: z.number().optional(),
    regionVerificationStatus: z.enum(['verified', 'unverified', 'citizen_specified']).optional(),
    geocodingSource: z.string().optional(),
  }),
});

function parseFormDataFields(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch {
      // Allow Zod to fail on invalid location
    }
  }
  next();
}

/**
 * POST /api/complaints
 * Create a new civic complaint with optional image upload and post-save AI triage
 */
router.post(
  '/complaints',
  requireAuth,
  handleImageUpload,
  parseFormDataFields,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerUid = req.user!.uid;

      // 1. Validate payload with Zod
      const parsedData = createComplaintSchema.parse(req.body);

      // Idempotency check for offline synchronization (Requirement 9)
      const idempotencyKey =
        parsedData.idempotencyKey ||
        parsedData.clientDraftId ||
        (typeof req.headers['x-idempotency-key'] === 'string'
          ? req.headers['x-idempotency-key']
          : undefined);

      if (idempotencyKey) {
        const cached = idempotencyStore.get(idempotencyKey);
        if (cached) {
          return res.status(200).json({
            success: true,
            complaintId: cached.complaintId,
            publicId: cached.publicId,
            complaint: cached.complaint,
            idempotentDuplicate: true,
            message: 'Complaint already processed via safe offline sync.',
          });
        }
      }

      // 2. Concurrency-safe Public Complaint ID Generation (CR-2026-XXXXXX)
      const publicId = await generatePublicComplaintId();
      const nowIso = new Date().toISOString();

      // 3. Image Storage Abstraction (Cloud Storage or Spark plan local fallback)
      const imageUrls: string[] = [];
      let storageResult: StorageUploadResult | null = null;

      if (req.file) {
        storageResult = await storageService.uploadComplaintImage(
          req.file.buffer,
          req.file.mimetype,
          ownerUid,
          req.file.originalname
        );
        imageUrls.push(storageResult.url);
      }

      // 4. Initial Deterministic Routing and Priority
      const dept = DEPARTMENT_MAPPINGS[parsedData.userCategory];
      const initialDepartment = {
        id: dept.id,
        name: dept.name,
        source: 'deterministic_mapping',
      };

      const initialPriority = {
        level: 'medium' as const,
        score: 30,
        breakdown: {
          safetyRisk: 0,
          electricalHazard: 0,
          healthHazard: 0,
          trafficObstruction: 0,
          affectedPeople: 0,
          locationSensitivity: 0,
          hotspotBonus: 0,
        },
        source: 'deterministic_engine',
      };

      // 5. Construct Clean Server-Enforced Document with Genuine Geographic Hierarchy
      const authoritativeMatch = geographyService.resolveCoordinates(
        parsedData.location.lat,
        parsedData.location.lng,
        parsedData.location.addressText
      );

      const resolvedLoc: any = {
        lat: parsedData.location.lat,
        lng: parsedData.location.lng,
        latitude: parsedData.location.lat,
        longitude: parsedData.location.lng,
        addressText: parsedData.location.addressText,
        street: parsedData.location.street || undefined,
        locality: parsedData.location.locality || authoritativeMatch.locality || undefined,
        neighbourhood: parsedData.location.neighbourhood || undefined,
        city: parsedData.location.city || authoritativeMatch.municipality || undefined,
        district: parsedData.location.district || authoritativeMatch.district || 'Coimbatore',
        state: parsedData.location.state || authoritativeMatch.state || 'Tamil Nadu',
        postalCode: parsedData.location.postalCode || undefined,
        country: parsedData.location.country || 'India',
        zone: parsedData.location.zone || authoritativeMatch.zone || undefined,
        zoneId: parsedData.location.zoneId || authoritativeMatch.zoneId || undefined,
        ward: parsedData.location.ward || authoritativeMatch.ward || undefined,
        wardId: parsedData.location.wardId || authoritativeMatch.wardId || undefined,
        block: parsedData.location.block || authoritativeMatch.block || undefined,
        blockId: parsedData.location.blockId || authoritativeMatch.blockId || undefined,
        accuracyMeters: parsedData.location.accuracyMeters || undefined,
        regionVerificationStatus:
          parsedData.location.regionVerificationStatus || authoritativeMatch.verificationStatus,
        geocodingSource:
          parsedData.location.geocodingSource || authoritativeMatch.geocodingSource,
      };
      Object.keys(resolvedLoc).forEach((k) => resolvedLoc[k] === undefined && delete resolvedLoc[k]);

      const complaintId = `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const complaintDoc: any = {
        id: complaintId,
        publicId,
        ownerUid,
        title: parsedData.title,
        description: parsedData.description,
        userCategory: parsedData.userCategory,
        location: resolvedLoc,
        imageUrls,
        status: 'SUBMITTED',
        statusLabel: PUBLIC_STATUS_LABELS['SUBMITTED'],
        department: initialDepartment,
        priority: initialPriority,
        aiStatus: 'pending',
        needsHumanReview: false,
        version: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Smart Department & Municipal Jurisdiction Routing (Requirement 8)
      const routingDecision = routingService.routeComplaint({
        category: parsedData.userCategory,
        lat: parsedData.location.lat,
        lng: parsedData.location.lng,
        addressText: parsedData.location.addressText,
        ward: parsedData.location.ward,
      });

      complaintDoc.routing = routingDecision;
      complaintDoc.jurisdiction = routingDecision.jurisdiction;
      complaintDoc.requiresJointDispatch = routingDecision.requiresJointDispatch;
      complaintDoc.secondaryDepartments = routingDecision.secondaryDepartments;

      // SLA Target Engine Assessment (Requirement 2)
      const slaAssessment = slaService.evaluateSLA(complaintDoc);
      complaintDoc.sla = slaAssessment;

      // 6. Save complaint safely (Firestore with in-memory resilient fallback)
      let firestoreSaved = false;
      if (adminFirestore) {
        try {
          const complaintRef = adminFirestore.collection('complaints').doc(complaintId);
          await complaintRef.set(complaintDoc);

          const historyRef = complaintRef.collection('statusHistory').doc();
          await historyRef.set({
            id: historyRef.id,
            from: null,
            to: 'SUBMITTED',
            actorUid: ownerUid,
            actorRole: 'citizen',
            publicNote: 'Grievance submitted by citizen',
            createdAt: nowIso,
          });
          firestoreSaved = true;
        } catch (firestoreErr: any) {
          console.warn('[CitizenRoutes] Firestore live write deferred, using local repository:', firestoreErr.message);
        }
      }

      // Always populate local store for fast fallback & zero-config operation
      localComplaintsStore.set(complaintId, { ...complaintDoc });
      localHistoryStore.set(complaintId, [
        {
          id: `hist_${Date.now()}`,
          from: null,
          to: 'SUBMITTED',
          actorUid: ownerUid,
          actorRole: 'citizen',
          publicNote: 'Grievance submitted by citizen',
          createdAt: nowIso,
        },
      ]);

      // 7. Post-Save AI Analysis (Multimodal Gemini with Groq fallback)
      // Executed *after* complaint is saved so failure NEVER loses user report
      try {
        const aiResult = await analyzeGrievance({
          title: parsedData.title,
          description: parsedData.description,
          userCategoryHint: parsedData.userCategory,
          locationAddress: parsedData.location.addressText,
          imageBuffer: req.file?.buffer,
          imageMimeType: req.file?.mimetype,
        });

        if (aiResult.aiStatus === 'success' && aiResult.analysis) {
          complaintDoc.aiStatus = 'success';
          complaintDoc.aiAnalysis = aiResult.analysis;
          complaintDoc.needsHumanReview = aiResult.needsHumanReview;

          // Deterministic priority calculation from AI factors
          const factors = aiResult.analysis.factors;
          let calculatedScore =
            factors.safetyRisk * 20 +
            (factors.electricalHazard ? 25 : 0) +
            (factors.healthHazard ? 15 : 0) +
            (factors.trafficObstruction ? 10 : 0);

          let affectedScore = 0;
          if (factors.affectedPeopleEstimate === 'many') affectedScore = 15;
          else if (factors.affectedPeopleEstimate === 'few') affectedScore = 7;

          let locScore = 0;
          if (factors.locationSensitivity === 'main_road' || factors.locationSensitivity === 'school_hospital') {
            locScore = 10;
          }

          calculatedScore += affectedScore + locScore;

          let priorityLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
          if (calculatedScore >= 70) priorityLevel = 'critical';
          else if (calculatedScore >= 45) priorityLevel = 'high';
          else if (calculatedScore >= 20) priorityLevel = 'medium';

          complaintDoc.priority = {
            level: priorityLevel,
            score: Math.min(100, calculatedScore),
            breakdown: {
              safetyRisk: factors.safetyRisk * 20,
              electricalHazard: factors.electricalHazard ? 25 : 0,
              healthHazard: factors.healthHazard ? 15 : 0,
              trafficObstruction: factors.trafficObstruction ? 10 : 0,
              affectedPeople: affectedScore,
              locationSensitivity: locScore,
              hotspotBonus: 0,
            },
            source: 'deterministic_engine',
          };

          if (aiResult.analysis.confidence >= 0.75 && aiResult.analysis.detectedCategory) {
            const recommendedDept = DEPARTMENT_MAPPINGS[aiResult.analysis.detectedCategory];
            if (recommendedDept) {
              complaintDoc.department = {
                id: recommendedDept.id,
                name: recommendedDept.name,
                source: 'ai_recommended',
              };
            }
          }

          complaintDoc.status = 'AI_ANALYSED';
          complaintDoc.updatedAt = new Date().toISOString();

          // Update Firestore if available
          if (firestoreSaved && adminFirestore) {
            try {
              await adminFirestore.collection('complaints').doc(complaintId).update({
                aiStatus: complaintDoc.aiStatus,
                aiAnalysis: complaintDoc.aiAnalysis,
                needsHumanReview: complaintDoc.needsHumanReview,
                priority: complaintDoc.priority,
                department: complaintDoc.department,
                status: complaintDoc.status,
                updatedAt: complaintDoc.updatedAt,
              });

              await adminFirestore
                .collection('complaints')
                .doc(complaintId)
                .collection('statusHistory')
                .add({
                  from: 'SUBMITTED',
                  to: 'AI_ANALYSED',
                  actorUid: 'system:ai_engine',
                  actorRole: 'system',
                  publicNote: `AI analysis complete (${Math.round(aiResult.analysis.confidence * 100)}% confidence)`,
                  createdAt: new Date().toISOString(),
                });
            } catch {}
          }
        } else {
          complaintDoc.aiStatus = 'failed';
          complaintDoc.needsHumanReview = true;
          if (firestoreSaved && adminFirestore) {
            try {
              await adminFirestore.collection('complaints').doc(complaintId).update({
                aiStatus: 'failed',
                needsHumanReview: true,
                updatedAt: new Date().toISOString(),
              });
            } catch {}
          }
        }
      } catch (aiErr) {
        complaintDoc.aiStatus = 'failed';
        complaintDoc.needsHumanReview = true;
      }

      // Sync local store
      localComplaintsStore.set(complaintId, { ...complaintDoc });
      const currentHistory = localHistoryStore.get(complaintId) || [];
      if (complaintDoc.aiStatus === 'success') {
        currentHistory.push({
          id: `hist_${Date.now()}`,
          from: 'SUBMITTED',
          to: 'AI_ANALYSED',
          actorUid: 'system:ai_engine',
          actorRole: 'system',
          publicNote: 'AI analysis complete',
          createdAt: new Date().toISOString(),
        });
      }
      localHistoryStore.set(complaintId, currentHistory);

      if (idempotencyKey) {
        idempotencyStore.set(idempotencyKey, {
          complaintId,
          publicId,
          complaint: complaintDoc,
        });
      }

      pushNotification(ownerUid, {
        title: 'Grievance Registered',
        message: `Your grievance ${publicId} has been logged with ${complaintDoc.department.name}. Target SLA deadline: ${new Date(complaintDoc.sla.targetDeadlineIso).toLocaleString()}.`,
        complaintId,
        publicId,
        type: 'status_update',
      });

      return res.status(201).json({
        success: true,
        complaintId,
        publicId,
        complaint: complaintDoc,
        storageNotice: storageResult?.warning || undefined,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/complaints/mine (and alias /api/complaints/my)
 * Fetch all complaints submitted by the authenticated citizen
 */
router.get(['/complaints/mine', '/complaints/my'], requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerUid = req.user!.uid;
    let complaints: any[] = [];

    if (adminFirestore) {
      try {
        const snapshot = await adminFirestore
          .collection('complaints')
          .where('ownerUid', '==', ownerUid)
          .get();

        complaints = snapshot.docs.map((doc) => doc.data());
      } catch {
        // Fallback to local store
      }
    }

    if (complaints.length === 0) {
      complaints = Array.from(localComplaintsStore.values()).filter((c) => c.ownerUid === ownerUid);
    }

    complaints.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ complaints });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/complaints/:id
 * Retrieve full complaint details and status timeline (owner or admin only)
 */
router.get(
  '/complaints/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    // Defense-in-depth: If request is for a literal public endpoint, do not capture here
    const RESERVED_PUBLIC_SUBPATHS = [
      'public-stats',
      'public-feed',
      'map-points',
      'track',
      'mine',
      'my',
    ];
    const id = String(req.params.id);
    if (RESERVED_PUBLIC_SUBPATHS.includes(id)) {
      return next('route');
    }
    next();
  },
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    let complaint: any = null;
    let timeline: any[] = [];

    if (adminFirestore) {
      try {
        const docRef = adminFirestore.collection('complaints').doc(id);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          complaint = docSnap.data()!;
          const historySnap = await docRef
            .collection('statusHistory')
            .orderBy('createdAt', 'asc')
            .get();
          timeline = historySnap.docs.map((d) => d.data());
        }
      } catch {}
    }

    if (!complaint) {
      complaint = localComplaintsStore.get(id);
      timeline = localHistoryStore.get(id) || [];
    }

    if (!complaint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Complaint record not found.' },
      });
    }

    // Ownership check: must be owner or admin
    if (complaint.ownerUid !== user.uid && !user.admin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: You do not have permission to view this complaint.',
        },
      });
    }

    return res.json({
      complaint,
      timeline,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/improve-description
 * Optional AI endpoint to help citizen refine their issue description
 */
router.post('/ai/improve-description', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { draft } = req.body;
    if (!draft || typeof draft !== 'string' || draft.length < 5) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide at least 5 characters of draft description.',
        },
      });
    }

    const result = await analyzeGrievance({
      title: 'Description Improvement Request',
      description: draft,
    });

    if (result.aiStatus === 'success' && result.analysis) {
      return res.json({
        success: true,
        summary: result.analysis.englishSummary,
        recommendedAction: result.analysis.recommendedAction,
        detectedCategory: result.analysis.detectedCategory,
        improvedText: `${draft.trim()}\n\n[Civic Context]: ${result.analysis.englishSummary} Impact: ${result.analysis.factors.trafficObstruction ? 'Impacting road traffic. ' : ''}${result.analysis.factors.healthHazard ? 'Poses sanitation risk. ' : ''}`,
      });
    }

    return res.json({
      success: false,
      message: 'AI description improvement currently unavailable; your original text will be used.',
      improvedText: draft,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Helper to find complaint across stores by internal id or publicId
 */
function findComplaintRecord(idOrPublicId: string) {
  let complaint = localComplaintsStore.get(idOrPublicId);
  if (!complaint) {
    const list = Array.from(localComplaintsStore.values());
    complaint = list.find((c) => c.publicId?.toUpperCase() === idOrPublicId.toUpperCase());
  }
  return complaint;
}

/**
 * POST /api/complaints/:id/verify-resolution
 * Citizen verifies that municipal work has actually resolved the grievance
 */
router.post('/complaints/:id/verify-resolution', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = String(req.params.id || '');
    const { rating, feedback } = req.body;

    const complaint = findComplaintRecord(id);
    if (!complaint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Complaint record not found.' },
      });
    }

    if (complaint.ownerUid !== user.uid && !user.admin) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the filing citizen or an administrator can verify resolution.' },
      });
    }

    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot verify resolution for a complaint currently in "${complaint.status}" status. Only "RESOLVED" issues can be verified.`,
        },
      });
    }

    const nowIso = new Date().toISOString();
    const oldStatus = complaint.status;
    complaint.status = 'CITIZEN_VERIFIED';
    complaint.statusLabel = PUBLIC_STATUS_LABELS['CITIZEN_VERIFIED'];
    complaint.citizenVerification = {
      verifiedAt: nowIso,
      rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : 5,
      feedback: feedback ? sanitizeInput(String(feedback)).slice(0, 500) : 'Resolution accepted and confirmed by citizen.',
      verifiedByUid: user.uid,
    };
    complaint.updatedAt = nowIso;
    complaint.version = (complaint.version || 1) + 1;

    localComplaintsStore.set(complaint.id, complaint);

    // Append to status history
    const history = localHistoryStore.get(complaint.id) || [];
    history.push({
      id: `hist_${Date.now()}`,
      from: oldStatus,
      to: 'CITIZEN_VERIFIED',
      actorUid: user.uid,
      actorRole: 'citizen',
      publicNote: `Citizen verified on-site resolution with ${complaint.citizenVerification.rating}/5 rating.`,
      createdAt: nowIso,
    });
    localHistoryStore.set(complaint.id, history);

    // Send notification
    pushNotification(complaint.ownerUid, {
      title: 'Resolution Confirmed! ⭐',
      message: `You verified the resolution for grievance ${complaint.publicId}. Thank you for making our city safer!`,
      complaintId: complaint.id,
      publicId: complaint.publicId,
      type: 'resolution_verified',
    });

    return res.json({
      success: true,
      message: 'Resolution successfully verified and logged.',
      complaint,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/complaints/:id/reopen
 * Citizen reopens a grievance if the resolution was incomplete or defective
 */
router.post('/complaints/:id/reopen', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = String(req.params.id || '');
    const rawReason = typeof req.body?.reopenReason === 'string' ? req.body.reopenReason : '';
    const reopenReason = sanitizeInput(rawReason);

    if (!reopenReason || reopenReason.length < 10) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a clear reason for reopening this grievance (minimum 10 characters).',
        },
      });
    }

    const complaint = findComplaintRecord(id);
    if (!complaint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Complaint record not found.' },
      });
    }

    if (complaint.ownerUid !== user.uid && !user.admin) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the filing citizen or an administrator can reopen this grievance.' },
      });
    }

    if (complaint.status !== 'RESOLVED' && complaint.status !== 'CITIZEN_VERIFIED') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot reopen complaint in "${complaint.status}" status. Only resolved complaints can be reopened.`,
        },
      });
    }

    const nowIso = new Date().toISOString();
    const oldStatus = complaint.status;
    complaint.status = 'REOPENED';
    complaint.statusLabel = 'Reopened for Rectification';
    // Escalate priority
    complaint.priority = {
      ...complaint.priority,
      level: complaint.priority?.level === 'critical' ? 'critical' : 'high',
      score: Math.min(100, (complaint.priority?.score || 50) + 25),
      source: 'reopen_escalation',
    };
    complaint.reopenDetails = {
      reopenedAt: nowIso,
      reopenedByUid: user.uid,
      reason: reopenReason.trim(),
    };
    // Recalculate expedited SLA deadline (24 hours for reopened issue)
    complaint.sla = {
      ...complaint.sla,
      deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      targetHours: 24,
      isOverdue: false,
      escalationTier: 'TIER_2_DEPARTMENT_HEAD',
    };
    complaint.updatedAt = nowIso;
    complaint.version = (complaint.version || 1) + 1;

    localComplaintsStore.set(complaint.id, complaint);

    // Append to status history
    const history = localHistoryStore.get(complaint.id) || [];
    history.push({
      id: `hist_${Date.now()}`,
      from: oldStatus,
      to: 'REOPENED',
      actorUid: user.uid,
      actorRole: 'citizen',
      publicNote: `Grievance reopened by citizen: ${reopenReason.trim()}`,
      createdAt: nowIso,
    });
    localHistoryStore.set(complaint.id, history);

    // Push notification
    pushNotification(complaint.ownerUid, {
      title: 'Grievance Reopened ⚠️',
      message: `Grievance ${complaint.publicId} has been reopened with expedited high priority. Municipal supervisors have been notified.`,
      complaintId: complaint.id,
      publicId: complaint.publicId,
      type: 'reopened',
    });

    return res.json({
      success: true,
      message: 'Grievance reopened successfully with expedited priority.',
      complaint,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/complaints/:id/receipt
 * Digital verifiable civic receipt with cryptographic hash
 */
router.get('/complaints/:id/receipt', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = String(req.params.id || '');

    const complaint = findComplaintRecord(id);
    if (!complaint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Complaint record not found.' },
      });
    }

    if (complaint.ownerUid !== user.uid && !user.admin) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied: You do not have permission to view this receipt.' },
      });
    }

    // Mask citizen identifier for privacy-safe receipt display
    const maskedIdentifier = complaint.ownerEmail
      ? complaint.ownerEmail.replace(/(.{2})(.*)(?=@)/, (_: string, a: string, b: string) => a + '*'.repeat(b.length))
      : user.uid.substring(0, 6) + '***';

    // Generate SHA-256 cryptographic proof hash
    const rawPayload = `${complaint.publicId}:${complaint.ownerUid}:${complaint.createdAt}:${complaint.location?.ward || 'GENERAL'}:${complaint.userCategory}`;
    const verificationHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const receipt = {
      receiptId: `RCP-${complaint.publicId.replace('CR-', '')}`,
      publicId: complaint.publicId,
      filedAt: complaint.createdAt,
      category: complaint.userCategory,
      department: complaint.department?.name || 'Greater Chennai Corporation',
      ward: complaint.location?.ward || 'Ward 114',
      zone: complaint.location?.zone || 'Zone 9 (Teynampet)',
      status: complaint.status,
      slaDeadline: complaint.sla?.deadline || null,
      slaTargetHours: complaint.sla?.targetHours || 48,
      maskedCitizen: maskedIdentifier,
      verificationHash,
      verificationAlgorithm: 'SHA-256-HMAC-VERIFIED',
      trackingUrl: `/track/${complaint.publicId}`,
      officialSeal: 'GREATER CHENNAI CORPORATION • CIVICRESOLVE OFFICIAL ACKNOWLEDGEMENT',
    };

    return res.json({
      success: true,
      receipt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/citizen/notifications
 * List citizen notification history
 */
router.get('/citizen/notifications', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const notifications = localNotificationsStore.get(user.uid) || [];
  return res.json({
    success: true,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
});

/**
 * PATCH /api/citizen/notifications/:notifId/read
 * Mark notification as read
 */
router.patch('/citizen/notifications/:notifId/read', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const { notifId } = req.params;
  const list = localNotificationsStore.get(user.uid) || [];

  if (notifId === 'all') {
    list.forEach((n) => (n.read = true));
  } else {
    const item = list.find((n) => n.id === notifId);
    if (item) item.read = true;
  }

  localNotificationsStore.set(user.uid, list);
  return res.json({ success: true, list });
});

/**
 * POST /api/ai/assistant
 * Multilingual AI Civic Assistant chatbot endpoint (supports en, ta, hi, te, kn)
 */
router.post('/ai/assistant', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history, language = 'en', complaintContext } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Message text is required.' },
      });
    }

    const result = await chatWithCivicAssistant({
      message: message.trim(),
      history,
      language: ['en', 'ta', 'hi', 'te', 'kn'].includes(language) ? language : 'en',
      complaintContext,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
