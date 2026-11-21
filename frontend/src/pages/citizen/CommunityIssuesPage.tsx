import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Filter,
  Search,
  Navigation,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Shield,
  ThumbsUp,
} from 'lucide-react';
import { communityService } from '../../services/api.js';
import { CommunityIssue, COMPLAINT_CATEGORIES, ComplaintCategory } from '../../types/index.js';
import { useAuth } from '../../features/auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';

// User Pin Icon
const createUserPin = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="background-color: #2563EB; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Custom Marker Icon for Community Grievances
const createIssuePin = (status: string, confirms: number) => {
  const bgColor =
    status === 'RESOLVED'
      ? '#10B981'
      : status === 'IN_PROGRESS'
      ? '#F97316'
      : '#0F2854';

  return L.divIcon({
    className: 'custom-community-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        ${confirms > 0 ? `+${confirms}` : '📍'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const CommunityIssuesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { currentUser } = useAuth();

  const [issues, setIssues] = useState<CommunityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRadius, setSelectedRadius] = useState<number>(2500);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'grid'>('split');

  const { coords: liveCoords, address: liveAddress, status: locationStatus, refreshLocation } = useCurrentLocation();

  // User coordinates (Initialized from live or cached coords, fallback to Chennai center)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: liveCoords ? liveCoords.lat : 13.0827,
    lng: liveCoords ? liveCoords.lng : 80.2707,
  }));

  // Action status states
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedSuccessNotice, setConfirmedSuccessNotice] = useState<string | null>(null);

  // Sync user coordinates whenever active GPS coordinates are acquired
  useEffect(() => {
    if (liveCoords) {
      setUserCoords({
        lat: liveCoords.lat,
        lng: liveCoords.lng,
      });
    }
  }, [liveCoords?.lat, liveCoords?.lng]);

  const loadNearbyIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communityService.getNearbyIssues(
        userCoords.lat,
        userCoords.lng,
        selectedRadius,
        selectedCategory
      );
      setIssues(res.issues);
    } catch (err: any) {
      console.error('Failed to load community issues:', err);
      setError('Unable to fetch nearby issues. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearbyIssues();
  }, [userCoords.lat, userCoords.lng, selectedRadius, selectedCategory]);

  const handleConfirmIssue = async (issue: CommunityIssue) => {
    if (!currentUser) {
      alert('Please log in as a citizen to confirm community grievances and earn ResolveRewards™.');
      return;
    }

    setConfirmingId(issue.id);
    setConfirmedSuccessNotice(null);

    try {
      const res = await communityService.confirmIssue(issue.id);
      // Update local state
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                communityConfirmationsCount: res.communityConfirmationsCount,
                userConfirmed: true,
              }
            : item
        )
      );

      setConfirmedSuccessNotice(
        `Issue confirmed! You earned ${res.creditsAwarded} ResolveRewards™ credits for validating "${issue.title}".`
      );
      setTimeout(() => setConfirmedSuccessNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to register confirmation.');
    } finally {
      setConfirmingId(null);
    }
  };

  // Filtered by text search
  const filteredIssues = issues.filter((iss) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      iss.title.toLowerCase().includes(q) ||
      iss.description.toLowerCase().includes(q) ||
      iss.location.addressText?.toLowerCase().includes(q) ||
      iss.publicId.toLowerCase().includes(q)
    );
  });

  const mapCenter: [number, number] = [userCoords.lat, userCoords.lng];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium mb-2">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Community verification hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2854] tracking-tight">
            Neighborhood Grievance Verifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Confirm existing issues in your neighborhood. Citizen confirmations elevate municipal resolution priority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/citizen/report">
            <Button className="bg-[#0F2854] hover:bg-[#1C4D8D] text-white">
              Report New Grievance
            </Button>
          </Link>
        </div>
      </div>

      {confirmedSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{confirmedSuccessNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            +10 Credits
          </span>
        </div>
      )}

      {/* Control Bar: Radius, Category Pills, Search, View Toggle */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by street name, landmark, or public ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            />
          </div>

          {/* Radius Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs self-start sm:self-auto">
            <span className="px-2.5 py-1 text-slate-500 font-semibold text-[11px]">Radius:</span>
            {[500, 1000, 2500, 5000].map((r) => (
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
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                viewMode === 'split'
                  ? 'bg-[#0F2854] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Map & List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#0F2854] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card Grid
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({issues.length})
          </button>
          {COMPLAINT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-[#0F2854] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Map Column */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-3 sticky top-6">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-[#0F2854]">
                <MapPin className="w-4 h-4 text-orange-500" />
                Live Neighborhood Radials ({filteredIssues.length} points)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px]">
                  {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                </span>
                <button
                  type="button"
                  onClick={() => refreshLocation()}
                  className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Update to current GPS location"
                >
                  <Navigation className={`w-3.5 h-3.5 text-blue-600 ${locationStatus === 'requesting' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-200 relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={true}
              >
                <ChangeView center={mapCenter} zoom={14} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Search Radius Circle */}
                <Circle
                  center={mapCenter}
                  radius={selectedRadius}
                  pathOptions={{
                    color: '#0F2854',
                    fillColor: '#0F2854',
                    fillOpacity: 0.05,
                    dashArray: '4, 4',
                  }}
                />

                {/* Live User Position Marker */}
                {liveCoords && (
                  <Marker
                    position={[liveCoords.lat, liveCoords.lng]}
                    icon={createUserPin()}
                  >
                    <Popup>
                      <div className="p-1.5 space-y-1 text-xs font-sans">
                        <strong className="text-blue-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          Your Detected Location
                        </strong>
                        <p className="text-[11px] text-slate-600">
                          {liveAddress?.fullFormattedAddress || `${liveCoords.lat.toFixed(4)}, ${liveCoords.lng.toFixed(4)}`}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Accuracy: ±{Math.round(liveCoords.accuracy)}m
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {filteredIssues
                  .filter((iss) => Boolean(iss && (iss.location?.lat != null || (iss as any).lat != null)))
                  .map((iss) => {
                    const lat = Number(iss.location?.lat ?? (iss as any).lat ?? 13.0827);
                    const lng = Number(iss.location?.lng ?? (iss as any).lng ?? 80.2707);
                    const addr = iss.location?.addressText || (iss as any).addressText || 'Municipal Area';
                    return (
                      <Marker
                        key={iss.id}
                        position={[lat, lng]}
                        icon={createIssuePin(iss.status, iss.communityConfirmationsCount)}
                      >
                        <Popup>
                          <div className="p-2 space-y-1.5 text-xs font-sans">
                            <span className="font-bold text-[#0F2854] block">
                              {iss.title}
                            </span>
                            <p className="text-slate-600 text-[11px]">
                              {addr}
                            </p>
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="text-orange-600 font-bold">
                                {iss.distanceMeters}m away
                              </span>
                              <span className="font-semibold text-slate-500">
                                {iss.communityConfirmationsCount} confirmations
                              </span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>
          </div>

          {/* Issue Cards Column */}
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-card space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-[#0F2854]">
                  No Grievances Found in Selected Radius
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try expanding the radius to 5km or changing the category filter to discover issues across adjacent wards.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <article
                  key={issue.id}
                  aria-label={issue.title}
                  className={`bg-white rounded-3xl p-6 border transition-all shadow-card space-y-4 ${
                    highlightId === issue.id
                      ? 'border-orange-500 ring-2 ring-orange-400/20'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono font-bold text-[#0F2854] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {issue.publicId}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-semibold capitalize bg-slate-100 text-slate-700">
                          {issue.userCategory.replace(/_/g, ' ')}
                        </span>
                        <span className="text-orange-600 font-bold flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {issue.distanceMeters}m away
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[#0F2854] pt-1">
                        {issue.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                        issue.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : issue.status === 'IN_PROGRESS'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-blue-50 text-[#0F2854] border border-blue-200'
                      }`}
                    >
                      {issue.statusLabel || issue.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="truncate">{issue.location.addressText}</span>
                  </div>

                  {issue.imageUrls && issue.imageUrls.length > 0 && (
                    <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={issue.imageUrls[0]}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Confirmation Action Row */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <ThumbsUp className="w-3.5 h-3.5 text-orange-500" />
                      <span>
                        Confirmed by <strong>{issue.communityConfirmationsCount}</strong> citizens
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/track?id=${issue.publicId}`}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2854] hover:bg-slate-50"
                      >
                        Track Status
                      </Link>

                      {issue.userConfirmed ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Confirmed by You</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={confirmingId === issue.id}
                          onClick={() => handleConfirmIssue(issue)}
                          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{confirmingId === issue.id ? 'Verifying...' : 'Yes, This Issue Exists'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Full Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <article
              key={issue.id}
              aria-label={issue.title}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card hover:shadow-elevation transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#0F2854] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {issue.publicId}
                  </span>
                  <span className="text-orange-600 font-bold flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {issue.distanceMeters}m away
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#0F2854] leading-snug">
                  {issue.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {issue.description}
                </p>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                  <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                  <span className="truncate">{issue.location.addressText}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {issue.communityConfirmationsCount} confirmations
                </span>

                {issue.userConfirmed ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Confirmed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmIssue(issue)}
                    disabled={confirmingId === issue.id}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Confirm Issue
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
