'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  FileText,
  ListChecks,
  GraduationCap,
  Building2,
  Calendar,
  Copy,
  ExternalLink,
  X,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { getPublicJobBySlug } from '@/lib/services';
import { captureApplySource } from '@/lib/applySource';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';
import JobText from '@/components/ui/JobText';
import { hasQualifications } from '@/lib/jobText';

const typeLabels: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  volunteer: 'Volunteer',
  intern: 'Internship',
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Shared links carry ?src=linkedin etc.; keep it for the application form.
  useEffect(() => { captureApplySource(); }, []);

  // "Save" keeps a list of bookmarked job slugs in this browser only.
  useEffect(() => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem('hkm-saved-jobs') || '[]');
      setSaved(list.includes(slug));
    } catch { /* storage unavailable */ }
  }, [slug]);

  const toggleSaved = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem('hkm-saved-jobs') || '[]');
      const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
      localStorage.setItem('hkm-saved-jobs', JSON.stringify(next));
      setSaved(next.includes(slug));
    } catch {
      setSaved((v) => !v);
    }
  };

  // Escape closes the confirm dialog.
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfirmOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicJobBySlug(slug);
        setJob(data);
      } catch {
        setError('Job not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Lock body scroll while the confirm dialog is open.
  useEffect(() => {
    if (!confirmOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [confirmOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the link is still visible in the share box */ }
  };

  // Phones get the native share sheet; desktops fall back to copying the link.
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && job) {
      try {
        await navigator.share({ title: job.title, url: window.location.href });
        return;
      } catch { /* cancelled */ }
    }
    handleCopyLink();
  };

  const startApplication = () => {
    setConfirmOpen(false);
    router.push(`/jobs/${slug}/apply`);
  };

  if (loading) {
    return (
      <div className="page-canvas min-h-screen" aria-busy="true">
        <div className="bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean pb-12 pt-[120px]">
          <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-24 bg-white/20" />
            <Skeleton className="h-10 w-2/3 bg-white/20" />
            <Skeleton className="h-8 w-1/2 bg-white/10" />
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-44" />
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-background via-gray-100/60 to-ocean/[0.04]">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200/60 shadow-inner">
            <AlertCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-navy">
            {error || 'Job not found'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            This position may have been filled or the link may be incorrect.
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => router.push('/jobs')}>
            Browse All Jobs
          </Button>
        </div>
      </div>
    );
  }

  const departmentName =
    typeof job.department === 'object' && job.department !== null
      ? job.department.name
      : '';

  return (
    <div className="page-canvas min-h-screen pb-24 sm:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean pb-10 pt-[104px] sm:pb-14 sm:pt-[120px]">
        {/* Decorative floating circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-[350px] w-[350px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full bg-gold/10 animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 h-[120px] w-[120px] rounded-full bg-white/5 animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm sm:flex">
              <Briefcase className="h-8 w-8 text-cyan" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan backdrop-blur-sm">
                  {typeLabels[job.type]}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/50">
                  <Calendar className="h-3.5 w-3.5" />
                  Posted {formatDate(job.createdAt)}
                </span>
              </div>
              <h1 className="mt-3 break-words text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {job.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                {departmentName && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-cyan" />
                    <span className="max-w-[50vw] truncate sm:max-w-none">{departmentName}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan" />
                  {job.location}
                </span>
                {job.experience && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-cyan" />
                    {job.experience}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/15 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm">
                    <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                    {job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}
                  </span>
                )}
                {job.targetGender && job.targetGender !== 'any' && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/15 px-4 py-1.5 text-sm font-medium text-purple-200 backdrop-blur-sm">
                    {job.targetGender === 'female' ? '♀ Female Only' : '♂ Male Only'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Apply CTA */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-goldDeep px-8 py-3.5 text-sm font-bold text-navy shadow-lg shadow-gold/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-gold/35 active:scale-[0.98]"
            >
              <CheckCircle className="h-4 w-4" />
              Apply Now
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              <Share2 className="h-4 w-4" />
              Share Job
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-8 pb-8 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Left Column - Content Cards */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* About This Role */}
            <motion.div
              variants={fadeUp}
              className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-navy">About This Role</h2>
              </div>
              <div className="p-5 sm:p-8">
                <JobText text={job.description} format={job.descriptionFormat} />
              </div>
            </motion.div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <motion.div
                variants={fadeUp}
                className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-8">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean to-cyan text-white shadow-md shadow-ocean/20">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-navy">Responsibilities</h2>
                </div>
                <div className="p-5 sm:p-8">
                  <JobText text={job.responsibilities} format={job.descriptionFormat} />
                </div>
              </motion.div>
            )}

            {/* Qualifications */}
            {hasQualifications(job) && (
              <motion.div
                variants={fadeUp}
                className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-8">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-amber-500 text-white shadow-md shadow-gold/20">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-navy">Qualifications</h2>
                </div>
                <div className="space-y-5 p-5 sm:p-8">
                  {!!job.qualificationTags?.length && (
                    <ul className="flex flex-wrap gap-2" aria-label="Education">
                      {job.qualificationTags.map((tag) => (
                        <li
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-sm font-semibold text-navy"
                        >
                          <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                  <JobText text={job.qualifications} format={job.descriptionFormat} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div variants={fadeUp} className="min-w-0 space-y-6">
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Apply Card */}
              <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-lift">
                <div className="h-1.5 bg-gradient-to-r from-navy via-ocean to-cyan" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-navy">Interested?</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Applications are reviewed on a rolling basis. Don&apos;t miss this opportunity.
                  </p>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-navy to-ocean px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-navy/25 active:scale-[0.98]"
                  >
                    <CheckCircle className="mr-2 inline h-4 w-4" />
                    Apply Now
                  </button>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={toggleSaved}
                      aria-pressed={saved}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${saved ? 'border-ocean/30 bg-ocean/10 text-ocean' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      {saved ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Details Card */}
              <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
                    Job Details
                  </h3>
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      Job Type
                    </span>
                    <Badge variant={job.type}>{typeLabels[job.type]}</Badge>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      Location
                    </span>
                    <span className="min-w-0 truncate text-right text-sm font-medium text-navy">{job.location}</span>
                  </div>
                  {departmentName && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          Department
                        </span>
                        <span className="min-w-0 text-right text-sm font-medium text-navy">{departmentName}</span>
                      </div>
                    </>
                  )}
                  {job.experience && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 text-gray-400" />
                          Experience
                        </span>
                        <span className="min-w-0 text-right text-sm font-medium text-navy">{job.experience}</span>
                      </div>
                    </>
                  )}
                  {job.deadline && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          Apply by
                        </span>
                        <span className="min-w-0 text-right text-sm font-semibold text-navy">{formatDate(job.deadline)}</span>
                      </div>
                    </>
                  )}
                  {job.salaryRange && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                          <IndianRupee className="h-4 w-4 text-gray-400" />
                          Salary
                        </span>
                        <span className="text-right text-sm font-bold text-green-600">{job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-100" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Posted
                    </span>
                    <span className="text-sm font-medium text-navy">{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Share This Job Card */}
              <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
                    Share This Job
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    Know someone who would be great for this role? Spread the word!
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-background p-2">
                    <div className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                      {typeof window !== 'undefined' ? window.location.href : `/jobs/${job.slug}`}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-navy to-ocean px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-md hover:shadow-navy/20 active:scale-[0.97]"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out this job: ${job.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile sticky apply bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(5,32,87,0.12)] backdrop-blur-xl sm:hidden">
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-navy to-ocean px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy/25 active:scale-[0.98]"
        >
          <CheckCircle className="h-4 w-4" />
          Apply Now — {job.title.length > 24 ? `${job.title.slice(0, 24)}…` : job.title}
        </button>
      </div>

      {/* "Did you read the description?" confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm application">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="h-2 bg-gradient-to-r from-navy via-ocean to-gold" />
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-goldDeep shadow-lg shadow-gold/30">
                  <FileText className="h-7 w-7 text-navy" />
                </div>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="mt-5 text-xl font-bold text-navy sm:text-2xl">
                Did you read the full job description?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Before you begin, please make sure you&apos;ve gone through the role details,
                responsibilities, and qualifications above. This helps you put together a strong
                application — and helps our team respond faster.
              </p>

              <ul className="mt-5 space-y-2.5 border-l-2 border-ocean/30 pl-4 text-sm text-gray-600">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-ocean" />
                  Yes, I&apos;ve read the description
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-ocean" />
                  I meet the key qualifications
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-ocean" />
                  My resume is ready to upload
                </li>
              </ul>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100"
                >
                  Not yet — take me back
                </button>
                <button
                  onClick={startApplication}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-navy to-ocean px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy/25 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                >
                  Yes, Start Application
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
