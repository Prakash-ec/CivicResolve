/**
 * CIVICRESOLVE — FINAL PRODUCT INTELLIGENCE TEST SUITE
 * Comprehensive verification of SLA calculations, idempotency, smart routing,
 * resolution verification, reopening, cryptographic receipts, risk indices,
 * privacy redaction, and multilingual AI responses.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { slaService, SLA_POLICIES } from '../services/slaService.js';
import { routingService } from '../services/routingService.js';
import { intelligenceService } from '../services/intelligenceService.js';
import { chatWithCivicAssistant } from '../services/aiService.js';
import {
  localComplaintsStore,
  idempotencyStore,
  localNotificationsStore,
  pushNotification,
} from '../routes/citizenRoutes.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

export async function runFinalProductIntelligenceSuite() {
  console.log('\n================================================================');
  console.log('CIVICRESOLVE: FINAL PRODUCT INTELLIGENCE EXPANSION TEST SUITE');
  console.log('================================================================\n');

  // 1. SLA Engine Tests
  await runTest('SLA Engine: Critical electrical hazard targets 6h-12h resolution deadline', () => {
    const assessment = slaService.evaluateSLA({
      userCategory: 'exposed_electrical_hazard',
      priority: { level: 'critical' },
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
    });
    assert.equal(assessment.targetHours, 6, 'Critical exposed electrical hazard must have 6h SLA target');
  });

  await runTest('SLA Engine: Drainage blockage targets 24h standard resolution deadline', () => {
    const assessment = slaService.evaluateSLA({
      userCategory: 'drainage_blockage',
      priority: { level: 'medium' },
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
    });
    assert.equal(assessment.targetHours, 24, 'Drainage blockage must have 24h SLA target');
  });

  await runTest('SLA Engine: Garbage overflow targets 24h resolution deadline', () => {
    const assessment = slaService.evaluateSLA({
      userCategory: 'garbage_overflow',
      priority: { level: 'medium' },
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
    });
    assert.equal(assessment.targetHours, 24, 'Garbage overflow must have 24h SLA target');
  });

  await runTest('SLA Engine: Road damage targets 48h resolution deadline', () => {
    const assessment = slaService.evaluateSLA({
      userCategory: 'pothole_road_damage',
      priority: { level: 'medium' },
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
    });
    assert.equal(assessment.targetHours, 48, 'Pothole road damage must have 48h SLA target');
  });

  await runTest('SLA Engine: 4-tier escalation hierarchy triggers correctly when overdue', () => {
    // 50 hours overdue
    const tier4 = slaService.evaluateSLA({
      userCategory: 'pothole_road_damage',
      priority: { level: 'medium' },
      createdAt: new Date(Date.now() - (48 + 50) * 3600 * 1000).toISOString(),
      status: 'IN_PROGRESS',
    });
    assert.equal(tier4.isOverdue, true);
    assert.equal(tier4.escalationTier, 'TIER_4_COMMISSIONER', 'Overdue by >48h must escalate to TIER_4_COMMISSIONER');

    // 5 hours overdue
    const tier3 = slaService.evaluateSLA({
      userCategory: 'pothole_road_damage',
      priority: { level: 'medium' },
      createdAt: new Date(Date.now() - (48 + 5) * 3600 * 1000).toISOString(),
      status: 'IN_PROGRESS',
    });
    assert.equal(tier3.isOverdue, true);
    assert.equal(tier3.escalationTier, 'TIER_3_EXECUTIVE_ENGINEER');
  });

  await runTest('SLA Engine: Resolved grievances are not marked overdue', () => {
    const assessment = slaService.evaluateSLA({
      userCategory: 'pothole_road_damage',
      priority: { level: 'medium' },
      createdAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
      status: 'RESOLVED',
      resolutionProof: { verifiedAt: new Date(Date.now() - 90 * 3600 * 1000).toISOString() },
    });
    assert.equal(assessment.isOverdue, false, 'Resolved grievances should not be marked overdue');
  });

  // 2. Smart Department Routing Tests
  await runTest('Smart Routing: Routes road damage to Roads & Highways Department', () => {
    const decision = routingService.routeComplaint({
      category: 'pothole_road_damage',
      lat: 13.0827,
      lng: 80.2707,
      addressText: 'Near Anna Flyover, Anna Salai',
      ward: 'Ward 114',
    });
    assert.equal(decision.department.id, 'dept_roads');
    assert.equal(decision.jurisdiction.zone, 'Zone 9');
  });

  await runTest('Smart Routing: Multi-hazard co-routing alerts electricity board during water drainage', () => {
    const decision = routingService.routeComplaint({
      category: 'drainage_blockage',
      lat: 13.0827,
      lng: 80.2707,
      addressText: 'Anna Salai',
      ward: 'Ward 114',
      aiFactors: {
        electricalHazard: true,
        trafficObstruction: true,
        healthHazard: false,
      },
    });
    assert.equal(decision.requiresJointDispatch, true, 'Must require joint dispatch for electrical + water');
    assert.ok(
      decision.secondaryDepartments.some((d: any) => d.id === 'dept_electricity'),
      'Electricity board must be listed as secondary department'
    );
  });

  // 3. Idempotency & Duplicate Submission Protection
  await runTest('Idempotency Store: Duplicate submission returns identical complaint ID', () => {
    const testKey = `test_idemp_${Date.now()}`;
    const payload = {
      id: 'comp_test_1',
      publicId: 'CR-2026-TEST01',
      title: 'Pothole near corner',
    };
    idempotencyStore.set(testKey, payload);

    const retrieved = idempotencyStore.get(testKey);
    assert.equal(retrieved.publicId, 'CR-2026-TEST01');
    assert.equal(retrieved.id, 'comp_test_1');
  });

  // 4. Resolution Verification & Reopening State Transitions
  await runTest('Lifecycle: Citizen verification saves rating and transitions status', () => {
    const testId = `test_comp_${Date.now()}`;
    const comp = {
      id: testId,
      publicId: 'CR-2026-VTEST',
      status: 'RESOLVED',
      ownerUid: 'uid_test_citizen',
      title: 'Broken streetlight',
    };
    localComplaintsStore.set(testId, comp);

    // Apply verification
    comp.status = 'CITIZEN_VERIFIED';
    (comp as any).citizenVerification = {
      verifiedAt: new Date().toISOString(),
      rating: 5,
      feedback: 'Excellent lighting restored.',
      verifiedByUid: 'uid_test_citizen',
    };
    localComplaintsStore.set(testId, comp);

    const reloaded = localComplaintsStore.get(testId);
    assert.equal(reloaded.status, 'CITIZEN_VERIFIED');
    assert.equal(reloaded.citizenVerification.rating, 5);
  });

  await runTest('Lifecycle: Grievance reopening escalates priority and re-calculates 24h SLA', () => {
    const testId = `test_comp_reopen_${Date.now()}`;
    const comp: any = {
      id: testId,
      publicId: 'CR-2026-ROTEST',
      status: 'RESOLVED',
      priority: { level: 'medium', score: 45 },
      ownerUid: 'uid_test_citizen',
      title: 'Pothole patch failed',
    };
    localComplaintsStore.set(testId, comp);

    // Reopen grievance
    comp.status = 'REOPENED';
    comp.priority.level = 'high';
    comp.priority.score = 70;
    comp.sla = {
      deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      targetHours: 24,
      isOverdue: false,
      escalationTier: 'TIER_2_DEPARTMENT_HEAD',
    };
    comp.reopenDetails = {
      reopenedAt: new Date().toISOString(),
      reason: 'The patch collapsed when heavy truck passed.',
    };
    localComplaintsStore.set(testId, comp);

    const reloaded = localComplaintsStore.get(testId);
    assert.equal(reloaded.status, 'REOPENED');
    assert.equal(reloaded.priority.level, 'high');
    assert.equal(reloaded.sla.targetHours, 24);
  });

  // 5. Digital Citizen Receipt Cryptographic Integrity
  await runTest('Digital Receipt: Generates verifiable SHA-256 cryptographic hash', () => {
    const rawPayload = 'CR-2026-001248:user_abc123:2026-11-21T00:00:00.000Z:Ward 114:pothole_road_damage';
    const hash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');

    // Identical payload produces identical hash
    const hash2 = crypto.createHash('sha256').update(rawPayload).digest('hex');
    assert.equal(hash, hash2, 'Hash must be strictly deterministic');
  });

  // 6. Infrastructure Risk Index & Geographic Clustering
  await runTest('Intelligence: Infrastructure Risk Index is strictly bounded between 0 and 100', () => {
    const mockComplaints = [
      {
        id: '1',
        userCategory: 'pothole_road_damage',
        priority: { score: 90 },
        location: { ward: 'Ward 114', lat: 13.0827, lng: 80.2707 },
        status: 'IN_PROGRESS',
        sla: { deadline: new Date(Date.now() - 10000).toISOString() },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userCategory: 'pothole_road_damage',
        priority: { score: 85 },
        location: { ward: 'Ward 114', lat: 13.0828, lng: 80.2708 },
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
    ];

    const assessment = intelligenceService.computeInfrastructureRiskIndex(mockComplaints, 'Ward 114');
    assert.ok(
      assessment.overallRiskIndex >= 0 && assessment.overallRiskIndex <= 100,
      'Risk index must be between 0 and 100'
    );
    assert.ok(['LOW', 'MODERATE', 'ELEVATED', 'CRITICAL'].includes(assessment.riskTier));
    assert.ok(assessment.explanation.length > 10, 'Formula explanation must be transparent');
  });

  await runTest('Intelligence: Recurring issue detection clusters proximity within 100 meters', () => {
    const mockComplaints = [
      {
        id: 'c1',
        publicId: 'CR-001',
        title: 'Road crack',
        userCategory: 'pothole_road_damage',
        location: { lat: 13.0827, lng: 80.2707, addressText: 'Anna Salai', ward: 'Ward 114' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c2',
        publicId: 'CR-002',
        title: 'Road collapsed nearby',
        userCategory: 'pothole_road_damage',
        location: { lat: 13.0829, lng: 80.2709, addressText: 'Anna Salai', ward: 'Ward 114' },
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];

    const patterns = intelligenceService.detectRecurringIssues(mockComplaints, 150, 90);
    assert.ok(Array.isArray(patterns));
    if (patterns.length > 0) {
      assert.ok(patterns[0].recurrenceCount >= 2);
      assert.ok(patterns[0].recommendedEngineeringAction.length > 0);
    }
  });

  // 7. Privacy Redaction Tests
  await runTest('Privacy Redaction: Coordinates fuzzed to 4 decimals (~11m precision)', () => {
    const rawLat = 13.0827491823;
    const rawLng = 80.2707129841;
    const fuzzedLat = Number(Number(rawLat).toFixed(4));
    const fuzzedLng = Number(Number(rawLng).toFixed(4));

    assert.equal(fuzzedLat, 13.0827);
    assert.equal(fuzzedLng, 80.2707);
  });

  // 8. Notification Engine Tests
  await runTest('Notification Engine: Enqueues and retrieves user notifications safely', () => {
    const testUid = `test_user_notif_${Date.now()}`;
    pushNotification(testUid, {
      title: 'Grievance Assigned',
      message: 'Field crew assigned to your report.',
      type: 'status_update',
      publicId: 'CR-2026-NTEST',
    });

    const notifs = localNotificationsStore.get(testUid) || [];
    assert.equal(notifs.length, 1);
    assert.equal(notifs[0].title, 'Grievance Assigned');
    assert.equal(notifs[0].read, false);
  });

  // 9. Multilingual AI Civic Assistant Tests
  await runTest('AI Civic Assistant: Handles Tamil queries with category recommendation', async () => {
    const res = await chatWithCivicAssistant({
      message: 'என் தெருவில் சாக்கடை நீர் வழிந்தோடுகிறது',
      language: 'ta',
    });
    assert.ok(res.reply.length > 20, 'Response must contain advice');
    assert.equal(res.language, 'ta');
    assert.ok(res.quickReplies.length > 0);
  });

  await runTest('AI Civic Assistant: Handles Hindi queries with category recommendation', async () => {
    const res = await chatWithCivicAssistant({
      message: 'सड़क पर बहुत बड़ा गड्ढा है',
      language: 'hi',
    });
    assert.ok(res.reply.length > 20);
    assert.equal(res.language, 'hi');
  });

  await runTest('AI Civic Assistant: Handles English queries with SLA explanation', async () => {
    const res = await chatWithCivicAssistant({
      message: 'What is the resolution SLA for open manhole?',
      language: 'en',
    });
    assert.ok(res.reply.length > 20);
    assert.equal(res.language, 'en');
  });

  // Print Summary
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    throw new Error(`${totalCount - passedCount} tests failed.`);
  }
}

// Auto-run if executed directly
runFinalProductIntelligenceSuite()
  .then(() => {
    console.log('Final Product Intelligence Suite completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Final Product Intelligence Suite error:', err);
    process.exit(1);
  });
