import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, MapPin, Shield } from 'lucide-react';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();

  let errorMessage = 'An unexpected error occurred while loading this civic page.';
  let errorStatus: number | string = 'Application Error';

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center">
        {/* Header Ribbon */}
        <div className="bg-[#0F2854] text-white py-4 px-6 flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
            CivicResolve Safety Boundary
          </span>
        </div>

        <div className="p-8 space-y-5">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Temporary Service Disruption
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We encountered an issue rendering geographic coordinates or live grievance data. Your citizen records and saved drafts remain completely safe.
            </p>
          </div>

          {/* Error Badge */}
          <div className="bg-slate-100 rounded-xl p-3 text-left border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Diagnostic Code: {String(errorStatus)}
            </span>
            <p className="font-mono text-[11px] text-slate-700 break-words line-clamp-3">
              {errorMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry / Refresh</span>
            </button>

            <Link
              to="/"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F2854] hover:bg-[#0B132B] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-orange-400" />
              <span>Go to Home</span>
            </Link>
          </div>

          <div className="pt-2">
            <Link
              to="/track"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Track your grievance by Reference ID</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
