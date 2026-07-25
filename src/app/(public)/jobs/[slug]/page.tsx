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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-gray-900">
          {error || 'Job not found'}
        </h2>
        <Button variant="secondary" className="mt-6" onClick={() => router.push('/jobs')}>
          Browse All Jobs
        </Button>
      </div>
    );
  }

  const departmentName =
    typeof job.department === 'object' && job.department !== null
      ? job.department.name
      : '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Header Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="h-2 bg-gradient-to-r from-navy via-ocean to-cyan" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={job.type}>{typeLabels[job.type]}</Badge>
                <span className="text-xs text-gray-400">Posted {formatDate(job.createdAt)}</span>
              </div>
              <h1 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">
                {job.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {departmentName && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-ocean/5 px-3 py-1.5">
                    <Briefcase className="h-4 w-4 text-ocean" />
                    {departmentName}
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {job.location}
                </span>
                {job.experience && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {job.experience}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 font-medium text-green-700">
                    <IndianRupee className="h-4 w-4" />
                    {job.salaryRange}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-navy">About This Role</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-navy">Responsibilities</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {job.responsibilities}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {job.qualifications && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-navy">Qualifications</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {job.qualifications}
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-6"
        >
          {/* Apply Card */}
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-navy">Interested?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Applications are reviewed on a rolling basis. Don&apos;t miss this opportunity.
            </p>
            <Link href={`/jobs/${job.slug}/apply`} className="mt-4 block">
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
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-background p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Job Type</span>
                <span className="font-medium text-navy">{typeLabels[job.type]}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-navy">{job.location}</span>
              </div>
              {job.experience && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium text-navy">{job.experience}</span>
                </div>
              )}
              {job.salaryRange && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Salary</span>
                  <span className="font-bold text-green-600">{job.salaryRange}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
