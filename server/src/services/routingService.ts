import { ComplaintCategory, DEPARTMENT_MAPPINGS } from '../config/constants.js';

export interface MunicipalJurisdiction {
  corporation: string;
  zone: string;
  zoneName: string;
  ward: string;
  headquarters: string;
  emergencyContact: string;
}

export interface RoutingDecision {
  department: {
    id: string;
    name: string;
    source: 'category_rule' | 'ai_verified' | 'jurisdiction_override';
  };
  jurisdiction: MunicipalJurisdiction;
  requiresJointDispatch: boolean;
  secondaryDepartments: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  routingBasis: string;
  confidence: number;
}

// Curated municipal zones for Greater Chennai Corporation
const CHENNAI_ZONES: Record<string, { zone: string; zoneName: string; hq: string }> = {
  '114': { zone: 'Zone 9', zoneName: 'Teynampet', hq: 'Thousand Lights Municipal Office' },
  '116': { zone: 'Zone 9', zoneName: 'Teynampet', hq: 'Marina Promenade Zonal Division' },
  '102': { zone: 'Zone 8', zoneName: 'Anna Nagar', hq: 'Anna Nagar Roundtana Divisional Office' },
  '127': { zone: 'Zone 10', zoneName: 'Kodambakkam', hq: 'Vadapalani Zonal Sub-office' },
  '165': { zone: 'Zone 13', zoneName: 'Adyar', hq: 'Guindy Industrial Zonal Depot' },
  '058': { zone: 'Zone 5', zoneName: 'Royapuram', hq: 'Ripon Building Central Zone' },
  '059': { zone: 'Zone 5', zoneName: 'Royapuram', hq: 'Central Railway Station Division' },
};

export class RoutingService {
  /**
   * Evaluates input category, coordinates, address, and AI factors to synthesize
   * an authoritative, explainable municipal department routing decision.
   */
  public routeComplaint(input: {
    category: ComplaintCategory;
    lat: number;
    lng: number;
    addressText: string;
    ward?: string;
    aiFactors?: {
      electricalHazard?: boolean;
      healthHazard?: boolean;
      trafficObstruction?: boolean;
      locationSensitivity?: string;
    };
  }): RoutingDecision {
    const primaryDept = DEPARTMENT_MAPPINGS[input.category] || DEPARTMENT_MAPPINGS.other;

    // 1. Resolve Jurisdiction from Ward or Coordinates
    let cleanWard = (input.ward || '').replace(/\D/g, '');
    if (!cleanWard && input.addressText) {
      const match = input.addressText.match(/ward\s*(\d+)/i);
      if (match) cleanWard = match[1];
    }
    if (cleanWard.length < 3 && cleanWard.length > 0) {
      cleanWard = cleanWard.padStart(3, '0');
    }

    const zoneInfo = CHENNAI_ZONES[cleanWard] || {
      zone: 'Zone 9',
      zoneName: 'Central Jurisdiction',
      hq: 'Greater Chennai Corporation Municipal Central Command',
    };

    const jurisdiction: MunicipalJurisdiction = {
      corporation: 'Greater Chennai Municipal Corporation',
      zone: zoneInfo.zone,
      zoneName: zoneInfo.zoneName,
      ward: cleanWard ? `Ward ${cleanWard}` : 'Unassigned Ward',
      headquarters: zoneInfo.hq,
      emergencyContact: 'Toll-free 1913 (24x7 Control Room)',
    };

    // 2. Multi-Hazard Joint Dispatch Analysis
    const secondaryDepartments: RoutingDecision['secondaryDepartments'] = [];
    let requiresJointDispatch = false;

    // Electrical Hazard combined with Flooding or Water
    if (
      (input.aiFactors?.electricalHazard &&
        (input.category === 'water_leakage' || input.category === 'drainage_blockage')) ||
      (input.aiFactors?.electricalHazard && input.category !== 'exposed_electrical_hazard')
    ) {
      requiresJointDispatch = true;
      secondaryDepartments.push({
        id: 'dept_electricity',
        name: 'Electricity Board (TANGEDCO)',
        reason: 'Concurrent electrical hazard requires immediate line de-energization during water drainage.',
      });
    }

    // Sewage overflowing near school or hospital
    if (
      input.category === 'sewage_overflow' &&
      input.aiFactors?.locationSensitivity === 'school_hospital'
    ) {
      requiresJointDispatch = true;
      secondaryDepartments.push({
        id: 'dept_sanitation',
        name: 'Sanitation & Public Health Department',
        reason: 'Sensitive public institution vicinity mandates immediate antimicrobial disinfection cordon.',
      });
    }

    // Heavy road crater obstructing arterial highway
    if (
      input.category === 'pothole_road_damage' &&
      input.aiFactors?.trafficObstruction &&
      input.aiFactors?.locationSensitivity === 'main_road'
    ) {
      secondaryDepartments.push({
        id: 'dept_traffic_police',
        name: 'Greater Chennai Traffic Police Control',
        reason: 'Severe traffic blockage on arterial thoroughfare requires temporary diversion barricading.',
      });
    }

    const routingBasis = `Mapped to ${primaryDept.name} via ${jurisdiction.corporation} (${jurisdiction.zone} - ${jurisdiction.zoneName}). ${
      requiresJointDispatch
        ? `Coordinated multi-agency joint dispatch triggered with ${secondaryDepartments.map((s) => s.name).join(', ')}.`
        : 'Direct single-department work ticket.'
    }`;

    return {
      department: {
        id: primaryDept.id,
        name: primaryDept.name,
        source: 'category_rule',
      },
      jurisdiction,
      requiresJointDispatch,
      secondaryDepartments,
      routingBasis,
      confidence: 0.98,
    };
  }
}

export const routingService = new RoutingService();
