'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Landmark,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import {
  getDocumentRequestByToken,
  removeRequestedDocument,
  saveBankDetails,
  submitRequestedDocuments,
  uploadRequestedDocument,
} from '@/lib/services';
import { HR_CONTACT } from '@/lib/contact';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CandidateDocumentView } from '@/types';

type Item = CandidateDocumentView['items'][number];

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.doc', '.docx'];
const ACCEPT = ALLOWED.join(',');
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const errorMessage = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || fallback;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' }) : '';

const ITEM_STATUS: Record<Item['status'], { label: string; cls: string }> = {
  pending: { label: 'Not uploaded yet', cls: 'bg-gray-100 text-gray-600' },
  uploaded: { label: 'Uploaded', cls: 'bg-blue-50 text-blue-700' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Please upload again', cls: 'bg-red-50 text-red-700' },
};

/** Private page where a candidate uploads the documents (and bank details) HR asked for. */
export default function DocumentUploadPage() {
  const params = useParams();
  const token = String(params.token || '');
  const [view, setView] = useState<CandidateDocumentView | null>(null);
  const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const load = useCallback(async () => {
    try {
      setView(await getDocumentRequestByToken(token));
      setLoadError(null);
    } catch (err) {
      const e = err as { response?: { status?: number } };
      setLoadError({ status: e.response?.status, message: errorMessage(err, 'We could not open this link. Please check your connection and try again.') });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  /** Server replies 404/410 mid-session when HR cancels or the link expires. */
  const handleGone = (err: unknown) => {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 404 || status === 410) {
      setLoadError({ status, message: errorMessage(err, 'This link is no longer active.') });
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="mt-5 h-28 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (loadError || !view) {
    const expired = loadError?.status === 410;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:py-20">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${expired ? 'bg-amber-100' : 'bg-red-50'}`}>
          {expired ? <Clock className="h-8 w-8 text-amber-600" /> : <AlertCircle className="h-8 w-8 text-red-500" />}
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy">{expired ? 'This link has expired' : 'This link isn’t working'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{loadError?.message}</p>
        <HrContact className="mt-7" />
      </div>
    );
  }

  const joining = view.kind === 'joining';
  const required = view.items.filter((i) => i.required);
  const requiredDone = required.filter((i) => i.files.length > 0 && i.status !== 'rejected').length;
  const rejected = view.items.filter((i) => i.status === 'rejected');
  const bankMissing = view.bank.wanted && !view.bank.submitted;
  const missing = [
    ...required.filter((i) => !i.files.length || i.status === 'rejected').map((i) => i.label),
    ...(bankMissing ? ['Bank details'] : []),
  ];
  const completed = view.status === 'completed';
  const submitted = view.status === 'submitted';
  const totalSteps = required.length + (view.bank.wanted ? 1 : 0);
  const doneSteps = requiredDone + (view.bank.wanted && view.bank.submitted ? 1 : 0);

  const onSubmit = async () => {
    setSubmitError('');
    if (missing.length) {
      setSubmitError(`Still needed: ${missing.join(', ')}`);
      return;
    }
    setSubmitting(true);
    try {
      setView(await submitRequestedDocuments(token));
      setJustSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (!handleGone(err)) setSubmitError(errorMessage(err, 'Could not submit. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-white to-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean/10 px-3 py-1 text-xs font-semibold text-ocean">
            <Lock className="h-3.5 w-3.5" /> Private upload link
          </span>
          <h1 className="mt-3 text-2xl font-bold text-navy sm:text-[28px]">
            {joining ? 'Your joining documents' : 'Documents for your application'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Hi {view.firstName || 'there'}, {joining ? 'congratulations on being selected for ' : 'thanks for applying for '}
            <span className="font-semibold text-gray-900">{view.jobTitle || 'the position'}</span>
            {view.applicationNumber ? <span className="text-gray-400"> ({view.applicationNumber})</span> : null}.{' '}
            {joining ? 'Please upload the documents below so we can get your joining ready.' : 'Please upload the documents HR has asked for below.'}
          </p>
          {view.message && (
            <div className="mt-4 rounded-xl border-l-4 border-ocean bg-ocean/[0.04] px-4 py-3 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {view.message}
            </div>
          )}

          {totalSteps > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>
                  {doneSteps} of {totalSteps} required {totalSteps === 1 ? 'item' : 'items'} done
                </span>
                {view.expiresAt && !completed && <span className="font-normal text-gray-400">Link valid until {formatDate(view.expiresAt)}</span>}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-ocean to-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalSteps ? (doneSteps / totalSteps) * 100 : 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Status banners */}
        {completed && (
          <Banner tone="success" title="All done, thank you!">
            HR has approved everything. There&apos;s nothing more you need to do here.
          </Banner>
        )}
        {submitted && rejected.length === 0 && (
          <Banner tone="success" title={justSubmitted ? 'Submitted. Thank you!' : 'You’ve submitted your documents'}>
            HR will review them. If anything needs to be uploaded again, we&apos;ll email you and you can use this same link.
          </Banner>
        )}
        {rejected.length > 0 && (
          <Banner tone="warn" title={`HR asked you to upload ${rejected.length === 1 ? 'one document' : `${rejected.length} documents`} again`}>
            See the note on {rejected.length === 1 ? 'it' : 'each one'} below, upload a new file, then press Submit again.
          </Banner>
        )}

        {/* Documents */}
        {view.items.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Documents</h2>
            <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, WEBP, HEIC or Word · up to 10 MB each · a clear phone photo is fine.</p>
            <ul className="mt-3 space-y-3">
              {view.items.map((item) => (
                <DocumentRow key={item._id} token={token} item={item} onChange={setView} onGone={handleGone} />
              ))}
            </ul>
          </section>
        )}

        {/* Bank */}
        {view.bank.wanted && <BankSection token={token} bank={view.bank} onChange={setView} onGone={handleGone} />}

        {/* Submit */}
        {!completed && (
          <div className="mt-8 rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6">
            {missing.length > 0 ? (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Still needed:</span> {missing.join(', ')}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                {submitted && rejected.length === 0
                  ? 'Added something new? Submit again so HR knows to take another look.'
                  : 'Everything required is in. Submit to let HR know.'}
              </p>
            )}
            {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}
            <Button type="button" size="lg" className="mt-4 w-full sm:w-auto" onClick={onSubmit} loading={submitting} disabled={missing.length > 0}>
              <CheckCircle2 className="h-5 w-5" /> {submitted ? 'Submit again' : 'Submit documents'}
            </Button>
          </div>
        )}

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Your files and bank details are encrypted and only the HKM Vizag HR team can see them. Please don&apos;t share this link with anyone.
        </p>
        <HrContact className="mt-6" />
      </div>
    </div>
  );
}

function Banner({ tone, title, children }: { tone: 'success' | 'warn'; title: string; children: React.ReactNode }) {
  const cls = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900';
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 flex gap-3 rounded-2xl border p-4 ${cls}`} role="status">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{children}</p>
      </div>
    </motion.div>
  );
}

function HrContact({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 ${className}`}>
      <p className="font-semibold text-gray-800">Questions? Contact HR</p>
      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1.5 sm:justify-start">
        <a href={`mailto:${HR_CONTACT.email}`} className="inline-flex items-center gap-1.5 text-ocean hover:text-navy">
          <Mail className="h-4 w-4" /> {HR_CONTACT.email}
        </a>
        <a href={HR_CONTACT.phoneHref} className="inline-flex items-center gap-1.5 text-ocean hover:text-navy">
          <Phone className="h-4 w-4" /> {HR_CONTACT.phone}
        </a>
      </div>
    </div>
  );
}

function DocumentRow({
  token,
  item,
  onChange,
  onGone,
}: {
  token: string;
  item: Item;
  onChange: (v: CandidateDocumentView) => void;
  onGone: (err: unknown) => boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const locked = item.status === 'approved';
  const full = item.files.length >= MAX_FILES;
  const status = ITEM_STATUS[item.status];

  const upload = async (files: FileList | File[]) => {
    setError('');
    const list = Array.from(files).slice(0, MAX_FILES - item.files.length);
    if (!list.length) {
      if (full) setError(`You can upload up to ${MAX_FILES} files here. Remove one first.`);
      return;
    }
    for (const file of list) {
      const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
      if (!ALLOWED.includes(ext)) {
        setError(`"${file.name}" isn't a supported file. Use PDF, JPG, PNG, WEBP, HEIC or Word.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" is larger than 10 MB. Try a smaller scan or a phone photo.`);
        return;
      }
    }
    try {
      for (const file of list) {
        setProgress(0);
        onChange(await uploadRequestedDocument(token, item._id, file, setProgress));
      }
    } catch (err) {
      if (!onGone(err)) setError(errorMessage(err, 'Upload failed. Please check your connection and try again.'));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (fileId: string) => {
    setError('');
    setRemoving(fileId);
    try {
      onChange(await removeRequestedDocument(token, item._id, fileId));
    } catch (err) {
      if (!onGone(err)) setError(errorMessage(err, 'Could not remove the file. Please try again.'));
    } finally {
      setRemoving(null);
    }
  };

  const busy = progress !== null;

  return (
    <li
      className={`rounded-2xl border bg-white p-4 shadow-soft transition-colors sm:p-5 ${
        item.status === 'rejected' ? 'border-red-200' : dragging ? 'border-ocean bg-ocean/[0.03]' : 'border-hairline'
      }`}
      onDragOver={(e) => {
        if (locked || busy) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!locked && !busy && e.dataTransfer.files?.length) upload(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">
            {item.label} {item.required ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-gray-400">(optional)</span>}
          </p>
          {item.hint && <p className="mt-0.5 text-xs text-gray-500">{item.hint}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
      </div>

      {item.status === 'rejected' && item.note && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">Note from HR:</span> {item.note}
        </p>
      )}

      {item.files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {item.files.map((f) => (
            <li key={f._id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
              <FileText className="h-5 w-5 shrink-0 text-ocean" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{f.name}</p>
                <p className="text-[11px] text-gray-400">{formatSize(f.size)}</p>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={() => remove(f._id)}
                  disabled={removing === f._id || busy}
                  aria-label={`Remove ${f.name}`}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  {removing === f._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {busy && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-ocean transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!locked && !full && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            id={`file-${item._id}`}
            onChange={(e) => e.target.files?.length && upload(e.target.files)}
            disabled={busy}
          />
          <label
            htmlFor={`file-${item._id}`}
            className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition-colors ${
              busy ? 'pointer-events-none border-gray-200 text-gray-300' : 'border-gray-300 text-navy hover:border-ocean hover:bg-ocean/[0.03] hover:text-ocean'
            }`}
          >
            <Upload className="h-4 w-4" />
            {item.files.length ? 'Add another file' : item.status === 'rejected' ? 'Upload a new file' : 'Choose file'}
            <span className="hidden font-normal text-gray-400 sm:inline">or drop it here</span>
          </label>
        </>
      )}
      {locked && <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> HR has approved this document.</p>}
    </li>
  );
}

const fieldCls = (error?: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30 ${
    error ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
  }`;

function BankSection({
  token,
  bank,
  onChange,
  onGone,
}: {
  token: string;
  bank: CandidateDocumentView['bank'];
  onChange: (v: CandidateDocumentView) => void;
  onGone: (err: unknown) => boolean;
}) {
  const [editing, setEditing] = useState(!bank.submitted);
  const [form, setForm] = useState({
    holder: bank.holder || '',
    account: '',
    account2: '',
    ifsc: bank.ifsc || '',
    bankName: bank.bankName || '',
    branch: bank.branch || '',
    accountType: bank.accountType || 'savings',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const lookedUp = useRef('');

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  // Fill in bank and branch from the IFSC code (public IFSC directory). Best effort: typing them still works.
  useEffect(() => {
    const code = form.ifsc;
    if (!IFSC_RE.test(code) || lookedUp.current === code) return;
    lookedUp.current = code;
    const ctrl = new AbortController();
    fetch(`https://ifsc.razorpay.com/${code}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { BANK?: string; BRANCH?: string } | null) => {
        if (!d) return;
        setForm((f) => ({ ...f, bankName: f.bankName || d.BANK || '', branch: f.branch || d.BRANCH || '' }));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [form.ifsc]);

  const save = async () => {
    const errs: Record<string, string> = {};
    const account = form.account.replace(/\s+/g, '');
    if (!form.holder.trim()) errs.holder = 'Enter the name exactly as on your bank account';
    if (!/^\d{9,18}$/.test(account)) errs.account = 'Account number should be 9 to 18 digits';
    if (account !== form.account2.replace(/\s+/g, '')) errs.account2 = 'The two account numbers don’t match';
    if (!IFSC_RE.test(form.ifsc)) errs.ifsc = 'IFSC is 11 characters, e.g. SBIN0001234';
    if (!form.bankName.trim()) errs.bankName = 'Enter the bank name';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setServerError('');
    try {
      onChange(
        await saveBankDetails(token, {
          holder: form.holder,
          account,
          ifsc: form.ifsc,
          bankName: form.bankName,
          branch: form.branch,
          accountType: form.accountType,
        }),
      );
      setForm((f) => ({ ...f, account: '', account2: '' }));
      setEditing(false);
    } catch (err) {
      if (!onGone(err)) setServerError(errorMessage(err, 'Could not save your bank details. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Bank details for salary</h2>
      <div className="mt-3 rounded-2xl border border-hairline bg-white p-4 shadow-soft sm:p-5">
        {!editing && bank.submitted ? (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Landmark className="h-5 w-5 text-emerald-600" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{bank.holder}</p>
                  <p className="text-sm text-gray-500">
                    {bank.bankName} · A/c ••••{bank.accountLast4}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ocean hover:bg-ocean/5"
              >
                <Pencil className="h-3.5 w-3.5" /> Change
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-gray-400">IFSC</dt>
                <dd className="font-medium text-gray-700">{bank.ifsc}</dd>
              </div>
              {bank.branch && (
                <div>
                  <dt className="text-gray-400">Branch</dt>
                  <dd className="font-medium text-gray-700">{bank.branch}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-400">Account type</dt>
                <dd className="font-medium capitalize text-gray-700">{bank.accountType || 'savings'}</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <BankField label="Account holder name" error={errors.holder}>
              <input
                value={form.holder}
                onChange={(e) => set('holder', e.target.value)}
                maxLength={100}
                autoComplete="name"
                placeholder="As printed on your passbook"
                className={fieldCls(!!errors.holder)}
              />
            </BankField>
            <div className="grid gap-4 sm:grid-cols-2">
              <BankField label="Account number" error={errors.account}>
                <input
                  value={form.account}
                  onChange={(e) => set('account', e.target.value.replace(/[^\d\s]/g, ''))}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={22}
                  placeholder={bank.accountLast4 ? `••••${bank.accountLast4}` : ''}
                  className={fieldCls(!!errors.account)}
                />
              </BankField>
              <BankField label="Re-enter account number" error={errors.account2}>
                <input
                  value={form.account2}
                  onChange={(e) => set('account2', e.target.value.replace(/[^\d\s]/g, ''))}
                  onPaste={(e) => e.preventDefault()}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={22}
                  className={fieldCls(!!errors.account2)}
                />
              </BankField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <BankField label="IFSC code" error={errors.ifsc}>
                <input
                  value={form.ifsc}
                  onChange={(e) => set('ifsc', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="e.g. SBIN0001234"
                  className={`${fieldCls(!!errors.ifsc)} font-mono tracking-wide`}
                />
              </BankField>
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">Account type</span>
                <div className="flex rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Account type">
                  {['savings', 'current'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={form.accountType === t}
                      onClick={() => set('accountType', t)}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
                        form.accountType === t ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <BankField label="Bank name" error={errors.bankName}>
                <input
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                  maxLength={100}
                  className={fieldCls(!!errors.bankName)}
                />
              </BankField>
              <BankField label="Branch" optional>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.branch}
                    onChange={(e) => set('branch', e.target.value)}
                    maxLength={100}
                    className={`${fieldCls()} pl-10`}
                  />
                </div>
              </BankField>
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={save} loading={saving}>
                <Lock className="h-4 w-4" /> Save bank details
              </Button>
              {bank.submitted && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BankField({ label, error, optional, children }: { label: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label} {optional ? <span className="text-xs font-normal text-gray-400">(optional)</span> : <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
