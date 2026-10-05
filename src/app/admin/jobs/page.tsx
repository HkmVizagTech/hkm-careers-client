'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Briefcase,
  MapPin,
  FileText,
} from 'lucide-react';
import { getAdminJobs, getDepartments, deleteJob } from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';

import { formatDate } from '@/lib/utils';
import type { Job, Department } from '@/types';

const typeLabels: Record<string, string> = { 'full-time': 'Full Time', 'part-time': 'Part Time', volunteer: 'Volunteer', intern: 'Internship' };
const statusLabels: Record<string, string> = { draft: 'Draft', active: 'Active', closed: 'Closed' };
const statusVariant: Record<string, 'warning' | 'success' | 'danger'> = { draft: 'warning', active: 'success', closed: 'danger' };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const jobsData = await getAdminJobs(params);
      setJobs(jobsData.jobs);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [search, statusFilter]); // eslint-disable-line

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try { await deleteJob(id); setDeleteConfirm(null); loadData(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const deptName = (dept: Job['department']): string => (typeof dept === 'object' && dept !== null && 'name' in dept) ? dept.name : '';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">{jobs.length} posting{jobs.length !== 1 ? 's' : ''} · manage listings</p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-navy/20 transition-all hover:scale-[1.02] hover:shadow-lg"
        >
          <Plus className="h-4 w-4" /> Create Job
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3" aria-busy="true">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ocean/25 bg-white py-16 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-base font-medium text-gray-900">No jobs found</p>
          <p className="mt-1 text-sm text-gray-500">Create your first job posting to start receiving applications.</p>
          <Link href="/admin/jobs/new" className="mt-5 inline-block">
            <Button><Plus className="h-4 w-4" /> Create Job</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {jobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group flex flex-col rounded-2xl border border-hairline bg-white p-5 shadow-soft transition-all hover:border-ocean/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/15">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/jobs/${job._id}/edit`} className="block truncate font-semibold text-gray-900 transition-colors hover:text-ocean">
                      {job.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                      <span className="text-gray-300">·</span>
                      {deptName(job.department) || '—'}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[job.status]}>{statusLabels[job.status]}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={job.type}>{typeLabels[job.type]}</Badge>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-600">
                  <FileText className="h-3 w-3" />
                  {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                </span>
                <span className="ml-auto text-gray-400">{formatDate(job.createdAt)}</span>
              </div>

              <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-gray-100 pt-3">
                <Link
                  href={`/jobs/${job.slug}`}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy"
                >
                  View public page
                </Link>
                <Link
                  href={`/admin/jobs/${job._id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy/5 px-3.5 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  onClick={() => setDeleteConfirm(job._id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Job" size="sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete this job? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
