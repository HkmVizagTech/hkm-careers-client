'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  X,
  User,
  Mail,
  Phone,
  Send,
  Sparkles,
  Briefcase,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Star,
  Shield,
} from 'lucide-react';
import { getPublicJobBySlug, submitApplication } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Job } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  coverLetter: z.string().optional(),
  isExperienced: z.boolean(),
  yearsOfExperience: z.string().optional(),
  lastEmployer: z.string().optional(),
  lastEmploymentFrom: z.string().optional(),
  lastEmploymentTo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [globalError, setGlobalError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isExperienced: false },
  });

  const isExperienced = watch('isExperienced');

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicJobBySlug(slug);
        setJob(data);
      } catch {
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError('');
    if (!selected) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(selected.type)) {
      setFileError('Only PDF, DOC, and DOCX files are allowed');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      const fakeEvent = { target: { files: [dropped] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!file) {
      setFileError('Resume is required');
      return;
    }
    if (!job) return;
    setSubmitting(true);
    setGlobalError('');
    try {
      const formData = new FormData();
      formData.append('job', job._id);
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      if (data.coverLetter) formData.append('coverLetter', data.coverLetter);
      formData.append('isExperienced', String(data.isExperienced));
      if (data.isExperienced) {
        if (data.yearsOfExperience) formData.append('yearsOfExperience', data.yearsOfExperience);
        if (data.lastEmployer) formData.append('lastEmployer', data.lastEmployer);
        if (data.lastEmploymentFrom) formData.append('lastEmploymentFrom', data.lastEmploymentFrom);
        if (data.lastEmploymentTo) formData.append('lastEmploymentTo', data.lastEmploymentTo);
      }
      formData.append('resume', file);
      const result = await submitApplication(formData);
      setApplicationId(result.application.id);
      setSubmitted(true);
    } catch (err: unknown) {
      setGlobalError(
        err instanceof Error ? err.message : 'Failed to submit application. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-white to-green-50/30">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl shadow-green-500/30">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="mt-8 text-3xl font-bold text-navy">Application Submitted!</h1>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Thank you for applying for <strong className="text-navy">{job?.title}</strong>. Our
              team will review your application and reach out to you via email.
            </p>
            {applicationId && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-navy/5">
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                <div className="p-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Application Reference
                  </p>
                  <p className="mt-2 font-mono text-xl font-bold text-navy">{applicationId}</p>
                  <p className="mt-1 text-xs text-gray-400">Save this for your records</p>
                </div>
              </div>
            )}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/jobs">
                <Button variant="primary" size="lg">Browse More Jobs</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg">Back to Home</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const departmentName =
    typeof job?.department === 'object' && job.department !== null ? job.department.name : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-100/60 to-ocean/[0.04]">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-[#0a2d6e] to-ocean py-10 sm:py-14">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-16 -left-16 h-[200px] w-[200px] rounded-full bg-gold/10 animate-float-delayed" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href={`/jobs/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Briefcase className="h-7 w-7 text-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{job?.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/60">
                {departmentName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {departmentName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {job?.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form container */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 -mt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl border border-gray-300/70 bg-white shadow-2xl shadow-navy/10"
        >
          {/* Gradient top bar */}
          <div className="h-2 bg-gradient-to-r from-navy via-ocean to-cyan" />

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Section header */}
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Apply for this Position</h2>
                <p className="text-sm text-gray-400">Fill in your details below to get started</p>
              </div>
            </div>

            {globalError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 text-sm text-red-700">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
              {/* Section: Personal Info */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-navy/10">
                    <User className="h-3.5 w-3.5 text-navy" />
                  </div>
                  Personal Information
                </h3>
                <div className="mt-4 space-y-5 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 sm:p-6 shadow-inner">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        {...register('name')}
                        className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-300 shadow-sm'}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          {...register('email')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-300 shadow-sm'}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          {...register('phone')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-300 shadow-sm'}`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Experience */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ocean/10">
                    <Briefcase className="h-3.5 w-3.5 text-ocean" />
                  </div>
                  Work Experience
                </h3>
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-ocean/[0.03] to-white p-5 sm:p-6 shadow-sm">
                  <label className="mb-3 block text-sm font-semibold text-gray-700">
                    Do you have prior work experience?
                  </label>
                  <Controller
                    control={control}
                    name="isExperienced"
                    render={({ field }) => (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-semibold transition-all ${
                            field.value === true
                              ? 'border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5 text-ocean shadow-sm shadow-ocean/10'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Briefcase className={`h-4 w-4 ${field.value === true ? 'text-ocean' : 'text-gray-300'}`} />
                          Yes, experienced
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-semibold transition-all ${
                            field.value === false
                              ? 'border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5 text-ocean shadow-sm shadow-ocean/10'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${field.value === false ? 'text-ocean' : 'text-gray-300'}`} />
                          Fresher
                        </button>
                      </div>
                    )}
                  />

                  {isExperienced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 space-y-5 rounded-xl border border-ocean/30 bg-gradient-to-br from-ocean/[0.05] to-cyan/[0.03] p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-ocean">
                        <Clock className="h-4 w-4" />
                        Employment Details
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            placeholder="e.g. 3"
                            {...register('yearsOfExperience')}
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Last Employer / Organization
                          </label>
                          <input
                            type="text"
                            placeholder="Company name"
                            {...register('lastEmployer')}
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                          />
                        </div>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            <Calendar className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
                            Employment From
                          </label>
                          <input
                            type="date"
                            {...register('lastEmploymentFrom')}
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            <Calendar className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
                            Employment To
                          </label>
                          <input
                            type="date"
                            {...register('lastEmploymentTo')}
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Section: Documents */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/15">
                    <FileText className="h-3.5 w-3.5 text-goldDeep" />
                  </div>
                  Documents
                </h3>
                <div className="mt-4 space-y-5 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gold/[0.03] to-gray-100/30 p-5 sm:p-6 shadow-inner">
                  {/* Resume Upload */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Resume / CV <span className="text-red-500">*</span>
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                        fileError
                          ? 'border-red-400 bg-red-50/50'
                          : file
                            ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50/30'
                            : 'border-gray-300 bg-gray-50 hover:border-ocean hover:bg-ocean/[0.03]'
                      }`}
                    >
                      {file ? (
                        <div className="flex w-full items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                            <FileText className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean/10">
                            <Upload className="h-6 w-6 text-ocean" />
                          </div>
                          <p className="mt-3 text-sm text-gray-600">
                            <span className="font-semibold text-ocean">Click to upload</span> or
                            drag and drop
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            PDF, DOC, or DOCX (max 5MB)
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                    {fileError && (
                      <p className="mt-1.5 text-xs text-red-500">{fileError}</p>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Cover Letter{' '}
                      <span className="text-xs font-normal text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      placeholder="Tell us why you'd be a great fit for this role and what motivates you to join HKM Vizag..."
                      rows={5}
                      {...register('coverLetter')}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="rounded-2xl border border-ocean/10 bg-gradient-to-br from-navy/[0.02] to-ocean/[0.02] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 text-ocean" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      By submitting, you agree to allow HKM Vizag to process your application data. Your information is kept confidential.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/jobs/${slug}`}>
                      <Button variant="ghost" type="button">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" loading={submitting} size="lg">
                      <Send className="h-4 w-4" />
                      Submit Application
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
