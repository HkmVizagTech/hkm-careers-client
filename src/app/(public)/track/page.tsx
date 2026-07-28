'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Briefcase,
  User,
  Mail,
  Calendar,
  Sparkles,
  FileSearch,
  XCircle,
  ClipboardList,
  Users,
  MessageSquare,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { trackApplication } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

type TrackedApplication = {
  name: string;
  email: string;
  job: { title: string; location: string; type: string } | null;
  status: string;
  appliedAt: string;
};

const steps = [
  { key: 'received', label: 'Received', icon: ClipboardList },
  { key: 'under-review', label: 'Under Review', icon: FileSearch },
  { key: 'shortlisted', label: 'Shortlisted', icon: Users },
  { key: 'interview', label: 'Interview', icon: MessageSquare },
  { key: 'selected', label: 'Selected', icon: Trophy },
];

function getStepIndex(status: string) {
  const idx = steps.findIndex((s) => s.key === status);
  return idx === -1 ? -1 : idx;
}

export default function TrackPage() {
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedApplication | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = applicationId.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    try {
      const data = await trackApplication(trimmed);
      setResult(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr.response?.status === 404) {
        setError('No application found with this ID. Please check and try again.');
      } else {
        setError(
          axiosErr.response?.data?.message ||
            (err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isRejected = result?.status === 'rejected';
  const currentStepIndex = result ? getStepIndex(result.status) : -1;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy via-[#0a2d6e] to-ocean py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gold/10 animate-float-delayed" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-cyan backdrop-blur-sm border border-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            Application Status
          </div>
          <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Track Your Application
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
            Enter your Application ID to check the current status of your application.
            You received this ID when you submitted your application.
          </p>
        </div>
      </section>

      {/* Search Card */}
      <section className="relative py-8 pb-16 bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-navy/10"
          >
            <div className="h-1.5 bg-gradient-to-r from-navy via-ocean to-cyan" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">Find Your Application</h2>
                  <p className="text-sm text-gray-400">Paste your application reference ID below</p>
                </div>
              </div>
              <form onSubmit={handleTrack} className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <FileSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    placeholder="Enter Application ID (e.g. 6651a3f...)"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                  />
                </div>
                <Button type="submit" loading={loading} size="lg" className="shrink-0">
                  <Search className="h-4 w-4" />
                  Track
                </Button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mx-auto mt-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error / Not Found */}
        {!loading && error && searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mt-10 max-w-2xl px-4 sm:px-6 lg:px-8"
          >
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Application Not Found</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{error}</p>
              <p className="mt-4 text-xs text-gray-400">
                Make sure you&apos;re using the exact ID you received after submitting your application.
              </p>
            </div>
          </motion.div>
        )}

        {/* Result Card */}
        {!loading && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-10 max-w-3xl px-4 sm:px-6 lg:px-8"
          >
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-navy/10">
              {/* Top gradient bar */}
              <div className={`h-2 ${isRejected ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-navy via-ocean to-cyan'}`} />

              <div className="p-6 sm:p-8 lg:p-10">
                {/* Applicant Info */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-ocean text-white shadow-lg shadow-navy/20">
                      <User className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-navy">{result.name}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                        <Mail className="h-3.5 w-3.5" />
                        {result.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 border border-gray-200">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Applied</p>
                      <p className="text-sm font-medium text-navy">
                        {new Date(result.appliedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                {result.job && (
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Position Applied For</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean/10">
                          <Briefcase className="h-5 w-5 text-ocean" />
                        </div>
                        <h4 className="text-lg font-bold text-navy">{result.job.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-gray-200 shadow-sm">
                          <MapPin className="h-3.5 w-3.5 text-ocean" />
                          {result.job.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-gray-200 shadow-sm">
                          <Clock className="h-3.5 w-3.5 text-ocean" />
                          {result.job.type}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="my-8 border-t border-gray-200" />

                {/* Status Section */}
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Application Status</p>
                </div>

                {isRejected ? (
                  /* Rejected State */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 p-6 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-red-700">Not Selected</h4>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                      Unfortunately, your application was not selected to move forward at this time.
                      We appreciate your interest and encourage you to apply for other positions.
                    </p>
                    <Link href="/jobs">
                      <Button variant="outline" size="md" className="mt-5">
                        Browse Other Positions
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  /* Progress Stepper */
                  <div className="py-4">
                    {/* Desktop Stepper */}
                    <div className="hidden sm:block">
                      <div className="relative flex items-start justify-between">
                        {/* Connecting line background */}
                        <div className="absolute top-5 left-[10%] right-[10%] h-1 rounded-full bg-gray-200" />
                        {/* Connecting line progress */}
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{
                            width: currentStepIndex >= 0
                              ? `${(currentStepIndex / (steps.length - 1)) * 80}%`
                              : '0%',
                          }}
                          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                          className="absolute top-5 left-[10%] h-1 rounded-full bg-gradient-to-r from-navy via-ocean to-cyan"
                        />
                        {steps.map((step, i) => {
                          const isCompleted = currentStepIndex >= 0 && i < currentStepIndex;
                          const isCurrent = i === currentStepIndex;
                          const isFuture = currentStepIndex < 0 || i > currentStepIndex;
                          const StepIcon = step.icon;

                          return (
                            <motion.div
                              key={step.key}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.15 * i + 0.2 }}
                              className="relative z-10 flex flex-col items-center"
                              style={{ width: `${100 / steps.length}%` }}
                            >
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                  isCompleted
                                    ? 'border-green-400 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                                    : isCurrent
                                      ? 'border-ocean bg-gradient-to-br from-navy to-ocean text-white shadow-lg shadow-ocean/30 ring-4 ring-ocean/20'
                                      : 'border-gray-300 bg-white text-gray-300'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <StepIcon className="h-4.5 w-4.5" />
                                )}
                              </div>
                              <p
                                className={`mt-3 text-center text-xs font-semibold ${
                                  isCompleted
                                    ? 'text-green-600'
                                    : isCurrent
                                      ? 'text-navy'
                                      : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                              </p>
                              {isCurrent && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.6 }}
                                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-ocean/10 px-2.5 py-0.5 text-[10px] font-bold text-ocean"
                                >
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ocean opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ocean" />
                                  </span>
                                  Current
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mobile Stepper (vertical) */}
                    <div className="block sm:hidden">
                      <div className="relative ml-5 space-y-0">
                        {steps.map((step, i) => {
                          const isCompleted = currentStepIndex >= 0 && i < currentStepIndex;
                          const isCurrent = i === currentStepIndex;
                          const StepIcon = step.icon;

                          return (
                            <motion.div
                              key={step.key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 * i + 0.2 }}
                              className="relative flex items-start gap-4 pb-8 last:pb-0"
                            >
                              {/* Vertical line */}
                              {i < steps.length - 1 && (
                                <div
                                  className={`absolute left-[15px] top-10 h-[calc(100%-28px)] w-0.5 ${
                                    isCompleted ? 'bg-gradient-to-b from-green-400 to-green-400' : 'bg-gray-200'
                                  }`}
                                />
                              )}
                              <div
                                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                  isCompleted
                                    ? 'border-green-400 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/30'
                                    : isCurrent
                                      ? 'border-ocean bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-ocean/30 ring-4 ring-ocean/20'
                                      : 'border-gray-300 bg-white text-gray-300'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <StepIcon className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <div className="pt-0.5">
                                <p
                                  className={`text-sm font-semibold ${
                                    isCompleted
                                      ? 'text-green-600'
                                      : isCurrent
                                        ? 'text-navy'
                                        : 'text-gray-400'
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {isCurrent && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-1 inline-flex items-center gap-1 rounded-full bg-ocean/10 px-2.5 py-0.5 text-[10px] font-bold text-ocean"
                                  >
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ocean opacity-75" />
                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ocean" />
                                    </span>
                                    Current Stage
                                  </motion.span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Helpful hint when nothing is searched yet */}
        {!loading && !searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mx-auto mt-12 max-w-lg px-4 text-center"
          >
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy/5">
                <FileSearch className="h-8 w-8 text-ocean/50" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Your Application ID was provided when you submitted your application.
              Check your confirmation page or email for the reference number.
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
