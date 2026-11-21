import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Navigation,
  RefreshCw,
  Radio,
  RadioTower,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
} from 'lucide-react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';
import { Button } from '../ui/Button.js';

interface CurrentLocationCardProps {
  compact?: boolean;
  className?: string;
}

export const CurrentLocationCard: React.FC<CurrentLocationCardProps> = ({
  compact = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const {
    coords,
    address,
    status,
    isLiveTracking,
    lastAcquiredAt,
    error,
    refreshLocation,
    stopLiveTracking,
    startLiveTracking,
    openPermissionDialog,
  } = useCurrentLocation();

  const formattedTime = lastAcquiredAt
    ? lastAcquiredAt.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  // Determine short area title
  const areaTitle = address?.locality
    ? `${address.locality}, ${address.villageOrCity || address.district || 'Coimbatore'}`
    : address?.villageOrCity
    ? `${address.villageOrCity}, ${address.district || 'Tamil Nadu'}`
    : coords
    ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    : 'Location Not Acquired';

  // Compact Header Bar Indicator
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 text-[11px] ${className}`}>
        <button
          type="button"
          onClick={openPermissionDialog}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 shadow-2xs group"
          title={coords ? `Accuracy: ±${coords.accuracy}m | Last updated: ${formattedTime || 'N/A'}` : 'Click to enable GPS location'}
        >
          <span className="relative flex h-2 w-2">
            {isLiveTracking ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : coords ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            )}
          </span>

          <MapPin className="w-3 h-3 text-orange-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium truncate max-w-[170px] sm:max-w-[220px]">
            {coords ? areaTitle : 'Set Location (GPS)'}
          </span>

          {coords && (
            <span className="text-[10px] text-white/70 font-mono hidden md:inline">
              (±{coords.accuracy}m)
            </span>
          )}
        </button>

        {coords && (
          <button
            type="button"
            onClick={refreshLocation}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Refresh GPS Coordinates"
            aria-label="Refresh Location"
          >
            <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
          </button>
        )}
      </div>
    );
  }

  // Full Card View (used on Dashboard / Grievance filing)
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-card space-y-4 transform-gpu transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F2854] text-orange-400 flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F2854]">GPS Spatial Intelligence</h3>
            <span className="text-[11px] text-slate-500 block">
              {isLiveTracking ? 'Live Watcher Active' : coords ? 'Static Point Acquired' : 'GPS Inactive'}
            </span>
          </div>
        </div>

        {/* Live Tracking Status Badge */}
        {isLiveTracking ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Tracking
          </span>
        ) : coords ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0F2854] border border-blue-200 text-[11px] font-bold">
            <ShieldCheck className="w-3 h-3 text-orange-500" />
            GPS Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
            Not Enabled
          </span>
        )}
      </div>

      {/* Main Location Info Display */}
      {coords ? (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Resolved Administrative Area:</span>
              <span className="font-mono text-slate-700">±{coords.accuracy}m accuracy</span>
            </div>
            <p className="text-sm font-bold text-[#0F2854] leading-snug">
              {address?.fullFormattedAddress || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Latitude</span>
              <span className="font-mono font-bold text-slate-900">{coords.lat.toFixed(6)}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Longitude</span>
              <span className="font-mono font-bold text-slate-900">{coords.lng.toFixed(6)}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Last Synced</span>
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formattedTime || 'Just now'}
              </span>
            </div>
          </div>

          {coords.accuracy > 100 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                GPS accuracy is wide (±{coords.accuracy}m). We recommend fine-tuning your location pin on the map.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
          <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600">
            Grant permission to automatically detect your ward, zone, and address for fast civic reporting.
          </p>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button
          type="button"
          size="sm"
          onClick={coords ? refreshLocation : openPermissionDialog}
          className="bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
        >
          {coords ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              <span>Refresh Location</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>Acquire My GPS</span>
            </>
          )}
        </Button>

        {isLiveTracking ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={stopLiveTracking}
            className="border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
          >
            <span>Stop Live Tracking</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openPermissionDialog}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
          >
            <Radio className="w-3.5 h-3.5 text-orange-500" />
            <span>Tracking Options</span>
          </Button>
        )}
      </div>
    </div>
  );
};
