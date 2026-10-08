'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Copy,
  Eye,
  Pencil,
  Search,
  MessageCircle,
  Info,
} from 'lucide-react';
import { getPublicJobBySlug, submitApplication } from '@/lib/services';
import { captureApplySource, readApplySource } from '@/lib/applySource';
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
  educational: ['highestDegree', 'collegeName', 'collegeCity', 'studyFrom', 'studyTo'],
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

const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  'prefer-not-to-say': 'Prefer not to say',
};

const CURRENT_YEAR = new Date().getFullYear();
/** Study start: this year back to 1970. */
const START_YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => String(CURRENT_YEAR - i)).map((y) => ({ value: y, label: y }));
/** Passed-out / expected: up to 6 years ahead, for current students. */
const endYearOptions = (from?: string) => {
  const min = from ? Number(from) : 1970;
  const out: { value: string; label: string }[] = [];
  for (let y = CURRENT_YEAR + 6; y >= min; y--) out.push({ value: String(y), label: y > CURRENT_YEAR ? `${y} (expected)` : String(y) });
  return out;
};

/** "0" -> "Immediately", "15" -> "15 days" */
const joinLabel = (days?: string) => {
  if (!days) return '';
  const n = Number(days);
  if (!Number.isFinite(n)) return days;
  return n === 0 ? 'Immediately' : `${n} day${n === 1 ? '' : 's'}`;
};

const GENDER_ONLY_LABEL: Record<string, string> = { male: 'male', female: 'female' };

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
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^[0-9+\-\s()]{10,15}$/, 'Please enter a valid phone number'),
  location: z.string().min(1, 'Location is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((v) => {
      if (!v) return true;
      const dob = new Date(v);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
      return age >= 14;
    }, 'Applicant must be at least 14 years old'),
  coverLetter: z.string().min(10, 'Please write at least a few words'),
  isExperienced: z.boolean(),
  yearsOfExperience: z.string().optional(),
  lastEmployer: z.string().optional(),
  lastEmploymentFrom: z.string().optional(),
  lastEmploymentTo: z.string().optional(),
  availableToJoin: z
    .string()
    .min(1, 'Please enter the number of days (0 if you can join immediately)')
    .regex(/^\d{1,3}$/, 'Enter the number of days only, e.g. 15 (0 = immediately)'),
  currentLocation: z.string().min(1, 'Current location is required'),
  linkedinUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  highestDegree: z.string().optional(),
  collegeName: z.string().optional(),
  collegeCity: z.string().optional(),
  studyFrom: z.string().optional(),
  studyTo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

/** Shared field classes: full label + value stay visible with comfortable sizing. */
const INPUT_CLASS =
  'w-full rounded-xl border bg-white px-4 py-3.5 text-base sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean';
const inputCls = (hasError?: boolean) =>
  `${INPUT_CLASS} ${hasError ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`;

/** Wraps a label, control, and error text in one consistent block. */
function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-gray-700">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {hint && <span className="text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

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
  const [copied, setCopied] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showLinkedin, setShowLinkedin] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const formTopRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    setError,
    clearErrors,
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
      studyFrom: '',
      studyTo: '',
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

  /**
   * Enter-key navigation for text inputs: focus the next visible input on the step,
   * or — on the last one — dismiss the on-screen keyboard. Textareas keep Enter for
   * line breaks, and the custom select/date triggers handle their own activation.
   */
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLInputElement;
    if (target.tagName !== 'INPUT' || target.type === 'file' || target.type === 'submit') return;
    e.preventDefault();

    // `offsetParent` is null for inputs inside the hidden (non-active) step sections.
    const inputs = Array.from(
      formRef.current?.querySelectorAll<HTMLInputElement>('input') ?? [],
    ).filter((el) => el.type !== 'file' && el.offsetParent !== null);
    const idx = inputs.indexOf(target);
    const next = inputs[idx + 1];

    if (next) {
      next.focus();
      const end = next.value.length;
      next.setSelectionRange?.(end, end);
    } else {
      // Last field: close the keyboard and reveal the step navigation.
      target.blur();
      navRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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
      { name: 'studyFrom' as const, message: 'Select the year you started' },
      { name: 'studyTo' as const, message: 'Select the year you passed out' },
    ];
    const missing = eduFields.filter((f) => !watch(f.name)?.trim());
    missing.forEach((f) => setError(f.name, { type: 'manual', message: f.message }));
    const from = Number(watch('studyFrom'));
    const to = Number(watch('studyTo'));
    if (from && to && to < from) {
      setError('studyTo', { type: 'manual', message: 'Passed-out year cannot be before the start year' });
      return false;
    }
    return missing.length === 0;
  };

  /** Jobs limited to one gender: block a mismatching choice with a clear message. */
  const genderOnly = job?.targetGender && job.targetGender !== 'any' ? job.targetGender : null;
  const genderMismatch = (value?: string) => !!genderOnly && !!value && value !== genderOnly;
  const genderOnlyMessage = genderOnly
    ? `This position is open to ${GENDER_ONLY_LABEL[genderOnly]} applicants only.`
    : '';
  const validateGender = () => {
    if (!genderMismatch(watch('gender'))) return true;
    setError('gender', { type: 'manual', message: genderOnlyMessage });
    return false;
  };

  const handleContinue = async () => {
    const valid = await trigger(fieldsForStep(step), { shouldFocus: true });
    if (!valid) return;

    if (layout.personal === step && !validateGender()) {
      return;
    }

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

  // Remember ?src=linkedin etc. if the shared link pointed straight at the form.
  useEffect(() => { captureApplySource(); }, []);

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

    if (!validateGender()) {
      setStep(layout.personal);
      scrollToFormTop();
      return;
    }

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
      if (data.availableToJoin) formData.append('availableToJoin', joinLabel(data.availableToJoin));
      if (data.currentLocation) formData.append('currentLocation', data.currentLocation);
      if (data.linkedinUrl) formData.append('linkedinUrl', data.linkedinUrl);
      if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
      if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
      if (data.highestDegree) formData.append('highestDegree', data.highestDegree);
      if (data.collegeName) formData.append('collegeName', data.collegeName);
      if (data.collegeCity) formData.append('collegeCity', data.collegeCity);
      if (data.studyFrom && data.studyTo) formData.append('studyYears', `${data.studyFrom} - ${data.studyTo}`);
      // Where the applicant came from (LinkedIn, Indeed, WhatsApp...), set by shared links: ?src=linkedin
      const source = readApplySource();
      if (source) formData.append('source', source);
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

  /** Reads the filled data for the review summary, memoized to avoid recompute churn. */
  const formData = watch();
  const reviewRows = useMemo(() => {
    const rows: { label: string; value: string }[] = [
      { label: 'Name', value: formData.name || '' },
      { label: 'Email', value: formData.email || '' },
      { label: 'Phone', value: formData.phone || '' },
      { label: 'Gender', value: formData.gender ? GENDER_LABELS[formData.gender] || formData.gender : '' },
      { label: 'Date of Birth', value: formData.dateOfBirth || '' },
      { label: 'Location', value: formData.location || '' },
      { label: 'Available to Join', value: joinLabel(formData.availableToJoin) },
      { label: 'Current Location', value: formData.currentLocation || '' },
    ];
    if (formData.isExperienced) {
      rows.push(
        { label: 'Experience', value: formData.yearsOfExperience ? `${formData.yearsOfExperience} years` : '' },
        { label: 'Last Employer', value: formData.lastEmployer || '' },
      );
    }
    if (job?.askEducationalDetails) {
      rows.push(
        { label: 'Highest Degree', value: formData.highestDegree || '' },
        { label: 'College', value: [formData.collegeName, formData.collegeCity].filter(Boolean).join(', ') },
        { label: 'Study Years', value: formData.studyFrom && formData.studyTo ? `${formData.studyFrom} - ${formData.studyTo}` : '' },
      );
    }
    if (formData.linkedinUrl) rows.push({ label: 'LinkedIn', value: formData.linkedinUrl });
    if (formData.githubUrl) rows.push({ label: 'GitHub', value: formData.githubUrl });
    if (formData.portfolioUrl) rows.push({ label: 'Portfolio', value: formData.portfolioUrl });
    return rows.filter((r) => r.value);
  }, [formData, job]);

  /** Jump to the step that owns a section, for "Edit" links in the review card. */
  const stepOfSection = (key: SectionKey) => layout[key];

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* Clipboard unavailable — the selectable ID text is the fallback. */
    }
  };

  const whatsappText = encodeURIComponent(
    `My application for ${job?.title || 'the position'} at HKM Vizag was submitted successfully! 🎉\n\nApplication ID: ${applicationId}\n\nI can track its status anytime here: ${typeof window !== 'undefined' ? window.location.origin : ''}/track?id=${applicationId}`,
  );

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
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:py-20">
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
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Tap to copy"
                    className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 font-mono text-lg font-bold text-navy transition-colors hover:bg-ocean/10 hover:text-ocean sm:text-xl"
                  >
                    {applicationId}
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <p className="mt-1.5 text-xs text-gray-400">
                    {copied ? 'Copied to clipboard!' : 'Tap the ID to copy it'}
                  </p>
                  <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-left">
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-green-800">
                      <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Tip: share or save your Application ID via WhatsApp so you always have it —
                      you&apos;ll need it to track your status.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="lg" className="bg-[#25D366] hover:bg-[#1fb857]">
                  <MessageCircle className="h-4 w-4" />
                  Send via WhatsApp
                </Button>
              </a>
              <Link href={`/track?id=${applicationId}`}>
                <Button variant="outline" size="lg">
                  <Search className="h-4 w-4" />
                  Track Status
                </Button>
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/jobs">
                <Button variant="ghost" size="md">Browse More Jobs</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="md">Back to Home</Button>
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
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean pb-6 pt-[96px] sm:pb-14 sm:pt-[120px]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-16 -left-16 h-[200px] w-[200px] rounded-full bg-gold/10 animate-float-delayed" />
        </div>
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href={`/jobs/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
              <Briefcase className="h-7 w-7 text-cyan" />
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold text-white sm:text-3xl">{job?.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/60">
                {departmentName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{departmentName}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {job?.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form container */}
      <div ref={formTopRef} className="mx-auto max-w-3xl px-4 py-5 pb-12 sm:px-6 sm:py-8 sm:pb-16 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-xl shadow-navy/10"
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

            {genderOnly && (
              <div role="note" className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  <span className="font-semibold">{genderOnlyMessage}</span>{' '}
                  Please apply only if this applies to you.
                </p>
              </div>
            )}

            {globalError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 text-sm text-red-700">
                {globalError}
              </div>
            )}

            <form ref={formRef} onKeyDown={handleFormKeyDown} onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-6 sm:mt-8 sm:space-y-8 [&>*:not(.hidden)~*:not(.hidden)]:border-t [&>*:not(.hidden)~*:not(.hidden)]:border-hairline [&>*:not(.hidden)~*:not(.hidden)]:pt-6 sm:[&>*:not(.hidden)~*:not(.hidden)]:pt-8">
              {/* Section: Personal Info */}
              <div className={showsSection('personal') ? '' : 'hidden'}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wider">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-navy/10">
                    <User className="h-3.5 w-3.5 text-navy" />
                  </div>
                  Personal Information
                </h3>
                <div className="mt-5 space-y-4 sm:space-y-5">
                  {/* Name */}
                  <Field label="Full Name" required error={errors.name?.message}>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        enterKeyHint="next"
                        placeholder="Enter your full name"
                        {...register('name')}
                        className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                      />
                    </div>
                  </Field>

                  {/* Email + Phone */}
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <Field label="Email Address" required error={errors.email?.message}>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          enterKeyHint="next"
                          placeholder="you@example.com"
                          {...register('email')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                      </div>
                    </Field>
                    <Field label="Phone Number" required error={errors.phone?.message}>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          enterKeyHint="next"
                          placeholder="+91 98765 43210"
                          {...register('phone')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Gender + DOB side by side, Location below */}
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <Field label="Gender" required error={errors.gender?.message}>
                      <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                          <SelectField
                            value={field.value}
                            onChange={(v) => {
                              field.onChange(v);
                              if (genderMismatch(v)) setError('gender', { type: 'manual', message: genderOnlyMessage });
                              else clearErrors('gender');
                            }}
                            options={GENDER_OPTIONS}
                            placeholder="Select gender"
                            error={!!errors.gender}
                            icon={User}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
                      <Controller
                        control={control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select date of birth"
                            error={!!errors.dateOfBirth}
                            disableFuture
                            minYear={1950}
                            maxYear={new Date().getFullYear()}
                          />
                        )}
                      />
                    </Field>
                  </div>
                  <Field label="Location" required error={errors.location?.message}>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        enterKeyHint="next"
                        placeholder="e.g. Visakhapatnam"
                        {...register('location')}
                        className={`${inputCls(!!errors.location)} pl-10`}
                      />
                    </div>
                  </Field>
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
                <div className="mt-5">
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
                      className="mt-5 space-y-5 overflow-hidden border-l-2 border-ocean/30 pl-4 pr-1"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-ocean">
                        <Clock className="h-4 w-4" />
                        Employment Details
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Years of Experience" error={undefined}>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="50"
                            enterKeyHint="next"
                            placeholder="e.g. 3"
                            {...register('yearsOfExperience')}
                            className="w-full rounded-xl border border-gray-300 bg-white py-3.5 px-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm"
                          />
                        </Field>
                        <Field label="Last Employer / Organization" error={undefined}>
                          <input
                            type="text"
                            enterKeyHint="next"
                            placeholder="Company name"
                            {...register('lastEmployer')}
                            className="w-full rounded-xl border border-gray-300 bg-white py-3.5 px-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm"
                          />
                        </Field>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Employment From" error={undefined}>
                          <Controller
                            control={control}
                            name="lastEmploymentFrom"
                            render={({ field }) => (
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Start date" disableFuture />
                            )}
                          />
                        </Field>
                        <Field label="Employment To" error={undefined}>
                          <Controller
                            control={control}
                            name="lastEmploymentTo"
                            render={({ field }) => (
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="End date" disableFuture />
                            )}
                          />
                        </Field>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Available to Join"
                      required
                      hint="(days)"
                      error={errors.availableToJoin?.message}
                     
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        enterKeyHint="next"
                        placeholder="e.g. 15 (0 = immediately)"
                        {...register('availableToJoin', {
                          // Digits only, even when pasted.
                          onChange: (e) => {
                            const digits = String(e.target.value).replace(/\D/g, '').slice(0, 3);
                            if (digits !== e.target.value) setValue('availableToJoin', digits, { shouldValidate: true });
                          },
                        })}
                        className={inputCls(!!errors.availableToJoin)}
                      />
                    </Field>
                    <Field label="Current Location" required error={errors.currentLocation?.message}>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          enterKeyHint="next"
                          placeholder="e.g. Hyderabad"
                          {...register('currentLocation')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.currentLocation ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                      </div>
                    </Field>
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
                <div className="mt-5">
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
                        <input type="url" inputMode="url" enterKeyHint="done" placeholder="https://linkedin.com/in/your-profile" {...register('linkedinUrl')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.linkedinUrl ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`} />
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
                        <input type="url" inputMode="url" enterKeyHint="done" placeholder="https://github.com/your-username" {...register('githubUrl')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.githubUrl ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
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
                        <input type="url" inputMode="url" enterKeyHint="done" placeholder="https://your-portfolio.com" {...register('portfolioUrl')}
                          className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.portfolioUrl ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
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
                  <div className="mt-5 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Highest Degree" required error={errors.highestDegree?.message}>
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
                      </Field>
                      <Field label="College / University Name" required error={errors.collegeName?.message}>
                        <input
                          type="text"
                          enterKeyHint="next"
                          placeholder="e.g. GITAM University"
                          {...register('collegeName')}
                          className={`w-full rounded-xl border bg-white py-3.5 px-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.collegeName ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="College City" required error={errors.collegeCity?.message}>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            enterKeyHint="next"
                            placeholder="e.g. Visakhapatnam"
                            {...register('collegeCity')}
                            className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean sm:text-sm ${errors.collegeCity ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                          />
                        </div>
                      </Field>
                      <Field label="Study Years" required error={errors.studyFrom?.message || errors.studyTo?.message}>
                        <div className="grid grid-cols-2 gap-2">
                          <Controller
                            control={control}
                            name="studyFrom"
                            render={({ field }) => (
                              <SelectField
                                value={field.value}
                                onChange={(v) => {
                                  field.onChange(v);
                                  clearErrors('studyFrom');
                                  // Keep the end year valid when the start moves past it.
                                  const to = watch('studyTo');
                                  if (to && Number(to) < Number(v)) setValue('studyTo', '');
                                }}
                                options={START_YEAR_OPTIONS}
                                placeholder="From"
                                error={!!errors.studyFrom}
                                icon={Calendar}
                              />
                            )}
                          />
                          <Controller
                            control={control}
                            name="studyTo"
                            render={({ field }) => (
                              <SelectField
                                value={field.value}
                                onChange={(v) => {
                                  field.onChange(v);
                                  clearErrors('studyTo');
                                }}
                                options={endYearOptions(watch('studyFrom'))}
                                placeholder="Passed out"
                                error={!!errors.studyTo}
                                icon={GraduationCap}
                              />
                            )}
                          />
                        </div>
                      </Field>
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
                <div className="mt-5">
                  <Field label="Why should we hire you?" required error={errors.coverLetter?.message}>
                    <textarea
                      placeholder="Tell us why you'd be a great fit for this role, what unique skills you bring, and what motivates you to join HKM Vizag..."
                      rows={5}
                      {...register('coverLetter')}
                      className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean resize-none ${errors.coverLetter ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                    />
                  </Field>
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
                <div className="mt-5">
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

              {/* Review summary — collapsible on the final step */}
              {step === totalSteps && (
                <div className="rounded-xl bg-surfaceAlt/70 p-4 sm:p-5">
                  <details>
                    <summary className="flex cursor-pointer select-none items-center gap-2 text-sm font-bold text-navy">
                      <Eye className="h-4 w-4 text-ocean" />
                      Review your details
                      <span className="ml-auto text-xs font-normal text-gray-400">tap to expand</span>
                    </summary>
                    <dl className="mt-4 grid min-w-0 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                      {reviewRows.map((row) => (
                        <div key={row.label} className="flex min-w-0 items-baseline justify-between gap-3 border-b border-gray-100 pb-2">
                          <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">{row.label}</dt>
                          <dd className="min-w-0 text-right text-sm font-medium text-gray-700 [overflow-wrap:anywhere]">{row.value}</dd>
                        </div>
                      ))}
                      <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-gray-100 pb-2">
                        <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Resume</dt>
                        <dd className="min-w-0 text-right text-sm font-medium text-gray-700 [overflow-wrap:anywhere]">{file ? file.name : '—'}</dd>
                      </div>
                    </dl>
                  </details>
                </div>
              )}

              {/* Step navigation */}
              <div ref={navRef} className="pt-1">
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

                  {/* Distinct keys: React must not turn the clicked Continue button into the
                      submit button mid-click, or the browser submits the form on the last step. */}
                  {step < totalSteps ? (
                    <Button key="continue" type="button" onClick={handleContinue} size="lg">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button key="submit" type="submit" loading={submitting} size="lg">
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
