'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Briefcase,
  X,
} from 'lucide-react';
import {
  getAdminJobs,
  getDepartments,
  createJob,
  updateJob,
  deleteJob,
} from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { Job, Department } from '@/types';

const typeLabels: Record<string, string> = { 'full-time': 'Full Time', 'part-time': 'Part Time', volunteer: 'Volunteer', intern: 'Internship' };
const statusLabels: Record<string, string> = { draft: 'Draft', active: 'Active', closed: 'Closed' };
const statusVariant: Record<string, 'warning' | 'success' | 'danger'> = { draft: 'warning', active: 'success', closed: 'danger' };

interface JobForm {
  title: string; department: string; location: string; type: string;
  description: string; responsibilities: string; qualifications: string;
  experience: string; salaryRange: string; status: string;
  askEducationalDetails: boolean; targetGender: string;
}

const emptyForm: JobForm = { title: '', department: '', location: '', type: 'full-time', description: '', responsibilities: '', qualifications: '', experience: '', salaryRange: '', status: 'draft', askEducationalDetails: false, targetGender: 'any' };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [descriptionPoints, setDescriptionPoints] = useState<string[]>(['']);
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [qualifications, setQualifications] = useState<string[]>(['']);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [jobsData, depts] = await Promise.all([getAdminJobs(params), getDepartments()]);
      setJobs(jobsData.jobs);
      setDepartments(depts);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [search, statusFilter]); // eslint-disable-line

  const openCreate = () => { setEditingJob(null); setForm(emptyForm); setDescriptionPoints(['']); setResponsibilities(['']); setQualifications(['']); setError(''); setModalOpen(true); };
  const openEdit = (job: Job) => {
    setEditingJob(job);
    setForm({ title: job.title, department: typeof job.department === 'object' ? job.department._id : job.department, location: job.location, type: job.type, description: job.description, responsibilities: job.responsibilities || '', qualifications: job.qualifications || '', experience: job.experience || '', salaryRange: job.salaryRange || '', status: job.status, askEducationalDetails: job.askEducationalDetails || false, targetGender: job.targetGender || 'any' });
    setDescriptionPoints(job.description ? job.description.split('\n').filter(Boolean) : ['']);
    setResponsibilities(job.responsibilities ? job.responsibilities.split('\n').filter(Boolean) : ['']);
    setQualifications(job.qualifications ? job.qualifications.split('\n').filter(Boolean) : ['']);
    setError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const jobData = {
        ...form,
        description: descriptionPoints.filter(d => d.trim()).join('\n'),
        responsibilities: responsibilities.filter(r => r.trim()).join('\n'),
        qualifications: qualifications.filter(q => q.trim()).join('\n'),
      };
      if (editingJob) await updateJob(editingJob._id, jobData as Partial<Job>);
      else await createJob(jobData as Partial<Job> & { department: string });
      setModalOpen(false); loadData();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to save job'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteJob(id); setDeleteConfirm(null); loadData(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const deptName = (dept: Job['department']): string => (typeof dept === 'object' && dept !== null && 'name' in dept) ? dept.name : '';

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Manage job postings</p>
        </div>
        <Button onClick={openCreate} className="shadow-md shadow-navy/10">
          <Plus className="h-4 w-4" /> Create Job
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-base font-medium text-gray-900">No jobs found</p>
          <p className="mt-1 text-sm text-gray-500">Create your first job posting to start receiving applications.</p>
          <Button onClick={openCreate} className="mt-5"><Plus className="h-4 w-4" /> Create Job</Button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Job</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Department</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Apps</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job, i) => (
                  <motion.tr key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-400">{job.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{deptName(job.department)}</td>
                    <td className="px-5 py-4"><Badge variant={job.type}>{typeLabels[job.type]}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={statusVariant[job.status]}>{statusLabels[job.status]}</Badge></td>
                    <td className="px-5 py-4 font-medium text-gray-900">{job.applicationCount}</td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(job.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(job)} className="rounded-lg p-2 text-gray-400 hover:bg-ocean/10 hover:text-ocean transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(job._id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingJob ? 'Edit Job' : 'Create Job'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Job Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Program Coordinator"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean">
                <option value="">Select department</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Job Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean">
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="volunteer">Volunteer</option>
                <option value="intern">Internship</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Visakhapatnam"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
            <div className="space-y-2">
              {descriptionPoints.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy flex-shrink-0">{index + 1}</span>
                  <input type="text" value={item}
                    onChange={(e) => { const u = [...descriptionPoints]; u[index] = e.target.value; setDescriptionPoints(u); }}
                    placeholder={`Description point ${index + 1}`}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20" />
                  {descriptionPoints.length > 1 && (
                    <button type="button" onClick={() => setDescriptionPoints(descriptionPoints.filter((_, i) => i !== index))}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setDescriptionPoints([...descriptionPoints, ''])}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:text-ocean hover:bg-ocean/5">
                <Plus className="h-4 w-4" /> Add Point
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Responsibilities <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {responsibilities.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...responsibilities];
                      updated[index] = e.target.value;
                      setResponsibilities(updated);
                    }}
                    placeholder={`Responsibility ${index + 1}`}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                  />
                  {responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setResponsibilities(responsibilities.filter((_, i) => i !== index))}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setResponsibilities([...responsibilities, ''])}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:text-ocean hover:bg-ocean/5"
              >
                <Plus className="h-4 w-4" /> Add Point
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Qualifications <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {qualifications.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...qualifications];
                      updated[index] = e.target.value;
                      setQualifications(updated);
                    }}
                    placeholder={`Qualification ${index + 1}`}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                  />
                  {qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQualifications(qualifications.filter((_, i) => i !== index))}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setQualifications([...qualifications, ''])}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:text-ocean hover:bg-ocean/5"
              >
                <Plus className="h-4 w-4" /> Add Point
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Experience</label>
              <input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 2-3 years"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Salary Range</label>
              <input value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="e.g. ₹3-5 LPA"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Target Gender</label>
              <select value={form.targetGender} onChange={(e) => setForm({ ...form, targetGender: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean">
                <option value="any">Any / Open to All</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.askEducationalDetails}
                  onChange={(e) => setForm({ ...form, askEducationalDetails: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-ocean focus:ring-ocean/30" />
                <div>
                  <span className="text-sm font-semibold text-gray-700">Ask Educational Details</span>
                  <p className="text-xs text-gray-400">Degree, college, city, study years</p>
                </div>
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editingJob ? 'Save Changes' : 'Create Job'}</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Job" size="sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete this job? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
