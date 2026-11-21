import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  User,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block mx-auto mb-2 group">
            <BrandLogo variant="full" size="xl" className="h-14 sm:h-16 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0F2854] text-xs font-semibold">
              <BrandLogo variant="icon" size="sm" className="w-4 h-4 object-contain" />
              <span>CivicResolve Secure Access Gateway</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F2854] tracking-tight">
            Select Your Access Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Choose your designated portal to report neighborhood grievances, monitor civic resolutions, or conduct municipal triage operations.
          </p>
        </div>

        {/* 2-Card Portal Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Citizen Portal */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card hover:border-blue-400 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0F2854] border border-blue-200 flex items-center justify-center font-bold shadow-xs">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0F2854]">Citizen Portal</h2>
                <span className="text-xs font-semibold text-orange-600">Public & Community Access</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Report civic issues, track progress with real-time photo evidence, participate in community confirmations, and earn ResolveRewards™ credits.
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Interactive GPS & Google Maps reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Multimodal AI classification & voice input</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ResolveRewards™ utility voucher store</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Link to="/citizen/login" className="block w-full">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg bg-[#0F2854] hover:bg-[#1C4D8D] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Login as Citizen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <div className="text-center text-xs text-slate-500">
                <span>New to CivicResolve? </span>
                <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-700 underline">
                  Create citizen account
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Administrator Portal */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card hover:border-orange-400 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0F2854]">Admin Portal</h2>
                <span className="text-xs font-semibold text-[#0F2854]">Municipal Governance & Triage</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review incoming grievances, assign engineering departments, analyze geographic hotspots, inspect image evidence, and verify public works.
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Geographic Hotspot Intelligence & clustering</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Duplicate linking & predefined rejection codes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Department SLA velocity & Recharts analytics</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Link to="/admin/login" className="block w-full">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Login as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Requires authorized municipal custom claims</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
