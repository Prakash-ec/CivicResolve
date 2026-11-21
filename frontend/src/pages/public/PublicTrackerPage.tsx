import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ThumbsUp,
  Compass,
  Eye,
  Route,
  ArrowLeft,
  FileText,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { apiClient } from '../../services/api.js';
import { formatDate } from '../../lib/utils.js';
import { BeforeAfterResolutionCard } from '../../components/complaints/BeforeAfterResolutionCard.js';
import { CitizenReceiptModal } from '../../components/complaints/CitizenReceiptModal.js';
import { useAuth } from '../../features/auth/AuthContext.js';

interface TimelineEvent {
  id: string;
  from: string | null;
  to: string;
  actorRole: string;
  publicNote: string;
  createdAt: string;
}

interface TrackedComplaint {
  id: string;
  publicId: string;
  title: string;
  description: string;
  userCategory: string;
  location: {
    lat: number;
    lng: number;
    addressText: string;
    locality?: string;
    ward?: string;
    zone?: string;
    city?: string;
    district?: string;
    state?: string;
    regionVerificationStatus?: string;
  };
  imageUrls: string[];
  status: string;
  statusLabel: string;
  department: {
    id: string;
    name: string;
  };
  priority: {
    level: string;
    score: number;
  };
  aiAnalysis?: {
    englishSummary: string;
    confidence: number;
  };
  resolutionProof?: {
    verifiedAt: string;
    officerNote: string;
    proofImageUrl?: string;
  };
  citizenVerification?: {
    verifiedAt: string;
    rating: number;
    feedback?: string;
  } | null;
  reopenDetails?: {
    reopenedAt: string;
    reason: string;
  } | null;
  sla?: {
    targetHours: number;
    deadline: string;
    isOverdue: boolean;
    escalationTier: string;
  } | null;
  ownerUid?: string;
  estimatedResolutionDate?: string | null;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

// 7-Step CivicRedressal Standard Stages
const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', label: 'Reported' },
  { key: 'AI_ANALYSED', label: 'AI Analysed' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CITIZEN_VERIFIED', label: 'Citizen Verified' },
];

const pinIcon = L.divIcon({
  className: 'public-track-pin',
  html: `<div style="background-color: #EA580C; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <div style="width: 10px; height: 10px; background: #0F2854; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export const PublicTrackerPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [trackingId, setTrackingId] = useState(initialId);
  const [complaint, setComplaint] = useState<TrackedComplaint | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const fetchComplaint = async (idToSearch: string, isSilent = false) => {
    if (!idToSearch.trim()) return;

    if (!isSilent) {
      setLoading(true);
      setError(null);
      setComplaint(null);
      setTimeline([]);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await apiClient<{
        success: boolean;
        complaint: TrackedComplaint;
        timeline: TimelineEvent[];
      }>(`/complaints/track/${encodeURIComponent(idToSearch.trim().toUpperCase())}`);

      if (res.complaint) {
        setComplaint(res.complaint);
        setTimeline(res.timeline || []);
      }
    } catch (err: any) {
      if (!isSilent) {
        setError(
          err.message ||
            `No grievance found with reference ID "${idToSearch}". Please verify the code and retry.`
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchComplaint(initialId);
    }
  }, [initialId]);

  // Real-time automatic updates every 15s with clean teardown
  useEffect(() => {
    if (!complaint?.publicId) return;

    const interval = setInterval(() => {
      fetchComplaint(complaint.publicId, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [complaint?.publicId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setSearchParams({ id: trackingId.trim().toUpperCase() });
      fetchComplaint(trackingId.trim().toUpperCase());
    }
  };

  const handleUpvote = async () => {
    if (!complaint || voted) return;
    try {
      await apiClient<{ success: boolean; upvotes: number }>(`/complaints/${complaint.id}/vote`, {
        method: 'POST',
      });
      setVoted(true);
      setComplaint((prev) => (prev ? { ...prev, upvotes: prev.upvotes + 1 } : null));
    } catch {}
  };

  // Helper to determine stage status
  const getStageIndex = (status: string): number => {
    switch (status) {
      case 'SUBMITTED':
        return 0;
      case 'AI_ANALYSED':
        return 1;
      case 'UNDER_REVIEW':
        return 2;
      case 'ASSIGNED':
        return 3;
      case 'IN_PROGRESS':
      case 'ESCALATED':
        return 4;
      case 'RESOLVED':
        return 5;
      case 'CITIZEN_VERIFIED':
        return 6;
      default:
        return 0;
    }
  };

  const currentStageIdx = complaint ? getStageIndex(complaint.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {/* Top Breadcrumb & Heading */}
      <div className="text-center space-y-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F2854] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
          Public Grievance Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Enter your reference ID (e.g. <code className="font-mono text-slate-800 font-bold bg-slate-100 px-1 rounded">CR-2026-001248</code>) to inspect live progress, department assignments, and timeline.
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. CR-2026-001248"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854] uppercase placeholder:normal-case"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#0F2854] hover:bg-[#1C4D8D] text-white font-bold text-xs sm:text-sm shrink-0 shadow-md transition-colors"
          >
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-card space-y-3">
          <div className="w-7 h-7 border-3 border-[#0F2854] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching verified grievance record from municipal ledger...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3 shadow-xs"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-red-950 text-sm">Grievance Not Found</h4>
            <p className="text-red-800 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Complaint Dossier View */}
      {complaint && !loading && (
        <article
          aria-label={`Grievance details for ${complaint.publicId}`}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-card transform-gpu transition-all"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#0F2854] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                  {complaint.publicId}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 capitalize border border-slate-200">
                  {complaint.userCategory.replace(/_/g, ' ')}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    complaint.priority?.level === 'critical'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : complaint.priority?.level === 'high'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  Priority: {complaint.priority?.level?.toUpperCase()}
                </span>
                {complaint.location.regionVerificationStatus === 'verified' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Area
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F2854] pt-1">
                {complaint.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-all shadow-xs"
                title="View verified digital municipal receipt certificate"
              >
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                <span>Digital Receipt</span>
              </button>

              <button
                type="button"
                onClick={handleUpvote}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                  voted
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : 'bg-white text-slate-800 hover:bg-orange-50 border-slate-200'
                }`}
                title="Upvote this complaint to raise municipal attention"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-orange-500" />
                <span>{complaint.upvotes} Community Votes</span>
              </button>

              <button
                type="button"
                onClick={() => fetchComplaint(complaint.publicId, true)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 7-Step Visual Progress Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Civic Resolution Lifecycle Progress
              </h3>
              <span className="text-xs font-bold text-[#0F2854] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Status: {complaint.statusLabel || complaint.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
              {LIFECYCLE_STAGES.map((stg, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div
                    key={stg.key}
                    className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                        : isCurrent
                        ? 'bg-[#0F2854] text-white border-[#0F2854] shadow-md ring-2 ring-orange-400/40'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="text-[11px] font-bold leading-tight truncate">{stg.label}</div>
                    <div className="text-[9px] uppercase font-bold tracking-wider">
                      {isCompleted ? 'Done' : isCurrent ? 'Active' : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Privacy-Safe Map Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Column: Metadata & Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Public Grievance Statement
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed p-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Assigned Department
                  </span>
                  <span className="font-bold text-[#0F2854] block mt-0.5">
                    {complaint.department?.name || 'General Municipal redresal'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Submission Date
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>
              </div>

              {/* Assignment & SLA Estimates */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-[#0F2854] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Assignment Status
                  </span>
                  <span className="font-bold text-orange-600">
                    {currentStageIdx >= 3 ? 'Crew Dispatched' : 'Triage Queue'}
                  </span>
                </div>
                {complaint.estimatedResolutionDate && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/60">
                    <span>Target Resolution SLA:</span>
                    <span className="font-bold">{formatDate(complaint.estimatedResolutionDate)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Last Updated:</span>
                  <span>{formatDate(complaint.updatedAt)}</span>
                </div>
              </div>

              {/* Location Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {complaint.location.addressText}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {[
                        complaint.location.locality,
                        complaint.location.ward,
                        complaint.location.city,
                        complaint.location.state,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Privacy-Safe Public Map Preview */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#0F2854]" />
                    <span>Neighborhood Area Jurisdiction</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Privacy Protected</span>
                </div>

                <div className="h-64 w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-xs">
                  {(() => {
                    const cLat = Number(complaint.location?.lat ?? (complaint as any).lat ?? 13.0827);
                    const cLng = Number(complaint.location?.lng ?? (complaint as any).lng ?? 80.2707);
                    return (
                      <MapContainer
                        center={[cLat, cLng]}
                        zoom={15}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Privacy Circle (~200m radius fuzzed coverage) */}
                        <Circle
                          center={[cLat, cLng]}
                          radius={220}
                          pathOptions={{
                            color: '#EA580C',
                            fillColor: '#EA580C',
                            fillOpacity: 0.15,
                            weight: 2,
                          }}
                        />
                        <Marker
                          position={[cLat, cLng]}
                          icon={pinIcon}
                        />
                      </MapContainer>
                    );
                  })()}
                  <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-xs text-[10px] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-orange-500" />
                    <span>Area buffer displayed to safeguard citizen household privacy</span>
                  </div>
                </div>
              </div>

              {/* Photo Evidence (if uploaded) */}
              {complaint.imageUrls && complaint.imageUrls.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Uploaded Photo Evidence
                  </h4>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video relative group shadow-xs">
                    <img
                      src={complaint.imageUrls[0]}
                      alt={`Uploaded evidence for grievance ${complaint.publicId}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Resolution Proof Card (If Verified) */}
              {complaint.resolutionProof && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-bold text-xs text-emerald-900">
                      Official Resolution Proof
                    </h5>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    {complaint.resolutionProof.officerNote}
                  </p>
                  {complaint.resolutionProof.proofImageUrl && (
                    <img
                      src={complaint.resolutionProof.proofImageUrl}
                      alt={`Official municipal resolution proof for grievance ${complaint.publicId}`}
                      className="w-full h-32 object-cover rounded-xl border border-emerald-200"
                    />
                  )}
                  <div className="text-[10px] text-emerald-700 font-bold">
                    Resolved on {formatDate(complaint.resolutionProof.verifiedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Before & After Resolution Card */}
          {(complaint.status === 'RESOLVED' ||
            complaint.status === 'CITIZEN_VERIFIED' ||
            complaint.resolutionProof) && (
            <div className="pt-2">
              <BeforeAfterResolutionCard
                complaintId={complaint.id}
                publicId={complaint.publicId}
                title={complaint.title}
                status={complaint.status}
                initialImageUrl={complaint.imageUrls?.[0]}
                resolutionProof={complaint.resolutionProof}
                citizenVerification={complaint.citizenVerification}
                reopenDetails={complaint.reopenDetails}
                isOwner={Boolean(currentUser && complaint.ownerUid === currentUser.uid)}
                onStatusUpdated={() => fetchComplaint(complaint.publicId, true)}
              />
            </div>
          )}

          {/* Append-Only Status Audit Timeline */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2854] flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Immutable Grievance Audit Timeline ({timeline.length} Events)</span>
            </h3>

            <div className="space-y-3">
              {timeline.map((evt, idx) => (
                <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="w-3 h-3 rounded-full bg-[#0F2854] ring-4 ring-orange-400/20 shrink-0 mt-1" />
                  <div className="flex-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#0F2854] capitalize text-xs">
                        {evt.to.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(evt.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{evt.publicNote}</p>
                    <span className="text-[10px] text-orange-600 font-bold uppercase block mt-1">
                      Logged by: {evt.actorRole}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Citizen Receipt Modal */}
          {complaint && (
            <CitizenReceiptModal
              complaintId={complaint.id}
              isOpen={receiptModalOpen}
              onClose={() => setReceiptModalOpen(false)}
            />
          )}
        </article>
      )}
    </div>
  );
};
