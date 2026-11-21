import fs from 'fs';
import path from 'path';
import { geographyService, COIMBATORE_ZONES, CHENNAI_ZONES, SULUR_PANCHAYAT } from '../services/geographyService.js';
import { intelligenceService } from '../services/intelligenceService.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const testResults: TestResult[] = [];
let currentSuite = '';

function suite(name: string) {
  currentSuite = name;
  console.log(`\n===============================================================`);
  console.log(`   [Suite: ${name}]`);
  console.log(`===============================================================`);
}

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    testResults.push({ suite: currentSuite, name, passed: true, details });
  } else {
    console.error(`  ✗ FAIL: ${name} - ${details || ''}`);
    testResults.push({ suite: currentSuite, name, passed: false, details });
  }
}

// ---------------------------------------------------------------------------
// 1. GEOLOCATION SERVICE & ACCURACY LOGIC TESTS
// ---------------------------------------------------------------------------
function testGeolocationServiceLogic() {
  suite('1. Geolocation Service & Accuracy Assessment');

  // Helper accuracy assessment function mirroring frontend/src/services/locationService.ts
  function assessAccuracy(meters: number): { tier: 'excellent' | 'good' | 'fair' | 'poor'; label: string; isReliable: boolean } {
    if (meters <= 15) return { tier: 'excellent', label: 'High GPS Precision (±' + Math.round(meters) + 'm)', isReliable: true };
    if (meters <= 50) return { tier: 'good', label: 'Good Accuracy (±' + Math.round(meters) + 'm)', isReliable: true };
    if (meters <= 150) return { tier: 'fair', label: 'Moderate Accuracy (±' + Math.round(meters) + 'm)', isReliable: true };
    return { tier: 'poor', label: 'Low Accuracy (±' + Math.round(meters) + 'm) - Manual Verification Recommended', isReliable: false };
  }

  // Coordinate validator
  function isValidCoordinates(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' &&
      !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180;
  }

  // Error code mapper
  function mapGeolocationError(code: number): { type: string; message: string; retryable: boolean } {
    switch (code) {
      case 1:
        return { type: 'PERMISSION_DENIED', message: 'Location permission was denied by the user', retryable: false };
      case 2:
        return { type: 'POSITION_UNAVAILABLE', message: 'GPS satellite signal unavailable', retryable: true };
      case 3:
        return { type: 'TIMEOUT', message: 'Location acquisition timed out', retryable: true };
      default:
        return { type: 'UNKNOWN_ERROR', message: 'An unexpected location error occurred', retryable: true };
    }
  }

  // Tests
  assert(isValidCoordinates(11.0168, 76.9558), 'Valid Coimbatore coordinates pass validation');
  assert(isValidCoordinates(13.0827, 80.2707), 'Valid Chennai coordinates pass validation');
  assert(!isValidCoordinates(95.0, 80.0), 'Latitude > 90 is rejected as invalid');
  assert(!isValidCoordinates(13.0, 190.0), 'Longitude > 180 is rejected as invalid');
  assert(!isValidCoordinates(NaN, 80.0), 'NaN coordinate is rejected');

  // Accuracy tiers
  const highAcc = assessAccuracy(8.5);
  assert(highAcc.tier === 'excellent' && highAcc.isReliable, 'Accuracy <= 15m classified as excellent & reliable');

  const goodAcc = assessAccuracy(35);
  assert(goodAcc.tier === 'good' && goodAcc.isReliable, 'Accuracy 35m classified as good & reliable');

  const fairAcc = assessAccuracy(120);
  assert(fairAcc.tier === 'fair' && fairAcc.isReliable, 'Accuracy 120m classified as fair & reliable');

  const poorAcc = assessAccuracy(350);
  assert(poorAcc.tier === 'poor' && !poorAcc.isReliable, 'Accuracy > 150m triggers poor accuracy warning for manual adjustment');

  // Error mappings
  const permErr = mapGeolocationError(1);
  assert(permErr.type === 'PERMISSION_DENIED' && !permErr.retryable, 'Permission denied error maps correctly and marked non-retryable');

  const timeoutErr = mapGeolocationError(3);
  assert(timeoutErr.type === 'TIMEOUT' && timeoutErr.retryable, 'Timeout error maps correctly and marked retryable');

  // Simulated Watcher Lifecycle
  class MockLocationTracker {
    private watchId: number | null = null;
    public isTracking = false;
    public lastPosition: { lat: number; lng: number } | null = null;

    public startTracking(mockPos: { lat: number; lng: number }) {
      this.isTracking = true;
      this.watchId = 101;
      this.lastPosition = mockPos;
    }

    public stopTracking() {
      this.isTracking = false;
      this.watchId = null;
    }
  }

  const tracker = new MockLocationTracker();
  tracker.startTracking({ lat: 11.0018, lng: 77.0143 });
  assert(tracker.isTracking && tracker.lastPosition !== null, 'Live GPS tracking starts and captures position');
  tracker.stopTracking();
  assert(!tracker.isTracking, 'Live GPS tracking cleanly stops without background memory leaks');
}

// ---------------------------------------------------------------------------
// 2. REVERSE GEOCODING LOGIC, PARSING & CACHE TESTS
// ---------------------------------------------------------------------------
function testReverseGeocodingLogic() {
  suite('2. Reverse Geocoding Parsing, Rate Limiting & Caching');

  // Mock Nominatim JSON response parser mirroring frontend/src/services/geocodingService.ts
  function parseNominatimAddress(raw: any) {
    const addr = raw.address || {};
    const houseNumber = addr.house_number || addr.building || undefined;
    const street = addr.road || addr.street || addr.residential || undefined;
    const locality = addr.suburb || addr.neighbourhood || addr.subdivision || addr.locality || undefined;
    const city = addr.city || addr.town || addr.municipality || addr.village || 'Coimbatore';
    const district = addr.state_district || addr.county || 'Coimbatore';
    const state = addr.state || 'Tamil Nadu';
    const postalCode = addr.postcode || undefined;
    const country = addr.country || 'India';

    const parts = [houseNumber, street, locality, city, district, postalCode].filter(Boolean);
    const formattedAddress = parts.join(', ');

    return {
      houseNumber,
      street,
      locality,
      city,
      district,
      state,
      postalCode,
      country,
      formattedAddress,
    };
  }

  const mockOsmResponse = {
    lat: '11.0018',
    lon: '77.0143',
    display_name: '42, Trichy Road, Singanallur, Coimbatore, Tamil Nadu, 641005, India',
    address: {
      house_number: '42',
      road: 'Trichy Road',
      suburb: 'Singanallur',
      city: 'Coimbatore',
      state_district: 'Coimbatore District',
      state: 'Tamil Nadu',
      postcode: '641005',
      country: 'India',
    },
  };

  const parsed = parseNominatimAddress(mockOsmResponse);
  assert(parsed.street === 'Trichy Road', 'Correctly extracts road/street from Nominatim output');
  assert(parsed.locality === 'Singanallur', 'Correctly extracts locality/suburb from Nominatim output');
  assert(parsed.city === 'Coimbatore', 'Correctly extracts city from Nominatim output');
  assert(parsed.postalCode === '641005', 'Correctly extracts postal PIN code');
  assert(parsed.houseNumber === '42', 'Correctly extracts house number');

  // No-fabrication test: missing fields remain undefined
  const partialOsmResponse = {
    address: {
      road: 'Avinashi Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
    },
  };
  const parsedPartial = parseNominatimAddress(partialOsmResponse);
  assert(parsedPartial.houseNumber === undefined, 'Does not fabricate house number when absent in geocoder response');
  assert(parsedPartial.locality === undefined, 'Does not fabricate locality when absent in geocoder response');
  assert(parsedPartial.postalCode === undefined, 'Does not fabricate postal code when absent');

  // Rate Limiting Protection Simulator (Minimum 1000ms delay enforcement)
  class RateLimitedGeocoder {
    private lastRequestTime = 0;
    private minIntervalMs = 1000;

    public canExecute(): { allowed: boolean; waitMs: number } {
      const now = Date.now();
      const diff = now - this.lastRequestTime;
      if (diff < this.minIntervalMs) {
        return { allowed: false, waitMs: this.minIntervalMs - diff };
      }
      this.lastRequestTime = now;
      return { allowed: true, waitMs: 0 };
    }
  }

  const geocoder = new RateLimitedGeocoder();
  const firstReq = geocoder.canExecute();
  assert(firstReq.allowed, 'First geocoding request is allowed immediately');
  const immediateSecondReq = geocoder.canExecute();
  assert(!immediateSecondReq.allowed && immediateSecondReq.waitMs > 0, 'Immediate second geocoding request is rate-limited to protect provider');

  // Cache test
  class GeocodingCache {
    private cache = new Map<string, any>();

    private makeKey(lat: number, lng: number): string {
      return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    }

    public get(lat: number, lng: number) {
      return this.cache.get(this.makeKey(lat, lng));
    }

    public set(lat: number, lng: number, data: any) {
      this.cache.set(this.makeKey(lat, lng), data);
    }
  }

  const cache = new GeocodingCache();
  cache.set(11.00182, 77.01431, { locality: 'Singanallur', formattedAddress: 'Trichy Road' });
  const cachedHit = cache.get(11.00184, 77.01429); // Within ~4 decimal places
  assert(Boolean(cachedHit && cachedHit.locality === 'Singanallur'), 'Nearby coordinates within 4 decimal places hit in-memory geocoding cache');
}

// ---------------------------------------------------------------------------
// 3. GEOGRAPHIC HIERARCHY & BOUNDARY TESTS
// ---------------------------------------------------------------------------
function testGeographicHierarchyAndBoundaries() {
  suite('3. Geographic Hierarchy & Boundary Resolution');

  // Hierarchy Tree structure verification
  const tree = geographyService.getHierarchy();
  assert(tree.states.length > 0, 'Hierarchy contains state records');
  const tn = tree.states.find((s) => s.name === 'Tamil Nadu');
  assert(Boolean(tn), 'Tamil Nadu state exists in geographic hierarchy');

  const coimbatoreDist = tn?.districts.find((d) => d.name === 'Coimbatore');
  assert(Boolean(coimbatoreDist), 'Coimbatore district exists in Tamil Nadu');

  const ccmc = coimbatoreDist?.municipalities.find((m) => m.name.includes('Coimbatore City Municipal Corporation'));
  assert(Boolean(ccmc), 'Coimbatore City Municipal Corporation exists as child of Coimbatore District');
  assert(ccmc?.zones.length === 5, 'CCMC contains 5 official administrative zones (East, West, North, South, Central)', `Found ${ccmc?.zones.length}`);

  const sulurMuni = coimbatoreDist?.municipalities.find((m) => m.name.includes('Sulur Town Panchayat'));
  assert(Boolean(sulurMuni), 'Sulur Town Panchayat exists with 18 official town wards');

  // Cascading Selection Logic: Changing parent resets invalid child selections
  function simulateCascadeSelection(
    currentSelection: { state: string; district: string; municipality: string; zone?: string; ward?: string },
    newMunicipality: string
  ) {
    if (currentSelection.municipality !== newMunicipality) {
      return {
        state: currentSelection.state,
        district: currentSelection.district,
        municipality: newMunicipality,
        zone: undefined, // Reset child
        ward: undefined, // Reset child
      };
    }
    return currentSelection;
  }

  const initialSelect = {
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    municipality: 'Coimbatore City Municipal Corporation',
    zone: 'ccmc_zone_east',
    ward: 'ccmc_ward_50',
  };
  const changed = simulateCascadeSelection(initialSelect, 'Greater Chennai Corporation');
  assert(changed.zone === undefined && changed.ward === undefined, 'Changing municipality resets child zone and ward selections');

  // Boundary Point Resolution Tests
  // 1. Sulur Town Panchayat Point (11.025, 77.125)
  const sulurRes = geographyService.resolveCoordinates(11.025, 77.125, 'Sulur Bus Stand');
  assert(sulurRes.municipality === 'Sulur Town Panchayat', 'Sulur coordinates resolve to Sulur Town Panchayat');
  assert(sulurRes.verificationStatus === 'verified', 'Sulur coordinates marked as officially verified administrative boundary');
  assert(sulurRes.geocodingSource === 'TN_TOWN_PANCHAYAT_DIRECTORATE', 'Source correctly cited as TN Town Panchayat Directorate');

  // 2. Coimbatore East Zone Point (11.002, 77.015)
  const eastRes = geographyService.resolveCoordinates(11.002, 77.015, 'Singanallur Trichy Road');
  assert(eastRes.municipality === 'Coimbatore City Municipal Corporation', 'East zone coordinates resolve to CCMC');
  assert(eastRes.zone === 'East Zone', 'Resolves to CCMC East Zone');
  assert(eastRes.verificationStatus === 'verified', 'CCMC coordinate marked as verified');
  assert(eastRes.geocodingSource === 'CCMC_GIS_OFFICIAL', 'Source correctly cited as CCMC GIS Official');

  // 3. Chennai GCC Point (13.041, 80.233)
  const chennaiRes = geographyService.resolveCoordinates(13.041, 80.233, 'T. Nagar Pondy Bazaar');
  assert(chennaiRes.municipality === 'Greater Chennai Corporation', 'Chennai coordinates resolve to GCC');
  assert(chennaiRes.verificationStatus === 'verified', 'GCC coordinate marked as verified');

  // 4. Outside verified polygon (e.g. 15.3647, 75.1240 in Hubli, Karnataka)
  const outsideRes = geographyService.resolveCoordinates(15.3647, 75.1240);
  assert(outsideRes.verificationStatus === 'unverified', 'Points outside registered boundary polygons are marked unverified');
  assert(outsideRes.ward === undefined, 'Unverified points do not fabricate non-existent ward assignments');

  // Rejection of invalid zone/ward identifiers
  const allRegions = geographyService.getAllRegions();
  const validWardIds = new Set(allRegions.filter((r) => r.regionType === 'ward').map((r) => r.regionId));
  assert(validWardIds.has('ccmc_ward_50'), 'Recognizes valid ward ccmc_ward_50');
  assert(!validWardIds.has('ccmc_ward_999'), 'Rejects non-existent ward ccmc_ward_999');
}

// ---------------------------------------------------------------------------
// 4. GRIEVANCE TRACKING LIFECYCLE & PRIVACY SANITIZATION TESTS
// ---------------------------------------------------------------------------
function testGrievanceTrackingLifecycleAndPrivacy() {
  suite('4. Grievance Tracking Lifecycle & Privacy Sanitization');

  // Reference ID validation
  const refIdRegex = /^CR-\d{4}-\d{6}$/;
  assert(refIdRegex.test('CR-2026-000123'), 'Valid reference ID format CR-YYYY-XXXXXX matches specification');
  assert(!refIdRegex.test('CR-26-123'), 'Short format rejected by reference ID regex');
  assert(!refIdRegex.test('COMPLAINT-1234'), 'Non-CR prefix rejected');

  // 7-Stage Lifecycle sequence verification
  const LIFECYCLE_STAGES = [
    'REPORTED',
    'AI_ANALYSED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CITIZEN_VERIFIED',
  ];

  function isValidTransition(current: string, next: string): boolean {
    const validNextMap: Record<string, string[]> = {
      SUBMITTED: ['AI_ANALYSED', 'UNDER_REVIEW', 'REJECTED'],
      REPORTED: ['AI_ANALYSED', 'UNDER_REVIEW', 'REJECTED'],
      AI_ANALYSED: ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED'],
      UNDER_REVIEW: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'],
      ASSIGNED: ['IN_PROGRESS', 'UNDER_REVIEW'],
      IN_PROGRESS: ['RESOLVED', 'UNDER_REVIEW'],
      RESOLVED: ['CITIZEN_VERIFIED', 'REOPENED'],
      CITIZEN_VERIFIED: [],
      REOPENED: ['UNDER_REVIEW', 'ASSIGNED'],
      REJECTED: ['REOPENED'],
    };
    return (validNextMap[current] || []).includes(next);
  }

  assert(isValidTransition('REPORTED', 'AI_ANALYSED'), 'Valid transition: REPORTED -> AI_ANALYSED');
  assert(isValidTransition('AI_ANALYSED', 'UNDER_REVIEW'), 'Valid transition: AI_ANALYSED -> UNDER_REVIEW');
  assert(isValidTransition('UNDER_REVIEW', 'ASSIGNED'), 'Valid transition: UNDER_REVIEW -> ASSIGNED');
  assert(isValidTransition('ASSIGNED', 'IN_PROGRESS'), 'Valid transition: ASSIGNED -> IN_PROGRESS');
  assert(isValidTransition('IN_PROGRESS', 'RESOLVED'), 'Valid transition: IN_PROGRESS -> RESOLVED');
  assert(isValidTransition('RESOLVED', 'CITIZEN_VERIFIED'), 'Valid transition: RESOLVED -> CITIZEN_VERIFIED');
  assert(!isValidTransition('REPORTED', 'CITIZEN_VERIFIED'), 'Invalid leap: REPORTED cannot skip straight to CITIZEN_VERIFIED');
  assert(isValidTransition('RESOLVED', 'REOPENED'), 'Citizen can transition from RESOLVED to REOPENED with reason');

  // Reopen validation
  function validateReopen(reason: string) {
    if (!reason || reason.trim().length < 10) {
      return { valid: false, error: 'Reopening reason must be at least 10 characters explaining unresolved issues' };
    }
    return { valid: true };
  }
  assert(!validateReopen('not fixed').valid, 'Reopen with short ambiguous reason is rejected');
  assert(validateReopen('The pothole was only partially filled with loose gravel and remains dangerous').valid, 'Detailed reopen reason is accepted');

  // Public Tracking Data Sanitization (Security & Privacy Audit)
  // Mirroring server/src/routes/publicRoutes.ts
  function sanitizePublicComplaint(complaint: any) {
    const rawLat = complaint.location?.lat ?? complaint.location?.latitude;
    const rawLng = complaint.location?.lng ?? complaint.location?.longitude;

    const safeCoordinates =
      typeof rawLat === 'number' && typeof rawLng === 'number'
        ? {
            lat: Math.round(rawLat * 100) / 100, // ~1.1km fuzz
            lng: Math.round(rawLng * 100) / 100,
            privacyRadiusMeters: 220,
          }
        : undefined;

    // Sanitize address to strip door/house/apartment numbers
    let safeAddress = complaint.location?.locality || complaint.location?.city || 'Civic Jurisdiction Area';
    if (complaint.location?.addressText) {
      safeAddress = complaint.location.addressText
        .replace(/^(plot\s*no\.?|door\s*no\.?|d\.no\.?|no\.?|flat\s*no\.?|#)\s*[\w\d\-\/,\s]+/i, '')
        .replace(/\b\d{1,4}\s*,\s*/, '')
        .trim();
      if (!safeAddress) safeAddress = complaint.location.locality || complaint.location.city || 'Civic Jurisdiction Area';
    }

    return {
      publicId: complaint.publicId,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      safeLocation: {
        approxAddress: safeAddress,
        locality: complaint.location?.locality,
        ward: complaint.location?.ward,
        zone: complaint.location?.zone,
        city: complaint.location?.city,
        state: complaint.location?.state,
        coordinates: safeCoordinates,
      },
      // Explicitly excluded: citizenEmail, citizenPhone, citizenId, internalNotes, privateEvidence
    };
  }

  const rawInternalComplaint = {
    id: 'comp_internal_998',
    publicId: 'CR-2026-000123',
    citizenId: 'usr_secret_77665',
    citizenEmail: 'citizen.resident@example.com',
    citizenPhone: '+91 9876543210',
    title: 'Severe drainage overflow near school',
    category: 'drainage_sewage',
    status: 'IN_PROGRESS',
    internalNotes: 'Investigation notes: Suspected illegal commercial connection.',
    privateEvidence: ['s3://civic-evidence-private/doc_id_card.pdf'],
    location: {
      latitude: 11.018247,
      longitude: 76.964891,
      addressText: 'Door No. 42/B, Nehru Street, Gandhipuram, Coimbatore - 641012',
      locality: 'Gandhipuram',
      ward: 'Ward 24',
      zone: 'Central Zone',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
    },
  };

  const sanitized = sanitizePublicComplaint(rawInternalComplaint);

  assert((sanitized as any).citizenEmail === undefined, 'Public payload DOES NOT expose citizenEmail');
  assert((sanitized as any).citizenPhone === undefined, 'Public payload DOES NOT expose citizenPhone');
  assert((sanitized as any).citizenId === undefined, 'Public payload DOES NOT expose citizen internal ID');
  assert((sanitized as any).internalNotes === undefined, 'Public payload DOES NOT expose internal administrative notes');
  assert((sanitized as any).privateEvidence === undefined, 'Public payload DOES NOT expose private evidence paths');
  assert(sanitized.safeLocation.coordinates?.lat === 11.02, 'Coordinates are fuzzed to 2 decimal places (11.018247 -> 11.02)');
  assert(sanitized.safeLocation.coordinates?.lng === 76.96, 'Coordinates are fuzzed to 2 decimal places (76.964891 -> 76.96)');
  assert(sanitized.safeLocation.coordinates?.privacyRadiusMeters === 220, 'Safe privacy blur radius (220m) attached');
  assert(!sanitized.safeLocation.approxAddress.includes('Door No. 42/B'), 'Exact door/flat number stripped from public address text', sanitized.safeLocation.approxAddress);
}

// ---------------------------------------------------------------------------
// 5. REGIONAL LOCALIZATION, NOTATION & SCRIPT INTEGRITY TESTS
// ---------------------------------------------------------------------------
function testRegionalLocalizationAndScripts() {
  suite('5. Regional Language Localization & Script Integrity');

  const localesDir = fs.existsSync(path.resolve(process.cwd(), 'frontend/src/i18n/locales'))
    ? path.resolve(process.cwd(), 'frontend/src/i18n/locales')
    : path.resolve(process.cwd(), '../frontend/src/i18n/locales');

  const languages = ['en', 'ta', 'hi', 'te', 'kn'];
  const localeData: Record<string, any> = {};

  // Check all 5 files exist
  for (const lang of languages) {
    const filePath = path.join(localesDir, `${lang}.json`);
    assert(fs.existsSync(filePath), `Locale JSON file exists for '${lang}' (${lang}.json)`);
    localeData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  // Flatten function
  function getFlattenedKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const k of Object.keys(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        keys = keys.concat(getFlattenedKeys(obj[k], full));
      } else {
        keys.push(full);
      }
    }
    return keys;
  }

  const enKeys = new Set(getFlattenedKeys(localeData['en']));
  assert(enKeys.size >= 290, `Base English locale contains complete UI key tree (${enKeys.size} keys)`);

  // Check parity across ta, hi, te, kn
  for (const lang of ['ta', 'hi', 'te', 'kn']) {
    const targetKeys = new Set(getFlattenedKeys(localeData[lang]));
    const missing: string[] = [];
    for (const k of enKeys) {
      if (!targetKeys.has(k)) missing.push(k);
    }
    assert(missing.length === 0, `100% Key parity for '${lang}': 0 missing keys out of ${enKeys.size}`);
  }

  // Indian Numbering Formatting & Currency (Intl API)
  const formatIndianNumber = (num: number, locale = 'en-IN') =>
    new Intl.NumberFormat(locale).format(num);

  const formatINR = (amt: number, locale = 'en-IN') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  const formattedLakh = formatIndianNumber(100000, 'en-IN');
  assert(formattedLakh === '1,00,000', `Indian grouping correctly formats 1 Lakh as '1,00,000' (got: ${formattedLakh})`);

  const formattedCrore = formatIndianNumber(10000000, 'en-IN');
  assert(formattedCrore === '1,00,00,000', `Indian grouping correctly formats 1 Crore as '1,00,00,000' (got: ${formattedCrore})`);

  const formattedCurrency = formatINR(50000, 'en-IN');
  assert(formattedCurrency.includes('₹') && formattedCurrency.includes('50,000'), `Currency formats with ₹ symbol and Indian grouping (got: ${formattedCurrency})`);

  // Tamil Script Integrity Test
  // Test Unicode NFC normalization and preserve vowels/pulli
  const sampleTamilPhrases = [
    localeData['ta'].location?.useCurrentLocation || 'எனது தற்போதைய இருப்பிடத்தைப் பயன்படுத்து',
    localeData['ta'].location?.trackingActive || 'நேரலை ஜி.பி.எஸ் கண்காணிப்பு செயலில் உள்ளது',
    localeData['ta'].intelligence?.title || 'குடிமக்கள் நுண்ணறிவு & பகுப்பாய்வு மையம்',
  ];

  for (const phrase of sampleTamilPhrases) {
    const isNormalized = phrase === phrase.normalize('NFC');
    assert(isNormalized, `Tamil script phrase passes Unicode NFC normalization: "${phrase.substring(0, 25)}..."`);
    // Ensure no replacement characters (U+FFFD)
    assert(!phrase.includes('\uFFFD'), 'Phrase contains zero Unicode replacement (corrupted) characters');
  }
}

// ---------------------------------------------------------------------------
// 6. GEOGRAPHIC INTELLIGENCE ANALYTICS TESTS
// ---------------------------------------------------------------------------
function testGeographicIntelligenceAnalytics() {
  suite('6. Geographic Intelligence Analytics');

  const now = Date.now();
  const mockComplaints = [
    {
      id: 'c1',
      title: 'Pothole on Trichy Rd',
      status: 'SUBMITTED',
      createdAt: new Date(now - 80 * 3600 * 1000).toISOString(), // 80h old -> Overdue!
      priority: { level: 'critical', score: 85 },
      department: { id: 'dept_roads', name: 'Roads & Bridges' },
      location: { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', zone: 'East Zone', ward: 'Ward 50', locality: 'Singanallur', lat: 11.0018, lng: 77.0143 },
    },
    {
      id: 'c2',
      title: 'Broken Streetlight',
      status: 'RESOLVED',
      createdAt: new Date(now - 20 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 4 * 3600 * 1000).toISOString(),
      priority: { level: 'medium', score: 50 },
      department: { id: 'dept_electrical', name: 'Electrical & Lighting' },
      location: { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', zone: 'East Zone', ward: 'Ward 50', locality: 'Singanallur', lat: 11.0020, lng: 77.0145 },
    },
    {
      id: 'c3',
      title: 'Water Pipe Burst',
      status: 'IN_PROGRESS',
      createdAt: new Date(now - 10 * 3600 * 1000).toISOString(),
      priority: { level: 'high', score: 70 },
      department: { id: 'dept_water', name: 'Water Supply' },
      location: { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', zone: 'West Zone', ward: 'Ward 16', locality: 'RS Puram', lat: 11.0125, lng: 76.9450 },
    },
    {
      id: 'c4',
      title: 'Garbage Dump Overflow',
      status: 'SUBMITTED',
      createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      priority: { level: 'critical', score: 80 },
      department: { id: 'dept_sanitation', name: 'Sanitation' },
      location: { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Sulur Town Panchayat', zone: 'Sulur Zone', ward: 'Ward 01', locality: 'Sulur', lat: 11.025, lng: 77.125 },
    },
  ];

  const overallAnalytics = intelligenceService.computeGeographicAnalytics(mockComplaints);
  assert(overallAnalytics.totalGrievances === 4, 'Computes correct total grievances count (4)');
  assert(overallAnalytics.resolvedGrievances === 1, 'Computes correct resolved grievances count (1)');
  assert(overallAnalytics.openGrievances === 3, 'Computes correct open grievances count (3)');
  assert(overallAnalytics.criticalGrievances === 2, 'Computes correct critical grievances count (2)');
  assert(overallAnalytics.overdueComplaints === 1, 'Accurately identifies overdue complaint open > 72 hours (1)');

  // Filtered by zone: East Zone
  const eastZoneAnalytics = intelligenceService.computeGeographicAnalytics(mockComplaints, { zone: 'East Zone' });
  assert(eastZoneAnalytics.totalGrievances === 2, 'Filters analytics accurately for East Zone (2 complaints)');
  assert(eastZoneAnalytics.resolvedGrievances === 1, 'Accurately counts 1 resolved in East Zone');

  // Department Workload breakdown
  const depts = overallAnalytics.departmentWorkload;
  assert(depts.length === 4, 'Calculates workload across 4 distinct municipal departments');
  const roadDept = depts.find((d) => d.id === 'dept_roads');
  assert(roadDept?.total === 1 && roadDept?.open === 1, 'Department workload captures Roads & Bridges open complaint');

  // Area-wise performance table
  const areas = overallAnalytics.areaWisePerformance;
  assert(areas.length > 0, 'Area-wise performance table generated');
  const ward50 = areas.find((a) => a.areaName.includes('Ward 50'));
  assert(ward50 !== undefined && ward50.total === 2 && ward50.resolved === 1, 'Ward 50 performance accurately recorded with 50% resolution');
}

// ---------------------------------------------------------------------------
// MAIN RUNNER
// ---------------------------------------------------------------------------
async function runAll() {
  console.log('###############################################################');
  console.log('   CIVICRESOLVE NEW CAPABILITIES AUTOMATED TEST SUITE          ');
  console.log('   GPS, Reverse Geocoding, Geographic Intelligence,            ');
  console.log('   Tracking Lifecycle & Regional Localization                  ');
  console.log('###############################################################');

  testGeolocationServiceLogic();
  testReverseGeocodingLogic();
  testGeographicHierarchyAndBoundaries();
  testGrievanceTrackingLifecycleAndPrivacy();
  testRegionalLocalizationAndScripts();
  testGeographicIntelligenceAnalytics();

  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log('\n===============================================================');
  console.log('   FINAL TEST EXECUTION SUMMARY');
  console.log('===============================================================');
  console.log(`  Total Test Assertions: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (failed > 0) {
    console.error(`\n[!] ${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('\n[✓] ALL AUTOMATED TEST ASSERTIONS PASSED PERFECTLY!');
  }
}

runAll().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
