'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { getPublicJobs, getDepartments } from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { JobCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Job, Department, PaginationInfo } from '@/types';

const typeLabels: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  volunteer: 'Volunteer',
  intern: 'Internship',
};

const jobTypes = [
  { value: '', label: 'All Types' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'intern', label: 'Internship' },
];

// Full class strings only — Tailwind cannot detect names built by interpolation.
const cardThemes = [
  { icon: 'from-navy to-ocean', tint: 'to-ocean/[0.05]', accent: 'text-ocean', hoverText: 'group-hover:text-ocean' },
  { icon: 'from-plum to-plumDeep', tint: 'to-plum/[0.05]', accent: 'text-plum', hoverText: 'group-hover:text-plum' },
  { icon: 'from-teal to-tealDeep', tint: 'to-teal/[0.05]', accent: 'text-teal', hoverText: 'group-hover:text-teal' },
  { icon: 'from-gold to-goldDeep', tint: 'to-gold/[0.06]', accent: 'text-goldDeep', hoverText: 'group-hover:text-goldDeep' },
  { icon: 'from-rose to-roseDeep', tint: 'to-rose/[0.05]', accent: 'text-rose', hoverText: 'group-hover:text-rose' },
  { icon: 'from-ocean to-cyan', tint: 'to-cyan/[0.06]', accent: 'text-ocean', hoverText: 'group-hover:text-ocean' },
];

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="page-canvas min-h-screen pt-[140px]"><div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">{Array.from({ length: 3 }, (_, i) => <JobCardSkeleton key={i} />)}</div></div>}>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const type = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchJobs = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string | number> = { page, limit: 9 };
      if (search) params.search = search;
      if (department) params.department = department;
      if (type) params.type = type;
      const data = await getPublicJobs(params);
      if (id !== requestId.current) return; // a newer request superseded this one
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [search, department, type, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { getDepartments({ active: true }).then(setDepartments).catch(() => {}); }, []);

  // Keep the box in step with the URL (back/forward, "clear all").
  useEffect(() => { setSearchInput(search); }, [search]);

  // Live search: apply the typed query shortly after the visitor stops typing.
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => updateParams('search', searchInput.trim()), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    if (key !== 'page') params.delete('page');
    router.push(`/jobs?${params.toString()}`);
    if (key === 'page') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateParams('search', searchInput); };
  const clearFilters = () => { router.push('/jobs'); setSearchInput(''); };
  const hasFilters = search || department || type;
  const activeDepartment = departments.find((d) => d._id === department)?.name;
  const typeLabel = jobTypes.find((t) => t.value === type)?.label;
  const departmentName = (dept: Job['department']): string => (typeof dept === 'object' && dept !== null && 'name' in dept) ? dept.name : '';

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean py-12 pt-[104px] sm:py-16 sm:pt-[120px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-24 -left-24 h-[300px] w-[300px] rounded-full bg-gold/10 animate-float-delayed" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-cyan backdrop-blur-sm border border-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            {pagination.total} Open Position{pagination.total !== 1 ? 's' : ''}
          </div>
          <h1 className="mt-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Find Your Calling</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Join a team that makes a real difference. Every role at HKM is a chance to serve and grow.
          </p>
        </div>
      </section>

      {/* Search + Jobs */}
      <section className="page-canvas py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search bar — column on phones so the input can actually shrink */}
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="search" aria-label="Search positions" placeholder="Search by title, skill, or keyword..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white py-3.5 pl-11 pr-11 text-sm [&::-webkit-search-cancel-button]:hidden shadow-lift ring-1 ring-navy/[0.04] transition-all focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/20" />
              {searchInput && (
                <button type="button" aria-label="Clear search" onClick={() => { setSearchInput(''); updateParams('search', ''); }}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-lift ring-1 ring-navy/[0.04] transition-all ${showFilters || hasFilters ? 'border-ocean bg-gradient-to-br from-ocean/10 to-plum/5 text-ocean' : 'border-white/80 bg-white text-gray-600 hover:text-ocean'}`}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ocean text-[10px] font-bold text-white">{[search, department, type].filter(Boolean).length}</span>}
            </button>
          </form>

          {/* Filter panel */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap items-end gap-4 rounded-2xl border border-white/80 bg-white p-5 shadow-lift ring-1 ring-navy/[0.04]">
              <div className="min-w-0 flex-1 sm:min-w-[180px]">
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                <select value={department} onChange={(e) => updateParams('department', e.target.value)}
                  className="w-full max-w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20">
                  <option value="">All Departments</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:min-w-[180px] sm:max-w-[220px]">
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Type</label>
                <select value={type} onChange={(e) => updateParams('type', e.target.value)}
                  className="w-full max-w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20">
                  {jobTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                  <X className="h-4 w-4" /> Clear all
                </button>
              )}
            </motion.div>
          )}

          {/* Active filter chips + result count */}
          {(hasFilters || (!loading && !error)) && (
            <div className="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
              {!loading && !error && (
                <span className="mr-1 text-sm font-medium text-gray-600">
                  {pagination.total} {pagination.total === 1 ? 'position' : 'positions'}
                </span>
              )}
              {[
                search && { label: `“${search}”`, clear: () => { setSearchInput(''); updateParams('search', ''); } },
                activeDepartment && { label: activeDepartment, clear: () => updateParams('department', '') },
                type && typeLabel && { label: typeLabel, clear: () => updateParams('type', '') },
              ].filter(Boolean).map((chip) => {
                const c = chip as { label: string; clear: () => void };
                return (
                  <button key={c.label} type="button" onClick={c.clear} aria-label={`Remove filter ${c.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ocean/20 bg-white px-3 py-1.5 text-xs font-semibold text-ocean shadow-sm transition-colors hover:bg-ocean/5">
                    {c.label} <X className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load the openings"
              description="Please check your connection and try again."
              action={<button onClick={fetchJobs} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-ocean">Try again</button>}
            />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No positions found"
              description="Try a different keyword or remove a filter."
              action={hasFilters ? <button onClick={clearFilters} className="text-sm font-semibold text-ocean transition-colors hover:text-navy">Clear all filters</button> : undefined}
            />
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job, i) => {
                  const t = cardThemes[i % cardThemes.length];
                  return (
                    <Link key={job._id} href={`/jobs/${job.slug}`} className="min-w-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2">
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`group accent-sweep flex h-full min-w-0 flex-col rounded-2xl border border-white/70 bg-gradient-to-br from-white ${t.tint} p-6 shadow-lift ring-1 ring-navy/[0.04] transition-all hover:shadow-glow hover:-translate-y-1`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.icon} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <Badge variant={job.type}>{typeLabels[job.type]}</Badge>
                        </div>
                        <h3 className={`mt-4 text-lg font-bold leading-snug text-navy transition-colors ${t.hoverText}`}>{job.title}</h3>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-500">
                          {departmentName(job.department) && (
                            <span className="flex min-w-0 items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surfaceAlt"><Briefcase className={`h-3 w-3 ${t.accent} opacity-70`} /></span><span className="truncate">{departmentName(job.department)}</span></span>
                          )}
                          <span className="flex min-w-0 items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surfaceAlt"><MapPin className={`h-3 w-3 ${t.accent} opacity-70`} /></span><span className="truncate">{job.location}</span></span>
                        </div>
                        <div className="mt-auto pt-5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
                            {job.salaryRange && <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">{job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}</span>}
                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${t.accent} transition-colors`}>
                              Details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button aria-label="Previous page" onClick={() => updateParams('page', String(page - 1))} disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm sm:px-4">
                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      typeof p === 'string' ? (
                        <span key={`e-${i}`} className="px-1 text-gray-400">...</span>
                      ) : (
                        <button key={p} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined} onClick={() => updateParams('page', String(p))}
                          className={`h-10 min-w-10 rounded-xl px-2 text-sm font-semibold transition-all shadow-sm ${p === page ? 'bg-gradient-to-br from-navy to-ocean text-white shadow-md' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      )
                    )}
                  <button aria-label="Next page" onClick={() => updateParams('page', String(page + 1))} disabled={page >= pagination.pages}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm sm:px-4">
                    <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
