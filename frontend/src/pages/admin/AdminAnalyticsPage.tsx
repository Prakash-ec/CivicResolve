import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/api.js';

const COLORS = ['#0F2854', '#F97316', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<{
    categoryData: any[];
    statusData: any[];
    priorityData: any[];
    totalGrievances: number;
  }>({
    categoryData: [
      { category: 'Potholes & Roads', count: 480 },
      { category: 'Garbage & Waste', count: 340 },
      { category: 'Water Leakage', count: 210 },
      { category: 'Streetlights', count: 180 },
      { category: 'Electrical Hazards', count: 95 },
      { category: 'Sewage / Drainage', count: 115 },
    ],
    statusData: [
      { status: 'Submitted', count: 85 },
      { status: 'Assigned', count: 92 },
      { status: 'In Progress', count: 182 },
      { status: 'Resolved', count: 940 },
      { status: 'Citizen Verified', count: 244 },
    ],
    priorityData: [
      { priority: 'CRITICAL', count: 18 },
      { priority: 'HIGH', count: 210 },
      { priority: 'MEDIUM', count: 680 },
      { priority: 'LOW', count: 512 },
    ],
    totalGrievances: 1420,
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAnalytics();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch analytics, using rich seed dataset', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F2854] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Operations Hub</span>
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-8 h-8 rounded-lg bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2854]">
              Municipal Grievance Intelligence & Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aggregated lifecycle metrics, turnaround velocity, and department resolution performance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs self-start sm:self-auto"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Grievances Inflow
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] font-mono">
            {data.totalGrievances}
          </div>
          <span className="text-[11px] text-slate-500">All city zones combined</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Mean Triage Latency
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
            1.4 <span className="text-xs font-normal">seconds</span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium">Gemini multimodal pipeline</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Average Time-to-Fix
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
            28.4 <span className="text-xs font-normal">hours</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Target SLA: &lt; 48 hours</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Citizen Sign-off Rate
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            91.2%
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Confirmed field quality</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#0F2854]">
              Grievances by Category
            </h3>
            <p className="text-xs text-slate-500">Distribution of citizen reports across civic disciplines</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryData}>
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F2854" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#0F2854]">
              Safety Severity & Priority Distribution
            </h3>
            <p className="text-xs text-slate-500">Urgency classification calculated by multimodal AI</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priorityData}>
                <XAxis dataKey="priority" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
