import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  RefreshCw,
  Search,
  ExternalLink,
  BarChart3,
  Award,
  Users,
} from 'lucide-react';
import { publicService } from '../../services/api.js';
import { Button } from '../../components/ui/Button.js';

export const PublicAccountabilityPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<{
    citySummary: any;
    wardPerformance: any[];
    departmentPerformance: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await publicService.getAccountability();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load public accountability metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWards = (data?.wardPerformance || []).filter((w) =>
    w.ward.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/50 via-blue-50/30 to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold tracking-wide">
                <img src="/logo-icon.png" alt="CivicResolve" className="w-4 h-4 object-contain" />
                {t('accountability.officialBadge', 'OFFICIAL MUNICIPAL ACCOUNTABILITY LEDGER')}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F2854]">
                {t('accountability.title', 'Public Transparency & SLA Velocity Dashboard')}
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                {t('accountability.subtitle', 'Real-time, verifiable municipal grievance resolution statistics across Greater Chennai Corporation. Driven directly by real citizen complaints and field officer proof.')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
                {loading ? t('accountability.refreshing', 'Refreshing...') : t('accountability.refreshLedger', 'Refresh Ledger')}
              </Button>
              <Link to="/map">
                <Button className="bg-[#0F2854] hover:bg-[#0B132B] text-white text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {t('accountability.liveIssueMap', 'Live Issue Map')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="font-bold underline ml-2">{t('accountability.retry', 'Retry')}</button>
          </div>
        )}

        {/* 1. Top High-Impact City Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('accountability.totalGrievancesLogged', 'Total Grievances Logged')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0F2854]">
              {data?.citySummary?.totalGrievances ?? '...'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              {t('accountability.municipalWideTally', 'Municipal wide tally')}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('accountability.resolutionRate', 'Resolution Rate')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 flex items-center gap-1">
              {data?.citySummary?.resolutionRate ?? '...'}%
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${data?.citySummary?.resolutionRate || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('accountability.avgResolutionTime', 'Avg. Resolution Time')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 flex items-center gap-1">
              {data?.citySummary?.avgResolutionHours ?? '...'}h
              <Clock className="w-5 h-5 text-blue-500 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              {t('accountability.fromReportToVerification', 'From report to field verification')}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('accountability.slaCompliance', 'SLA Compliance')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-orange-600 flex items-center gap-1">
              {data?.citySummary?.slaComplianceRate ?? '...'}%
              <Award className="w-5 h-5 text-orange-500 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              {t('accountability.metWithinDeadline', 'Met within category deadline')}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('accountability.wardsMonitored', 'Wards Monitored')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0F2854]">
              {data?.citySummary?.activeWardsCovered ?? '...'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              {t('accountability.greaterChennaiCorp', 'Greater Chennai Corp')}
            </span>
          </div>
        </div>

        {/* 2. Department SLA Performance and Velocity Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0F2854]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  {t('accountability.departmentLedgerTitle', 'Department Workload & SLA Compliance Ledger')}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {t('accountability.departmentLedgerSub', 'Performance targets based on municipal citizen charters (12h to 96h)')}
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {t('timeline.lastUpdated', 'Updated')}: {data?.citySummary?.lastUpdated ? new Date(data.citySummary.lastUpdated).toLocaleTimeString() : 'Live'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">{t('accountability.tableDept', 'Municipal Department')}</th>
                  <th className="px-6 py-3">{t('accountability.tableActive', 'Active Complaints')}</th>
                  <th className="px-6 py-3">{t('accountability.tableResolved', 'Resolved')}</th>
                  <th className="px-6 py-3">{t('accountability.tableOverdue', 'Overdue Count')}</th>
                  <th className="px-6 py-3">{t('accountability.tableSla', 'SLA Compliance')}</th>
                  <th className="px-6 py-3">{t('accountability.tableCapacity', 'Capacity Health')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(data?.departmentPerformance || []).map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {dept.departmentName}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700">
                        {dept.activeCount} {t('accountability.open', 'open')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-700">
                      {dept.resolvedCount} {t('accountability.completed', 'completed')}
                    </td>
                    <td className="px-6 py-3.5">
                      {dept.overdueCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          {dept.overdueCount} {t('accountability.overdue', 'overdue')}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0 {t('accountability.overdue', 'overdue')}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-right">{dept.slaComplianceRatePercent}%</span>
                        <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.slaComplianceRatePercent >= 80
                                ? 'bg-emerald-500'
                                : dept.slaComplianceRatePercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${dept.slaComplianceRatePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          dept.capacityStatus === 'OPTIMAL'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dept.capacityStatus === 'MODERATE_LOAD'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dept.capacityStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Ward Grievance Resolution Index */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#0F2854] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                {t('accountability.wardIndexTitle', 'Ward Resolution Index & Performance')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('accountability.wardIndexSub', 'Track civic responsiveness across individual municipal wards')}
              </p>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('accountability.searchWardPlaceholder', 'Search ward (e.g. Ward 114)...')}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredWards.map((w) => (
              <div
                key={w.ward}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{w.ward}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      w.riskLevel === 'Elevated'
                        ? 'bg-red-100 text-red-700'
                        : w.riskLevel === 'Moderate'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {w.riskLevel} {t('accountability.risk', 'Risk')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{t('accountability.resolutionRate', 'Resolution Rate')}</span>
                    <span className="font-bold text-slate-900">{w.resolutionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${w.resolutionRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[10px] text-center text-slate-500">
                  <div>
                    <span className="block font-bold text-slate-800 text-xs">{w.total}</span>
                    <span>{t('accountability.total', 'Total')}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-emerald-600 text-xs">{w.resolved}</span>
                    <span>{t('accountability.tableResolved', 'Resolved')}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-orange-600 text-xs">{w.inProgress}</span>
                    <span>{t('accountability.pending', 'Pending')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Transparency Commitment Card */}
        <div className="bg-[#0B132B] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
              <img src="/logo-icon.png" alt="CivicResolve" className="w-4 h-4 object-contain" />
              {t('accountability.guaranteeBadge', 'Verifiable Civic Ledger Guarantee')}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t('accountability.guaranteeTitle', 'No Fabricated Metrics. Immutable Resolution Audit Trail.')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('accountability.guaranteeDesc', 'Every status change recorded on CivicResolve undergoes cryptographic timestamping. Resolved issues require mandatory on-site photo evidence and officer notes, followed by direct citizen confirmation. Issues exceeding SLA thresholds automatically escalate to higher municipal supervisory tiers.')}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link to="/track">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold">
                  {t('accountability.trackByCode', 'Track Any Grievance by Code')}
                </Button>
              </Link>
              <Link to="/news">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs">
                  {t('accountability.readBulletins', 'Read Civic Bulletins')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
