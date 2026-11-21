/**
 * CivicResolve - Civic Impact Intelligence & Geospatial Analytics Engine
 * Provides Haversine clustering, Civic Impact Scoring (0-100), Ward Risk Index,
 * and explainable municipal intervention recommendations.
 */

export interface GeoLocation {
  lat: number;
  lng: number;
  addressText?: string;
  ward?: string;
}

export interface ComplaintData {
  id: string;
  publicId: string;
  title: string;
  description: string;
  userCategory: string;
  location: GeoLocation;
  status: string;
  priority?: {
    level: string;
    score: number;
  };
  department?: {
    id: string;
    name: string;
  };
  communityConfirmationsCount?: number;
  phoneVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface HotspotCluster {
  id: string;
  centroid: {
    lat: number;
    lng: number;
    approxAddress: string;
    ward: string;
  };
  radiusMeters: number;
  complaintCount: number;
  complaintIds: string[];
  publicIds: string[];
  dominantCategory: string;
  averageImpactScore: number;
  severityLevel: 'low' | 'moderate' | 'high' | 'critical';
  unresolvedCount: number;
  suggestedAction: string;
}

export interface WardMetric {
  wardName: string;
  totalComplaints: number;
  unresolvedCount: number;
  resolutionRatePercent: number;
  criticalClustersCount: number;
  averageImpactScore: number;
  dominantCategory: string;
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
}

export interface CivicRecommendation {
  id: string;
  title: string;
  ward: string;
  category: string;
  urgency: 'immediate' | 'medium_term' | 'preventive';
  impactScore: number;
  clusterId?: string;
  rationale: string;
  suggestedResourceDispatch: string;
}

export interface RecurringIssuePattern {
  id: string;
  category: string;
  approxAddress: string;
  ward: string;
  centroid: { lat: number; lng: number };
  recurrenceCount: number;
  isChronic: boolean;
  firstReportedDate: string;
  latestReportedDate: string;
  recurrenceIntervalDays: number;
  complaintIds: string[];
  publicIds: string[];
  rootCauseHypothesis: string;
  recommendedEngineeringAction: string;
  riskWeight: number;
}

export interface InfrastructureRiskAssessment {
  areaKey: string;
  areaName: string;
  overallRiskIndex: number;
  riskTier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  formulaBreakdown: {
    densityScore: number;
    severityScore: number;
    recurrenceScore: number;
    slaLatencyScore: number;
  };
  explanation: string;
  totalComplaints: number;
  criticalHazardsCount: number;
  chronicHotspotsCount: number;
  evaluatedAt: string;
}

export class IntelligenceService {
  /**
   * Calculates precise great-circle distance between two GPS coordinates in meters.
   */
  public haversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's mean radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculates deterministic Civic Impact Score (0-100) for an individual complaint or cluster
   * Formula:
   * - 30% Unresolved Backlog
   * - 25% Severity & Hazard Level
   * - 20% Recurrence & Proximity Density
   * - 15% Public Impact & Community Confirmations
   * - 10% SLA Overdue Duration (>72h)
   */
  public calculateImpactScore(
    complaint: ComplaintData,
    clusterSize = 1,
    hoursOpen = 24
  ): { score: number; level: 'low' | 'moderate' | 'high' | 'critical'; breakdown: any } {
    // 1. Unresolved Weight (Max 30)
    const isUnresolved = complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED';
    const unresolvedPoints = isUnresolved ? 30 : 5;

    // 2. Severity & Hazard Weight (Max 25)
    let hazardPoints = 12;
    switch (complaint.userCategory) {
      case 'exposed_electrical_hazard':
        hazardPoints = 25;
        break;
      case 'sewage_overflow':
      case 'drainage_blockage':
        hazardPoints = 22;
        break;
      case 'water_leakage':
        hazardPoints = 20;
        break;
      case 'pothole_road_damage':
      case 'public_infrastructure_damage':
        hazardPoints = 18;
        break;
      case 'garbage_overflow':
      case 'illegal_dumping':
        hazardPoints = 15;
        break;
      case 'streetlight_failure':
        hazardPoints = 14;
        break;
      default:
        hazardPoints = 10;
    }

    // 3. Recurrence & Density Weight (Max 20)
    let densityPoints = 5;
    if (clusterSize >= 5) densityPoints = 20;
    else if (clusterSize >= 3) densityPoints = 15;
    else if (clusterSize === 2) densityPoints = 10;

    // 4. Public Impact & Community Confirmations (Max 15)
    const confirmations = complaint.communityConfirmationsCount || 0;
    const confirmationPoints = Math.min(15, confirmations * 3 + (complaint.phoneVerified ? 3 : 0));

    // 5. Overdue / Age Weight (Max 10)
    let agePoints = 2;
    if (hoursOpen >= 72) agePoints = 10;
    else if (hoursOpen >= 48) agePoints = 7;
    else if (hoursOpen >= 24) agePoints = 4;

    const rawScore = unresolvedPoints + hazardPoints + densityPoints + confirmationPoints + agePoints;
    const finalScore = Math.min(100, Math.max(0, rawScore));

    let level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (finalScore >= 75) level = 'critical';
    else if (finalScore >= 50) level = 'high';
    else if (finalScore >= 25) level = 'moderate';

    return {
      score: Math.round(finalScore),
      level,
      breakdown: {
        unresolvedPoints,
        hazardPoints,
        densityPoints,
        confirmationPoints,
        agePoints,
      },
    };
  }

  /**
   * Identifies spatial clusters within a given radius in meters (default 150m)
   */
  public clusterComplaints(
    complaints: ComplaintData[],
    radiusMeters = 150
  ): HotspotCluster[] {
    const visited = new Set<string>();
    const clusters: HotspotCluster[] = [];

    const validComplaints = complaints.filter(
      (c) => c.location && typeof c.location.lat === 'number' && typeof c.location.lng === 'number'
    );

    for (let i = 0; i < validComplaints.length; i++) {
      const current = validComplaints[i];
      if (visited.has(current.id)) continue;

      const group: ComplaintData[] = [current];
      visited.add(current.id);

      for (let j = 0; j < validComplaints.length; j++) {
        if (i === j) continue;
        const other = validComplaints[j];
        if (visited.has(other.id)) continue;

        const distance = this.haversineDistanceMeters(
          current.location.lat,
          current.location.lng,
          other.location.lat,
          other.location.lng
        );

        if (distance <= radiusMeters) {
          visited.add(other.id);
          group.push(other);
        }
      }

      // Group forms a hotspot if it has 1 or more complaints (with priority given to >=2)
      const count = group.length;
      const centroidLat = group.reduce((acc, c) => acc + c.location.lat, 0) / count;
      const centroidLng = group.reduce((acc, c) => acc + c.location.lng, 0) / count;

      // Find dominant category
      const categoryCounts: Record<string, number> = {};
      group.forEach((c) => {
        categoryCounts[c.userCategory] = (categoryCounts[c.userCategory] || 0) + 1;
      });
      const dominantCategory = Object.keys(categoryCounts).sort(
        (a, b) => categoryCounts[b] - categoryCounts[a]
      )[0] || 'other';

      const unresolvedCount = group.filter(
        (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED'
      ).length;

      // Calculate aggregate impact score
      let totalScore = 0;
      group.forEach((c) => {
        const hoursOpen = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
        const { score } = this.calculateImpactScore(c, count, hoursOpen);
        totalScore += score;
      });
      const avgScore = Math.round(totalScore / count);

      let severityLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (avgScore >= 75 || count >= 4) severityLevel = 'critical';
      else if (avgScore >= 50 || count >= 2) severityLevel = 'high';
      else if (avgScore >= 25) severityLevel = 'moderate';

      let suggestedAction = 'Monitor neighborhood telemetry';
      if (dominantCategory === 'pothole_road_damage' && count >= 2) {
        suggestedAction = 'Dispatch Road Works asphalt resurfacing vehicle for area sweep';
      } else if (dominantCategory === 'garbage_overflow' || dominantCategory === 'illegal_dumping') {
        suggestedAction = 'Authorize immediate solid-waste compactor deployment and add smart bin sensor';
      } else if (dominantCategory === 'exposed_electrical_hazard') {
        suggestedAction = 'URGENT: Dispatch EB emergency linesmen for live wire insulation';
      } else if (dominantCategory === 'drainage_blockage' || dominantCategory === 'sewage_overflow') {
        suggestedAction = 'Deploy super-sucker drainage jetting machine to clear underground conduit';
      } else if (dominantCategory === 'water_leakage') {
        suggestedAction = 'Alert MetroWater pipeline engineering unit for distribution shut-off & patch';
      }

      clusters.push({
        id: `cluster_${Math.round(centroidLat * 1000)}_${Math.round(centroidLng * 1000)}_${i}`,
        centroid: {
          lat: Number(centroidLat.toFixed(6)),
          lng: Number(centroidLng.toFixed(6)),
          approxAddress: current.location.addressText || 'Municipal Arterial Corridor',
          ward: current.location.ward || 'Zone 9 - Central Ward',
        },
        radiusMeters: Math.max(80, Math.min(250, radiusMeters)),
        complaintCount: count,
        complaintIds: group.map((c) => c.id),
        publicIds: group.map((c) => c.publicId),
        dominantCategory,
        averageImpactScore: avgScore,
        severityLevel,
        unresolvedCount,
        suggestedAction,
      });
    }

    return clusters.sort((a, b) => b.averageImpactScore - a.averageImpactScore);
  }

  /**
   * Generates Ward-level operational metrics & risk profiles
   */
  public computeWardMetrics(complaints: ComplaintData[], clusters: HotspotCluster[]): WardMetric[] {
    const wardMap = new Map<string, ComplaintData[]>();

    complaints.forEach((c) => {
      const wardKey = c.location.ward?.trim() || 'Central Zone 9';
      if (!wardMap.has(wardKey)) wardMap.set(wardKey, []);
      wardMap.get(wardKey)!.push(c);
    });

    const metrics: WardMetric[] = [];

    wardMap.forEach((wardComplaints, wardName) => {
      const total = wardComplaints.length;
      const unresolved = wardComplaints.filter(
        (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED'
      ).length;
      const resolutionRatePercent = total > 0 ? Math.round(((total - unresolved) / total) * 100) : 100;

      const wardClusters = clusters.filter((cl) => cl.centroid.ward === wardName);
      const criticalClustersCount = wardClusters.filter(
        (cl) => cl.severityLevel === 'critical' || cl.severityLevel === 'high'
      ).length;

      let scoreSum = 0;
      wardComplaints.forEach((c) => {
        scoreSum += this.calculateImpactScore(c, 1, 24).score;
      });
      const averageImpactScore = total > 0 ? Math.round(scoreSum / total) : 0;

      // Dominant category
      const counts: Record<string, number> = {};
      wardComplaints.forEach((c) => {
        counts[c.userCategory] = (counts[c.userCategory] || 0) + 1;
      });
      const dominantCategory = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'Roads';

      let riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical' = 'Low';
      if (criticalClustersCount >= 2 || averageImpactScore > 65) riskLevel = 'Critical';
      else if (criticalClustersCount >= 1 || averageImpactScore > 45) riskLevel = 'Elevated';
      else if (averageImpactScore > 30) riskLevel = 'Moderate';

      metrics.push({
        wardName,
        totalComplaints: total,
        unresolvedCount: unresolved,
        resolutionRatePercent,
        criticalClustersCount,
        averageImpactScore,
        dominantCategory,
        riskLevel,
      });
    });

    return metrics.sort((a, b) => b.averageImpactScore - a.averageImpactScore);
  }

  /**
   * Synthesizes actionable, explainable intervention recommendations
   */
  public generateRecommendations(
    clusters: HotspotCluster[],
    wardMetrics: WardMetric[]
  ): CivicRecommendation[] {
    const recommendations: CivicRecommendation[] = [];

    // 1. From Critical Hotspots
    clusters.slice(0, 4).forEach((cluster, idx) => {
      let urgency: 'immediate' | 'medium_term' | 'preventive' =
        cluster.severityLevel === 'critical' ? 'immediate' : 'medium_term';

      recommendations.push({
        id: `rec_cluster_${idx}`,
        title: `Priority Hotspot: ${cluster.dominantCategory.replace(/_/g, ' ')} cluster at ${cluster.centroid.approxAddress}`,
        ward: cluster.centroid.ward,
        category: cluster.dominantCategory,
        urgency,
        impactScore: cluster.averageImpactScore,
        clusterId: cluster.id,
        rationale: `Detected ${cluster.complaintCount} related citizen grievances within a ${cluster.radiusMeters}m corridor. Collective Civic Impact Score reaches ${cluster.averageImpactScore}/100 with ${cluster.unresolvedCount} unresolved reports.`,
        suggestedResourceDispatch: cluster.suggestedAction,
      });
    });

    // 2. From Ward Inefficiencies
    wardMetrics.forEach((ward, idx) => {
      if (ward.resolutionRatePercent < 60 && ward.totalComplaints >= 3) {
        recommendations.push({
          id: `rec_ward_${idx}`,
          title: `Ward Backlog Alert: ${ward.wardName} resolution velocity below target (currently ${ward.resolutionRatePercent}%)`,
          ward: ward.wardName,
          category: ward.dominantCategory,
          urgency: 'immediate',
          impactScore: ward.averageImpactScore,
          rationale: `Cumulative unresolved count (${ward.unresolvedCount} of ${ward.totalComplaints}) indicates field crew capacity deficit in ${ward.dominantCategory.replace(/_/g, ' ')}.`,
          suggestedResourceDispatch: `Reassign 2 standby rapid-response units from adjacent zones to clear backlog.`,
        });
      }
    });

    return recommendations;
  }

  /**
   * Geographic Area Intelligence & Spatial Drilldown Engine
   * Aggregates real complaint records across administrative levels:
   * State -> District -> Municipality -> Zone -> Ward -> Block -> Locality
   */
  public computeGeographicAnalytics(
    complaints: any[],
    filter: {
      state?: string;
      district?: string;
      municipality?: string;
      zone?: string;
      ward?: string;
      block?: string;
      locality?: string;
    } = {}
  ) {
    const now = Date.now();

    // 1. Filter complaints by geographic criteria if supplied
    let filtered = complaints.filter((c) => {
      const loc = c.location || {};
      if (filter.state && loc.state && loc.state.toLowerCase() !== filter.state.toLowerCase()) return false;
      if (filter.district && loc.district && loc.district.toLowerCase() !== filter.district.toLowerCase()) return false;
      if (filter.municipality && loc.city && !loc.city.toLowerCase().includes(filter.municipality.toLowerCase())) return false;
      if (filter.zone && loc.zone && !loc.zone.toLowerCase().includes(filter.zone.toLowerCase())) return false;
      if (filter.ward && loc.ward && !loc.ward.toLowerCase().includes(filter.ward.toLowerCase())) return false;
      if (filter.locality && loc.locality && !loc.locality.toLowerCase().includes(filter.locality.toLowerCase())) return false;
      return true;
    });

    const total = filtered.length;
    const resolvedList = filtered.filter((c) => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED');
    const openList = filtered.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CITIZEN_VERIFIED' && c.status !== 'REJECTED');
    const criticalList = filtered.filter((c) => c.priority?.level === 'critical' || c.priority?.score >= 75);

    // Overdue: open for > 72 hours
    const overdueList = openList.filter((c) => {
      const created = new Date(c.createdAt).getTime();
      return (now - created) > 72 * 3600 * 1000;
    });

    // Average resolution time in hours
    let totalResolutionHours = 0;
    let resolvedCount = 0;
    for (const c of resolvedList) {
      const created = new Date(c.createdAt).getTime();
      const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : created;
      const hours = Math.max(1, (updated - created) / (3600 * 1000));
      totalResolutionHours += hours;
      resolvedCount++;
    }
    const averageResolutionHours = resolvedCount > 0 ? Math.round(totalResolutionHours / resolvedCount) : 24;

    // Community confirmations
    const totalConfirmations = filtered.reduce((acc, c) => acc + (c.communityConfirmationsCount || c.upvotes || 0), 0);

    // Department workload breakdown
    const deptMap: Record<string, { id: string; name: string; total: number; open: number; resolved: number }> = {};
    for (const c of filtered) {
      const dId = c.department?.id || 'dept_general';
      const dName = c.department?.name || 'General Municipal Services';
      if (!deptMap[dId]) {
        deptMap[dId] = { id: dId, name: dName, total: 0, open: 0, resolved: 0 };
      }
      deptMap[dId].total++;
      if (c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED') {
        deptMap[dId].resolved++;
      } else {
        deptMap[dId].open++;
      }
    }
    const departmentWorkload = Object.values(deptMap).sort((a, b) => b.total - a.total);

    // Area-wise performance breakdown (by Ward or Locality)
    const areaMap: Record<string, { name: string; total: number; open: number; resolved: number; critical: number; hoursSum: number }> = {};
    for (const c of filtered) {
      const areaKey = c.location?.ward || c.location?.locality || c.location?.zone || 'Central Area';
      if (!areaMap[areaKey]) {
        areaMap[areaKey] = { name: areaKey, total: 0, open: 0, resolved: 0, critical: 0, hoursSum: 0 };
      }
      areaMap[areaKey].total++;
      if (c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED') {
        areaMap[areaKey].resolved++;
        const created = new Date(c.createdAt).getTime();
        const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : created;
        areaMap[areaKey].hoursSum += Math.max(1, (updated - created) / (3600 * 1000));
      } else {
        areaMap[areaKey].open++;
      }
      if (c.priority?.level === 'critical' || c.priority?.score >= 75) {
        areaMap[areaKey].critical++;
      }
    }

    const areaWisePerformance = Object.entries(areaMap).map(([k, v]) => ({
      areaKey: k,
      areaName: v.name,
      total: v.total,
      open: v.open,
      resolved: v.resolved,
      critical: v.critical,
      resolutionRate: v.total > 0 ? Math.round((v.resolved / v.total) * 100) : 0,
      avgResolutionHours: v.resolved > 0 ? Math.round(v.hoursSum / v.resolved) : 24,
    })).sort((a, b) => b.total - a.total);

    // Compute clusters
    const clusters = this.clusterComplaints(filtered, 200);

    // Approximate area coverage: 15 km² for urban municipal center
    const estimatedAreaKm2 = Math.max(5, (areaWisePerformance.length || 1) * 3);
    const complaintsPerKm2 = Number((total / estimatedAreaKm2).toFixed(1));
    let densityLevel: 'low' | 'moderate' | 'dense' | 'critical' = 'low';
    if (complaintsPerKm2 > 4) densityLevel = 'critical';
    else if (complaintsPerKm2 > 2) densityLevel = 'dense';
    else if (complaintsPerKm2 > 0.8) densityLevel = 'moderate';

    // Official boundary overlays for Coimbatore & Chennai
    const verifiedBoundaries = [
      {
        id: 'ccmc_zone_east',
        name: 'Coimbatore East Zone',
        type: 'zone' as const,
        boundaryBox: { minLat: 10.970, maxLat: 11.035, minLng: 76.980, maxLng: 77.060 },
        center: { lat: 11.0018, lng: 77.0143 },
        complaintCount: filtered.filter((c) => c.location?.zone?.includes('East') || (c.location?.lat >= 10.970 && c.location?.lat <= 11.035 && c.location?.lng >= 76.980 && c.location?.lng <= 77.060)).length,
      },
      {
        id: 'ccmc_zone_west',
        name: 'Coimbatore West Zone',
        type: 'zone' as const,
        boundaryBox: { minLat: 10.990, maxLat: 11.045, minLng: 76.910, maxLng: 76.965 },
        center: { lat: 11.0125, lng: 76.9450 },
        complaintCount: filtered.filter((c) => c.location?.zone?.includes('West') || (c.location?.lat >= 10.990 && c.location?.lat <= 11.045 && c.location?.lng >= 76.910 && c.location?.lng <= 76.965)).length,
      },
      {
        id: 'ccmc_zone_north',
        name: 'Coimbatore North Zone',
        type: 'zone' as const,
        boundaryBox: { minLat: 11.025, maxLat: 11.100, minLng: 76.950, maxLng: 77.030 },
        center: { lat: 11.0480, lng: 76.9920 },
        complaintCount: filtered.filter((c) => c.location?.zone?.includes('North') || (c.location?.lat >= 11.025 && c.location?.lat <= 11.100 && c.location?.lng >= 76.950 && c.location?.lng <= 77.030)).length,
      },
      {
        id: 'ccmc_zone_central',
        name: 'Coimbatore Central Zone',
        type: 'zone' as const,
        boundaryBox: { minLat: 10.980, maxLat: 11.020, minLng: 76.945, maxLng: 76.985 },
        center: { lat: 10.9980, lng: 76.9650 },
        complaintCount: filtered.filter((c) => c.location?.zone?.includes('Central') || (c.location?.lat >= 10.980 && c.location?.lat <= 11.020 && c.location?.lng >= 76.945 && c.location?.lng <= 76.985)).length,
      },
      {
        id: 'sulur_panchayat',
        name: 'Sulur Town Panchayat',
        type: 'zone' as const,
        boundaryBox: { minLat: 11.000, maxLat: 11.055, minLng: 77.090, maxLng: 77.160 },
        center: { lat: 11.0267, lng: 77.1264 },
        complaintCount: filtered.filter((c) => c.location?.city?.includes('Sulur') || (c.location?.lat >= 11.000 && c.location?.lat <= 11.055 && c.location?.lng >= 77.090 && c.location?.lng <= 77.160)).length,
      },
    ];

    return {
      filterApplied: filter,
      totalGrievances: total,
      openGrievances: openList.length,
      resolvedGrievances: resolvedList.length,
      criticalGrievances: criticalList.length,
      averageResolutionHours,
      overdueComplaints: overdueList.length,
      communityConfirmationsCount: totalConfirmations,
      geographicDensity: {
        complaintsPerSquareKm: complaintsPerKm2,
        densityLevel,
      },
      departmentWorkload,
      areaWisePerformance,
      clusters,
      verifiedBoundaries,
    };
  }

  /**
   * Chronic / Recurring Issue Detection Engine (Requirement 6)
   * Detects repeated infrastructure failures within 100m over a 90-day window.
   */
  public detectRecurringIssues(
    complaints: any[],
    maxDistanceMeters = 100,
    lookbackDays = 90
  ): RecurringIssuePattern[] {
    const now = Date.now();
    const cutoffTime = now - lookbackDays * 86400 * 1000;
    const recent = complaints.filter(
      (c) => new Date(c.createdAt).getTime() >= cutoffTime && c.location?.lat && c.location?.lng
    );

    const patterns: RecurringIssuePattern[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < recent.length; i++) {
      const c1 = recent[i];
      if (visited.has(c1.id)) continue;

      const group: any[] = [c1];
      for (let j = i + 1; j < recent.length; j++) {
        const c2 = recent[j];
        if (visited.has(c2.id)) continue;

        // Same or related issue category
        const sameCategory =
          c1.userCategory === c2.userCategory ||
          (c1.userCategory?.includes('road') && c2.userCategory?.includes('road')) ||
          (c1.userCategory?.includes('drainage') && c2.userCategory?.includes('sewage'));

        if (sameCategory) {
          const dist = this.haversineDistanceMeters(
            c1.location.lat,
            c1.location.lng,
            c2.location.lat,
            c2.location.lng
          );
          if (dist <= maxDistanceMeters) {
            group.push(c2);
            visited.add(c2.id);
          }
        }
      }

      // If at least 2 issues occurred in close proximity within window, flag recurrence pattern
      if (group.length >= 2) {
        visited.add(c1.id);
        const sorted = [...group].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const firstDate = sorted[0].createdAt;
        const lastDate = sorted[sorted.length - 1].createdAt;
        const spanDays = Math.max(
          1,
          Math.round(
            (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (86400 * 1000)
          )
        );
        const avgInterval = Math.round((spanDays / (group.length - 1)) * 10) / 10;

        const cat = c1.userCategory || 'pothole_road_damage';
        let rootCause = 'Chronic structural fatigue due to sub-surface moisture or foundation inadequacy.';
        let action = 'Commission ground-penetrating radar survey and conduct full-depth sub-base reconstruction.';

        if (cat.includes('sanitation') || cat.includes('garbage') || cat.includes('dumping')) {
          rootCause = 'Absence of designated community waste receptacle causing recurrent informal dumping.';
          action = 'Install 2.5m³ dumper placer bin, introduce biometric worker surveillance, and schedule 2x daily clearance.';
        } else if (cat.includes('water') || cat.includes('drainage') || cat.includes('sewage')) {
          rootCause = 'Under-capacity or cracked legacy earthenware stormwater conduit with hydraulic bottleneck.';
          action = 'Upgrade 60m trunk line to 900mm reinforced concrete pipe with intermediate silt-trap manholes.';
        } else if (cat.includes('electrical')) {
          rootCause = 'Overhead distribution line sagging and recurring tree branch entanglement during wind.';
          action = 'Underground power cabling conversion or install aerial bunched cables (ABC) with insulated conductors.';
        }

        const riskWeight = Math.min(100, group.length * 20 + (avgInterval < 15 ? 30 : 15));

        patterns.push({
          id: `pattern_${c1.id}_${patterns.length + 1}`,
          category: cat,
          approxAddress: c1.location.addressText || 'Municipal Corridor',
          ward: c1.location.ward || 'Ward 114',
          centroid: {
            lat: Number((group.reduce((acc, c) => acc + c.location.lat, 0) / group.length).toFixed(6)),
            lng: Number((group.reduce((acc, c) => acc + c.location.lng, 0) / group.length).toFixed(6)),
          },
          recurrenceCount: group.length,
          isChronic: group.length >= 3,
          firstReportedDate: firstDate,
          latestReportedDate: lastDate,
          recurrenceIntervalDays: avgInterval,
          complaintIds: group.map((c) => c.id),
          publicIds: group.map((c) => c.publicId),
          rootCauseHypothesis: rootCause,
          recommendedEngineeringAction: action,
          riskWeight,
        });
      }
    }

    return patterns.sort((a, b) => b.recurrenceCount - a.recurrenceCount);
  }

  /**
   * Explainable Infrastructure Risk Index Engine (Requirement 7)
   * Combines Issue Density (0-25), Severity Weights (0-30), Recurrence (0-25), and SLA Latency (0-20).
   * Strict mathematical range: 0 - 100 with transparent factor breakdown.
   */
  public computeInfrastructureRiskIndex(
    complaints: any[],
    areaKey?: string
  ): InfrastructureRiskAssessment {
    const list = areaKey
      ? complaints.filter((c) => c.location?.ward === areaKey || c.location?.locality === areaKey)
      : complaints;

    const total = list.length;
    const now = Date.now();

    // 1. Density Score (0 - 25 points)
    // Urban baseline: 5+ open issues in a ward = 25 pts
    const openComplaints = list.filter(
      (c) => c.status !== 'RESOLVED' && c.status !== 'CITIZEN_VERIFIED' && c.status !== 'REJECTED'
    );
    const densityScore = Math.min(25, Math.round((openComplaints.length / 5) * 25));

    // 2. Severity Score (0 - 30 points)
    // Critical (safetyRisk=2 or priority='critical') = 10 pts each, High = 5 pts each
    const criticalList = openComplaints.filter(
      (c) => c.priority?.level === 'critical' || c.priority?.score >= 75
    );
    const highList = openComplaints.filter(
      (c) => c.priority?.level === 'high' || (c.priority?.score >= 50 && c.priority?.score < 75)
    );
    const severityScore = Math.min(30, criticalList.length * 10 + highList.length * 5);

    // 3. Recurrence Score (0 - 25 points)
    // Recurring clusters within area
    const recurringPatterns = this.detectRecurringIssues(list, 150, 90);
    const chronicCount = recurringPatterns.filter((p) => p.isChronic).length;
    const recurrenceScore = Math.min(
      25,
      chronicCount * 12 + (recurringPatterns.length - chronicCount) * 6
    );

    // 4. SLA Latency Score (0 - 20 points)
    // Overdue complaints (>72h without resolution) = 5 pts each
    const overdueCount = openComplaints.filter((c) => {
      const created = new Date(c.createdAt).getTime();
      return now - created > 72 * 3600 * 1000;
    }).length;
    const slaLatencyScore = Math.min(20, overdueCount * 5);

    // Composite Index strictly 0 - 100
    const overallRiskIndex = Math.min(
      100,
      Math.max(0, densityScore + severityScore + recurrenceScore + slaLatencyScore)
    );

    let riskTier: InfrastructureRiskAssessment['riskTier'] = 'LOW';
    if (overallRiskIndex >= 76) riskTier = 'CRITICAL';
    else if (overallRiskIndex >= 51) riskTier = 'ELEVATED';
    else if (overallRiskIndex >= 26) riskTier = 'MODERATE';

    const explanation = `Infrastructure Risk Index for ${areaKey || 'Municipal Territory'} evaluated at ${overallRiskIndex}/100 (${riskTier}). Breakdown: Issue Density (${densityScore}/25 from ${openComplaints.length} open reports), Hazard Severity (${severityScore}/30 from ${criticalList.length} critical / ${highList.length} high priority hazards), Chronic Recurrence (${recurrenceScore}/25 from ${recurringPatterns.length} localized hotspot patterns), and SLA Backlog Latency (${slaLatencyScore}/20 from ${overdueCount} overdue breaches).`;

    return {
      areaKey: areaKey || 'city_wide',
      areaName: areaKey || 'Greater Chennai Metropolitan Area',
      overallRiskIndex,
      riskTier,
      formulaBreakdown: {
        densityScore,
        severityScore,
        recurrenceScore,
        slaLatencyScore,
      },
      explanation,
      totalComplaints: total,
      criticalHazardsCount: criticalList.length,
      chronicHotspotsCount: recurringPatterns.length,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const intelligenceService = new IntelligenceService();
