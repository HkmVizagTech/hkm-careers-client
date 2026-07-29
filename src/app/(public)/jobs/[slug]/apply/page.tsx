'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
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
  Globe,
  Linkedin,
  Github,
  ExternalLink,
  Plus,
  GraduationCap,
} from 'lucide-react';
import { getPublicJobBySlug, submitApplication } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DatePicker } from '@/components/ui/DatePicker';
import { SelectField } from '@/components/ui/SelectField';
import { useIsMobile } from '@/lib/useMediaQuery';
import type { Job } from '@/types';

type SectionKey = 'personal' | 'experience' | 'educational' | 'whyHire' | 'resume' | 'profiles';

interface StepPlan {
  layout: Record<SectionKey, number>;
  titles: string[];
}

/**
 * Which step each section appears on.
 *
 * Desktop pairs personal details with work experience and normally runs in two steps,
 * gaining a third only when the job asks for educational details. Mobile always runs in
 * three. The final step always carries the resume plus the optional online profiles;
 * the "why should we hire you" prompt stays on the middle step except on mobile when
 * education is also asked, where it moves to the last step to keep step 2 manageable.
 */
function getStepPlan(isMobile: boolean, asksEducation: boolean): StepPlan {
  if (isMobile) {
    return asksEducation
      ? {
          layout: { personal: 1, experience: 2, educational: 2, whyHire: 3, resume: 3, profiles: 3 },
          titles: ['Your Details', 'Experience & Education', 'Resume & Profiles'],
        }
      : {
          layout: { personal: 1, experience: 2, educational: 2, whyHire: 2, resume: 2, profiles: 3 },
          titles: ['Your Details', 'Experience & Documents', 'Online Profiles'],
        };
  }
  return asksEducation
    ? {
        layout: { personal: 1, experience: 1, educational: 2, whyHire: 2, resume: 3, profiles: 3 },
        titles: ['About You', 'Education & Motivation', 'Resume & Profiles'],
      }
    : {
        layout: { personal: 1, experience: 1, educational: 2, whyHire: 2, resume: 2, profiles: 2 },
        titles: ['About You', 'Documents & Profiles'],
      };
}

/** Fields validated before leaving each section. */
const SECTION_FIELDS: Record<SectionKey, (keyof FormData)[]> = {
  personal: ['name', 'email', 'phone', 'location', 'gender', 'dateOfBirth'],
  experience: ['availableToJoin', 'currentLocation'],
  educational: ['highestDegree', 'collegeName', 'collegeCity', 'studyYears'],
  whyHire: ['coverLetter'],
  // The resume is a File in component state, not part of the Zod schema.
  resume: [],
  profiles: ['linkedinUrl', 'githubUrl', 'portfolioUrl'],
};

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const DEGREE_OPTIONS = [
  { value: '10th', label: '10th' },
  { value: '12th / Intermediate', label: '12th / Intermediate' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'B.Tech / B.E.', label: 'B.Tech / B.E.' },
  { value: 'B.Sc', label: 'B.Sc' },
  { value: 'B.Com', label: 'B.Com' },
  { value: 'B.A.', label: 'B.A.' },
  { value: 'BBA', label: 'BBA' },
  { value: 'BCA', label: 'BCA' },
  { value: 'M.Tech / M.E.', label: 'M.Tech / M.E.' },
  { value: 'M.Sc', label: 'M.Sc' },
  { value: 'M.Com', label: 'M.Com' },
  { value: 'M.A.', label: 'M.A.' },
  { value: 'MBA', label: 'MBA' },
  { value: 'MCA', label: 'MCA' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Other', label: 'Other' },
];

const schema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  location: z.string().min(1, 'Location is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  coverLetter: z.string().min(10, 'Please write at least a few words'),
  isExperienced: z.boolean(),
  yearsOfExperience: z.string().optional(),
  lastEmployer: z.string().optional(),
  lastEmploymentFrom: z.string().optional(),
  lastEmploymentTo: z.string().optional(),
  availableToJoin: z.string().min(1, 'Please specify when you can join'),
  currentLocation: z.string().min(1, 'Current location is required'),
  linkedinUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  highestDegree: z.string().optional(),
  collegeName: z.string().optional(),
  collegeCity: z.string().optional(),
  studyYears: z.string().optional(),
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
  const [showLinkedin, setShowLinkedin] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const formTopRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    setError,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    // Controlled fields need an empty-string default, otherwise they start as
    // `undefined` and Zod reports a generic "Required" instead of our message.
    defaultValues: {
      isExperienced: false,
      gender: '',
      dateOfBirth: '',
      lastEmploymentFrom: '',
      lastEmploymentTo: '',
      highestDegree: '',
    },
  });

  const isExperienced = watch('isExperienced');

  const asksEducation = !!job?.askEducationalDetails;
  const { layout, titles: stepTitles } = getStepPlan(isMobile, asksEducation);
  const totalSteps = stepTitles.length;
  const showsSection = (key: SectionKey) => layout[key] === step;

  // Switching breakpoints changes the step count, so keep `step` in range.
  useEffect(() => {
    setStep((s) => Math.min(s, totalSteps));
  }, [totalSteps]);

  // The success screen replaces the form, so reset the scroll position to show it.
  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [submitted]);

  const scrollToFormTop = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** Fields belonging to the given step, skipping sections that aren't shown. */
  const fieldsForStep = (target: number): (keyof FormData)[] => {
    const keys = (Object.keys(layout) as SectionKey[]).filter((k) => layout[k] === target);
    return keys.flatMap((k) => {
      if (k === 'educational' && !job?.askEducationalDetails) return [];
      return SECTION_FIELDS[k];
    });
  };

  /**
   * Educational details are required only when the job asks for them, so the rule
   * lives here rather than in the Zod schema. Returns false and flags the fields
   * when any are blank.
   */
  const validateEducational = () => {
    if (!job?.askEducationalDetails) return true;
    const eduFields = [
      { name: 'highestDegree' as const, message: 'Highest degree is required' },
      { name: 'collegeName' as const, message: 'College name is required' },
      { name: 'collegeCity' as const, message: 'College city is required' },
      { name: 'studyYears' as const, message: 'Study years are required' },
    ];
    const missing = eduFields.filter((f) => !watch(f.name)?.trim());
    missing.forEach((f) => setError(f.name, { type: 'manual', message: f.message }));
    return missing.length === 0;
  };

  const handleContinue = async () => {
    const valid = await trigger(fieldsForStep(step), { shouldFocus: true });
    if (!valid) return;

    if (layout.educational === step && !validateEducational()) {
      document.getElementById('educational-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // The resume is component state, so the Zod resolver can't cover it.
    if (layout.resume === step && !file) {
      setFileError('Resume is required');
      document.getElementById('resume-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setStep((s) => Math.min(s + 1, totalSteps));
    scrollToFormTop();
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    scrollToFormTop();
  };

  /** If validation fails, jump to the step holding the first offending field. */
  const onInvalid = (formErrors: typeof errors) => {
    const firstField = Object.keys(formErrors)[0] as keyof FormData | undefined;
    if (!firstField) return;
    const owner = (Object.keys(SECTION_FIELDS) as SectionKey[]).find((k) =>
      SECTION_FIELDS[k].includes(firstField),
    );
    if (owner && layout[owner] !== step) {
      setStep(layout[owner]);
      scrollToFormTop();
    }
  };

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
    if (!job) return;

    // These sections may live on an earlier step, so switch to it before scrolling —
    // otherwise the error lands on hidden markup and the submit looks like a no-op.
    if (!validateEducational()) {
      setStep(layout.educational);
      requestAnimationFrame(() =>
        document.getElementById('educational-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }

    if (!file) {
      setFileError('Resume is required');
      setStep(layout.resume);
      requestAnimationFrame(() =>
        document.getElementById('resume-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }
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
      if (data.location) formData.append('location', data.location);
      if (data.gender) formData.append('gender', data.gender);
      if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
      if (data.availableToJoin) formData.append('availableToJoin', data.availableToJoin);
      if (data.currentLocation) formData.append('currentLocation', data.currentLocation);
      if (data.linkedinUrl) formData.append('linkedinUrl', data.linkedinUrl);
      if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
      if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
      if (data.highestDegree) formData.append('highestDegree', data.highestDegree);
      if (data.collegeName) formData.append('collegeName', data.collegeName);
      if (data.collegeCity) formData.append('collegeCity', data.collegeCity);
      if (data.studyYears) formData.append('studyYears', data.studyYears);
      formData.append('resume', file);
      const result = await submitApplication(formData);
      setApplicationId(result.application.id);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setGlobalError(
        axiosErr.response?.data?.message ||
          (err instanceof Error ? err.message : 'Failed to submit application. Please try again.'),
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="page-canvas min-h-screen">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean py-6 sm:py-14">
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
      <div ref={formTopRef} className="mx-auto max-w-3xl px-4 sm:px-6 py-5 pb-12 sm:py-8 sm:pb-16 scroll-mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-2xl shadow-navy/15 ring-1 ring-navy/[0.03]"
        >
          {/* Gradient top bar */}
          <div className="h-2 bg-gradient-to-r from-navy via-plum to-cyan" />

          <div className="p-5 sm:p-8 lg:p-10">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Apply for this Position</h2>
                <p className="text-sm text-gray-400">
                  Step {step} of {totalSteps} — {stepTitles[step - 1]}
                </p>
              </div>
            </div>

            {/* Progress stepper */}
            <div className="mt-5 flex items-center gap-2 border-b border-hairline pb-6">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
                <div key={n} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      n < step
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm'
                        : n === step
                          ? 'bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/25'
                          : 'bg-surfaceSunken text-gray-400'
                    }`}
                  >
                    {n < step ? <CheckCircle className="h-4 w-4" /> : n}
                  </div>
                  <div
                    className={`hidden flex-1 text-xs font-semibold sm:block ${
                      n === step ? 'text-navy' : 'text-gray-400'
                    }`}
                  >
                    {stepTitles[n - 1]}
                  </div>
                  {n < totalSteps && (
                    <div
                      className={`h-1 flex-1 rounded-full sm:max-w-[2rem] ${
                        n < step ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-surfaceSunken'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {globalError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 text-sm text-red-700">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
              {/* Section: Personal Info */}
              <div className={showsSection('personal') ? '' : 'hidden'}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-navy/10">
                    <User className="h-3.5 w-3.5 text-navy" />
                  </div>
                  Personal Information
                </h3>
                <div className="mt-4 space-y-4 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:space-y-5 sm:p-6 shadow-inner">
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
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
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

                  {/* Location + Gender + DOB */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. Visakhapatnam"
                          {...register('location')}
                          className={`h-[50px] w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.location ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                      </div>
                      {errors.location && <p className="mt-1.5 text-xs text-red-500">{errors.location.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                          <SelectField
                            value={field.value}
                            onChange={field.onChange}
                            options={GENDER_OPTIONS}
                            placeholder="Select gender"
                            error={!!errors.gender}
                            icon={User}
                          />
                        )}
                      />
                      {errors.gender && <p className="mt-1.5 text-xs text-red-500">{errors.gender.message}</p>}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        control={control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select your date of birth"
                            error={!!errors.dateOfBirth}
                            disableFuture
                            minYear={1950}
                            maxYear={new Date().getFullYear()}
                          />
                        )}
                      />
                      {errors.dateOfBirth && <p className="mt-1.5 text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Experience */}
              <div className={showsSection('experience') ? '' : 'hidden'}>
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
                          <Controller
                            control={control}
                            name="lastEmploymentFrom"
                            render={({ field }) => (
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Start date" disableFuture />
                            )}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            <Calendar className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
                            Employment To
                          </label>
                          <Controller
                            control={control}
                            name="lastEmploymentTo"
                            render={({ field }) => (
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="End date" disableFuture />
                            )}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Available to Join <span className="text-red-500">*</span>
                        <span className="ml-1 text-xs font-normal text-gray-400">(days)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15, 30, Immediately"
                        {...register('availableToJoin')}
                        className={`w-full rounded-xl border bg-white py-3 px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.availableToJoin ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                      />
                      {errors.availableToJoin && <p className="mt-1.5 text-xs text-red-500">{errors.availableToJoin.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Current Location <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. Hyderabad"
                          {...register('currentLocation')}
                          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.currentLocation ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                      </div>
                      {errors.currentLocation && <p className="mt-1.5 text-xs text-red-500">{errors.currentLocation.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Online Profiles */}
              <div className={showsSection('profiles') ? '' : 'hidden'}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100">
                    <Globe className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Online Profiles
                  <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">(optional — increases shortlisting chances)</span>
                </h3>
                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-purple-50/30 to-gray-100/30 p-5 sm:p-6 shadow-inner">
                  <div className="flex flex-wrap gap-3">
                    {!showLinkedin && (
                      <button type="button" onClick={() => setShowLinkedin(true)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:text-ocean hover:bg-ocean/5">
                        <Plus className="h-4 w-4" /> Add LinkedIn
                      </button>
                    )}
                    {!showGithub && (
                      <button type="button" onClick={() => setShowGithub(true)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:text-ocean hover:bg-ocean/5">
                        <Plus className="h-4 w-4" /> Add GitHub
                      </button>
                    )}
                    {!showPortfolio && (
                      <button type="button" onClick={() => setShowPortfolio(true)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-all hover:border-ocean hover:text-ocean hover:bg-ocean/5">
                        <Plus className="h-4 w-4" /> Add Portfolio
                      </button>
                    )}
                  </div>

                  {showLinkedin && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Linkedin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
                        <input type="url" placeholder="https://linkedin.com/in/your-profile" {...register('linkedinUrl')}
                          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.linkedinUrl ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`} />
                      </div>
                      <button type="button" onClick={() => { setShowLinkedin(false); setValue('linkedinUrl', ''); }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {errors.linkedinUrl && showLinkedin && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.linkedinUrl.message}</p>
                  )}

                  {showGithub && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Github className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-800" />
                        <input type="url" placeholder="https://github.com/your-username" {...register('githubUrl')}
                          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.githubUrl ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`} />
                      </div>
                      <button type="button" onClick={() => { setShowGithub(false); setValue('githubUrl', ''); }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {errors.githubUrl && showGithub && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.githubUrl.message}</p>
                  )}

                  {showPortfolio && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="relative flex-1">
                        <ExternalLink className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600" />
                        <input type="url" placeholder="https://your-portfolio.com" {...register('portfolioUrl')}
                          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.portfolioUrl ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`} />
                      </div>
                      <button type="button" onClick={() => { setShowPortfolio(false); setValue('portfolioUrl', ''); }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {errors.portfolioUrl && showPortfolio && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.portfolioUrl.message}</p>
                  )}
                </div>
              </div>

              {/* Section: Educational Details (conditional) */}
              {job?.askEducationalDetails && (
                <div id="educational-section" className={showsSection('educational') ? '' : 'hidden'}>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100">
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    Educational Information
                  </h3>
                  <div className="mt-4 space-y-5 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-emerald-50/30 to-gray-100/30 p-5 sm:p-6 shadow-inner">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Highest Degree <span className="text-red-500">*</span>
                        </label>
                        <Controller
                          control={control}
                          name="highestDegree"
                          render={({ field }) => (
                            <SelectField
                              value={field.value}
                              onChange={field.onChange}
                              options={DEGREE_OPTIONS}
                              placeholder="Select degree"
                              error={!!errors.highestDegree}
                              icon={GraduationCap}
                            />
                          )}
                        />
                        {errors.highestDegree && <p className="mt-1.5 text-xs text-red-500">{errors.highestDegree.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          College / University Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GITAM University"
                          {...register('collegeName')}
                          className={`w-full rounded-xl border bg-white py-3.5 px-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.collegeName ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                        {errors.collegeName && <p className="mt-1.5 text-xs text-red-500">{errors.collegeName.message}</p>}
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          College City <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="e.g. Visakhapatnam"
                            {...register('collegeCity')}
                            className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.collegeCity ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                          />
                        </div>
                        {errors.collegeCity && <p className="mt-1.5 text-xs text-red-500">{errors.collegeCity.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Study Years <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2020 - 2024"
                          {...register('studyYears')}
                          className={`w-full rounded-xl border bg-white py-3.5 px-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean ${errors.studyYears ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                        {errors.studyYears && <p className="mt-1.5 text-xs text-red-500">{errors.studyYears.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Why should we hire you */}
              <div id="whyhire-section" className={showsSection('whyHire') ? '' : 'hidden'}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose/10">
                    <Star className="h-3.5 w-3.5 text-rose" />
                  </div>
                  Your Motivation
                </h3>
                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-rose/[0.03] to-gray-100/30 p-4 sm:p-6 shadow-inner">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Why should we hire you? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Tell us why you'd be a great fit for this role, what unique skills you bring, and what motivates you to join HKM Vizag..."
                    rows={5}
                    {...register('coverLetter')}
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean resize-none ${errors.coverLetter ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                  />
                  {errors.coverLetter && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.coverLetter.message}</p>
                  )}
                </div>
              </div>

              {/* Section: Resume */}
              <div id="resume-section" className={showsSection('resume') ? '' : 'hidden'}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/15">
                    <FileText className="h-3.5 w-3.5 text-goldDeep" />
                  </div>
                  Resume
                </h3>
                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gold/[0.03] to-gray-100/30 p-4 sm:p-6 shadow-inner">
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
                </div>
              </div>

              {/* Step navigation */}
              <div className="rounded-2xl border border-ocean/15 bg-gradient-to-br from-navy/[0.03] via-plum/[0.02] to-ocean/[0.03] p-5 sm:p-6">
                {step === totalSteps && (
                  <div className="mb-4 flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-ocean" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      By submitting, you agree to allow HKM Vizag to process your application data. Your information is kept confidential.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <Button variant="ghost" type="button" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Link href={`/jobs/${slug}`}>
                      <Button variant="ghost" type="button">
                        Cancel
                      </Button>
                    </Link>
                  )}

                  {step < totalSteps ? (
                    <Button type="button" onClick={handleContinue} size="lg">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" loading={submitting} size="lg">
                      <Send className="h-4 w-4" />
                      Submit Application
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
