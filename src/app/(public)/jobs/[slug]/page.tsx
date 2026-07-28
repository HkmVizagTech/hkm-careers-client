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
  FileText,
  ListChecks,
  GraduationCap,
  Building2,
  Calendar,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { getPublicJobBySlug } from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';

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

function renderPoints(text: string) {
  const lines = text.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="text-sm leading-relaxed text-gray-600">{text}</p>;
  }
  return (
    <ul className="space-y-3">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-gray-600">
          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-br from-ocean to-cyan" />
          {line}
        </li>
      ))}
    </ul>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Spinner size="lg" />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-100/60 to-ocean/[0.04]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-[#0a2d6e] to-ocean py-12 sm:py-16">
        {/* Decorative floating circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-[350px] w-[350px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full bg-gold/10 animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 h-[120px] w-[120px] rounded-full bg-white/5 animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Briefcase className="h-8 w-8 text-cyan" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan backdrop-blur-sm border border-white/10">
                  {typeLabels[job.type]}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/50">
                  <Calendar className="h-3.5 w-3.5" />
                  Posted {formatDate(job.createdAt)}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {job.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 overflow-hidden">
                {departmentName && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/10">
                    <Building2 className="h-3.5 w-3.5 text-cyan" />
                    {departmentName}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/10">
                  <MapPin className="h-3.5 w-3.5 text-cyan" />
                  {job.location}
                </span>
                {job.experience && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/10">
                    <Clock className="h-3.5 w-3.5 text-cyan" />
                    {job.experience}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm border border-emerald-400/20">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}
                  </span>
                )}
                {job.targetGender && job.targetGender !== 'any' && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-purple-400/15 px-4 py-1.5 text-sm font-medium text-purple-200 backdrop-blur-sm border border-purple-400/20">
                    {job.targetGender === 'female' ? '♀ Female Only' : '♂ Male Only'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 pb-8 bg-background">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Left Column - Content Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* About This Role */}
            <motion.div
              variants={fadeUp}
              className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/30 shadow-xl shadow-navy/5"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-navy">About This Role</h2>
              </div>
              <div className="p-6 sm:p-8">
                {renderPoints(job.description)}
              </div>
            </motion.div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <motion.div
                variants={fadeUp}
                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-ocean/[0.02] shadow-xl shadow-navy/5"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ocean to-cyan text-white shadow-md shadow-ocean/20">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-navy">Responsibilities</h2>
                </div>
                <div className="p-6 sm:p-8">
                  {renderPoints(job.responsibilities)}
                </div>
              </motion.div>
            )}

            {/* Qualifications */}
            {job.qualifications && (
              <motion.div
                variants={fadeUp}
                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gold/[0.03] shadow-xl shadow-navy/5"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-amber-500 text-white shadow-md shadow-gold/20">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-navy">Qualifications</h2>
                </div>
                <div className="p-6 sm:p-8">
                  {renderPoints(job.qualifications)}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div variants={fadeUp} className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Apply Card */}
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-ocean/[0.04] shadow-xl shadow-navy/5">
                <div className="h-1.5 bg-gradient-to-r from-navy via-ocean to-cyan" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-navy">Interested?</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Applications are reviewed on a rolling basis. Don&apos;t miss this opportunity.
                  </p>
                  <Link href={`/jobs/${job.slug}/apply`} className="mt-5 block">
                    <button className="w-full rounded-2xl bg-gradient-to-r from-navy to-ocean px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy/20 transition-all hover:shadow-xl hover:shadow-navy/25 hover:scale-[1.02] active:scale-[0.98]">
                      <CheckCircle className="mr-2 inline h-4 w-4" />
                      Apply Now
                    </button>
                  </Link>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100">
                      <Bookmark className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Details Card */}
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-navy/[0.03] shadow-xl shadow-navy/5">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                    Job Details
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      Job Type
                    </span>
                    <Badge variant={job.type}>{typeLabels[job.type]}</Badge>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      Location
                    </span>
                    <span className="text-sm font-medium text-navy">{job.location}</span>
                  </div>
                  {departmentName && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          Department
                        </span>
                        <span className="text-sm font-medium text-navy">{departmentName}</span>
                      </div>
                    </>
                  )}
                  {job.experience && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 text-gray-400" />
                          Experience
                        </span>
                        <span className="text-sm font-medium text-navy">{job.experience}</span>
                      </div>
                    </>
                  )}
                  {job.salaryRange && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                          <IndianRupee className="h-4 w-4 text-gray-400" />
                          Salary
                        </span>
                        <span className="text-sm font-bold text-green-600">{job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Posted
                    </span>
                    <span className="text-sm font-medium text-navy">{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Share This Job Card */}
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-cyan/[0.04] shadow-xl shadow-navy/5">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                    Share This Job
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    Know someone who would be great for this role? Spread the word!
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-background p-2">
                    <div className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-gray-500 border border-gray-200">
                      {typeof window !== 'undefined' ? window.location.href : `/jobs/${job.slug}`}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-navy to-ocean px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-md hover:shadow-navy/20 active:scale-[0.97]"
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
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out this job: ${job.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300"
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

    </div>
  );
}
