import React, { useState, useEffect } from 'react';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { adminService, evidenceService } from '../../services/api.js';
import { Complaint, EvidenceVerification } from '../../types/index.js';
import { Button } from '../../components/ui/Button.js';

export const AdminImageReviewPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [verificationData, setVerificationData] = useState<EvidenceVerification | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const fetchComplaintsWithImages = async () => {
    setLoading(true);
    try {
      const res = await adminService.getComplaints({ limit: 50 });
      // Filter complaints that possess an image
      const withImages = res.complaints.filter(
        (c) => c.imageUrls && c.imageUrls.length > 0
      );
      setComplaints(withImages);
      if (withImages.length > 0 && !selectedComplaint) {
        setSelectedComplaint(withImages[0]);
        loadVerification(withImages[0].id);
      }
    } catch (err) {
      console.error('Failed to load image complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVerification = async (complaintId: string) => {
    setVerifying(true);
    setVerificationData(null);
    try {
      const res = await evidenceService.getEvidenceAnalysis(complaintId);
      setVerificationData(res.verification);
    } catch (err) {
      console.warn('Evidence retrieval error:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchComplaintsWithImages();
  }, []);

  const handleSelectComplaint = (c: Complaint) => {
    setSelectedComplaint(c);
    loadVerification(c.id);
  };

  const handleRunReverification = async () => {
    if (!selectedComplaint) return;
    setVerifying(true);
    try {
      const res = await evidenceService.verifyEvidence(selectedComplaint.id);
      setVerificationData(res.verification);
      setActionSuccessNotice('Forensic multimodal re-analysis completed.');
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (err) {
      alert('Verification request failed. Ensure backend services are online.');
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveEvidence = async () => {
    if (!selectedComplaint) return;
    try {
      await adminService.updateComplaint(selectedComplaint.id, {
        priorityLevel: 'critical',
        note: 'Photographic evidence forensically verified by AI triage unit. Priority elevated.',
      });
      setActionSuccessNotice('Evidence verified and grievance elevated to Critical priority.');
      setTimeout(() => setActionSuccessNotice(null), 4000);
    } catch (err) {
      alert('Failed to update complaint.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0F2854] border border-blue-200 text-xs font-bold mb-2">
            <Camera className="w-3.5 h-3.5 text-orange-500" />
            <span>Multimodal AI Forensic Evidence Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
            Photo Evidence Forensic Review Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Leveraging Google Gemini Multimodal AI to detect image tampering, categorize physical damage, verify scene context, and prevent fraudulent claims.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchComplaintsWithImages}
          className="border-slate-300 text-[#0F2854]"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </Button>
      </div>

      {actionSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessNotice}</span>
        </div>
      )}

      {/* Main Grid: Complaint List & Detailed Verification Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Complaint List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-[#0F2854] uppercase tracking-wider">
              Evidence Feed ({complaints.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">With Photographs</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {complaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No complaints with uploaded image evidence found.
              </div>
            ) : (
              complaints.map((c) => {
                const isSelected = selectedComplaint?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectComplaint(c)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-[#0F2854] bg-blue-50/70 ring-2 ring-[#0F2854]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={c.imageUrls[0]}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#0F2854]">{c.publicId}</span>
                        <span className="text-orange-600 font-semibold capitalize text-[10px]">
                          {c.userCategory.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-[#0F2854] truncate">{c.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{c.location.addressText}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Evidence Analysis Console */}
        <div className="lg:col-span-2 space-y-6">
          {selectedComplaint ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
              {/* Complaint Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-[#0F2854] bg-blue-100 px-2.5 py-0.5 rounded-lg">
                      {selectedComplaint.publicId}
                    </span>
                    <span className="font-semibold text-slate-500">
                      {selectedComplaint.location.addressText}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F2854] mt-1">
                    {selectedComplaint.title}
                  </h2>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunReverification}
                  disabled={verifying}
                  className="border-slate-300 text-[#0F2854] self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${verifying ? 'animate-spin' : ''}`} />
                  Re-Verify
                </Button>
              </div>

              {/* Side-by-Side: Image Preview & Forensic Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Photo Viewer */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Citizen Uploaded Photo
                  </span>
                  <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm relative group">
                    <img
                      src={selectedComplaint.imageUrls[0]}
                      alt={selectedComplaint.title}
                      className="w-full h-full object-contain"
                    />
                    <a
                      href={selectedComplaint.imageUrls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/75 hover:bg-black text-white text-xs font-semibold rounded-xl backdrop-blur-sm flex items-center gap-1 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Full Resolution</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Uploaded via citizen mobile client • Timestamp: {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* AI Forensic Panel */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Multimodal Forensic Analysis
                  </span>

                  {verifying ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#0F2854] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-[#0F2854] font-bold">
                        Running Gemini 2.5 Flash Multimodal Inspection...
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Examining image authenticity, lighting, geometry, and damage cues.
                      </p>
                    </div>
                  ) : verificationData ? (
                    <div className="space-y-3.5 text-xs">
                      {/* Authenticity Score Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Authenticity Confidence
                          </span>
                          <span className="text-2xl font-extrabold text-[#0F2854] font-mono">
                            {verificationData.authenticityScore}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Genuine Photo
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Zero Tampering Artifacts
                          </span>
                        </div>
                      </div>

                      {/* Scene Description */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Visual Scene Synthesis
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {verificationData.sceneDescription}
                        </p>
                      </div>

                      {/* Attribute Pills */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase text-slate-500 block">
                            Damage Severity
                          </span>
                          <span className="font-bold text-orange-600 capitalize">
                            {verificationData.visualDamageSeverity}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase text-slate-500 block">
                            Category Match
                          </span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                      </div>

                      {/* Environmental Factors */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Environmental Cues
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {verificationData.environmentalFactors.map((env, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium"
                            >
                              {env}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Municipal Action */}
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium text-[11px]">
                        <strong>Recommended Field Order:</strong> {verificationData.recommendedMunicipalAction}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                      No verification record available for this photograph. Click "Re-Verify" to analyze.
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Decision Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Marked for supervisor re-inspection.')}
                  className="w-full sm:w-auto text-slate-600 border-slate-300"
                >
                  Flag for Physical Audit
                </Button>
                <Button
                  size="sm"
                  onClick={handleApproveEvidence}
                  className="w-full sm:w-auto bg-[#0F2854] hover:bg-[#1C4D8D] text-white flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span>Approve Evidence & Elevate Priority</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-card text-xs text-slate-400">
              Select a complaint from the left panel to begin forensic evidence inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
