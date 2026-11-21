import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Rectangle,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BrainCircuit,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Building,
  Truck,
  Sparkles,
  Compass,
  Radio,
  Clock,
  ThumbsUp,
  ExternalLink,
  ShieldCheck,
  Building2,
  Info,
} from 'lucide-react';
import { intelligenceService, adminService } from '../../services/api.js';
import { HotspotCluster, WardMetric, CivicRecommendation } from '../../types/index.js';
import { Button } from '../../components/ui/Button.js';

// Custom Map Centering Hook
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center[0], center[1], zoom, map]);
  return null;
};

// Custom Marker Icon for Centroids
const createClusterPin = (severity: string, count: number) => {
  const bgColor =
    severity === 'critical'
      ? '#DC2626'
      : severity === 'high'
      ? '#EA580C'
      : severity === 'moderate'
      ? '#D97706'
      : '#2563EB';

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 13px;
        border: 2.5px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      ">
        ${count}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createComplaintPin = (severity: string) => {
  const color = severity === 'critical' ? '#DC2626' : severity === 'high' ? '#EA580C' : '#2563EB';
  return L.divIcon({
    className: 'complaint-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export const CivicIntelligencePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Geographic Level Filters
  const [filterState, setFilterState] = useState<string>('Tamil Nadu');
  const [filterDistrict, setFilterDistrict] = useState<string>('Coimbatore');
  const [filterMunicipality, setFilterMunicipality] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterWard, setFilterWard] = useState<string>('all');

  // Geographic Analytics Data
  const [geoAnalytics, setGeoAnalytics] = useState<any>(null);
  const [clusters, setClusters] = useState<HotspotCluster[]>([]);
  const [wards, setWards] = useState<WardMetric[]>([]);
  const [recommendations, setRecommendations] = useState<CivicRecommendation[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<number>(150);

  // Active Selections
  const [selectedCluster, setSelectedCluster] = useState<HotspotCluster | null>(null);
  const [selectedBoundary, setSelectedBoundary] = useState<any>(null);
  const [selectedComplaintPreview, setSelectedComplaintPreview] = useState<any>(null);
  const [dispatchedActions, setDispatchedActions] = useState<Record<string, boolean>>({});

  const loadAllIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const [geoRes, clRes, wdRes, rcRes] = await Promise.all([
        intelligenceService.getGeographicAnalytics({
          state: filterState,
          district: filterDistrict,
          municipality: filterMunicipality,
          zone: filterZone,
          ward: filterWard,
        }),
        intelligenceService.getHotspots(selectedRadius),
        intelligenceService.getWards(),
        intelligenceService.getRecommendations(),
      ]);

      if (geoRes.analytics) {
        setGeoAnalytics(geoRes.analytics);
      }
      setClusters(clRes.clusters || []);
      setWards(wdRes.wards || []);
      setRecommendations(rcRes.recommendations || []);

      if (clRes.clusters && clRes.clusters.length > 0) {
        setSelectedCluster(clRes.clusters[0]);
      }
    } catch (err: any) {
      console.error('Failed to load civic intelligence:', err);
      setError('Could not retrieve intelligence telemetry. Verify municipal server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllIntelligence();
  }, [filterState, filterDistrict, filterMunicipality, filterZone, filterWard, selectedRadius]);

  const handleDispatchAction = (recId: string) => {
    setDispatchedActions((prev) => ({ ...prev, [recId]: true }));
    setTimeout(() => {
      alert('Municipal rapid-intervention unit dispatched! Field crews notified.');
    }, 200);
  };

  const handleZoneClick = (boundary: any) => {
    setSelectedBoundary(boundary);
    setFilterZone(boundary.name.replace('Coimbatore ', ''));
  };

  const handleResetFilters = () => {
    setFilterMunicipality('all');
    setFilterZone('all');
    setFilterWard('all');
    setSelectedBoundary(null);
  };

  const defaultCenter: [number, number] = selectedBoundary?.center?.lat != null
    ? [selectedBoundary.center.lat, selectedBoundary.center.lng]
    : clusters.length > 0 && clusters[0]?.centroid?.lat != null
    ? [clusters[0].centroid.lat, clusters[0].centroid.lng]
    : [11.0018, 77.0143];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transform-gpu transition-all">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0F2854] border border-blue-200 text-xs font-bold mb-2">
            <BrainCircuit className="w-3.5 h-3.5 text-orange-500" />
            <span>Civic Geographic Intelligence & Spatial Redressal Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
            City Command Intelligence Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Authoritative municipal boundary analysis for Coimbatore & Chennai. Real-time Haversine clustering, Civic Impact Scoring, and automated rapid-dispatch triggers.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <span className="px-2.5 py-1 text-slate-500 font-bold text-[10px] uppercase">Cluster Radius:</span>
            {[100, 150, 300].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRadius(r)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedRadius === r
                    ? 'bg-[#0F2854] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}m
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={loadAllIntelligence}
            disabled={loading}
            className="bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-xs font-bold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Geographic Level Filters Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-[#0F2854] uppercase tracking-wider">
              Geographic Drilldown Filters
            </span>
          </div>
          {(filterMunicipality !== 'all' || filterZone !== 'all' || filterWard !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              Reset Area Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* State */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="Tamil Nadu">Tamil Nadu</option>
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">District</label>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="Coimbatore">Coimbatore</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>

          {/* Municipality */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Municipality</label>
            <select
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="all">All Municipalities</option>
              <option value="Coimbatore City Municipal Corporation">Coimbatore Corp (CCMC)</option>
              <option value="Sulur Town Panchayat">Sulur Town Panchayat</option>
              <option value="Greater Chennai Corporation">Chennai Corp (GCC)</option>
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zone</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="all">All Zones</option>
              <option value="East Zone">East Zone (Singanallur)</option>
              <option value="West Zone">West Zone (RS Puram)</option>
              <option value="North Zone">North Zone (Peelamedu)</option>
              <option value="Central Zone">Central Zone (Town Hall)</option>
              <option value="Sulur">Sulur Panchayat Zone</option>
              <option value="Zone 9">Chennai Zone 9 (Teynampet)</option>
            </select>
          </div>

          {/* Ward */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ward</label>
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
            >
              <option value="all">All Wards</option>
              <option value="Ward 50">Ward 50 (Singanallur North)</option>
              <option value="Ward 51">Ward 51 (Singanallur South)</option>
              <option value="Ward 16">Ward 16 (RS Puram West)</option>
              <option value="Ward 31">Ward 31 (Town Hall)</option>
              <option value="Ward 01">Ward 01 (Sulur / Saravanampatti)</option>
              <option value="Ward 114">Ward 114 (Mylapore GCC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Real Data Metric Cards */}
      {geoAnalytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Grievances */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Grievances
            </span>
            <div className="text-2xl font-black text-[#0F2854]">{geoAnalytics.totalGrievances}</div>
            <span className="text-[10px] text-slate-500 font-medium">In selected jurisdiction</span>
          </div>

          {/* Open Grievances */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active / Open
            </span>
            <div className="text-2xl font-black text-amber-600">{geoAnalytics.openGrievances}</div>
            <span className="text-[10px] text-slate-500 font-medium">Field queue</span>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Resolved & Closed
            </span>
            <div className="text-2xl font-black text-emerald-600">
              {geoAnalytics.resolvedGrievances}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Citizen verified</span>
          </div>

          {/* Critical Hazard */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Critical Urgency
            </span>
            <div className="text-2xl font-black text-red-600">
              {geoAnalytics.criticalGrievances}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Score &ge; 75 / hazard</span>
          </div>

          {/* Average Resolution Time */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Resolution Time
            </span>
            <div className="text-2xl font-black text-[#0F2854]">
              {geoAnalytics.averageResolutionHours}h
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Municipal dispatch speed</span>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Overdue (&gt;72h)
            </span>
            <div className="text-2xl font-black text-orange-600">
              {geoAnalytics.overdueComplaints}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">SLA Breach Warning</span>
          </div>
        </div>
      )}

      {/* Main Map & Area Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Leaflet Map with Boundary Overlays */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-bold text-[#0F2854]">
                Interactive Geographic Boundary & Hotspot Map
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Critical
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> High
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Moderate
              </span>
            </div>
          </div>

          {/* Map Frame */}
          <div className="h-[420px] w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner z-0">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors, CCMC GIS"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ChangeView center={defaultCenter} zoom={selectedBoundary ? 14 : 13} />

              {/* Verified Municipal Boundary Overlays */}
              {geoAnalytics?.verifiedBoundaries?.map((boundary: any) => {
                const box = boundary.boundaryBox;
                const isSelected = selectedBoundary?.id === boundary.id;

                return (
                  <Rectangle
                    key={boundary.id}
                    bounds={[
                      [box.minLat, box.minLng],
                      [box.maxLat, box.maxLng],
                    ]}
                    pathOptions={{
                      color: isSelected ? '#EA580C' : '#0F2854',
                      weight: isSelected ? 3 : 1.5,
                      fillColor: isSelected ? '#EA580C' : '#3B82F6',
                      fillOpacity: isSelected ? 0.2 : 0.08,
                      dashArray: isSelected ? undefined : '5, 5',
                    }}
                    eventHandlers={{
                      click: () => handleZoneClick(boundary),
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <strong className="block text-[#0F2854] text-sm">{boundary.name}</strong>
                        <div>Official Verified Municipal Zone</div>
                        <div className="font-bold text-orange-600">
                          {boundary.complaintCount} Grievances Recorded
                        </div>
                      </div>
                    </Popup>
                  </Rectangle>
                );
              })}

              {/* Hotspot Cluster Centroids */}
              {clusters
                .filter((cluster) => cluster?.centroid?.lat != null && cluster?.centroid?.lng != null)
                .map((cluster) => (
                <Circle
                  key={cluster.id}
                  center={[cluster.centroid.lat, cluster.centroid.lng]}
                  radius={cluster.radiusMeters}
                  pathOptions={{
                    color: cluster.severityLevel === 'critical' ? '#DC2626' : '#EA580C',
                    fillColor: cluster.severityLevel === 'critical' ? '#DC2626' : '#EA580C',
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedCluster(cluster),
                  }}
                >
                  <Marker
                    position={[cluster.centroid.lat, cluster.centroid.lng]}
                    icon={createClusterPin(cluster.severityLevel, cluster.complaintCount)}
                    eventHandlers={{
                      click: () => setSelectedCluster(cluster),
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-bold text-[#0F2854] text-sm">
                          {cluster.dominantCategory.replace(/_/g, ' ')}
                        </div>
                        <div className="text-slate-600">{cluster.centroid.approxAddress}</div>
                        <div className="font-semibold text-orange-600">
                          Impact Score: {cluster.averageImpactScore}/100
                        </div>
                        <div className="text-slate-500">
                          {cluster.complaintCount} Reports ({cluster.unresolvedCount} Open)
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </Circle>
              ))}
            </MapContainer>

            {/* Bottom Map Source Attribution Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-xs text-[10px] text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>
                GIS Boundaries: <strong>CCMC Official Portal</strong> &amp; <strong>GCC Open Data</strong>. Dash lines indicate verified zones.
              </span>
            </div>
          </div>

          {/* Area Complaint Density Indicator Bar */}
          {geoAnalytics?.geographicDensity && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
                <span>
                  <strong>Geographic Density:</strong> {geoAnalytics.geographicDensity.complaintsPerSquareKm} issues/km² ({geoAnalytics.geographicDensity.densityLevel} density).
                </span>
              </div>
              <span className="font-semibold text-slate-600">
                Community Confirmations: <strong>{geoAnalytics.communityConfirmationsCount}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Right Col: Selected Area / Cluster Detail Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#0F2854] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Zone &amp; Area Intelligence Detail</span>
            </h3>
            {selectedBoundary && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">
                Zone Active
              </span>
            )}
          </div>

          {selectedBoundary ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-orange-700">Selected Territory</span>
                <h4 className="text-base font-extrabold text-[#0F2854]">{selectedBoundary.name}</h4>
                <p className="text-slate-600 text-xs">
                  Boundary Coordinates: {selectedBoundary.center.lat}, {selectedBoundary.center.lng}
                </p>
                <div className="pt-1 text-orange-800 font-bold">
                  {selectedBoundary.complaintCount} Grievances reported in this zone.
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 text-xs">Recommended Zone Intervention:</h5>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Deploy targeted street sweepers and inspect road conduits before monsoon escalation.
                </p>
              </div>
            </div>
          ) : selectedCluster ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-700">Cluster Focal Point</span>
                <h4 className="text-base font-extrabold text-[#0F2854]">
                  {selectedCluster.dominantCategory.replace(/_/g, ' ')}
                </h4>
                <p className="text-slate-600 text-xs">{selectedCluster.centroid.approxAddress}</p>
                <div className="flex items-center justify-between pt-1 font-bold">
                  <span>Impact Score: {selectedCluster.averageImpactScore}/100</span>
                  <span className="text-orange-600">{selectedCluster.complaintCount} Citations</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Suggested Municipal Action:</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
                  {selectedCluster.suggestedAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Click a zone polygon or cluster marker on the map to inspect real-time metrics.
            </div>
          )}

          {/* Department Workload Breakdown */}
          {geoAnalytics?.departmentWorkload && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2854]">
                Department Workload In Area
              </h4>
              <div className="space-y-2">
                {geoAnalytics.departmentWorkload.slice(0, 4).map((dept: any) => (
                  <div key={dept.departmentId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate max-w-[180px]">{dept.departmentName}</span>
                      <span className="text-orange-600">{dept.total} Total</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Open: {dept.open}</span>
                      <span className="text-emerald-700 font-semibold">Resolved: {dept.resolved}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area-Wise Resolution Performance Table */}
      {geoAnalytics?.areaWisePerformance && geoAnalytics.areaWisePerformance.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#0F2854] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <span>Area-Wise Resolution Performance &amp; SLA Compliance</span>
            </h3>
            <span className="text-xs text-slate-500">Live Database Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Ward / Locality</th>
                  <th className="p-3">Total Issues</th>
                  <th className="p-3">Open</th>
                  <th className="p-3">Resolved</th>
                  <th className="p-3">Critical</th>
                  <th className="p-3">Resolution Velocity</th>
                  <th className="p-3 rounded-r-xl">Avg Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {geoAnalytics.areaWisePerformance.map((row: any) => (
                  <tr key={row.areaKey} className="hover:bg-slate-50/80 transition-colors font-medium text-slate-800">
                    <td className="p-3 font-bold text-[#0F2854]">{row.areaName}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3 text-amber-600 font-bold">{row.open}</td>
                    <td className="p-3 text-emerald-600 font-bold">{row.resolved}</td>
                    <td className="p-3">
                      {row.critical > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                          {row.critical} Critical
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${row.resolutionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px]">{row.resolutionRate}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{row.avgResolutionHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Autonomous Resource Dispatch Directives */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-[#0F2854] uppercase tracking-wider">
              Autonomous Municipal Rapid-Intervention Directives
            </h3>
          </div>
          <span className="text-xs text-slate-500">AI-Synthesized Actions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.slice(0, 4).map((rec) => {
            const isDispatched = dispatchedActions[rec.id];

            return (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                      {rec.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Score: {rec.impactScore}/100</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#0F2854] leading-snug">{rec.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.rationale}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-700 font-semibold truncate">
                    Directive: {rec.suggestedResourceDispatch}
                  </span>
                  <Button
                    size="sm"
                    disabled={isDispatched}
                    onClick={() => handleDispatchAction(rec.id)}
                    className={
                      isDispatched
                        ? 'bg-emerald-600 text-white text-xs shrink-0 font-bold'
                        : 'bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-xs shrink-0 font-bold'
                    }
                  >
                    {isDispatched ? 'Dispatched' : 'Dispatch Unit'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
