import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  ThumbsUp,
  RefreshCw,
  Eye,
  ArrowRight,
  ShieldCheck,
  Check,
  Building,
  Navigation,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { citizenService } from '../../services/api.js';
import { useAuth } from '../../features/auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { formatDate } from '../../lib/utils.js';

type ComplaintFilter =
  | 'all'
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'reopened';

export const MyComplaintsPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ComplaintFilter>('all');
  const [search, setSearch] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await citizenService.getMyComplaints();
      if (res.complaints) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.warn('Failed to fetch citizen complaints, using local store', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Auto-refresh interval (20s) with proper cleanup
    const timer = setInterval(() => {
      citizenService.getMyComplaints().then((res) => {
        if (res.complaints) setComplaints(res.complaints);
      }).catch(() => {});
    }, 20000);

    return () => clearInterval(timer);
  }, []);

  const handleConfirmResolution = async (id: string) => {
    setVerifyingId(id);
    try {
      await citizenService.verifyResolution(id, 5, 'Citizen physically verified complete resolution.');
      setConfirmSuccess(id);
      fetchComplaints();
      setTimeout(() => setConfirmSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to verify resolution.');
    } finally {
      setVerifyingId(null);
    }
  };

  const toggleTimeline = (id: string) => {
    setExpandedTimelines((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = complaints.filter((comp) => {
    // 1. Status Filter Tabs
    if (activeTab === 'submitted') {
      if (comp.status !== 'SUBMITTED' && comp.status !== 'AI_ANALYSED') return false;
    } else if (activeTab === 'under_review') {
      if (comp.status !== 'UNDER_REVIEW') return false;
    } else if (activeTab === 'assigned') {
      if (comp.status !== 'ASSIGNED') return false;
    } else if (activeTab === 'in_progress') {
      if (comp.status !== 'IN_PROGRESS' && comp.status !== 'ESCALATED') return false;
    } else if (activeTab === 'resolved') {
      if (comp.status !== 'RESOLVED' && comp.status !== 'CITIZEN_VERIFIED') return false;
    } else if (activeTab === 'reopened') {
      if (comp.status !== 'REOPENED' && comp.status !== 'ESCALATED') return false;
    }

    // 2. Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = comp.publicId?.toLowerCase().includes(q);
      const matchTitle = comp.title?.toLowerCase().includes(q);
      const matchAddr = comp.location?.addressText?.toLowerCase().includes(q);
      const matchLoc = comp.location?.locality?.toLowerCase().includes(q);
      const matchWard = comp.location?.ward?.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchAddr && !matchLoc && !matchWard) return false;
    }
    return true;
  });

  // Calculate Progress Percent
  const getProgressPercent = (status: string): number => {
    switch (status) {
      case 'SUBMITTED':
        return 15;
      case 'AI_ANALYSED':
        return 30;
      case 'UNDER_REVIEW':
        return 45;
      case 'ASSIGNED':
        return 60;
      case 'IN_PROGRESS':
        return 80;
      case 'RESOLVED':
        return 95;
      case 'CITIZEN_VERIFIED':
        return 100;
      default:
        return 20;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
              My Civic Grievances
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track, verify, and confirm resolutions for all grievances reported by {userProfile?.displayName || currentUser?.email}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchComplaints}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
          <Link to="/citizen/report">
            <button
              type="button"
              className="inline-flex items-center justify-center font-bold rounded-xl text-xs px-4 py-2.5 bg-[#0F2854] hover:bg-[#1C4D8D] text-white shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-orange-400" />
              File New Grievance
            </button>
          </Link>
        </div>
      </div>

      {/* Confirmation Success Toast */}
      {confirmSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#0F2854] text-xs flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Thank you! Grievance <strong>{confirmSuccess}</strong> has been marked as <strong>Citizen Verified</strong>. 25 ResolveRewards™ credits have been awarded.
          </span>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all', label: `All (${complaints.length})` },
            { id: 'submitted', label: 'Submitted' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'reopened', label: 'Reopened' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#0F2854] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, ward, area, title..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
          />
        </div>
      </div>

      {/* Complaint Cards Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-card space-y-3">
          <div className="w-8 h-8 border-3 border-[#0F2854] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Retrieving your grievances from municipal ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-card space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0F2854] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#0F2854]">No Grievances Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't submitted any complaints matching this filter.
            </p>
          </div>
          <Link to="/citizen/report">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md"
            >
              Report an Issue Now
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((comp) => {
            const progress = getProgressPercent(comp.status);
            const isExpanded = expandedTimelines[comp.id] || false;
            const geoArea = [
              comp.location?.ward,
              comp.location?.zone,
              comp.location?.locality,
              comp.location?.city,
            ]
              .filter(Boolean)
              .join(', ') || comp.location?.addressText || 'Municipal Ward Area';

            return (
              <div
                key={comp.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card hover:border-blue-400 hover:shadow-xl transition-all flex flex-col justify-between space-y-5 transform-gpu"
              >
                <div className="space-y-4">
                  {/* Top Header in Card */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F2854] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                        {comp.publicId}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {comp.userCategory?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        comp.status === 'CITIZEN_VERIFIED'
                          ? 'bg-blue-50 text-[#0F2854] border border-blue-300'
                          : comp.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : comp.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {comp.statusLabel || comp.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-base text-[#0F2854] leading-snug">
                    {comp.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                    {comp.description}
                  </p>

                  {/* Geographic Area & Department Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#0F2854] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Department
                        </span>
                        <span className="font-bold text-slate-800 truncate block">
                          {comp.department?.name || 'Municipal Works'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Geographic Area
                        </span>
                        <span className="font-bold text-slate-800 truncate block" title={geoArea}>
                          {geoArea}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">
                        Resolution Velocity
                      </span>
                      <span className="font-bold text-[#0F2854]">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-[#0F2854] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {comp.imageUrls && comp.imageUrls.length > 0 && (
                    <img
                      src={comp.imageUrls[0]}
                      alt={`Evidence for grievance ${comp.publicId}: ${comp.title}`}
                      className="w-full h-32 object-cover rounded-2xl border border-slate-200 mt-2"
                    />
                  )}
                </div>

                {/* Resolution Confirmation Module (If Resolved) */}
                {comp.status === 'RESOLVED' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-emerald-950">
                        Municipal Team Marked Resolved
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Did the team fix this civic problem on the ground?
                    </p>
                    <button
                      type="button"
                      disabled={verifyingId === comp.id}
                      onClick={() => handleConfirmResolution(comp.id)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>
                        {verifyingId === comp.id ? 'Confirming...' : 'Confirm Resolution (+25 Credits)'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Inline Complete Timeline Drawer */}
                {isExpanded && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-fadeIn">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
                      Status Timeline Audit History
                    </span>
                    <div className="space-y-2 pt-1">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        <div>
                          <span className="font-bold text-slate-800">Grievance Registered</span>
                          <span className="text-[10px] text-slate-400 block">{formatDate(comp.createdAt)}</span>
                        </div>
                      </div>
                      {comp.status !== 'SUBMITTED' && (
                        <div className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          <div>
                            <span className="font-bold text-slate-800">Current Phase: {comp.statusLabel || comp.status}</span>
                            <span className="text-[10px] text-slate-400 block">Updated {formatDate(comp.updatedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Controls & Quick Links */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      Updated {formatDate(comp.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* View on Map Link */}
                    {comp.location?.lat && comp.location?.lng && (
                      <Link
                        to={`/map?lat=${comp.location.lat}&lng=${comp.location.lng}`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0F2854] font-semibold text-xs"
                        title="View on Live City Map"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span>Map</span>
                      </Link>
                    )}

                    {/* Toggle Timeline */}
                    <button
                      type="button"
                      onClick={() => toggleTimeline(comp.id)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0F2854] font-semibold text-xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>{isExpanded ? 'Hide' : 'Timeline'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Dossier Link */}
                    <Link
                      to={`/track?id=${comp.publicId}`}
                      className="text-xs font-bold text-[#0F2854] hover:text-orange-600 underline inline-flex items-center gap-0.5"
                    >
                      <span>Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
