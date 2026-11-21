import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Rectangle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Filter,
  Layers,
  ArrowRight,
  ThumbsUp,
  Route,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  X,
  Compass,
} from 'lucide-react';
import { publicService } from '../../services/api.js';
import { Button } from '../../components/ui/Button.js';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom category pin generator
const createCategoryPin = (priority: string, category: string) => {
  let bgColor = '#0F2854'; // Navy
  let innerColor = '#F97316'; // Saffron Orange

  if (priority === 'critical') {
    bgColor = '#DC2626';
    innerColor = '#FFFFFF';
  } else if (priority === 'high') {
    bgColor = '#EA580C';
    innerColor = '#FFFFFF';
  }

  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(15,40,84,0.35);">
            <div style="width: 10px; height: 10px; background: ${innerColor}; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
};

// Custom user location pin generator
const createUserPin = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="background-color: #2563EB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(37,99,235,0.6);"></div>
          </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

interface MapPoint {
  id: string;
  publicId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  statusLabel: string;
  location: {
    lat: number;
    lng: number;
    addressText: string;
    ward?: string;
  };
  upvotes: number;
  imageUrl?: string;
  createdAt: string;
}

// Controller component to smoothly pan/zoom map
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export const PublicMapExplorerPage: React.FC = () => {
  const {
    coords: liveCoords,
    address: liveAddress,
    status: locationStatus,
    requestLocation,
    refreshLocation,
  } = useCurrentLocation();

  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState<'hybrid' | 'osm'>('hybrid');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    liveCoords ? liveCoords.lat : 13.0827,
    liveCoords ? liveCoords.lng : 80.2707,
  ]);
  const [mapZoom, setMapZoom] = useState(liveCoords ? 15 : 13);

  // Auto-center map when active GPS coordinates are acquired
  useEffect(() => {
    if (liveCoords) {
      setMapCenter([liveCoords.lat, liveCoords.lng]);
      setMapZoom(15);
    }
  }, [liveCoords?.lat, liveCoords?.lng]);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const res = await publicService.getMapPoints({
        category: categoryFilter,
        status: statusFilter,
        ward: wardFilter,
      });
      if (res.points && res.points.length > 0) {
        setPoints(res.points);
      } else {
        // Fallback realistic points
        setPoints(getMockPoints());
      }
    } catch {
      setPoints(getMockPoints());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [categoryFilter, statusFilter, wardFilter]);

  const getMockPoints = (): MapPoint[] => [
    {
      id: 'mock-1',
      publicId: 'CR-2026-001248',
      title: 'Dangerous deep road crater on Anna Salai',
      category: 'pothole_road_damage',
      priority: 'critical',
      status: 'IN_PROGRESS',
      statusLabel: 'Repair Crew Deployed',
      location: { lat: 13.0827, lng: 80.2707, addressText: 'Anna Salai, Thousand Lights, Chennai', ward: 'Ward 114' },
      upvotes: 42,
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    },
    {
      id: 'mock-2',
      publicId: 'CR-2026-001249',
      title: 'Overflowing commercial garbage mound blocking walkway',
      category: 'garbage_overflow',
      priority: 'high',
      status: 'RESOLVED',
      statusLabel: 'Cleared & Sanitized',
      location: { lat: 13.05, lng: 80.2824, addressText: 'Marina High Road, Chennai', ward: 'Ward 116' },
      upvotes: 28,
      imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    },
    {
      id: 'mock-3',
      publicId: 'CR-2026-001250',
      title: 'High tension dangling electrical cable over pedestrian walk',
      category: 'exposed_electrical_hazard',
      priority: 'critical',
      status: 'ASSIGNED',
      statusLabel: 'Linesman Dispatched',
      location: { lat: 13.0368, lng: 80.2676, addressText: 'Mylapore Tank Junction, Chennai', ward: 'Ward 124' },
      upvotes: 56,
      createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    },
    {
      id: 'mock-4',
      publicId: 'CR-2026-001251',
      title: 'Pressurized water main fracture spilling drinking water',
      category: 'water_leakage',
      priority: 'high',
      status: 'IN_PROGRESS',
      statusLabel: 'Main Valve Isolated',
      location: { lat: 13.0012, lng: 80.2565, addressText: 'Adyar Bridge Road, Chennai', ward: 'Ward 173' },
      upvotes: 33,
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    },
    {
      id: 'mock-5',
      publicId: 'CR-2026-001252',
      title: 'Corroded high-mast streetlight pole fixture',
      category: 'broken_streetlight',
      priority: 'medium',
      status: 'SUBMITTED',
      statusLabel: 'Awaiting Crew Review',
      location: { lat: 12.9815, lng: 80.218, addressText: 'Velachery 100 Feet Bypass Road', ward: 'Ward 178' },
      upvotes: 19,
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
  ];

  const filteredPoints = points.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.publicId.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.location.addressText.toLowerCase().includes(q) ||
      (p.location.ward && p.location.ward.toLowerCase().includes(q))
    );
  });

  const categories = [
    { id: 'all', label: 'All Issues' },
    { id: 'pothole_road_damage', label: 'Potholes & Roads' },
    { id: 'garbage_overflow', label: 'Garbage & Waste' },
    { id: 'water_leakage', label: 'Water Leakage' },
    { id: 'broken_streetlight', label: 'Streetlights' },
    { id: 'exposed_electrical_hazard', label: 'Electrical Hazards' },
    { id: 'sewage_overflow', label: 'Sewage / Drainage' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden bg-slate-50">
      {/* Top Filter and Search Control Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Title & Count */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-[#0F2854] leading-tight">
                  Live Citywide Grievance Explorer
                </h1>
                {liveCoords && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    <span>{liveAddress?.locality || liveAddress?.villageOrCity || 'Live GPS Active'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Displaying <span className="font-bold text-orange-600">{filteredPoints.length}</span> active grievances across municipal boundaries
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, street name, or ward..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Layer toggle & refresh */}
          <div className="flex items-center gap-2">
            {/* Locate Me / Center GPS Button */}
            <button
              type="button"
              onClick={async () => {
                if (liveCoords) {
                  setMapCenter([liveCoords.lat, liveCoords.lng]);
                  setMapZoom(16);
                } else {
                  await requestLocation();
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 text-xs font-semibold shadow-2xs transition-colors"
              title="Center map on your current location"
            >
              <Navigation className={`w-3.5 h-3.5 text-blue-600 ${locationStatus === 'requesting' ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {locationStatus === 'requesting' ? 'Locating...' : 'My Location'}
              </span>
            </button>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveLayer('hybrid')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeLayer === 'hybrid'
                    ? 'bg-white text-[#0F2854] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite Hybrid
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer('osm')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeLayer === 'osm'
                    ? 'bg-white text-[#0F2854] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Street Map
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                showHeatmap
                  ? 'bg-red-600 text-white border-red-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle severity risk heatmap intensity"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Heatmap</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBoundaries(!showBoundaries)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                showBoundaries
                  ? 'bg-[#0F2854] text-white border-[#0B132B] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Municipal Ward & Zone Boundaries"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Boundaries</span>
            </button>

            <button
              type="button"
              onClick={fetchPoints}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
              title="Refresh Map Points"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#0F2854] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 relative z-10 w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <MapViewController center={mapCenter} zoom={mapZoom} />

          {activeLayer === 'hybrid' ? (
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          ) : (
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* User Active Geolocation Marker & Precision Circle */}
          {liveCoords && (
            <>
              <Circle
                center={[liveCoords.lat, liveCoords.lng]}
                radius={liveCoords.accuracy || 25}
                pathOptions={{
                  color: '#2563EB',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
              <Marker
                position={[liveCoords.lat, liveCoords.lng]}
                icon={createUserPin()}
              >
                <Popup className="civic-custom-popup">
                  <div className="p-1.5 space-y-1 text-xs font-sans max-w-[210px]">
                    <div className="flex items-center gap-1.5 font-bold text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                      <span>Your Active Location</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug">
                      {liveAddress?.fullFormattedAddress || `${liveCoords.lat.toFixed(5)}, ${liveCoords.lng.toFixed(5)}`}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      GPS Accuracy: ±{Math.round(liveCoords.accuracy)}m
                    </span>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Municipal Boundaries Overlays */}
          {showBoundaries && (
            <>
              <Rectangle
                bounds={[[13.090, 80.270], [13.130, 80.310]]}
                pathOptions={{ color: '#0F2854', weight: 1.5, fillOpacity: 0.03, dashArray: '4, 4' }}
              >
                <Popup className="text-xs">
                  <div className="font-bold text-[#0F2854]">Zone 5: Royapuram</div>
                  <div className="text-[10px] text-slate-500">Greater Chennai Corporation Jurisdiction</div>
                </Popup>
              </Rectangle>

              <Rectangle
                bounds={[[13.065, 80.190], [13.105, 80.235]]}
                pathOptions={{ color: '#0F2854', weight: 1.5, fillOpacity: 0.03, dashArray: '4, 4' }}
              >
                <Popup className="text-xs">
                  <div className="font-bold text-[#0F2854]">Zone 8: Anna Nagar</div>
                  <div className="text-[10px] text-slate-500">Greater Chennai Corporation Jurisdiction</div>
                </Popup>
              </Rectangle>

              <Rectangle
                bounds={[[13.025, 80.230], [13.065, 80.275]]}
                pathOptions={{ color: '#0F2854', weight: 1.5, fillOpacity: 0.03, dashArray: '4, 4' }}
              >
                <Popup className="text-xs">
                  <div className="font-bold text-[#0F2854]">Zone 9: Teynampet (Ward 114)</div>
                  <div className="text-[10px] text-slate-500">Greater Chennai Corporation Jurisdiction</div>
                </Popup>
              </Rectangle>

              <Rectangle
                bounds={[[13.030, 80.195], [13.070, 80.235]]}
                pathOptions={{ color: '#0F2854', weight: 1.5, fillOpacity: 0.03, dashArray: '4, 4' }}
              >
                <Popup className="text-xs">
                  <div className="font-bold text-[#0F2854]">Zone 10: Kodambakkam</div>
                  <div className="text-[10px] text-slate-500">Greater Chennai Corporation Jurisdiction</div>
                </Popup>
              </Rectangle>

              <Rectangle
                bounds={[[12.980, 80.220], [13.025, 80.275]]}
                pathOptions={{ color: '#0F2854', weight: 1.5, fillOpacity: 0.03, dashArray: '4, 4' }}
              >
                <Popup className="text-xs">
                  <div className="font-bold text-[#0F2854]">Zone 13: Adyar</div>
                  <div className="text-[10px] text-slate-500">Greater Chennai Corporation Jurisdiction</div>
                </Popup>
              </Rectangle>
            </>
          )}

          {/* Severity Risk Heatmap Intensity Circles */}
          {showHeatmap &&
            filteredPoints.map((pt) => {
              const color =
                pt.priority === 'critical' ? '#DC2626' : pt.priority === 'high' ? '#EA580C' : '#D97706';
              const radius = pt.priority === 'critical' ? 260 : pt.priority === 'high' ? 190 : 130;
              return (
                <Circle
                  key={`heat-${pt.id}`}
                  center={[pt.location.lat, pt.location.lng]}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.28,
                    weight: 1.5,
                  }}
                />
              );
            })}

          {filteredPoints.map((pt) => {
            const icon = createCategoryPin(pt.priority, pt.category);
            return (
              <Marker
                key={pt.id}
                position={[pt.location.lat, pt.location.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedPoint(pt);
                    setMapCenter([pt.location.lat, pt.location.lng]);
                  },
                }}
              >
                <Popup className="civic-custom-popup">
                  <div className="p-1 space-y-1.5 max-w-[220px]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-[#0F2854] bg-blue-50 px-1.5 py-0.5 rounded">
                        {pt.publicId}
                      </span>
                      <span className="font-bold text-orange-600 uppercase">{pt.priority}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                      {pt.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">{pt.location.addressText}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedPoint(pt)}
                      className="w-full text-center py-1 mt-1 rounded bg-[#0F2854] text-white text-[10px] font-bold"
                    >
                      Inspect Dossier
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Selected Complaint Slide-Over Dossier Card */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 z-30 animate-fadeIn space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0F2854] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedPoint.publicId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedPoint.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-800'
                        : selectedPoint.status === 'IN_PROGRESS'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {selectedPoint.statusLabel}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#0F2854] pt-1 leading-snug">
                  {selectedPoint.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                aria-label="Close grievance details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPoint.imageUrl && (
              <img
                src={selectedPoint.imageUrl}
                alt={`Evidence photo for ${selectedPoint.title}`}
                className="w-full h-32 object-cover rounded-xl border border-slate-200"
              />
            )}

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{selectedPoint.location.addressText}</span>
              </div>
              {selectedPoint.location.ward && (
                <div className="text-[11px] text-slate-500 pl-5">
                  Jurisdiction: <strong className="text-slate-700">{selectedPoint.location.ward}</strong>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.location.lat},${selectedPoint.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <Route className="w-3.5 h-3.5 text-orange-500" />
                <span>Directions</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>

              <Link
                to={`/track?id=${selectedPoint.publicId}`}
                className="inline-flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors"
              >
                <span>Track Ticket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
