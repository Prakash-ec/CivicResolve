import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Building,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { apiClient } from '../../services/api.js';

export interface GeographicSelection {
  state: string;
  district: string;
  municipality: string;
  zone?: string;
  zoneId?: string;
  ward?: string;
  wardId?: string;
  block?: string;
  locality?: string;
  verificationStatus: 'verified' | 'unverified' | 'citizen_specified';
}

interface GeographicHierarchySelectorProps {
  value: Partial<GeographicSelection>;
  onChange: (selection: GeographicSelection) => void;
  className?: string;
}

export const GeographicHierarchySelector: React.FC<GeographicHierarchySelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { t } = useTranslation();

  // Hierarchy Data from Server
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Current selections
  const [selectedState, setSelectedState] = useState(value.state || 'Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || 'Coimbatore');
  const [selectedMunicipality, setSelectedMunicipality] = useState(
    value.municipality || 'Coimbatore City Municipal Corporation'
  );
  const [selectedZone, setSelectedZone] = useState(value.zone || '');
  const [selectedWard, setSelectedWard] = useState(value.ward || '');
  const [selectedLocality, setSelectedLocality] = useState(value.locality || '');

  // Fetch Authoritative Hierarchy
  useEffect(() => {
    let active = true;
    const fetchTaxonomy = async () => {
      try {
        const res = await apiClient<{ success: boolean; hierarchy: any }>('/geography/hierarchy');
        if (active && res.hierarchy) {
          setHierarchyData(res.hierarchy);
        }
      } catch (err) {
        console.warn('Unable to load server hierarchy, using local fallback:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTaxonomy();
    return () => {
      active = false;
    };
  }, []);

  // Sync external changes (e.g. from GPS / reverse geocoding)
  useEffect(() => {
    if (value.state && value.state !== selectedState) setSelectedState(value.state);
    if (value.district && value.district !== selectedDistrict) setSelectedDistrict(value.district);
    if (value.municipality && value.municipality !== selectedMunicipality)
      setSelectedMunicipality(value.municipality);
    if (value.zone && value.zone !== selectedZone) setSelectedZone(value.zone);
    if (value.ward && value.ward !== selectedWard) setSelectedWard(value.ward);
    if (value.locality && value.locality !== selectedLocality) setSelectedLocality(value.locality);
  }, [value.state, value.district, value.municipality, value.zone, value.ward, value.locality]);

  // Derive cascaded lists
  const states = hierarchyData?.states || [
    {
      id: 'tn',
      name: 'Tamil Nadu',
      districts: [
        {
          id: 'cbe',
          name: 'Coimbatore',
          municipalities: [
            {
              id: 'ccmc',
              name: 'Coimbatore City Municipal Corporation',
              zones: [
                {
                  id: 'ccmc_zone_east',
                  name: 'East Zone',
                  wards: [
                    { id: 'ccmc_ward_50', number: '50', name: 'Singanallur North' },
                    { id: 'ccmc_ward_51', number: '51', name: 'Singanallur South' },
                    { id: 'ccmc_ward_52', number: '52', name: 'Ramanathapuram North' },
                    { id: 'ccmc_ward_53', number: '53', name: 'Ramanathapuram South' },
                    { id: 'ccmc_ward_54', number: '54', name: 'Ondipudur' },
                    { id: 'ccmc_ward_56', number: '56', name: 'Varadharajapuram' },
                    { id: 'ccmc_ward_57', number: '57', name: 'Masakalipalayam' },
                  ],
                  localities: ['Singanallur', 'Ramanathapuram', 'Ondipudur', 'Varadharajapuram', 'Masakalipalayam'],
                },
                {
                  id: 'ccmc_zone_west',
                  name: 'West Zone',
                  wards: [
                    { id: 'ccmc_ward_16', number: '16', name: 'RS Puram West' },
                    { id: 'ccmc_ward_17', number: '17', name: 'RS Puram East' },
                    { id: 'ccmc_ward_18', number: '18', name: 'Saibaba Colony' },
                    { id: 'ccmc_ward_22', number: '22', name: 'Vadavalli' },
                  ],
                  localities: ['RS Puram', 'Saibaba Colony', 'Vadavalli', 'Koundampalayam'],
                },
                {
                  id: 'ccmc_zone_north',
                  name: 'North Zone',
                  wards: [
                    { id: 'ccmc_ward_1', number: '01', name: 'Saravanampatti West' },
                    { id: 'ccmc_ward_5', number: '05', name: 'Ganapathy North' },
                    { id: 'ccmc_ward_8', number: '08', name: 'Peelamedu North' },
                  ],
                  localities: ['Saravanampatti', 'Ganapathy', 'Peelamedu', 'Vilankurichi'],
                },
                {
                  id: 'ccmc_zone_central',
                  name: 'Central Zone',
                  wards: [
                    { id: 'ccmc_ward_31', number: '31', name: 'Town Hall' },
                    { id: 'ccmc_ward_32', number: '32', name: 'Gandhipuram Central' },
                    { id: 'ccmc_ward_35', number: '35', name: 'Race Course' },
                  ],
                  localities: ['Town Hall', 'Gandhipuram', 'Race Course', 'Ukkadam'],
                },
              ],
            },
            {
              id: 'sulur',
              name: 'Sulur Town Panchayat',
              zones: [
                {
                  id: 'sulur_zone',
                  name: 'Sulur Panchayat Area',
                  wards: [
                    { id: 'sulur_ward_1', number: '01', name: 'Sulur Bus Stand' },
                    { id: 'sulur_ward_2', number: '02', name: 'Air Force Station Area' },
                    { id: 'sulur_ward_3', number: '03', name: 'Ranganathapuram' },
                    { id: 'sulur_ward_4', number: '04', name: 'Kalangal Road' },
                  ],
                  localities: ['Sulur', 'Ranganathapuram', 'Kalangal Road', 'Kannampalayam'],
                },
              ],
            },
          ],
        },
        {
          id: 'chn',
          name: 'Chennai',
          municipalities: [
            {
              id: 'gcc',
              name: 'Greater Chennai Corporation',
              zones: [
                {
                  id: 'gcc_zone_9',
                  name: 'Zone 9 - Teynampet',
                  wards: [
                    { id: 'gcc_ward_114', number: '114', name: 'Mylapore' },
                    { id: 'gcc_ward_115', number: '115', name: 'Alwarpet' },
                  ],
                  localities: ['Mylapore', 'Alwarpet', 'Teynampet'],
                },
                {
                  id: 'gcc_zone_8',
                  name: 'Zone 8 - Anna Nagar',
                  wards: [
                    { id: 'gcc_ward_101', number: '101', name: 'Anna Nagar West' },
                    { id: 'gcc_ward_102', number: '102', name: 'Anna Nagar Roundtana' },
                  ],
                  localities: ['Anna Nagar', 'Shenoy Nagar'],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  const currentDistrictObj = states
    .find((s: any) => s.name === selectedState)
    ?.districts.find((d: any) => d.name === selectedDistrict);

  const currentMunicipalityObj = currentDistrictObj?.municipalities.find(
    (m: any) => m.name === selectedMunicipality
  );

  const availableZones: any[] = currentMunicipalityObj?.zones || [];

  const currentZoneObj = availableZones.find(
    (z: any) => z.name === selectedZone || z.id === selectedZone
  );

  const availableWards: any[] = currentZoneObj?.wards || [];
  const availableLocalities: string[] = currentZoneObj?.localities || [];

  // Handlers for Cascading Resets
  const handleStateChange = (st: string) => {
    setSelectedState(st);
    setSelectedDistrict('');
    setSelectedMunicipality('');
    setSelectedZone('');
    setSelectedWard('');
    setSelectedLocality('');
    notifyChange(st, '', '', '', '', '', 'citizen_specified');
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    setSelectedMunicipality('');
    setSelectedZone('');
    setSelectedWard('');
    setSelectedLocality('');
    notifyChange(selectedState, dist, '', '', '', '', 'citizen_specified');
  };

  const handleMunicipalityChange = (muni: string) => {
    setSelectedMunicipality(muni);
    setSelectedZone('');
    setSelectedWard('');
    setSelectedLocality('');
    notifyChange(selectedState, selectedDistrict, muni, '', '', '', 'citizen_specified');
  };

  const handleZoneChange = (zName: string) => {
    setSelectedZone(zName);
    setSelectedWard('');
    setSelectedLocality('');
    const matchedZone = availableZones.find((z) => z.name === zName || z.id === zName);
    notifyChange(
      selectedState,
      selectedDistrict,
      selectedMunicipality,
      zName,
      '',
      '',
      'citizen_specified',
      matchedZone?.id
    );
  };

  const handleWardChange = (wName: string) => {
    setSelectedWard(wName);
    const matchedWard = availableWards.find((w) => w.name === wName || `${w.number} - ${w.name}` === wName);
    notifyChange(
      selectedState,
      selectedDistrict,
      selectedMunicipality,
      selectedZone,
      wName,
      selectedLocality,
      'citizen_specified',
      currentZoneObj?.id,
      matchedWard?.id
    );
  };

  const handleLocalityChange = (loc: string) => {
    setSelectedLocality(loc);
    notifyChange(
      selectedState,
      selectedDistrict,
      selectedMunicipality,
      selectedZone,
      selectedWard,
      loc,
      'citizen_specified',
      currentZoneObj?.id
    );
  };

  const notifyChange = (
    st: string,
    dist: string,
    muni: string,
    zn: string,
    wd: string,
    loc: string,
    status: 'verified' | 'unverified' | 'citizen_specified',
    zId?: string,
    wId?: string
  ) => {
    onChange({
      state: st,
      district: dist,
      municipality: muni,
      zone: zn || undefined,
      zoneId: zId || undefined,
      ward: wd || undefined,
      wardId: wId || undefined,
      locality: loc || undefined,
      verificationStatus: status,
    });
  };

  return (
    <div className={`space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#0F2854]" />
          <span className="font-bold text-[#0F2854] text-xs uppercase tracking-wider">
            Authoritative Civic Geographic Hierarchy
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
            value.verificationStatus === 'verified'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          {value.verificationStatus === 'verified' ? 'GIS Verified' : 'Citizen Specified'}
        </span>
      </div>

      <p className="text-[11px] text-slate-500">
        Select your state, district, and municipal corporation. Wards and localities dynamically adjust based on administrative boundaries.
      </p>

      {/* Cascading Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* State */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
          >
            {states.map((s: any) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
          >
            <option value="">-- Select District --</option>
            {states
              .find((s: any) => s.name === selectedState)
              ?.districts.map((d: any) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
          </select>
        </div>

        {/* City / Municipality */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            City / Municipality / Panchayat
          </label>
          <select
            value={selectedMunicipality}
            onChange={(e) => handleMunicipalityChange(e.target.value)}
            disabled={!selectedDistrict}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">-- Select Municipality --</option>
            {currentDistrictObj?.municipalities.map((m: any) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Zone (if applicable)
          </label>
          <select
            value={selectedZone}
            onChange={(e) => handleZoneChange(e.target.value)}
            disabled={availableZones.length === 0}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">-- Select Zone --</option>
            {availableZones.map((z: any) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ward */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Ward (if applicable)
          </label>
          <select
            value={selectedWard}
            onChange={(e) => handleWardChange(e.target.value)}
            disabled={availableWards.length === 0}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">-- Select Ward --</option>
            {availableWards.map((w: any) => (
              <option key={w.id} value={w.name}>
                {w.number ? `Ward ${w.number} - ` : ''}
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Locality / Neighbourhood */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Locality / Neighbourhood
          </label>
          {availableLocalities.length > 0 ? (
            <select
              value={selectedLocality}
              onChange={(e) => handleLocalityChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            >
              <option value="">-- Select Locality --</option>
              {availableLocalities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedLocality}
              onChange={(e) => handleLocalityChange(e.target.value)}
              placeholder="e.g. Singanallur, Sulur"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            />
          )}
        </div>
      </div>
    </div>
  );
};
