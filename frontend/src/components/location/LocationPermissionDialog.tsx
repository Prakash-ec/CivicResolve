import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  Radio,
  X,
  AlertCircle,
  EyeOff,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const LocationPermissionDialog: React.FC<LocationPermissionDialogProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const { t } = useTranslation();
  const { requestLocation, startLiveTracking, isLiveTracking } = useCurrentLocation();

  if (!isOpen) return null;

  const handleGrantGps = async () => {
    onClose();
    const result = await requestLocation();
    if (result && onPermissionGranted) {
      onPermissionGranted();
    }
  };

  const handleStartLiveTracking = async () => {
    onClose();
    const success = await startLiveTracking();
    if (success && onPermissionGranted) {
      onPermissionGranted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative transform-gpu transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gps-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with CivicResolve Logo Badge */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-sm shrink-0">
            <img src="/logo-icon.png" alt="CivicResolve" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              Civic Geographic Redressal
            </span>
            <h2 id="gps-dialog-title" className="text-xl sm:text-2xl font-extrabold text-[#0F2854] tracking-tight">
              Enable GPS Location?
            </h2>
            <p className="text-xs text-slate-500">
              CivicResolve uses your device coordinates exclusively for accurate municipal issue dispatch.
            </p>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#0F2854] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-slate-900 block">Instant Ward & Zone Resolution</strong>
              <span className="text-slate-600">
                Automatically determines your municipal ward and engineering jurisdiction.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-slate-900 block">Faster Field Inspection</strong>
              <span className="text-slate-600">
                Helps civic maintenance crews navigate directly to the verified physical issue.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <EyeOff className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-slate-900 block">Privacy-First Guarantee</strong>
              <span className="text-slate-600">
                No silent background tracking. Coordinates are fuzzed on public maps to protect residential privacy.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-xs"
          >
            Enter Manually Instead
          </Button>

          <Button
            type="button"
            onClick={handleGrantGps}
            className="bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4 text-orange-400" />
            <span>Use My Current Location</span>
          </Button>

          {!isLiveTracking && (
            <Button
              type="button"
              variant="outline"
              onClick={handleStartLiveTracking}
              className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span>Enable Live Tracking</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
