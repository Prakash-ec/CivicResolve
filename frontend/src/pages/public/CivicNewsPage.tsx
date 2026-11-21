import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  Calendar,
  Building2,
  AlertTriangle,
  Megaphone,
  CheckCircle,
  Clock,
  ArrowRight,
  Download,
  Share2,
  Tag,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'infrastructure' | 'sanitation' | 'water' | 'emergency' | 'community';
  categoryLabel: string;
  department: string;
  date: string;
  ward?: string;
  urgent?: boolean;
}

export const CivicNewsPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const bulletins: NewsItem[] = [
    {
      id: 'news-1',
      title: 'Monsoon Preparedness: Stormwater Drain De-silting Drive Across 15 Zones',
      summary:
        'Greater Municipal Corporation has mobilized 85 heavy suction trucks and 320 field personnel to clear main arterial drainage canals before the anticipated seasonal rains.',
      category: 'infrastructure',
      categoryLabel: 'Infrastructure & Roads',
      department: 'Department of Public Works',
      date: 'November 20, 2026',
      ward: 'Citywide (Zones 1-15)',
      urgent: true,
    },
    {
      id: 'news-2',
      title: '24-Hour Scheduled Drinking Water Supply Interruption for Pipeline Overhaul',
      summary:
        'Metro Water Board will carry out essential valve replacements on the primary 1000mm feeder line. Water tankers will be deployed free of cost to affected streets.',
      category: 'water',
      categoryLabel: 'Water Supply',
      department: 'Metro Water & Sewerage Board',
      date: 'November 19, 2026',
      ward: 'Wards 114 to 126',
      urgent: true,
    },
    {
      id: 'news-3',
      title: 'ResolveRewards™ Multiplier Campaign: Zero-Litter Neighborhood Initiative',
      summary:
        'Citizens reporting unattended commercial waste mounds that lead to confirmed contractor clearing will receive 2x Civic Credit multipliers during the clean city sprint.',
      category: 'community',
      categoryLabel: 'Citizen Rewards',
      department: 'Solid Waste Management Cell',
      date: 'November 18, 2026',
      ward: 'All Metropolitan Wards',
      urgent: false,
    },
    {
      id: 'news-4',
      title: 'Smart LED Streetlight Replacement Completed in 12 Residential Corridors',
      summary:
        'Over 1,400 legacy sodium-vapor fixtures have been upgraded to automated energy-efficient LED luminaires equipped with fault-sensing microcontrollers.',
      category: 'infrastructure',
      categoryLabel: 'Electrical Services',
      department: 'Municipal Electrical Engineering',
      date: 'November 16, 2026',
      ward: 'Zone 13 (Adyar & Velachery)',
      urgent: false,
    },
    {
      id: 'news-5',
      title: 'Bio-Medical and E-Waste Dedicated Collection Centers Launched',
      summary:
        'Designated e-waste drop boxes and hazardous domestic chemical disposal units are now active at all primary community health centers.',
      category: 'sanitation',
      categoryLabel: 'Sanitation & Health',
      department: 'Public Health Department',
      date: 'November 14, 2026',
      ward: 'Zone 9 & Zone 10',
      urgent: false,
    },
  ];

  const filteredBulletins = bulletins.filter((item) => {
    const matchesFilter = filter === 'all' || item.category === filter;
    const matchesSearch =
      !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0F2854] text-xs font-semibold">
          <Megaphone className="w-3.5 h-3.5 text-orange-500" />
          <span>Official Municipal Gazette & Notices</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F2854] tracking-tight">
              Civic News & Administrative Bulletins
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Verified announcements, infrastructure schedules, and public works progress reports direct from municipal departments.
            </p>
          </div>

          <Link to="/report">
            <button
              type="button"
              className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white transition-colors shrink-0"
            >
              Report a defect
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      <div className="p-5 rounded-xl bg-[#0F2854] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">
                Active public notice
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white pt-0.5">
              24x7 Municipal Control Room Operational for Heavy Rain Season
            </h3>
            <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
              Citizens are urged to immediately report street waterlogging, open manholes, or fallen tree branches via CivicResolve or toll-free hotline <strong className="text-white">1800-425-1333</strong>.
            </p>
          </div>
        </div>
        <Link to="/report">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Report Hazard
          </button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Notices' },
            { id: 'infrastructure', label: 'Roads & Infrastructure' },
            { id: 'sanitation', label: 'Sanitation & Waste' },
            { id: 'water', label: 'Water Supply' },
            { id: 'community', label: 'Civic Rewards' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                filter === cat.id
                  ? 'bg-[#0F2854] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
          />
        </div>
      </div>

      {/* Bulletins List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBulletins.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-blue-400 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0F2854] border border-blue-200">
                  {item.categoryLabel}
                </span>
                {item.urgent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                    Urgent Notice
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-[#0F2854] leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 truncate">{item.department}</span>
                <span className="text-[11px] shrink-0">{item.date}</span>
              </div>

              {item.ward && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-orange-500" />
                  <span>Coverage: {item.ward}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
