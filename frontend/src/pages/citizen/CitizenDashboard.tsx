import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  LogOut,
  MapPin,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Copy,
  AlertOctagon,
  Flame,
  Search,
  X,
  Compass,
  Eye,
  Route,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { apiClient } from '../../services/api.js';
import { formatDate } from '../../lib/utils.js';

interface ComplaintItem {
  id: string;
  publicId: string;
  title: string;
  description: string;
  userCategory: string;
  location: {
    addressText: string;
    lat: number;
    lng: number;
    ward?: string;
  };
  imageUrls: string[];
  status: string;
  statusLabel: string;
  department: {
    id: string;
    name: string;
    source: string;
  };
  priority: {
    level: 'critical' | 'high' | 'medium' | 'low';
    score: number;
  };
  aiStatus: string;
  aiAnalysis?: {
    englishSummary: string;
    confidence: number;
  };
  createdAt: string;
}

export const CitizenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userProfile, logoutUser } = useAuth();

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'reported' | 'in_progress' | 'resolved'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mapModalComplaint, setMapModalComplaint] = useState<ComplaintItem | null>(null);

  const fetchMyComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ complaints: ComplaintItem[] }>('/complaints/mine');
      setComplaints(data.complaints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve your complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Real Metric Calculations from Firestore
  const totalCount = complaints.length;
  const reportedCount = complaints.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'AI_ANALYSED' || c.status === 'UNDER_REVIEW'
  ).length;
  const inProgressCount = complaints.filter(
    (c) =>
      c.status === 'ASSIGNED' ||
      c.status === 'IN_PROGRESS' ||
      c.status === 'REOPENED' ||
      c.status === 'ESCALATED'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED'
  ).length;

  const filteredComplaints = complaints.filter((c) => {
    if (activeFilter === 'reported') {
      return c.status === 'SUBMITTED' || c.status === 'AI_ANALYSED' || c.status === 'UNDER_REVIEW';
    }
    if (activeFilter === 'in_progress') {
      return (
        c.status === 'ASSIGNED' ||
        c.status === 'IN_PROGRESS' ||
        c.status === 'REOPENED' ||
        c.status === 'ESCALATED'
      );
    }
    if (activeFilter === 'resolved') {
      return c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED';
    }
    return true;
  });

  const getPriorityBadge = (priority: { level: string; score: number }) => {
    switch (priority.level) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            <AlertOctagon className="w-3 h-3 text-red-600" />
            Critical ({priority.score})
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            <Flame className="w-3 h-3 text-orange-600" />
            High ({priority.score})
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Medium ({priority.score})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
            Low ({priority.score})
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, label: string) => {
    if (status === 'RESOLVED' || status === 'CITIZEN_VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {label}
        </span>
      );
    }
    if (status === 'IN_PROGRESS' || status === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F2854] font-semibold text-lg shrink-0">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-civic-dark">
                {t('dashboard.title', 'Citizen Grievance Records')}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                <img src="/logo-icon.png" alt="CivicResolve" className="w-3.5 h-3.5 object-contain" />
                Verified resident
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {userProfile?.displayName || currentUser?.displayName || 'Citizen'} • {currentUser?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={fetchMyComplaints}
            isLoading={loading}
            title="Refresh Complaints"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link to="/report" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-lg text-xs px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              {t('dashboard.newGrievance', 'Report new issue')}
            </button>
          </Link>
          <Button variant="outline" size="md" onClick={() => logoutUser()}>
            <LogOut className="w-4 h-4 mr-1.5 text-civic-muted" />
            {t('nav.logout', 'Sign Out')}
          </Button>
        </div>
      </div>

      {/* Real Firestore Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-5 rounded-xl border cursor-pointer transition-colors ${
            activeFilter === 'all'
              ? 'bg-white border-[#0F2854] shadow-sm ring-1 ring-[#0F2854]'
              : 'bg-white border-surface-border hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-slate-500">
              {t('dashboard.totalCount', 'Total reports')}
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">{totalCount}</div>
          <span className="text-[11px] text-slate-500">All-time submissions</span>
        </div>

        <div
          onClick={() => setActiveFilter('reported')}
          className={`p-5 rounded-xl border cursor-pointer transition-colors ${
            activeFilter === 'reported'
              ? 'bg-white border-amber-600 shadow-sm ring-1 ring-amber-600'
              : 'bg-white border-surface-border hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-slate-500">
              {t('dashboard.reportedCount', 'Reported')}
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">{reportedCount}</div>
          <span className="text-[11px] text-slate-500">Awaiting triage</span>
        </div>

        <div
          onClick={() => setActiveFilter('in_progress')}
          className={`p-5 rounded-xl border cursor-pointer transition-colors ${
            activeFilter === 'in_progress'
              ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
              : 'bg-white border-surface-border hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-slate-500">
              {t('dashboard.inProgressCount', 'In progress')}
            </span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">{inProgressCount}</div>
          <span className="text-[11px] text-slate-500">Assigned to field crews</span>
        </div>

        <div
          onClick={() => setActiveFilter('resolved')}
          className={`p-5 rounded-xl border cursor-pointer transition-colors ${
            activeFilter === 'resolved'
              ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-600'
              : 'bg-white border-surface-border hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-slate-500">
              {t('dashboard.resolvedCount', 'Resolved')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-700 font-mono tabular-nums">{resolvedCount}</div>
          <span className="text-[11px] text-slate-500">Confirmed resolutions</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-civic-critical text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-civic-dark">
              Your Registered Grievances ({filteredComplaints.length})
            </h2>
            <p className="text-xs text-civic-muted">
              Live updates directly synchronized with the municipal dispatch ledger.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-civic-muted hover:bg-surface-subtle border border-surface-border'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter('reported')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'reported'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-civic-muted hover:bg-surface-subtle border border-surface-border'
              }`}
            >
              Reported ({reportedCount})
            </button>
            <button
              onClick={() => setActiveFilter('in_progress')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-civic-muted hover:bg-surface-subtle border border-surface-border'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setActiveFilter('resolved')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'resolved'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-civic-muted hover:bg-surface-subtle border border-surface-border'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Complaints List or Loading or Empty State */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-surface-border p-12 text-center space-y-3 shadow-card">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-civic-muted">Retrieving real grievance data from Firestore...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-border p-8 sm:p-12 text-center shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4 border border-brand-200 shadow-sm">
              <FileText className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-bold text-civic-dark">No Grievances Found</h3>
            <p className="text-sm text-civic-muted max-w-md mx-auto mt-1 mb-6">
              {activeFilter === 'all'
                ? 'You have not submitted any complaints yet. Report an issue to help improve your neighborhood.'
                : `You currently have no complaints in the "${activeFilter.replace('_', ' ')}" status category.`}
            </p>
            <Link to="/report">
              <Button size="md">
                <PlusCircle className="w-4 h-4 mr-2" />
                Report an Issue
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-2xl border border-surface-border p-5 hover:border-brand-300 hover:shadow-card-hover transition-all duration-150 space-y-3 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {comp.publicId}
                    </span>
                    <button
                      onClick={(e) => handleCopyId(comp.publicId, e)}
                      className="text-civic-muted hover:text-brand-600 transition-colors"
                      title="Copy Public ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedId === comp.publicId && (
                      <span className="text-[10px] text-brand-600 font-bold">Copied!</span>
                    )}
                    <span className="text-xs font-semibold text-civic-dark capitalize bg-surface-subtle px-2 py-0.5 rounded">
                      {comp.userCategory.replace(/_/g, ' ')}
                    </span>
                    {getPriorityBadge(comp.priority)}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(comp.status, comp.statusLabel)}
                    <span className="text-xs text-civic-muted">
                      {formatDate(comp.createdAt)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-civic-dark">
                    {comp.title}
                  </h3>
                  <p className="text-xs text-civic-muted mt-1 line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-surface-border text-xs text-civic-muted">
                  <div className="flex items-center gap-1.5 truncate max-w-md">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="truncate">{comp.location.addressText}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-brand-700">
                      Dept: {comp.department.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMapModalComplaint(comp)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                      title="Preview location in Google Maps"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Maps Interactive Modal */}
      {mapModalComplaint && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setMapModalComplaint(null)}
        >
          <div
            className="bg-white rounded-2xl border border-surface-border shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-subtle">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-civic-dark line-clamp-1">
                    {mapModalComplaint.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-civic-muted">
                    <span className="font-mono font-bold text-brand-700">
                      {mapModalComplaint.publicId}
                    </span>
                    <span>•</span>
                    <span>{mapModalComplaint.department.name}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapModalComplaint(null)}
                className="p-1.5 rounded-lg text-civic-muted hover:text-civic-dark hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Google Maps View */}
            <div className="h-72 sm:h-96 w-full relative bg-slate-100">
              <iframe
                title="Google Maps Location View"
                src={`https://maps.google.com/maps?q=${mapModalComplaint.location.lat},${mapModalComplaint.location.lng}&hl=en&z=17&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>

            {/* Modal Footer / Google Maps Tool Bar */}
            <div className="p-4 border-t border-surface-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-civic-muted truncate max-w-xs">
                <span className="font-semibold text-civic-dark block truncate">
                  {mapModalComplaint.location.addressText}
                </span>
                <span className="font-mono text-[11px]">
                  {mapModalComplaint.location.lat.toFixed(5)}, {mapModalComplaint.location.lng.toFixed(5)}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${mapModalComplaint.location.lat},${mapModalComplaint.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-border bg-white text-civic-dark hover:bg-surface-subtle font-semibold shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Street View 360°</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapModalComplaint.location.lat},${mapModalComplaint.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-border bg-white text-civic-dark hover:bg-surface-subtle font-semibold shadow-2xs"
                >
                  <Route className="w-3.5 h-3.5 text-orange-600" />
                  <span>Directions</span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapModalComplaint.location.lat},${mapModalComplaint.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
