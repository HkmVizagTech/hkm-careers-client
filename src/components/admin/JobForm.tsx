'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  FileText,
  ListChecks,
  GraduationCap,
  Plus,
  X,
  Info,
  Eye,
  MapPin,
  IndianRupee,
  Clock,
  Users,
} from 'lucide-react';
import { createJob, updateJob } from '@/lib/services';
import type { Job, Department } from '@/types';

const typeLabels: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  volunteer: 'Volunteer',
  intern: 'Internship',
};

interface JobFormState {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  experience: string;
  salaryRange: string;
  status: string;
  askEducationalDetails: boolean;
  targetGender: string;
}

const emptyForm: JobFormState = {
  title: '',
  department: '',
  location: 'Visakhapatnam',
  type: 'full-time',
  description: '',
  responsibilities: '',
  qualifications: '',
  experience: '',
  salaryRange: '',
  status: 'active',
  askEducationalDetails: false,
  targetGender: 'any',
};

/** One "point" row used by the repeating bullet inputs. */
function PointRows({
  label,
  icon: Icon,
  hint,
  points,
  setPoints,
  placeholder,
  required = false,
}: {
  label: string;
  icon: React.ElementType;
  hint?: string;
  points: string[];
  setPoints: (p: string[]) => void;
  placeholder: string;
  required?: boolean;
}) {
  const update = (i: number, v: string) => {
    const next = [...points];
    next[i] = v;
    setPoints(next);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Icon className="h-4 w-4 text-ocean" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      <div className="mt-2.5 space-y-2">
        {points.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-xs font-bold text-navy">
              {i + 1}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-ocean focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
            {points.length > 1 && (
              <button
                type="button"
                onClick={() => setPoints(points.filter((_, idx) => idx !== i))}
                className="shrink-0 rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPoints([...points, ''])}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:bg-ocean/5 hover:text-ocean"
        >
          <Plus className="h-4 w-4" /> Add point
        </button>
      </div>
    </div>
  );
}

export default function JobForm({
  departments,
  job,
}: {
  departments: Department[];
  job?: Job | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<JobFormState>(
    job
      ? {
          title: job.title,
          department: typeof job.department === 'object' ? job.department._id : job.department,
          location: job.location,
          type: job.type,
          description: job.description,
          responsibilities: job.responsibilities || '',
          qualifications: job.qualifications || '',
          experience: job.experience || '',
          salaryRange: job.salaryRange || '',
          status: job.status,
          askEducationalDetails: job.askEducationalDetails || false,
          targetGender: job.targetGender || 'any',
        }
      : emptyForm
  );
  const [descriptionPoints, setDescriptionPoints] = useState<string[]>(
    job?.description ? job.description.split('\n').filter(Boolean) : ['']
  );
  const [responsibilityPoints, setResponsibilityPoints] = useState<string[]>(
    job?.responsibilities ? job.responsibilities.split('\n').filter(Boolean) : ['']
  );
  const [qualificationPoints, setQualificationPoints] = useState<string[]>(
    job?.qualifications ? job.qualifications.split('\n').filter(Boolean) : ['']
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const deptName = useMemo(
    () => departments.find((d) => d._id === form.department)?.name || '—',
    [departments, form.department]
  );

  const filledPoints = (arr: string[]) => arr.map((p) => p.trim()).filter(Boolean);
  const isEdit = !!job;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Job title is required';
    if (!form.department) errs.department = 'Department is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (filledPoints(descriptionPoints).length === 0) errs.description = 'Add at least one description point';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError('Please fix the highlighted fields.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const jobData = {
        ...form,
        description: filledPoints(descriptionPoints).join('\n'),
        responsibilities: filledPoints(responsibilityPoints).join('\n'),
        qualifications: filledPoints(qualificationPoints).join('\n'),
      };
      if (isEdit && job) await updateJob(job._id, jobData as Partial<Job>);
      else await createJob(jobData as Partial<Job> & { department: string });
      router.push('/admin/jobs');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Failed to save job'));
      setSaving(false);
    }
  };

  const inputClass = (key: string) =>
    `w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 ${
      fieldErrors[key] ? 'border-red-400 bg-red-50/40 focus:border-red-400' : 'border-gray-200 focus:border-ocean'
    }`;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/jobs"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-navy"
            aria-label="Back to jobs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Job' : 'Create Job'}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEdit ? `Updating “${job?.title}”` : 'Fill in the basics — you can edit everything later'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className={`inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all sm:self-auto ${
            showPreview
              ? 'border-ocean bg-ocean/5 text-ocean'
              : 'border-gray-200 bg-white text-gray-600 hover:text-ocean'
          }`}
        >
          <Eye className="h-4 w-4" />
          {showPreview ? 'Hide preview' : 'Preview'}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Form column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: The Basics */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-navy to-ocean text-xs font-bold text-white">1</span>
              The Basics
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Program Coordinator"
                  className={inputClass('title')}
                />
                {fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => set('department', e.target.value)}
                    className={inputClass('department')}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.department && <p className="mt-1 text-xs text-red-500">{fieldErrors.department}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Job Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('type', value)}
                        className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
                          form.type === value
                            ? 'border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5 text-ocean'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="e.g. Visakhapatnam"
                      className={`${inputClass('location')} pl-10`}
                    />
                  </div>
                  {fieldErrors.location && <p className="mt-1 text-xs text-red-500">{fieldErrors.location}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Experience</label>
                  <input
                    value={form.experience}
                    onChange={(e) => set('experience', e.target.value)}
                    placeholder="e.g. 2-3 years"
                    className={inputClass('experience')}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Salary Range</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.salaryRange}
                    onChange={(e) => set('salaryRange', e.target.value)}
                    placeholder="e.g. ₹3-5 LPA (optional)"
                    className={`${inputClass('salaryRange')} pl-10`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Description */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-ocean to-cyan text-xs font-bold text-white">2</span>
              Role Details
            </h2>
            <p className="mt-1 text-xs text-gray-400">Each point becomes a bullet on the job page.</p>
            <div className="mt-5 space-y-6">
              <PointRows
                label="Description"
                icon={FileText}
                points={descriptionPoints}
                setPoints={setDescriptionPoints}
                placeholder="What is this role about?"
                required
              />
              {fieldErrors.description && <p className="-mt-4 text-xs text-red-500">{fieldErrors.description}</p>}
              <PointRows
                label="Responsibilities"
                icon={ListChecks}
                points={responsibilityPoints}
                setPoints={setResponsibilityPoints}
                placeholder="What will they do day to day?"
              />
              <PointRows
                label="Qualifications"
                icon={GraduationCap}
                points={qualificationPoints}
                setPoints={setQualificationPoints}
                placeholder="What skills or education are needed?"
              />
            </div>
          </section>

          {/* Section: Requirements & Visibility */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-goldDeep text-xs font-bold text-white">3</span>
              Application Settings
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Open Applications To</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'any', label: 'Everyone' },
                    { value: 'male', label: 'Male only' },
                    { value: 'female', label: 'Female only' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('targetGender', opt.value)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                        form.targetGender === opt.value
                          ? 'border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5 text-ocean'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => set('askEducationalDetails', !form.askEducationalDetails)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  form.askEducationalDetails
                    ? 'border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span
                  className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                    form.askEducationalDetails ? 'justify-end bg-ocean' : 'justify-start bg-gray-300'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-700">Ask for educational details</span>
                  <span className="block text-xs text-gray-400">Degree, college, city, and years of study</span>
                </span>
              </button>
            </div>
          </section>

          {/* Sticky action bar */}
          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg shadow-navy/10 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hidden sm:inline">Status:</span>
              <div className="flex rounded-xl bg-gray-100 p-1">
                {(['draft', 'active', 'closed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all ${
                      form.status === s
                        ? s === 'active'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                          : s === 'draft'
                            ? 'bg-white text-gray-700 shadow-sm'
                            : 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/jobs"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-navy/20 transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 sm:flex-none"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEdit ? 'Save Changes' : 'Publish Job'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview column */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            {/* Summary card (always visible on desktop) */}
            <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${showPreview ? '' : 'hidden lg:block'}`}>
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Info className="h-4 w-4 text-ocean" />
                Live Preview
              </h3>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean p-5">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan">
                  {typeLabels[form.type]}
                </span>
                <h4 className="mt-2.5 break-words text-lg font-bold text-white">
                  {form.title || 'Job Title'}
                </h4>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {form.location || 'Location'}
                  </span>
                  {form.experience && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {form.experience}
                    </span>
                  )}
                </div>
                {form.salaryRange && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    <IndianRupee className="h-3 w-3" />
                    {form.salaryRange}
                  </span>
                )}
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Department</dt>
                  <dd className="truncate font-medium text-gray-700">{deptName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Description</dt>
                  <dd className="font-medium text-gray-700">{filledPoints(descriptionPoints).length} points</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Responsibilities</dt>
                  <dd className="font-medium text-gray-700">{filledPoints(responsibilityPoints).length} points</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Qualifications</dt>
                  <dd className="font-medium text-gray-700">{filledPoints(qualificationPoints).length} points</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Open to</dt>
                  <dd className="font-medium text-gray-700">
                    {form.targetGender === 'any' ? 'Everyone' : form.targetGender === 'male' ? 'Male only' : 'Female only'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Education form</dt>
                  <dd className="font-medium text-gray-700">{form.askEducationalDetails ? 'Shown' : 'Hidden'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
