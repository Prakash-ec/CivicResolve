import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  Download,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';
import { adminService } from '../../services/api.js';
import { Button } from '../../components/ui/Button.js';

export const AdminComplaintManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Assignment & Export State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDepartment, setBulkDepartment] = useState('');
  const [bulkOfficer, setBulkOfficer] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(complaints.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;
    setBulkApplying(true);
    setActionNotice('');
    try {
      await adminService.bulkAssign({
        complaintIds: selectedIds,
        departmentId: bulkDepartment || undefined,
        officerName: bulkOfficer.trim() || undefined,
        status: bulkStatus || undefined,
        priorityLevel: bulkPriority || undefined,
      });
      setActionNotice(`Successfully updated ${selectedIds.length} complaints.`);
      setSelectedIds([]);
      fetchComplaints(currentPage);
    } catch (err: any) {
      setActionNotice(err.message || 'Bulk assignment failed.');
    } finally {
      setBulkApplying(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await adminService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civicresolve-complaints-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getComplaints({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: 10,
      });

      if (res.complaints) {
        setComplaints(res.complaints);
        setTotalCount(res.pagination.totalCount);
        setTotalPages(res.pagination.totalPages);
        setCurrentPage(res.pagination.currentPage);
      }
    } catch (err) {
      console.warn('Failed to fetch admin complaints, using fallback seed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(1);
  }, [statusFilter, priorityFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="text-xs font-semibold text-slate-500 hover:text-[#0F2854]"
            >
              Operations Hub
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-[#0F2854]">Grievance Triage Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2854] pt-1">
            Grievance Triage & Dispatch Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total active records: <strong className="text-orange-600">{totalCount}</strong> grievances across municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            disabled={exporting}
            className="text-xs flex items-center gap-1.5 bg-white border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>

          <button
            type="button"
            onClick={() => fetchComplaints(currentPage)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs self-start sm:self-auto"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, title, road, or ward..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            >
              <option value="all">All Statuses</option>
              <option value="SUBMITTED">Submitted (New)</option>
              <option value="AI_ANALYSED">AI Analysed</option>
              <option value="ASSIGNED">Assigned to Crew</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved (Pending Sign-off)</option>
              <option value="CITIZEN_VERIFIED">Citizen Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical (&gt;= 70)</option>
              <option value="high">High (45-69)</option>
              <option value="medium">Medium (25-44)</option>
              <option value="low">Low (&lt; 25)</option>
            </select>
          </div>

          {/* Submit Search Button */}
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-[#0F2854] hover:bg-[#1C4D8D] text-white font-bold text-xs transition-colors"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <span className="font-semibold">{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="text-emerald-700 hover:text-emerald-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* Floating Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#0F2854] text-white p-4 rounded-2xl shadow-xl border border-white/20 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono text-[11px]">
                {selectedIds.length} Selected
              </span>
              Bulk Administrative Actions
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white underline"
            >
              Deselect All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs text-slate-900">
            {/* Bulk Department */}
            <select
              aria-label="Bulk assign department"
              value={bulkDepartment}
              onChange={(e) => setBulkDepartment(e.target.value)}
              className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              <option value="">Assign Department...</option>
              <option value="dept_roads">Roads & Highways (PWD)</option>
              <option value="dept_sanitation">Sanitation & Solid Waste</option>
              <option value="dept_water">Water Supply & Metro Water</option>
              <option value="dept_drainage">Drainage Blockage</option>
              <option value="dept_electricity">Electricity Board (TANGEDCO)</option>
              <option value="dept_traffic">Traffic Engineering</option>
              <option value="dept_health">Public Health & Sanitation</option>
            </select>

            {/* Bulk Officer */}
            <input
              type="text"
              aria-label="Assign field officer name"
              placeholder="Assign Field Officer..."
              value={bulkOfficer}
              onChange={(e) => setBulkOfficer(e.target.value)}
              className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            />

            {/* Bulk Status */}
            <select
              aria-label="Bulk update complaint status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              <option value="">Update Status...</option>
              <option value="ASSIGNED">Assign to Crew</option>
              <option value="IN_PROGRESS">Mark In Progress</option>
              <option value="RESOLVED">Mark Resolved</option>
              <option value="REJECTED">Reject / Close</option>
            </select>

            {/* Bulk Priority */}
            <select
              aria-label="Bulk change priority level"
              value={bulkPriority}
              onChange={(e) => setBulkPriority(e.target.value)}
              className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              <option value="">Change Priority...</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Apply Button */}
            <Button
              type="button"
              onClick={handleBulkApply}
              disabled={bulkApplying}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-1.5"
            >
              {bulkApplying ? 'Applying...' : 'Apply to Selected'}
            </Button>
          </div>
        </div>
      )}

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={complaints.length > 0 && selectedIds.length === complaints.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                </th>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3">Complaint Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location & Ward</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">SLA / Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-2" />
                    Loading complaint registry...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No grievances matched your search and filter criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const isOverdue = c.sla?.deadline
                    ? new Date(c.sla.deadline) < new Date() && !['RESOLVED', 'CITIZEN_VERIFIED'].includes(c.status)
                    : false;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        selectedIds.includes(c.id) ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelectOne(c.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0"
                        />
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-[#0F2854]">
                        <Link
                          to={`/admin/review/${c.id}`}
                          className="hover:text-orange-600 hover:underline"
                        >
                          {c.publicId}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {c.description}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {c.userCategory?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs truncate text-slate-600">
                        <div className="truncate">{c.location?.addressText}</div>
                        {c.location?.ward && (
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {c.location.ward}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            c.priority?.level === 'critical'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : c.priority?.level === 'high'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.priority?.level || 'LOW'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap space-y-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED'
                              ? 'bg-emerald-50 text-emerald-800'
                              : c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
                              ? 'bg-blue-50 text-blue-800'
                              : c.status === 'REJECTED'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {c.statusLabel || c.status}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.2 rounded block w-fit">
                            OVERDUE
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/review/${c.id}`}
                          className="inline-flex items-center gap-1 font-bold text-xs px-3 py-1.5 rounded-lg bg-[#0F2854] hover:bg-[#1C4D8D] text-white transition-colors"
                        >
                          <span>Triage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong> ({totalCount} total entries)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => fetchComplaints(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => fetchComplaints(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
