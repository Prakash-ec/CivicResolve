import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Printer,
  Copy,
  Check,
  X,
  FileCheck2,
  Lock,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { citizenService } from '../../services/api.js';

interface CitizenReceiptModalProps {
  complaintId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CitizenReceiptModal: React.FC<CitizenReceiptModalProps> = ({
  complaintId,
  isOpen,
  onClose,
}) => {
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !complaintId) return;

    let active = true;
    setLoading(true);
    setError('');

    citizenService
      .getReceipt(complaintId)
      .then((res) => {
        if (active && res.receipt) {
          setReceipt(res.receipt);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to generate digital receipt.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [complaintId, isOpen]);

  if (!isOpen) return null;

  const copyHash = () => {
    if (receipt?.verificationHash) {
      navigator.clipboard.writeText(receipt.verificationHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="digital-receipt-title">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-[#0B132B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="CivicResolve" className="w-6 h-6 object-contain" />
            <div>
              <h2 id="digital-receipt-title" className="text-sm font-bold tracking-tight text-white uppercase">
                Digital Citizen Receipt
              </h2>
              <p className="text-[11px] text-blue-200">
                Official Municipal Grievance Acknowledgement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close digital citizen receipt"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Generating cryptographic receipt proof...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          ) : receipt ? (
            <div className="border border-slate-300 rounded-xl p-5 bg-gradient-to-b from-slate-50 to-white shadow-inner space-y-4 font-sans">
              {/* Receipt Header Badge */}
              <div className="text-center pb-3 border-b border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  {receipt.officialSeal}
                </span>
                <span className="text-xl font-mono font-black text-[#0F2854] tracking-tight">
                  {receipt.receiptId}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Reference: <span className="font-semibold text-slate-800">{receipt.publicId}</span>
                </span>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Filed On
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(receipt.filedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200">
                  <span className="text-[10px] uppercase font-bold text-orange-800 block mb-0.5">
                    SLA Resolution Target
                  </span>
                  <span className="font-bold text-orange-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    {receipt.slaTargetHours} Hours Maximum
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Responsible Department
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 line-clamp-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {receipt.department}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Municipal Jurisdiction
                  </span>
                  <span className="font-semibold text-slate-800 block">
                    {receipt.ward} • {receipt.zone}
                  </span>
                </div>
              </div>

              {/* Citizen Identity Protection */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Authenticated Citizen
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {receipt.maskedCitizen}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Privacy Protected
                </span>
              </div>

              {/* Cryptographic Verification Proof */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="uppercase tracking-wider font-bold">Tamper-Proof SHA-256 Hash</span>
                  <button
                    onClick={copyHash}
                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-sans text-xs"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Proof'}
                  </button>
                </div>
                <p className="break-all text-slate-300 select-all leading-tight">
                  {receipt.verificationHash}
                </p>
                <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800 flex items-center justify-between">
                  <span>Standard: {receipt.verificationAlgorithm}</span>
                  <span>Publicly Verifiable</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-[#0F2854] hover:bg-[#0B132B] text-white text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
