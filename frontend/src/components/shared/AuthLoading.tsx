import React from 'react';
import { BrandLogo } from '../brand/BrandLogo.js';

export const AuthLoading: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm p-3">
          <BrandLogo variant="icon" size="md" className="w-full h-full object-contain animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/20 animate-ping pointer-events-none" />
      </div>
      <h3 className="text-base font-semibold text-civic-dark mt-6 tracking-tight">
        Verifying Session...
      </h3>
      <p className="text-xs text-civic-muted mt-1">
        Securing municipal identity and role claims
      </p>
    </div>
  );
};
