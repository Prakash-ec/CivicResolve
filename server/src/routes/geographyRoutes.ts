import { Router, Request, Response } from 'express';
import { geographyService } from '../services/geographyService.js';

const router = Router();

/**
 * GET /api/geography/hierarchy
 * Returns the entire state -> district -> municipality -> zone -> ward -> locality taxonomy
 */
router.get('/geography/hierarchy', (_req: Request, res: Response) => {
  const hierarchy = geographyService.getHierarchy();
  res.json({
    success: true,
    hierarchy,
  });
});

/**
 * GET /api/geography/regions
 * Returns flat list or filtered list of regions (by parentRegionId or regionType)
 */
router.get('/geography/regions', (req: Request, res: Response) => {
  const { parentRegionId, regionType } = req.query;
  const regions = geographyService.queryRegions({
    parentRegionId: parentRegionId ? String(parentRegionId) : undefined,
    regionType: regionType ? String(regionType) : undefined,
  });

  res.json({
    success: true,
    total: regions.length,
    regions,
  });
});

/**
 * POST /api/geography/resolve-point
 * Resolves GPS coordinates (lat, lng) to authoritative zone, ward, and municipality
 */
router.post('/geography/resolve-point', (req: Request, res: Response) => {
  const { lat, lng, addressHint } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COORDINATES',
        message: 'Numeric lat and lng are required to resolve administrative boundaries.',
      },
    });
  }

  const resolved = geographyService.resolveCoordinates(lat, lng, addressHint);

  res.json({
    success: true,
    resolved,
  });
});

export default router;
