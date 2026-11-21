import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  Camera,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { citizenService } from '../../services/api.js';

interface BeforeAfterResolutionCardProps {
  complaintId: string;
  publicId: string;
  title: string;
  status: string;
  initialImageUrl?: string | null;
  resolutionProof?: {
    verifiedAt?: string;
    officerNote?: string;
    proofImageUrl?: string | null;
  } | null;
  citizenVerification?: {
    verifiedAt?: string;
    rating?: number;
    feedback?: string;
  } | null;
  reopenDetails?: {
    reopenedAt?: string;
    reason?: string;
  } | null;
  isOwner?: boolean;
  onStatusUpdated?: () => void;
}

export const BeforeAfterResolutionCard: React.FC<BeforeAfterResolutionCardProps> = ({
  complaintId,
  publicId,
  title,
  status,
  initialImageUrl,
  resolutionProof,
  citizenVerification,
  reopenDetails,
  isOwner = false,
  onStatusUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'verify' | 'reopen'>('comparison');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isResolved = status === 'RESOLVED' || status === 'CITIZEN_VERIFIED';
  const hasProofImage = Boolean(resolutionProof?.proofImageUrl);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await citizenService.verifyResolution(complaintId, rating, feedback);
      setSuccessMsg('Resolution confirmed! Thank you for verifying municipal accountability.');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify resolution. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reopenReason.trim().length < 10) {
      setErrorMsg('Please describe why the issue requires reopening (minimum 10 characters).');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await citizenService.reopenComplaint(complaintId, reopenReason.trim());
      setSuccessMsg('Grievance has been reopened with expedited high priority.');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reopen complaint. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header Banner */}
      <div className="bg-[#0F2854] text-white px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Before & After Resolution Evidence
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/10 text-orange-300">
                {publicId}
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Verified ground inspection photos logged to municipal ledger
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {citizenVerification ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Citizen Verified ({citizenVerification.rating}/5)
            </span>
          ) : isResolved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30">
              Pending Citizen Confirmation
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30">
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Side-by-Side Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Before: Citizen Report Evidence */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-red-500" />
                  Initial Reported Evidence
                </span>
                <span className="text-[10px] font-medium text-slate-400">Citizen Submission</span>
              </div>
              <div className="relative aspect-video rounded-md overflow-hidden bg-slate-200 border border-slate-300/60">
                {initialImageUrl ? (
                  <img
                    src={initialImageUrl}
                    alt="Initial citizen grievance photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Camera className="w-6 h-6 mb-1 text-slate-300" />
                    No initial photo attached
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600 line-clamp-2 italic">
              "{title}"
            </p>
          </div>

          {/* 2. After: Municipal Resolution Proof */}
          <div className="rounded-lg border border-slate-200 bg-emerald-50/50 p-3 flex flex-col justify-between border-emerald-200/80">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Post-Resolution Verification
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Municipal Crew
                </span>
              </div>
              <div className="relative aspect-video rounded-md overflow-hidden bg-slate-200 border border-emerald-300/60">
                {resolutionProof?.proofImageUrl ? (
                  <img
                    src={resolutionProof.proofImageUrl}
                    alt="Municipal resolution photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-3 text-center bg-white">
                    <Clock className="w-6 h-6 mb-1 text-slate-300" />
                    {isResolved
                      ? 'Resolution logged via field officer report'
                      : 'Pending physical completion by field maintenance crew'}
                  </div>
                )}
              </div>
            </div>
            {resolutionProof?.officerNote ? (
              <div className="mt-2 text-xs bg-white p-2 rounded border border-emerald-200 text-emerald-900">
                <span className="font-semibold block text-[11px] text-emerald-700">Official Inspection Note:</span>
                "{resolutionProof.officerNote}"
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500 italic">
                Awaiting officer resolution log
              </p>
            )}
          </div>
        </div>

        {/* Citizen Rating / Reopen Outcome Notices */}
        {citizenVerification && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Citizen Verified Resolution</span>
                <span className="flex items-center text-amber-500">
                  {Array.from({ length: citizenVerification.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {citizenVerification.feedback || 'Grievance resolution verified on site.'}
              </p>
            </div>
          </div>
        )}

        {reopenDetails && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Grievance Reopened by Citizen</span>
              <p className="text-[11px] text-red-700 mt-0.5">
                Reason: "{reopenDetails.reason}"
              </p>
            </div>
          </div>
        )}

        {/* Action Controls for Grievance Owner */}
        {isOwner && isResolved && !citizenVerification && (
          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('verify')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'verify'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm & Accept Resolution
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reopen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'reopen'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen Issue (Defective Work)
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200 mb-3">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-md border border-emerald-200 mb-3">
                {successMsg}
              </div>
            )}

            {/* Verification Form */}
            {activeTab === 'verify' && !successMsg && (
              <form onSubmit={handleVerify} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate Municipal Resolution Quality:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-600 ml-2">
                      {rating === 5 ? 'Excellent' : rating >= 3 ? 'Satisfactory' : 'Needs Work'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Citizen Feedback Notes (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g., Road resurfaced cleanly, sidewalk accessible."
                    className="w-full text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {submitting ? 'Submitting Verification...' : 'Submit Resolution Acceptance'}
                </Button>
              </form>
            )}

            {/* Reopening Form */}
            {activeTab === 'reopen' && !successMsg && (
              <form onSubmit={handleReopen} className="bg-red-50/50 p-4 rounded-lg border border-red-200 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-red-900 mb-1">
                    Reason for Reopening Grievance (Mandatory):
                  </label>
                  <textarea
                    rows={3}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Describe why the issue was not solved adequately (e.g., pothole patch collapsed after 1 day, water pipe leaking again)..."
                    className="w-full text-xs p-2 rounded border border-red-300 focus:ring-1 focus:ring-red-500"
                    required
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Reopening will automatically escalate this issue to higher municipal tier with 24h SLA.
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  {submitting ? 'Reopening Grievance...' : 'Reopen Grievance & Escalate'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
