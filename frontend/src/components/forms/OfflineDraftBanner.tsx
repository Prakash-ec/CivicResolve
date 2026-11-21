import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOfflineDrafts } from '../../hooks/useOfflineDrafts.js';

export const OfflineDraftBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, syncDrafts } = useOfflineDrafts();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      role="status"
      className={`w-full px-4 py-2.5 text-xs border-b transition-colors ${
        !isOnline
          ? 'bg-amber-500 text-slate-900 border-amber-600 font-medium'
          : 'bg-blue-600 text-white border-blue-700'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
          ) : (
            <Wifi className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>
            {!isOnline ? (
              <>
                <strong>Offline Mode Active:</strong> You are currently disconnected. You can still fill
                and save grievance reports; they will be safely queued and submitted automatically once
                reconnected.
              </>
            ) : (
              <>
                <strong>Back Online:</strong> You have {pendingCount} offline grievance{' '}
                {pendingCount === 1 ? 'draft' : 'drafts'} awaiting synchronization.
              </>
            )}
          </span>
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => syncDrafts()}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded bg-white text-blue-900 font-bold text-[11px] hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};
