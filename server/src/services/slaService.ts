import { ComplaintCategory, ComplaintStatus } from '../config/constants.js';

export interface SLAPolicy {
  category: ComplaintCategory;
  targetHours: number;
  criticalTargetHours: number;
  description: string;
}

export interface SLAAssessment {
  category: ComplaintCategory;
  priorityLevel: string;
  targetHours: number;
  targetDeadlineIso: string;
  elapsedHours: number;
  remainingHours: number;
  percentElapsed: number;
  isOverdue: boolean;
  overdueHours: number;
  slaBreached: boolean;
  escalationTier: 'TIER_1_WARD' | 'TIER_2_SUPERINTENDENT' | 'TIER_3_EXECUTIVE_ENGINEER' | 'TIER_4_COMMISSIONER';
  resolutionTimeHours: number | null;
  status: ComplaintStatus;
}

export interface DepartmentWorkloadMetric {
  departmentId: string;
  departmentName: string;
  activeCount: number;
  resolvedCount: number;
  overdueCount: number;
  slaComplianceRatePercent: number;
  averageResolutionHours: number;
  capacityStatus: 'OPTIMAL' | 'MODERATE' | 'HIGH' | 'SATURATED';
}

// Category-Specific SLA Resolution Timeframes (Hours)
export const SLA_POLICIES: Record<ComplaintCategory, SLAPolicy> = {
  exposed_electrical_hazard: {
    category: 'exposed_electrical_hazard',
    targetHours: 12,
    criticalTargetHours: 6,
    description: 'Imminent public electrocution hazard requiring emergency line de-energization.',
  },
  water_leakage: {
    category: 'water_leakage',
    targetHours: 24,
    criticalTargetHours: 12,
    description: 'Potable water main burst or high-pressure distribution pipe breach.',
  },
  sewage_overflow: {
    category: 'sewage_overflow',
    targetHours: 24,
    criticalTargetHours: 12,
    description: 'Biological sanitary health hazard overflowing onto public walkways.',
  },
  garbage_overflow: {
    category: 'garbage_overflow',
    targetHours: 24,
    criticalTargetHours: 12,
    description: 'Solid waste container overflow obstructing pedestrian paths or school access.',
  },
  drainage_blockage: {
    category: 'drainage_blockage',
    targetHours: 24,
    criticalTargetHours: 12,
    description: 'Stormwater drain impediment causing localized monsoon water stagnation.',
  },
  illegal_dumping: {
    category: 'illegal_dumping',
    targetHours: 48,
    criticalTargetHours: 24,
    description: 'Unauthorized commercial dumping on municipal vacant land.',
  },
  streetlight_failure: {
    category: 'streetlight_failure',
    targetHours: 48,
    criticalTargetHours: 24,
    description: 'Darkened public thoroughfare elevating pedestrian nighttime safety risk.',
  },
  pothole_road_damage: {
    category: 'pothole_road_damage',
    targetHours: 48,
    criticalTargetHours: 24,
    description: 'Pavement depression or crater threatening two-wheeler vehicle safety.',
  },
  public_infrastructure_damage: {
    category: 'public_infrastructure_damage',
    targetHours: 96,
    criticalTargetHours: 48,
    description: 'Damaged footbridge, park perimeter wall, or municipal building masonry.',
  },
  other: {
    category: 'other',
    targetHours: 72,
    criticalTargetHours: 36,
    description: 'General civic grievance routed to zonal municipal administrative queue.',
  },
};

export class SLAService {
  /**
   * Computes comprehensive SLA assessment for a complaint.
   */
  public evaluateSLA(complaint: {
    userCategory: ComplaintCategory;
    priority?: { level: string };
    createdAt: string;
    updatedAt?: string;
    status: ComplaintStatus;
    resolutionProof?: { verifiedAt?: string };
  }): SLAAssessment {
    const policy = SLA_POLICIES[complaint.userCategory] || SLA_POLICIES.other;
    const isCritical = complaint.priority?.level === 'critical';
    const targetHours = isCritical ? policy.criticalTargetHours : policy.targetHours;

    const createdTime = new Date(complaint.createdAt).getTime();
    const deadlineTime = createdTime + targetHours * 3600 * 1000;
    const deadlineIso = new Date(deadlineTime).toISOString();

    const isResolved =
      complaint.status === 'RESOLVED' ||
      complaint.status === 'CITIZEN_VERIFIED';

    const endTime = isResolved && complaint.resolutionProof?.verifiedAt
      ? new Date(complaint.resolutionProof.verifiedAt).getTime()
      : isResolved && complaint.updatedAt
      ? new Date(complaint.updatedAt).getTime()
      : Date.now();

    const elapsedMs = Math.max(0, endTime - createdTime);
    const elapsedHours = Math.round((elapsedMs / (3600 * 1000)) * 10) / 10;
    const remainingMs = deadlineTime - endTime;
    const remainingHours = Math.round((remainingMs / (3600 * 1000)) * 10) / 10;

    const percentElapsed = Math.min(
      999,
      Math.max(0, Math.round((elapsedHours / targetHours) * 100))
    );

    const isOverdue = !isResolved && complaint.status !== 'REJECTED' && complaint.status !== 'DUPLICATE' && Date.now() > deadlineTime;
    const overdueHours = isOverdue
      ? Math.round(((Date.now() - deadlineTime) / (3600 * 1000)) * 10) / 10
      : 0;

    // SLA breached if currently overdue or if resolved after deadline
    const slaBreached = isOverdue || (isResolved && endTime > deadlineTime);

    // Dynamic escalation tier calculation based on overdue severity
    let escalationTier: SLAAssessment['escalationTier'] = 'TIER_1_WARD';
    if (overdueHours > 48) {
      escalationTier = 'TIER_4_COMMISSIONER';
    } else if (overdueHours > 0) {
      escalationTier = 'TIER_3_EXECUTIVE_ENGINEER';
    } else if (percentElapsed >= 75) {
      escalationTier = 'TIER_2_SUPERINTENDENT';
    }

    const resolutionTimeHours = isResolved ? elapsedHours : null;

    return {
      category: complaint.userCategory,
      priorityLevel: complaint.priority?.level || 'medium',
      targetHours,
      targetDeadlineIso: deadlineIso,
      elapsedHours,
      remainingHours: isResolved ? 0 : remainingHours,
      percentElapsed,
      isOverdue,
      overdueHours,
      slaBreached,
      escalationTier,
      resolutionTimeHours,
      status: complaint.status,
    };
  }

  /**
   * Computes department workload, capacity saturation, and SLA compliance metrics across all complaints.
   */
  public computeDepartmentWorkloads(complaints: any[]): DepartmentWorkloadMetric[] {
    const deptBuckets = new Map<
      string,
      {
        name: string;
        active: number;
        resolved: number;
        overdue: number;
        totalResolutionHours: number;
      }
    >();

    for (const c of complaints) {
      const deptId = c.department?.id || 'dept_human_review';
      const deptName = c.department?.name || 'Human Review & Triage';

      if (!deptBuckets.has(deptId)) {
        deptBuckets.set(deptId, {
          name: deptName,
          active: 0,
          resolved: 0,
          overdue: 0,
          totalResolutionHours: 0,
        });
      }

      const bucket = deptBuckets.get(deptId)!;
      const isResolved = c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED';
      const sla = this.evaluateSLA(c);

      if (isResolved) {
        bucket.resolved += 1;
        if (sla.resolutionTimeHours) {
          bucket.totalResolutionHours += sla.resolutionTimeHours;
        }
      } else if (c.status !== 'REJECTED' && c.status !== 'DUPLICATE') {
        bucket.active += 1;
        if (sla.isOverdue) {
          bucket.overdue += 1;
        }
      }
    }

    const results: DepartmentWorkloadMetric[] = [];

    deptBuckets.forEach((data, deptId) => {
      const totalManaged = data.active + data.resolved;
      const complianceRate =
        totalManaged > 0
          ? Math.max(0, Math.round(((totalManaged - data.overdue) / totalManaged) * 100))
          : 100;

      const avgRes =
        data.resolved > 0
          ? Math.round((data.totalResolutionHours / data.resolved) * 10) / 10
          : 24;

      let capacityStatus: DepartmentWorkloadMetric['capacityStatus'] = 'OPTIMAL';
      if (data.active > 20 || data.overdue > 5) {
        capacityStatus = 'SATURATED';
      } else if (data.active > 10 || data.overdue > 2) {
        capacityStatus = 'HIGH';
      } else if (data.active > 5) {
        capacityStatus = 'MODERATE';
      }

      results.push({
        departmentId: deptId,
        departmentName: data.name,
        activeCount: data.active,
        resolvedCount: data.resolved,
        overdueCount: data.overdue,
        slaComplianceRatePercent: complianceRate,
        averageResolutionHours: avgRes,
        capacityStatus,
      });
    });

    return results.sort((a, b) => b.activeCount - a.activeCount);
  }
}

export const slaService = new SLAService();
