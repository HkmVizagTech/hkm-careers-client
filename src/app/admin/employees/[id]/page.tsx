'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  HeartPulse,
  History,

  Landmark,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  StickyNote,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import {
  deleteEmployee,
  deleteEmployeeDocument,
  fetchEmployeeDocument,
  getDepartments,
  getEmployee,
  renameEmployeeDocument,
  revealEmployeeField,
  updateEmployee,
  uploadEmployeeDocument,
} from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SelectField } from '@/components/ui/SelectField';
import EmployeeForm, { checkForm, formFromEmployee, inputFromForm, type EmployeeFormState, type EmployeeSection } from '@/components/admin/EmployeeForm';
import { toast } from '@/lib/toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Department, Employee, EmployeeDocument } from '@/types';

const apiMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const kb = (n?: number) => (!n ? '' : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const DOC_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.doc', '.docx'];
const DOC_MAX = 10 * 1024 * 1024;
const LABELS = [
  'Aadhaar card',
  'PAN card',
  'Passport-size photo',
  'Educational certificates',
  'Bank passbook or statement',
  'Resume',
  'Offer / appointment letter',
  'Relieving letter',
  'Experience certificate',
  'Address proof',
  'Medical certificate',
];
const OTHER = '__other__';

const SECTION_TITLE: Record<EmployeeSection, string> = {
  job: 'Edit job details',
  contact: 'Edit contact & address',
  emergency: 'Edit emergency contact',
  personal: 'Edit personal details',
  bank: 'Edit bank details',
  notes: 'Edit notes',
};

export default function EmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<EmployeeSection | null>(null);
  const [form, setForm] = useState<EmployeeFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [shown, setShown] = useState<Partial<Record<'aadhaar' | 'pan' | 'account', string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getEmployee(id)
      .then(setEmp)
      .catch(() => setNotFound(true));
    getDepartments().then(setDepartments).catch(() => {});
  }, [id]);

  const openEdit = (sec: EmployeeSection) => {
    if (!emp) return;
    setForm(formFromEmployee(emp));
    setEditing(sec);
  };

  const save = async () => {
    if (!emp || !form || !editing) return;
    const problem = checkForm(form, [editing]);
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const next = await updateEmployee(emp._id, inputFromForm(form, [editing]));
      setEmp(next);
      setShown({});
      setEditing(null);
      toast.success('Saved');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const reveal = async (field: 'aadhaar' | 'pan' | 'account') => {
    if (!emp) return;
    if (shown[field]) return setShown(({ [field]: _, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
    try {
      const value = await revealEmployeeField(emp._id, field);
      setShown((s) => ({ ...s, [field]: value }));
      getEmployee(emp._id).then(setEmp).catch(() => {}); // refresh the activity log
    } catch (err) {
      toast.error(apiMessage(err, 'Could not show it'));
    }
  };

  const remove = async () => {
    if (!emp) return;
    setDeleting(true);
    try {
      await deleteEmployee(emp._id);
      toast.success('Employee record deleted');
      router.push('/admin/employees');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete'));
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <div className="rounded-2xl border border-hairline bg-white p-10 text-center shadow-soft">
        <p className="font-semibold text-navy">This employee record was not found.</p>
        <Link href="/admin/employees" className="mt-3 inline-block text-sm font-semibold text-ocean hover:text-navy">
          Back to Employees
        </Link>
      </div>
    );
  }
  if (!emp) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const masked = (field: 'aadhaar' | 'pan' | 'account', has: boolean, last4?: string) =>
    has ? (
      <span className="inline-flex items-center gap-1.5 font-mono">
        {shown[field] || `•••• ${last4 || ''}`}
        <button
          type="button"
          onClick={() => reveal(field)}
          aria-label={shown[field] ? 'Hide' : 'Show the full number'}
          title={shown[field] ? 'Hide' : 'Show (recorded in the activity log)'}
          className="rounded p-0.5 text-gray-400 hover:text-ocean"
        >
          {shown[field] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </span>
    ) : undefined;

  return (
    <div>
      <Link href="/admin/employees" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Employees
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ${
              emp.status === 'left' ? 'bg-gray-400' : 'bg-gradient-to-br from-navy to-ocean'
            }`}
          >
            {emp.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-navy">{emp.name}</h1>
              {emp.employeeId && <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">{emp.employeeId}</span>}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  emp.status === 'left' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {emp.status === 'left' ? `Left${emp.leavingDate ? ` on ${formatDate(emp.leavingDate)}` : ''}` : 'Working'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {[emp.designation, emp.department?.name].filter(Boolean).join(' · ') || 'No designation yet'}
              {emp.joiningDate && <span className="text-gray-400"> · joined {formatDate(emp.joiningDate)}</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              {emp.phone && (
                <a href={`tel:${emp.phone}`} className="inline-flex items-center gap-1.5 hover:text-ocean">
                  <Phone className="h-3.5 w-3.5" /> {emp.phone}
                </a>
              )}
              {emp.email && (
                <a href={`mailto:${emp.email}`} className="inline-flex items-center gap-1.5 hover:text-ocean">
                  <Mail className="h-3.5 w-3.5" /> {emp.email}
                </a>
              )}
            </div>
            {emp.applicationNumber && (
              <p className="mt-2 text-xs text-gray-500">
                Added from application{' '}
                {emp.application ? (
                  <Link href={`/admin/applications/${emp.application}`} className="font-semibold text-ocean hover:text-navy">
                    {emp.applicationNumber}
                  </Link>
                ) : (
                  <span className="font-semibold">{emp.applicationNumber}</span>
                )}
                {emp.appliedFor ? ` (${emp.appliedFor})` : ''}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => openEdit('job')}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete employee record"
              title="Delete employee record"
              className="rounded-xl p-2.5 text-gray-400 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <DocumentsPanel emp={emp} onChange={setEmp} />

          <InfoCard title="Personal details" icon={UserRound} onEdit={() => openEdit('personal')}>
            <Info label="Gender" value={emp.gender ? emp.gender[0].toUpperCase() + emp.gender.slice(1) : ''} />
            <Info label="Date of birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : ''} />
            <Info label="Blood group" value={emp.bloodGroup} />
            <Info label="Aadhaar" value={masked('aadhaar', !!emp.hasAadhaar, emp.aadhaarLast4)} />
            <Info label="PAN" value={masked('pan', !!emp.hasPan, emp.panLast4)} />
          </InfoCard>

          <InfoCard title="Contact & address" icon={MapPin} onEdit={() => openEdit('contact')}>
            <Info label="Phone" value={emp.phone} />
            <Info label="Alternate phone" value={emp.altPhone} />
            <Info label="Email" value={emp.email} />
            <Info label="Current address" value={emp.currentAddress} wide />
            <Info label="Permanent address" value={emp.permanentAddress} wide />
          </InfoCard>

          <InfoCard title="Bank details" icon={Landmark} onEdit={() => openEdit('bank')}>
            <Info label="Account holder" value={emp.bank?.holder} />
            <Info label="Account number" value={masked('account', !!emp.bank?.accountLast4, emp.bank?.accountLast4)} />
            <Info label="IFSC" value={emp.bank?.ifsc ? <span className="font-mono">{emp.bank.ifsc}</span> : ''} />
            <Info label="Bank" value={emp.bank?.bankName} />
            <Info label="Branch" value={emp.bank?.branch} />
            <Info label="Type" value={emp.bank?.accountLast4 ? (emp.bank.accountType || 'savings').replace(/^./, (c) => c.toUpperCase()) : ''} />
          </InfoCard>
        </div>

        <div className="min-w-0 space-y-6">
          <InfoCard title="Job details" icon={Briefcase} onEdit={() => openEdit('job')} single>
            <Info label="Employee ID" value={emp.employeeId} />
            <Info label="Designation" value={emp.designation} />
            <Info label="Department" value={emp.department?.name} />
            <Info label="Joining date" value={emp.joiningDate ? formatDate(emp.joiningDate) : ''} />
            {emp.status === 'left' && <Info label="Leaving date" value={emp.leavingDate ? formatDate(emp.leavingDate) : ''} />}
          </InfoCard>

          <InfoCard title="Emergency contact" icon={HeartPulse} onEdit={() => openEdit('emergency')} single>
            <Info label="Name" value={emp.emergencyContact?.name} />
            <Info label="Relationship" value={emp.emergencyContact?.relationship} />
            <Info
              label="Phone"
              value={
                emp.emergencyContact?.phone ? (
                  <a href={`tel:${emp.emergencyContact.phone}`} className="text-ocean hover:text-navy">
                    {emp.emergencyContact.phone}
                  </a>
                ) : (
                  ''
                )
              }
            />
          </InfoCard>

          <InfoCard title="Notes" icon={StickyNote} onEdit={() => openEdit('notes')} single>
            {emp.notes ? (
              <p className="whitespace-pre-line text-sm text-gray-700 sm:col-span-2">{emp.notes}</p>
            ) : (
              <p className="text-sm text-gray-400">No notes.</p>
            )}
          </InfoCard>

          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <History className="h-5 w-5 text-ocean" /> Activity
            </h2>
            <ol className="mt-3 space-y-3">
              {emp.activity.slice(0, 15).map((a) => (
                <li key={a._id} className="text-sm">
                  <p className="text-gray-800">{a.text}</p>
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-500">{(typeof a.by === 'object' && a.by?.name) || a.byName || 'System'}</span> ·{' '}
                    {formatDateTime(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <Modal isOpen={!!editing} onClose={() => !saving && setEditing(null)} title={editing ? SECTION_TITLE[editing] : ''} size="xl">
        {editing && form && (
          <>
            <EmployeeForm value={form} onChange={setForm} sections={[editing]} departments={departments} saved={emp} showTitles={false} />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                Save
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)} title="Delete this employee record?" size="sm">
        <p className="text-sm text-gray-600">
          {emp.name}&apos;s record and all {emp.documents.length} document{emp.documents.length === 1 ? '' : 's'} stored here are deleted permanently. If
          they have only left, mark them as <strong>Left</strong> instead so the record is kept.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={deleting}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  onEdit,
  children,
  single,
}: {
  title: string;
  icon: typeof FileText;
  onEdit: () => void;
  children: React.ReactNode;
  single?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Icon className="h-5 w-5 text-ocean" /> {title}
        </h2>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ocean hover:bg-ocean/5">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      <dl className={`mt-3 grid gap-x-6 gap-y-3 ${single ? '' : 'sm:grid-cols-2'}`}>{children}</dl>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm font-medium text-gray-800 [overflow-wrap:anywhere]">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}

/** All of an employee's documents, grouped by what they are, with upload / view / rename / delete. */
function DocumentsPanel({ emp, onChange }: { emp: Employee; onChange: (e: Employee) => void }) {
  const [label, setLabel] = useState(LABELS[0]);
  const [otherLabel, setOtherLabel] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; label: string } | null>(null);
  const [confirm, setConfirm] = useState<EmployeeDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const map = new Map<string, EmployeeDocument[]>();
    for (const d of emp.documents) map.set(d.label, [...(map.get(d.label) || []), d]);
    return Array.from(map.entries());
  }, [emp.documents]);

  const chosenLabel = label === OTHER ? otherLabel.replace(/\s+/g, ' ').trim() : label;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!chosenLabel) return toast.error('Type what this document is first');
    for (const f of Array.from(files)) {
      const ext = `.${f.name.split('.').pop()?.toLowerCase() || ''}`;
      if (!DOC_EXTS.includes(ext)) return toast.error(`"${f.name}" isn't allowed. Use PDF, JPG, PNG, WEBP, HEIC, DOC or DOCX.`);
      if (f.size > DOC_MAX) return toast.error(`"${f.name}" is larger than 10 MB.`);
    }
    try {
      let latest = emp;
      for (const f of Array.from(files)) {
        setProgress(0);
        latest = await uploadEmployeeDocument(emp._id, chosenLabel, f, setProgress);
      }
      onChange(latest);
      toast.success(`Uploaded to "${chosenLabel}"`);
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const open = async (d: EmployeeDocument, inline: boolean) => {
    const win = inline ? window.open('', '_blank') : null;
    try {
      const { blob, name } = await fetchEmployeeDocument(emp._id, d._id, inline);
      const url = URL.createObjectURL(blob);
      if (inline && win && /pdf|image/i.test(blob.type)) {
        win.document.title = name;
        win.document.body.style.margin = '0';
        const el = win.document.createElement(/pdf/i.test(blob.type) ? 'iframe' : 'img');
        el.setAttribute('src', url);
        el.setAttribute('alt', name);
        el.setAttribute('style', /pdf/i.test(blob.type) ? 'border:0;width:100vw;height:100vh' : 'max-width:100%;display:block;margin:auto');
        win.document.body.appendChild(el);
      } else {
        win?.close();
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      win?.close();
      toast.error(apiMessage(err, 'Could not open the file'));
    }
  };

  const saveRename = async () => {
    if (!renaming) return;
    const next = renaming.label.replace(/\s+/g, ' ').trim();
    if (!next) return toast.error('Enter the document name');
    setBusy(true);
    try {
      onChange(await renameEmployeeDocument(emp._id, renaming.id, next));
      setRenaming(null);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not rename'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      onChange(await deleteEmployeeDocument(emp._id, confirm._id));
      toast.success('Document deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <FolderOpen className="h-5 w-5 text-ocean" /> Documents
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{emp.documents.length}</span>
        </h2>
      </div>

      {/* Upload */}
      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SelectField
            size="sm"
            className="sm:!w-64"
            ariaLabel="What is this document?"
            value={label}
            onChange={setLabel}
            options={[...LABELS.map((l) => ({ value: l, label: l })), { value: OTHER, label: 'Something else…' }]}
          />
          {label === OTHER && (
            <input
              value={otherLabel}
              onChange={(e) => setOtherLabel(e.target.value)}
              maxLength={120}
              placeholder="e.g. Police verification"
              aria-label="Document name"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15"
            />
          )}
          <label
            className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ocean ${
              progress !== null ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input ref={inputRef} type="file" multiple accept={DOC_EXTS.join(',')} className="sr-only" onChange={(e) => upload(e.target.files)} />
            {progress !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {progress !== null ? `Uploading ${progress}%` : 'Upload files'}
          </label>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">PDF, JPG, PNG, WEBP, HEIC, DOC or DOCX · up to 10 MB each · stored encrypted</p>
      </div>

      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No documents yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map(([group, docs]) => (
            <div key={group}>
              <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <FileText className="h-3.5 w-3.5" /> {group} <span className="font-semibold text-gray-400">({docs.length})</span>
              </p>
              <ul className="space-y-1.5">
                {docs.map((d) => (
                  <li key={d._id} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs">
                    {renaming?.id === d._id ? (
                      <div className="flex w-full flex-wrap items-center gap-2">
                        <span className="text-gray-500">Rename to</span>
                        <input
                          value={renaming.label}
                          onChange={(e) => setRenaming({ id: d._id, label: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename();
                            if (e.key === 'Escape') setRenaming(null);
                          }}
                          autoFocus
                          maxLength={120}
                          aria-label="New document name"
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-ocean focus:outline-none"
                        />
                        <Button size="sm" onClick={saveRename} loading={busy}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                          <span className="block truncate font-medium text-gray-800" title={d.name}>
                            {d.name}
                          </span>
                          <span className="text-gray-400">
                            {kb(d.size)} · {formatDateTime(d.uploadedAt)}
                            {d.fromApplication ? ' · from the application' : d.addedByName ? ` · added by ${d.addedByName}` : ''}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-0.5">
                          <button type="button" onClick={() => open(d, true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-ocean hover:bg-ocean/5">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button type="button" onClick={() => open(d, false)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-gray-600 hover:bg-gray-100">
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenaming({ id: d._id, label: d.label })}
                            aria-label={`Rename ${d.name}`}
                            title="Change what this document is"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirm(d)}
                            aria-label={`Delete ${d.name}`}
                            title="Delete"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!confirm} onClose={() => !busy && setConfirm(null)} title="Delete this document?" size="sm">
        <p className="flex gap-2 text-sm text-gray-600">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <span>
            <strong className="text-navy">{confirm?.name}</strong> ({confirm?.label}) is deleted permanently.
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={busy}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
