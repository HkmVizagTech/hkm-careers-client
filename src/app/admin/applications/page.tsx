'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ExternalLink, FileText, ArrowRight, Download, X, CalendarClock } from 'lucide-react';
import { getAdminApplications, getAdminJobs, getDepartments, exportApplicationsCsv, viewResume, downloadResume } from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';

import { formatDate, formatDateTime } from '@/lib/utils';
import type { Application, Job, Department, PaginationInfo } from '@/types';

const statusLabels: Record<string, string> = {
  received: 'Received', 'under-review': 'Under Review', shortlisted: 'Shortlisted',
  interview: 'Interview', selected: 'Selected', rejected: 'Rejected',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  // Filters can come from a link (e.g. the bell's "waiting for review" alert -> ?status=received).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('status')) setStatusFilter(q.get('status') || '');
    if (q.get('job')) setJobFilter(q.get('job') || '');
    if (q.get('search')) { setSearchInput(q.get('search') || ''); setSearch(q.get('search') || ''); }
    setReady(true);
    Promise.all([getAdminJobs({ limit: 100 }), getDepartments()])
      .then(([jobsData, deptsData]) => { setJobs(jobsData.jobs); setDepartments(deptsData); })
      .catch(() => undefined);
  }, []);

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filterParams = () => {
    const params: Record<string, string> = {};
    if (departmentFilter) params.department = departmentFilter;
    if (jobFilter) params.job = jobFilter;
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    return params;
  };

  const load = async () => {
    setLoading(true);
    try {
      const appsData = await getAdminApplications({ ...filterParams(), page, limit: 15 });
      setApplications(appsData.applications);
      setPagination(appsData.pagination);
    } catch { toast.error('Could not load applications'); } finally { setLoading(false); }
  };

  useEffect(() => { if (ready) load(); }, [ready, departmentFilter, jobFilter, statusFilter, search, page]); // eslint-disable-line

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportApplicationsCsv(filterParams());
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = !!(departmentFilter || jobFilter || statusFilter || search);
  const clearFilters = () => {
    setDepartmentFilter(''); setJobFilter(''); setStatusFilter(''); setSearchInput(''); setSearch(''); setPage(1);
  };

  const jobTitle = (job: Application['job']): string => (typeof job === 'object' && job !== null && 'title' in job) ? job.title : '—';

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Applications</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage all candidate applications</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || pagination.total === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-ocean/40 hover:bg-ocean/5 disabled:opacity-50"
          title="Download the applications matching the current filters as a CSV file (opens in Excel)"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : `Export${hasFilters ? ' filtered' : ''} CSV`}
        </button>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, phone or application no. (e.g. FSD10001)"
          aria-label="Search applications"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15"
        />
        {searchInput && (
          <button type="button" onClick={() => setSearchInput('')} aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <select value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setPage(1); }}
          aria-label="Filter by job"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15">
          <option value="">All Jobs</option>
          {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
        </select>
        <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
          aria-label="Filter by department"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15">
          <option value="">All Statuses</option>
          <option value="received">Received</option>
          <option value="under-review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3" aria-busy="true">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : applications.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ocean/25 bg-white py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-base font-medium text-gray-900">No applications found</p>
          <p className="mt-1 text-sm text-gray-500">
            {hasFilters ? 'Nothing matches these filters.' : 'Applications will appear here as candidates apply.'}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-ocean hover:text-navy">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{pagination.total} application{pagination.total !== 1 ? 's' : ''}</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-ocean hover:text-navy">Clear filters</button>
            )}
          </div>
          <div className="mt-2 overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surfaceAlt/70">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Candidate</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Job</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Resume</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app, i) => (
                    <motion.tr key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-ocean/[0.04] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-ocean text-xs font-bold text-white">
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{app.name}</p>
                            <p className="text-xs text-gray-500">{app.email}</p>
                            {app.applicationNumber && <p className="font-mono text-[11px] text-ocean">{app.applicationNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{jobTitle(app.job)}</td>
                      <td className="px-5 py-4">
                        <Badge variant={app.status as 'received'}>{statusLabels[app.status] || app.status}</Badge>
                        {app.interview?.scheduledAt && new Date(app.interview.scheduledAt).getTime() > Date.now() - 2 * 3600e3 && (
                          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-plum">
                            <CalendarClock className="h-3 w-3" /> {formatDateTime(app.interview.scheduledAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(app.createdAt)}</td>
                      <td className="px-5 py-4">
                        {app.resumeUrl && (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => viewResume(app._id, app.resumeUrl).catch(() => toast.error('Could not open the resume'))}
                              className="inline-flex items-center gap-1 rounded-lg bg-ocean/10 px-2.5 py-1 text-xs font-medium text-ocean hover:bg-ocean/20 transition-colors">
                              <ExternalLink className="h-3 w-3" /> View
                            </button>
                            <button type="button" onClick={() => downloadResume(app._id).catch(() => toast.error('Could not download the resume'))}
                              title="Download resume" aria-label={`Download ${app.name}'s resume`}
                              className="inline-flex items-center rounded-lg bg-ocean/10 p-1.5 text-ocean hover:bg-ocean/20 transition-colors">
                              <Download className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/admin/applications/${app._id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-ocean hover:text-navy transition-colors">
                          Details <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
              <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
