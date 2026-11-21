import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Public auth status probe
router.get('/auth/status', (_req: Request, res: Response) => {
  return res.json({
    authProvider: 'Firebase Authentication',
    claimsVerification: 'Server-side Firebase Admin verifyIdToken',
    adminRoleRequirement: 'token.admin == true',
    phoneVerificationSupported: true,
    timestamp: new Date().toISOString(),
  });
});

// Authenticated user identity inspection
router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    user: {
      uid: req.user!.uid,
      email: req.user!.email,
      isAdmin: req.user!.admin,
      role: req.user!.admin ? 'admin' : 'citizen',
      phoneNumber: req.user!.phone_number || null,
      phoneVerified: req.user!.phone_verified,
    },
    authenticatedAt: new Date().toISOString(),
  });
});

// Administrative verification endpoint (Requires token.admin == true)
router.get('/admin/verify', requireAuth, requireAdmin, (req: Request, res: Response) => {
  return res.json({
    authorized: true,
    adminUid: req.user!.uid,
    adminEmail: req.user!.email,
    scope: 'MUNICIPAL_ADMINISTRATOR',
    verifiedAt: new Date().toISOString(),
  });
});

export default router;
