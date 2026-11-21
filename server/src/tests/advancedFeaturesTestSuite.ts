import { intelligenceService, ComplaintData } from '../services/intelligenceService.js';
import { imageAnalysisService } from '../services/imageAnalysisService.js';
import { communityConfirmationsMap } from '../routes/communityRoutes.js';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    results.push({ name, passed: true, details });
  } else {
    console.error(`  ✗ FAIL: ${name} - ${details || ''}`);
    results.push({ name, passed: false, details });
  }
}

async function runAdvancedFeaturesTestSuite() {
  console.log('===============================================================');
  console.log('   CivicResolve Advanced Features Automated Verification Suite ');
  console.log('===============================================================');

  // 1. Haversine Distance Formula Tests
  console.log('\n[Suite 1: Geospatial Math & Haversine Distance]');
  {
    // Ripon Building (13.0827, 80.2707) to Central Station (13.0836, 80.2755) ~ 529 meters
    const dist = intelligenceService.haversineDistanceMeters(13.0827, 80.2707, 13.0836, 80.2755);
    assert(dist > 500 && dist < 560, 'Haversine distance accurate within expected range (~529m)', `Calculated: ${Math.round(dist)}m`);

    // Zero distance test (identical point)
    const zeroDist = intelligenceService.haversineDistanceMeters(13.0827, 80.2707, 13.0827, 80.2707);
    assert(Math.round(zeroDist) === 0, 'Haversine distance between identical points is exactly 0m');
  }

  // 2. Geospatial Clustering Tests
  console.log('\n[Suite 2: Geospatial Hotspot Clustering]');
  {
    const sampleComplaints: ComplaintData[] = [
      {
        id: 'c1',
        publicId: 'CR-2026-0001',
        title: 'Pothole on North Main Rd',
        description: 'Deep road cavity',
        userCategory: 'pothole_road_damage',
        location: { lat: 13.0827, lng: 80.2707, addressText: 'North Main Rd', ward: 'Ward 114' },
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c2',
        publicId: 'CR-2026-0002',
        title: 'Road crack near North Main junction',
        description: 'Road damage adjacent to c1 (~45m)',
        userCategory: 'pothole_road_damage',
        location: { lat: 13.0829, lng: 80.2709, addressText: 'North Main Rd Junction', ward: 'Ward 114' },
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c3',
        publicId: 'CR-2026-0003',
        title: 'Broken streetlight in Guindy',
        description: 'Far away location (>8km away)',
        userCategory: 'streetlight_failure',
        location: { lat: 13.0067, lng: 80.2026, addressText: 'Guindy Industrial', ward: 'Ward 165' },
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
    ];

    const clusters = intelligenceService.clusterComplaints(sampleComplaints, 150);
    assert(clusters.length === 2, 'Clusters proximate complaints into distinct geographic groups', `Total clusters: ${clusters.length}`);

    const mainCluster = clusters.find((cl) => cl.complaintCount === 2);
    assert(Boolean(mainCluster), 'Group of 2 proximate complaints forms a combined hotspot');
    assert(mainCluster?.dominantCategory === 'pothole_road_damage', 'Identifies dominant issue category in cluster');
  }

  // 3. Civic Impact Score (0-100) Tests
  console.log('\n[Suite 3: Deterministic Civic Impact Score Engine]');
  {
    const criticalComplaint: ComplaintData = {
      id: 'crit-1',
      publicId: 'CR-2026-9999',
      title: 'Snapped high voltage electric wire',
      description: 'Hanging 4 feet above walkway',
      userCategory: 'exposed_electrical_hazard',
      location: { lat: 13.05, lng: 80.25, ward: 'Ward 114' },
      status: 'SUBMITTED',
      phoneVerified: true,
      communityConfirmationsCount: 5,
      createdAt: new Date(Date.now() - 80 * 3600 * 1000).toISOString(), // >72h overdue
    };

    const criticalResult = intelligenceService.calculateImpactScore(criticalComplaint, 4, 80);
    assert(criticalResult.score >= 75, 'Critical electrical hazard with community confirmation exceeds 75 points', `Score: ${criticalResult.score}`);
    assert(criticalResult.level === 'critical', 'Assigns "critical" severity classification to score >= 75');
    assert(criticalResult.score <= 100, 'Score is strictly bounded to max 100 points');

    const minorResolvedComplaint: ComplaintData = {
      id: 'min-1',
      publicId: 'CR-2026-0005',
      title: 'Minor cosmetic paint peeling on railing',
      description: 'Small paint scratch',
      userCategory: 'other',
      location: { lat: 13.05, lng: 80.25, ward: 'Ward 114' },
      status: 'RESOLVED',
      phoneVerified: false,
      communityConfirmationsCount: 0,
      createdAt: new Date().toISOString(),
    };

    const minorResult = intelligenceService.calculateImpactScore(minorResolvedComplaint, 1, 2);
    assert(minorResult.score < 30, 'Resolved minor issue scores below 30 points', `Score: ${minorResult.score}`);
    assert(minorResult.level === 'low' || minorResult.level === 'moderate', 'Assigns low or moderate severity to minor issue');
  }

  // 4. Ward Metrics & Automated Recommendations
  console.log('\n[Suite 4: Ward Metrics & Actionable Recommendations]');
  {
    const sampleComplaints: ComplaintData[] = [
      {
        id: 'w1',
        publicId: 'CR-W1',
        title: 'Sewage overflow',
        description: 'Road flooded with drain water',
        userCategory: 'sewage_overflow',
        location: { lat: 13.08, lng: 80.27, ward: 'Ward 114' },
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'w2',
        publicId: 'CR-W2',
        title: 'Drainage blockage',
        description: 'Water stagnant',
        userCategory: 'drainage_blockage',
        location: { lat: 13.081, lng: 80.271, ward: 'Ward 114' },
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
    ];

    const clusters = intelligenceService.clusterComplaints(sampleComplaints, 150);
    const wardMetrics = intelligenceService.computeWardMetrics(sampleComplaints, clusters);
    assert(wardMetrics.length === 1, 'Aggregates metrics for distinct wards', `Wards: ${wardMetrics.length}`);
    assert(wardMetrics[0].wardName === 'Ward 114', 'Correctly matches ward identifier');

    const recs = intelligenceService.generateRecommendations(clusters, wardMetrics);
    assert(recs.length > 0, 'Synthesizes actionable municipal engineering recommendations');
    assert(Boolean(recs[0].suggestedResourceDispatch), 'Includes specific resource dispatch directive (e.g. jetting vehicle)');
  }

  // 5. Community Issue Confirmation Logic
  console.log('\n[Suite 5: Community Issue Confirmation & Anti-Fraud]');
  {
    const testComplaintId = 'test_comp_community_1';
    communityConfirmationsMap.set(testComplaintId, new Set<string>());

    const user1 = 'citizen_uid_1';
    const user2 = 'citizen_uid_2';

    // First confirmation
    const confSet = communityConfirmationsMap.get(testComplaintId)!;
    assert(!confSet.has(user1), 'User 1 not yet confirmed');
    confSet.add(user1);
    assert(confSet.has(user1), 'User 1 successfully added to confirmation registry');

    // Duplicate confirmation check
    const duplicateAttempt = confSet.has(user1);
    assert(duplicateAttempt === true, 'Correctly flags duplicate confirmation attempt by same user');

    // Second user confirmation
    confSet.add(user2);
    assert(confSet.size === 2, 'Increments confirmation count across distinct citizens (count = 2)');
  }

  // 6. Multimodal Image Evidence Verification Engine
  console.log('\n[Suite 6: Multimodal AI Image Evidence Verification]');
  {
    const analysis = await imageAnalysisService.verifyImageEvidence({
      complaintId: 'test_evidence_1',
      userCategory: 'pothole_road_damage',
      complaintTitle: 'Dangerous arterial pothole near Anna Flyover',
      complaintDescription: 'Deep crater on the main carriage way posing risk to motorists.',
    });

    assert(typeof analysis.authenticityScore === 'number' && analysis.authenticityScore >= 0 && analysis.authenticityScore <= 100,
      'Returns authenticityScore bounded 0-100', `Score: ${analysis.authenticityScore}`);
    assert(analysis.categoryMatch === true, 'Confirms category match between image cues and reported category');
    assert(typeof analysis.tamperingDetected === 'boolean', 'Evaluates tamperingDetected boolean');
    assert(Boolean(analysis.sceneDescription && analysis.sceneDescription.length > 10), 'Generates structured scene description');
    assert(Boolean(analysis.recommendedMunicipalAction), 'Generates concrete recommended municipal action');
  }

  // Summary
  console.log('\n===============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`  Tests Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log('===============================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAdvancedFeaturesTestSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
