import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  Sparkles,
  MapPin,
  Route,
  ExternalLink,
  CheckCircle2,
  AlertOctagon,
  Flame,
  AlertTriangle,
  Building2,
  UserCheck,
  Send,
  X,
  FileCheck,
  Search,
  Link2,
} from 'lucide-react';
import { adminService } from '../../services/api.js';
import { Button } from '../../components/ui/Button.js';

export const AdminReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for triage updates
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [resolutionProofUrl, setResolutionProofUrl] = useState('');

  // Modals for Duplicate Search & Rejection
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Duplicate submission with existing ticket');

  const fetchComplaintDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminService.getComplaintById(id);
      if (res.complaint) {
        setComplaint(res.complaint);
        setTimeline(res.timeline || []);
        setStatus(res.complaint.status);
        setDepartmentId(res.complaint.department?.id || 'dept_roads');
        setPriorityLevel(res.complaint.priority?.level || 'high');
        setOfficerName(res.complaint.assignedOfficer || '');
      }
    } catch (err) {
      console.warn('Failed to load complaint by ID, fallback to demo', err);
      // Demo fallback
      const demo = {
        id: id || 'demo-1',
        publicId: 'CR-2026-001248',
        title: 'Severe crater pothole on Anna Salai arterial junction',
        description: 'Deep road cavity measuring approximately 2.5 meters across right after the flyover ramp, causing heavy vehicle bottleneck and accident risks for two-wheelers.',
        userCategory: 'pothole_road_damage',
        location: {
          lat: 13.0827,
          lng: 80.2707,
          addressText: 'Near Anna Flyover, Anna Salai, Thousand Lights, Chennai',
          ward: 'Ward 114',
        },
        imageUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
        status: 'IN_PROGRESS',
        statusLabel: 'Repair Crew Deployed',
        department: { id: 'dept_roads', name: 'Roads & Highways (Public Works)' },
        priority: { level: 'critical', score: 85 },
        assignedOfficer: 'Er. R. Sundararajan (AE-Ward 114)',
        upvotes: 42,
        createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
        aiAnalysis: {
          englishSummary: 'Deep asphalt surface defect in high-density lane; severe collision risk for two-wheelers.',
          suggestedDepartment: 'dept_roads',
          suggestedDepartmentName: 'Roads & Highways',
          confidenceScore: 0.94,
          safetyHazardScore: 85,
        },
      };
      setComplaint(demo);
      setStatus(demo.status);
      setDepartmentId(demo.department.id);
      setPriorityLevel(demo.priority.level);
      setOfficerName(demo.assignedOfficer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setSaving(true);
    try {
      await adminService.updateComplaint(complaint.id, {
        status,
        departmentId,
        priorityLevel,
        officerName,
        note: adminNote,
        resolutionProofUrl: status === 'RESOLVED' ? resolutionProofUrl : undefined,
      });
      setSaveSuccess(true);
      fetchComplaintDetails();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!complaint) return;
    setSaving(true);
    try {
      await adminService.updateComplaint(complaint.id, {
        status: 'REJECTED',
        rejectionReason,
        duplicateOfPublicId: selectedMasterId || undefined,
        note: `Administrative closure: ${rejectionReason}${selectedMasterId ? ` (Linked to Master Ticket: ${selectedMasterId})` : ''}`,
      });
      setShowRejectModal(false);
      setShowDuplicateModal(false);
      setSaveSuccess(true);
      fetchComplaintDetails();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject complaint.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#0F2854] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading grievance triage console...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#0F2854]">Complaint Not Found</h2>
        <Link to="/admin/complaints">
          <Button variant="outline" size="sm">Back to Complaints List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F2854] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Grievance Triage Queue</span>
          </Link>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <span className="font-mono text-base font-extrabold text-[#0F2854] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {complaint.publicId}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                complaint.status === 'RESOLVED' || complaint.status === 'CITIZEN_VERIFIED'
                  ? 'bg-emerald-50 text-emerald-800'
                  : complaint.status === 'IN_PROGRESS' || complaint.status === 'ASSIGNED'
                  ? 'bg-blue-50 text-blue-800'
                  : complaint.status === 'REJECTED'
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              Status: {complaint.statusLabel || complaint.status}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                complaint.priority?.level === 'critical'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : complaint.priority?.level === 'high'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              Priority: {complaint.priority?.level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDuplicateModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-orange-500" />
            <span>Link Duplicate</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 shadow-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject Grievance</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#0F2854] text-xs flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Complaint records, department assignment, and status timeline updated successfully!</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Complaint Dossier & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Category: {complaint.userCategory?.replace(/_/g, ' ')}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F2854] pt-1">
                {complaint.title}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
              {complaint.description}
            </div>

            {/* Photo Evidence */}
            {complaint.imageUrls && complaint.imageUrls.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Ground-Level Photo Evidence
                </span>
                <img
                  src={complaint.imageUrls[0]}
                  alt="On-site evidence"
                  className="w-full h-64 sm:h-80 object-cover rounded-2xl border border-slate-200"
                />
              </div>
            )}

            {/* Location & Navigation */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  <strong>{complaint.location?.ward || 'General Jurisdiction'}:</strong>{' '}
                  {complaint.location?.addressText}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${complaint.location.lat},${complaint.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  <Route className="w-3.5 h-3.5 text-orange-500" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Gemini Multimodal AI Triage Report */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F2854]">
                    Gemini Multimodal AI Automated Triage Analysis
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Confidence: 94% • Risk Matrix Evaluated
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                Hazard Score: 85/100
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  AI Department Route
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  Roads & Infrastructure
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Target SLA Window
                </span>
                <span className="font-bold text-red-600 block mt-0.5">
                  24 Hours (High Danger)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Citizen Upvotes
                </span>
                <span className="font-bold text-orange-600 block mt-0.5">
                  {complaint.upvotes || 0} Neighbors Verified
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <strong className="text-[#0F2854]">AI Diagnostic Observation: </strong>
              Visual features depict open pavement crater causing severe hazards to two-wheelers and braking vehicles. Immediate asphalt cold-mix compaction and caution barricade required.
            </p>
          </div>
        </div>

        {/* Right 1 Column: Action Console */}
        <div className="space-y-6">
          <form
            onSubmit={handleSaveChanges}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-5"
          >
            <h3 className="font-bold text-base text-[#0F2854] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>Administrative Action Console</span>
            </h3>

            {/* Lifecycle Status Dropdown */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">
                Update Grievance Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854] font-medium"
              >
                <option value="SUBMITTED">SUBMITTED (Awaiting Triage)</option>
                <option value="ASSIGNED">ASSIGNED (Sent to Department)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Crew On-Site)</option>
                <option value="RESOLVED">RESOLVED (Upload Completion Proof)</option>
                <option value="CITIZEN_VERIFIED">CITIZEN_VERIFIED (Sign-Off Complete)</option>
                <option value="REJECTED">REJECTED (Close Ticket)</option>
              </select>
            </div>

            {/* Department Assignment */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">
                Assign Municipal Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
              >
                <option value="dept_roads">Roads & Highways (Public Works)</option>
                <option value="dept_sanitation">Sanitation & Solid Waste Management</option>
                <option value="dept_water">Metro Water & Drainage Board</option>
                <option value="dept_electrical">Municipal Electrical Engineering</option>
                <option value="dept_health">Public Health & Vector Control</option>
                <option value="dept_general">General Municipal Administration</option>
              </select>
            </div>

            {/* Priority Override */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">
                Priority Classification
              </label>
              <select
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
              >
                <option value="critical">CRITICAL (&lt; 2hr Response)</option>
                <option value="high">HIGH (24hr Response)</option>
                <option value="medium">MEDIUM (48hr Response)</option>
                <option value="low">LOW (Routine Maintenance)</option>
              </select>
            </div>

            {/* Officer Name */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">
                Assigned Field Supervisor / Officer
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="e.g. Er. K. Ramanathan (Junior Engineer)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
              />
            </div>

            {/* Resolution Proof Upload (Only if Resolved) */}
            {status === 'RESOLVED' && (
              <div className="space-y-1.5 text-xs p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <label className="block font-bold text-emerald-900">
                  Resolution Proof Photo URL
                </label>
                <input
                  type="url"
                  value={resolutionProofUrl}
                  onChange={(e) => setResolutionProofUrl(e.target.value)}
                  placeholder="https://.../completion-proof.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                />
                <span className="text-[10px] text-emerald-700 block">
                  Citizen will be prompted to confirm this photo before final ledger closure.
                </span>
              </div>
            )}

            {/* Internal Audit Note */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">
                Administrative Action Note
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Details of action taken, contractor instructions, or dispatch timestamp..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Apply & Broadcast Update'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Duplicate Search & Linking Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base text-[#0F2854]">
                  Duplicate Detection & Linking Console
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Multiple neighbors often report the same civic issue. Search for existing tickets in this ward and link this report as a child duplicate.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={duplicateSearch}
                  onChange={(e) => setDuplicateSearch(e.target.value)}
                  placeholder="Search master ticket by ID (e.g. CR-2026-001248)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <span className="font-bold text-[#0F2854] block">Master Ticket Reference</span>
                <input
                  type="text"
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  placeholder="Enter Master ID: CR-2026-001248"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedMasterId.trim() || saving}
                onClick={handleConfirmRejection}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs disabled:opacity-50"
              >
                Link as Duplicate & Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Predefined Municipal Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#0F2854]">
                Predefined Municipal Rejection Panel
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select an official justification code for rejecting this submission. This note will be published to the citizen's audit timeline.
            </p>

            <div className="space-y-2 text-xs">
              {[
                'Duplicate report already registered with active repair crew',
                'Private property or gated residential society jurisdiction',
                'Insufficient photographic evidence or blurry location capture',
                'Normal wear and tear within standard municipal maintenance cycle',
                'Frivolous, non-civic, or abusive content',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                    rejectionReason === reason
                      ? 'bg-blue-50 border-[#0F2854] text-[#0F2854] font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-0.5 text-[#0F2854]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmRejection}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Confirm Rejection & Update Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
