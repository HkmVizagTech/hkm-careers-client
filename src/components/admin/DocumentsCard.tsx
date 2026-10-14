'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MailCheck,
  Pencil,
  Undo2,
  Upload,
  Eye,
  EyeOff,
  FileCheck2,
  FolderUp,
  Landmark,
  Plus,
  RotateCw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { SelectField } from '@/components/ui/SelectField';
import {
  addDocumentItem,
  adminRemoveDocumentFile,
  adminSaveBankDetails,
  adminUploadDocument,
  createDocumentRequest,
  deleteDocumentRequest,
  removeDocumentItem,
  updateDocumentItem,
  fetchDocumentFile,
  remindDocumentRequest,
  revealBankAccount,
  reviewDocumentItem,
} from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { DocumentItem, DocumentRequest } from '@/types';

/** Same rules as the server (controllers/documentController.js). */
const DOC_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.doc', '.docx'];
const DOC_ACCEPT = DOC_EXTS.join(',');
const DOC_MAX = 10 * 1024 * 1024;
export const DOC_FORMATS = 'PDF, JPG, PNG, WEBP, HEIC, DOC or DOCX · up to 10 MB each · max 5 files per document';

/** Starting checklists; HR can untick, mark optional or add their own. */
const PRESETS: Record<DocumentRequest['kind'], { label: string; required: boolean; on: boolean }[]> = {
  documents: [
    { label: 'Updated resume', required: true, on: false },
    { label: 'Educational certificates', required: true, on: true },
    { label: 'Government photo ID (Aadhaar / PAN / Passport)', required: true, on: true },
    { label: 'Experience / relieving letter', required: false, on: false },
    { label: 'Latest payslip', required: false, on: false },
  ],
  joining: [
    { label: 'Aadhaar card', required: true, on: true },
    { label: 'PAN card', required: true, on: true },
    { label: 'Passport-size photo', required: true, on: true },
    { label: 'Educational certificates', required: true, on: true },
    { label: 'Bank passbook front page or bank statement', required: true, on: true },
    { label: 'Relieving letter from previous employer', required: false, on: true },
    { label: 'Address proof (if different from Aadhaar)', required: false, on: false },
  ],
};

const STATUS: Record<DocumentRequest['status'], { label: string; cls: string }> = {
  open: { label: 'Waiting for candidate', cls: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'Ready to review', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'All approved', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
};

const ITEM: Record<DocumentItem['status'], { label: string; pill: string; dot: string; icon: typeof Check }> = {
  pending: { label: 'Waiting for upload', pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-100 text-gray-400', icon: Clock },
  uploaded: { label: 'Needs your review', pill: 'bg-blue-100 text-blue-800', dot: 'bg-blue-100 text-blue-700', icon: Eye },
  approved: { label: 'Approved', pill: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Re-upload requested', pill: 'bg-red-100 text-red-700', dot: 'bg-red-100 text-red-600', icon: RotateCw },
};

const apiMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const kb = (n?: number) => (!n ? '' : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

interface Props {
  applicationId: string;
  candidateName: string;
  status: string;
  requests: DocumentRequest[];
  onChange: (requests: DocumentRequest[]) => void;
  /** Bump to open the "request" window from elsewhere on the page. */
  openRequest?: { kind: DocumentRequest['kind']; n: number };
  onActivity?: () => void;
}

export default function DocumentsCard({ applicationId, candidateName, status, requests, onChange, openRequest, onActivity }: Props) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DocumentRequest['kind']>('documents');
  const [items, setItems] = useState<{ label: string; required: boolean; on: boolean }[]>([]);
  const [custom, setCustom] = useState('');
  const [wantBank, setWantBank] = useState(false);
  const [message, setMessage] = useState('');
  const [days, setDays] = useState('14');
  const [saving, setSaving] = useState(false);
  /** "<id>:<action>" of the button that is working, e.g. "abc:approve". */
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ rid: string; item: DocumentItem } | null>(null);
  const [reason, setReason] = useState('');
  const [emailNow, setEmailNow] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<DocumentRequest | null>(null);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  /** Email the upload link when creating a list (off = HR uploads the files themselves). */
  const [emailLink, setEmailLink] = useState(true);
  const [uploading, setUploading] = useState<{ iid: string; pct: number } | null>(null);
  const [renaming, setRenaming] = useState<{ iid: string; label: string } | null>(null);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [confirmItem, setConfirmItem] = useState<{ rid: string; item: DocumentItem } | null>(null);
  const [confirmFile, setConfirmFile] = useState<{ rid: string; item: DocumentItem; fid: string; name: string } | null>(null);
  const [bankEdit, setBankEdit] = useState<{
    rid: string;
    hasAccount: boolean;
    form: { holder: string; account: string; ifsc: string; bankName: string; branch: string; accountType: string };
  } | null>(null);

  const startRequest = (k: DocumentRequest['kind'], opts: { email?: boolean } = {}) => {
    setEmailLink(opts.email ?? true);
    setKind(k);
    setItems(PRESETS[k].map((p) => ({ ...p })));
    setWantBank(k === 'joining');
    setMessage('');
    setCustom('');
    setDays('14');
    setOpen(true);
  };

  useEffect(() => {
    if (openRequest?.n) startRequest(openRequest.kind);
  }, [openRequest?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCustom = () => {
    const label = custom.replace(/\s+/g, ' ').trim();
    if (!label) return;
    if (items.some((i) => i.label.toLowerCase() === label.toLowerCase())) return toast.info('Already in the list');
    setItems([...items, { label, required: true, on: true }]);
    setCustom('');
  };

  const send = async () => {
    const chosen = items.filter((i) => i.on).map(({ label, required }) => ({ label, required }));
    if (!chosen.length && !wantBank) return toast.error('Tick at least one document');
    setSaving(true);
    try {
      const res = await createDocumentRequest(applicationId, {
        kind,
        items: chosen,
        wantBank,
        message: message.trim() || undefined,
        expiresInDays: Number(days),
        notify: emailLink,
      });
      onChange(res.requests);
      setOpen(false);
      onActivity?.();
      if (!emailLink) toast.success('Document list created. Use "Upload file" on each document to add the files.');
      else if (res.email?.status === 'sent') toast.success(`Upload link emailed to ${candidateName}`);
      else {
        // Email not set up / failed: HR can still share the link another way.
        await navigator.clipboard?.writeText(res.link).catch(() => undefined);
        toast.info(`Request created, but the email wasn't sent${res.email?.error ? ` (${res.email.error})` : ''}. The link was copied so you can share it.`);
      }
    } catch (err) {
      toast.error(apiMessage(err, 'Could not create the request'));
    } finally {
      setSaving(false);
    }
  };

  const openFile = async (rid: string, fid: string, inline: boolean) => {
    const win = inline ? window.open('', '_blank') : null;
    try {
      const { blob, name } = await fetchDocumentFile(applicationId, rid, fid, inline);
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

  const review = async (
    rid: string,
    item: DocumentItem,
    next: 'approved' | 'rejected' | 'uploaded',
    opts: { note?: string; notify?: boolean } = {}
  ) => {
    setBusy(`${item._id}:${next}`);
    try {
      const res = await reviewDocumentItem(applicationId, rid, item._id, { status: next, ...opts });
      onChange(res.requests);
      onActivity?.();
      if (next === 'approved') toast.success(`Approved "${item.label}"`);
      else if (next === 'uploaded') toast.info(`"${item.label}" is back to "Needs your review"`);
      else if (!opts.notify) toast.info(`Re-upload requested for "${item.label}". Not emailed yet.`);
      else if (res.email?.status === 'sent') toast.success(`Re-upload requested and emailed to ${candidateName}`);
      else toast.error(`Re-upload requested, but the email wasn't sent${res.email?.error ? `: ${res.email.error}` : ''}`);
      return true;
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const askReupload = async () => {
    if (!rejecting) return;
    const ok = await review(rejecting.rid, rejecting.item, 'rejected', { note: reason.trim() || undefined, notify: emailNow });
    if (ok) setRejecting(null);
  };

  const remind = async (r: DocumentRequest) => {
    setBusy(`${r._id}:email`);
    try {
      const res = await remindDocumentRequest(applicationId, r._id);
      onChange(res.requests);
      onActivity?.();
      const reupload = r.items.some((i) => i.status === 'rejected');
      if (res.email?.status === 'sent') toast.success(reupload ? `Re-upload request emailed to ${candidateName}` : `Upload link emailed to ${candidateName}`);
      else toast.error(`Email not sent${res.email?.error ? `: ${res.email.error}` : ''}`);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not send the email'));
    } finally {
      setBusy(null);
    }
  };

  /** Runs an HR edit and swaps in the updated requests; returns false on failure. */
  const hrAction = async (key: string, fn: () => Promise<{ requests: DocumentRequest[] }>, done?: string) => {
    setBusy(key);
    try {
      onChange((await fn()).requests);
      onActivity?.();
      if (done) toast.success(done);
      return true;
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const hrUpload = async (rid: string, item: DocumentItem, files: FileList | null) => {
    const list = Array.from(files || []).slice(0, Math.max(0, 5 - item.files.length));
    if (!list.length) return toast.error('Up to 5 files per document. Delete one first.');
    for (const f of list) {
      const ext = `.${f.name.split('.').pop()?.toLowerCase() || ''}`;
      if (!DOC_EXTS.includes(ext)) return toast.error(`"${f.name}" isn't allowed. Use ${DOC_FORMATS.split(' · ')[0]}.`);
      if (f.size > DOC_MAX) return toast.error(`"${f.name}" is larger than 10 MB.`);
    }
    try {
      for (const f of list) {
        setUploading({ iid: item._id, pct: 0 });
        onChange((await adminUploadDocument(applicationId, rid, item._id, f, (pct) => setUploading({ iid: item._id, pct }))).requests);
      }
      onActivity?.();
      toast.success(`Uploaded to "${item.label}"`);
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setUploading(null);
    }
  };

  const saveRename = async (rid: string) => {
    if (!renaming) return;
    const label = renaming.label.replace(/\s+/g, ' ').trim();
    if (!label) return toast.error('Enter the document name');
    const ok = await hrAction(`${renaming.iid}:rename`, () => updateDocumentItem(applicationId, rid, renaming.iid, { label }), 'Renamed');
    if (ok) setRenaming(null);
  };

  const addItem = async (rid: string) => {
    const label = (newItem[rid] || '').replace(/\s+/g, ' ').trim();
    if (!label) return;
    const ok = await hrAction(`${rid}:add`, () => addDocumentItem(applicationId, rid, { label, required: false }), `Added "${label}"`);
    if (ok) setNewItem((n) => ({ ...n, [rid]: '' }));
  };

  const openBank = (r: DocumentRequest) =>
    setBankEdit({
      rid: r._id,
      hasAccount: !!r.bank?.accountLast4,
      form: {
        holder: r.bank?.holder || candidateName,
        account: '',
        ifsc: r.bank?.ifsc || '',
        bankName: r.bank?.bankName || '',
        branch: r.bank?.branch || '',
        accountType: r.bank?.accountType || 'savings',
      },
    });

  const saveBank = async () => {
    if (!bankEdit) return;
    const f = bankEdit.form;
    const account = f.account.replace(/\s+/g, '');
    if (!f.holder.trim()) return toast.error('Enter the account holder name');
    if ((account || !bankEdit.hasAccount) && !/^\d{9,18}$/.test(account)) return toast.error('Account number should be 9 to 18 digits');
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc)) return toast.error('IFSC is 11 characters, e.g. SBIN0001234');
    if (!f.bankName.trim()) return toast.error('Enter the bank name');
    const ok = await hrAction('bank', () => adminSaveBankDetails(applicationId, bankEdit.rid, { ...f, account: account || undefined }), 'Bank details saved');
    if (ok) {
      setAccounts(({ [bankEdit.rid]: _, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
      setBankEdit(null);
    }
  };

  const reveal = async (rid: string) => {
    if (accounts[rid]) return setAccounts(({ [rid]: _, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
    try {
      const account = await revealBankAccount(applicationId, rid);
      setAccounts((a) => ({ ...a, [rid]: account }));
      onActivity?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not show the account number'));
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const r = confirmDelete;
    setConfirmDelete(null);
    try {
      onChange((await deleteDocumentRequest(applicationId, r._id)).requests);
      onActivity?.();
      toast.info('Request deleted');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete'));
    }
  };

  const hasJoining = requests.some((r) => r.kind === 'joining');
  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <FolderUp className="h-5 w-5 text-ocean" /> Documents
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startRequest('documents')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10"
          >
            <Plus className="h-3.5 w-3.5" /> Request documents
          </button>
          <button
            type="button"
            onClick={() => startRequest('joining')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <FileCheck2 className="h-3.5 w-3.5" /> Joining documents
          </button>
          <button
            type="button"
            onClick={() => startRequest('documents', { email: false })}
            title="Make a list and upload the files yourself, e.g. copies the candidate handed in"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 hover:text-navy"
          >
            <Upload className="h-3.5 w-3.5" /> Add files yourself
          </button>
        </div>
      </div>

      {status === 'selected' && !hasJoining && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <strong>{candidateName}</strong> is selected. Send the joining documents link (ID, certificates, bank details).
          </span>
          <button type="button" onClick={() => startRequest('joining')} className="shrink-0 font-semibold text-emerald-800 underline-offset-2 hover:underline">
            Request now →
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          Nothing yet. Request documents and the candidate gets a private link to upload them, or use &quot;Add files yourself&quot; for copies
          they gave you. Everything is kept here, encrypted, for as long as this application exists.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {requests.map((r) => {
            const st = STATUS[r.status];
            const counts = {
              approved: r.items.filter((i) => i.status === 'approved').length,
              toReview: r.items.filter((i) => i.status === 'uploaded').length,
            };
            // Re-upload asked for but the candidate hasn't been emailed about it.
            const unsent = r.status === 'cancelled' ? [] : r.items.filter((i) => i.status === 'rejected' && !i.notifiedAt);
            return (
              <div key={r._id} className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy">{r.kind === 'joining' ? 'Joining documents' : 'Documents'}</p>
                    <p className="text-xs text-gray-500">
                      Requested {formatDate(r.createdAt)}
                      {r.submittedAt ? ` · uploaded ${formatDateTime(r.submittedAt)}` : ''}
                      {r.status !== 'completed' && r.expiresAt ? ` · link ${r.expired ? 'expired' : 'valid till'} ${formatDate(r.expiresAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {counts.toReview > 0 && (
                      <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white">{counts.toReview} to review</span>
                    )}
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
                      {counts.approved}/{r.items.length} approved
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                </div>

                {unsent.length > 0 && (
                  <div className="flex flex-col gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        {candidateName} hasn&apos;t been told yet to re-upload {unsent.map((i) => i.label).join(', ')}.
                      </span>
                    </span>
                    <Button size="sm" onClick={() => remind(r)} loading={busy === `${r._id}:email`} className="shrink-0">
                      <Send className="h-3.5 w-3.5" /> Email the candidate now
                    </Button>
                  </div>
                )}

                <ul className="divide-y divide-gray-100">
                  {r.items.map((item) => {
                    const ist = ITEM[item.status];
                    const StatusIcon = ist.icon;
                    const working = busy?.startsWith(`${item._id}:`);
                    return (
                      <li key={item._id} className={`px-4 py-4 ${item.status === 'uploaded' ? 'bg-blue-50/40' : ''}`}>
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ist.dot}`}>
                            <StatusIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            {renaming?.iid === item._id ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  value={renaming.label}
                                  onChange={(e) => setRenaming({ iid: item._id, label: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename(r._id);
                                    if (e.key === 'Escape') setRenaming(null);
                                  }}
                                  maxLength={120}
                                  autoFocus
                                  aria-label="Document name"
                                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
                                />
                                <Button size="sm" onClick={() => saveRename(r._id)} loading={busy === `${item._id}:rename`}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.label}
                                  {!item.required && <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>}
                                </p>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ist.pill}`}>{ist.label}</span>
                                <span className="ml-auto flex gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setRenaming({ iid: item._id, label: item.label })}
                                    aria-label={`Rename ${item.label}`}
                                    title="Rename"
                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmItem({ rid: r._id, item })}
                                    aria-label={`Remove ${item.label}`}
                                    title="Remove this document"
                                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              </div>
                            )}

                            {item.status === 'pending' && <p className="mt-1 text-xs text-gray-500">Waiting for {candidateName.split(' ')[0]} to upload.</p>}
                            {item.status === 'approved' && item.reviewedAt && (
                              <p className="mt-1 text-xs text-emerald-700">Approved {formatDateTime(item.reviewedAt)}</p>
                            )}

                            {item.status === 'rejected' && (
                              <div className="mt-2 rounded-lg border border-red-100 bg-red-50/70 px-3 py-2 text-xs">
                                <p className="text-red-800">
                                  <span className="font-semibold">Reason:</span> {item.note || 'Please upload a clearer copy.'}
                                </p>
                                {item.notifiedAt ? (
                                  <p className="mt-1 flex items-center gap-1 font-semibold text-emerald-700">
                                    <MailCheck className="h-3.5 w-3.5" /> Emailed to the candidate {formatDateTime(item.notifiedAt)}. Waiting for a new file.
                                  </p>
                                ) : (
                                  <p className="mt-1 flex items-center gap-1 font-semibold text-amber-700">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Not emailed yet
                                  </p>
                                )}
                              </div>
                            )}

                            {!!item.files.length && (
                              <ul className="mt-2.5 space-y-1.5">
                                {item.files.map((f) => (
                                  <li key={f._id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs">
                                    <span className="min-w-0 flex-1 truncate font-medium text-gray-700" title={f.name}>
                                      {f.name}{' '}
                                      <span className="font-normal text-gray-400">
                                        · {kb(f.size)} · {formatDateTime(f.uploadedAt)}
                                        {f.addedByName ? ` · added by ${f.addedByName}` : ''}
                                      </span>
                                    </span>
                                    <span className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openFile(r._id, f._id, true)}
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-ocean hover:bg-ocean/5"
                                      >
                                        <Eye className="h-3.5 w-3.5" /> View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openFile(r._id, f._id, false)}
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-gray-600 hover:bg-gray-100"
                                      >
                                        <Download className="h-3.5 w-3.5" /> Download
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmFile({ rid: r._id, item, fid: f._id, name: f.name })}
                                        aria-label={`Delete ${f.name}`}
                                        title="Delete this file"
                                        className="rounded-md px-1.5 py-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {item.status === 'uploaded' && !!item.files.length && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => review(r._id, item, 'approved')}
                                  loading={busy === `${item._id}:approved`}
                                  disabled={working}
                                  className="!bg-emerald-600 hover:!bg-emerald-700"
                                >
                                  <Check className="h-4 w-4" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={working}
                                  onClick={() => {
                                    setReason('');
                                    setEmailNow(true);
                                    setRejecting({ rid: r._id, item });
                                  }}
                                  className="!border-red-300 !text-red-700 hover:!bg-red-50"
                                >
                                  <RotateCw className="h-4 w-4" /> Ask to re-upload
                                </Button>
                              </div>
                            )}

                            {(item.status === 'approved' || (item.status === 'rejected' && !!item.files.length)) && (
                              <button
                                type="button"
                                onClick={() => review(r._id, item, 'uploaded')}
                                disabled={working}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-navy disabled:opacity-50"
                              >
                                {busy === `${item._id}:uploaded` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                                Undo{item.status === 'approved' ? ' approval' : ' re-upload request'}
                              </button>
                            )}

                            {uploading?.iid === item._id ? (
                              <div className="mt-2 max-w-xs">
                                <div className="flex justify-between text-[11px] text-gray-500">
                                  <span>Uploading…</span>
                                  <span>{uploading.pct}%</span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                  <div className="h-full rounded-full bg-ocean transition-all" style={{ width: `${uploading.pct}%` }} />
                                </div>
                              </div>
                            ) : (
                              item.files.length < 5 && (
                                <label className="mt-2 ml-0.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-ocean hover:text-navy">
                                  <input
                                    type="file"
                                    accept={DOC_ACCEPT}
                                    multiple
                                    className="sr-only"
                                    disabled={!!uploading}
                                    onChange={(e) => {
                                      hrUpload(r._id, item, e.target.files);
                                      e.target.value = '';
                                    }}
                                  />
                                  <Upload className="h-3.5 w-3.5" /> {item.files.length ? 'Add another file' : 'Upload file yourself'}
                                </label>
                              )
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  <li className="bg-gray-50/50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={newItem[r._id] || ''}
                        onChange={(e) => setNewItem((n) => ({ ...n, [r._id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addItem(r._id)}
                        maxLength={120}
                        placeholder="Add another document, e.g. Medical fitness certificate"
                        aria-label="New document name"
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
                      />
                      <Button size="sm" variant="outline" onClick={() => addItem(r._id)} loading={busy === `${r._id}:add`} disabled={!(newItem[r._id] || '').trim()}>
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">Accepted files: {DOC_FORMATS}</p>
                  </li>
                  {r.bank?.wanted && (
                    <li className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                          <Landmark className="h-4 w-4 text-ocean" /> Bank details
                        </p>
                        <button
                          type="button"
                          onClick={() => openBank(r)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ocean hover:bg-ocean/5"
                        >
                          <Pencil className="h-3.5 w-3.5" /> {r.bank.submittedAt ? 'Edit' : 'Enter them yourself'}
                        </button>
                      </div>
                      {r.bank.submittedAt ? (
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                          <div>
                            <dt className="text-gray-400">Account holder</dt>
                            <dd className="font-semibold text-navy">{r.bank.holder}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400">Account number</dt>
                            <dd className="flex items-center gap-1.5 font-mono font-semibold text-navy">
                              {accounts[r._id] || `•••• ${r.bank.accountLast4}`}
                              <button
                                type="button"
                                onClick={() => reveal(r._id)}
                                aria-label={accounts[r._id] ? 'Hide account number' : 'Show full account number'}
                                title={accounts[r._id] ? 'Hide' : 'Show (this is recorded in the activity log)'}
                                className="rounded p-0.5 text-gray-400 hover:text-ocean"
                              >
                                {accounts[r._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-400">IFSC</dt>
                            <dd className="font-mono font-semibold text-navy">{r.bank.ifsc}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400">Bank</dt>
                            <dd className="font-semibold text-navy">{r.bank.bankName}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400">Branch</dt>
                            <dd className="font-semibold text-navy">{r.bank.branch || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400">Type</dt>
                            <dd className="font-semibold capitalize text-navy">{r.bank.accountType || 'savings'}</dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="text-xs font-semibold text-gray-500">Not filled in yet</p>
                      )}
                    </li>
                  )}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5">
                  {r.status !== 'completed' ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <button
                        type="button"
                        onClick={() => remind(r)}
                        disabled={busy === `${r._id}:email`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-ocean ring-1 ring-ocean/25 hover:bg-ocean/5 disabled:opacity-50"
                      >
                        {busy === `${r._id}:email` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {busy === `${r._id}:email` ? 'Sending…' : r.items.some((i) => i.status === 'rejected') ? 'Email re-upload request' : 'Email the link again'}
                      </button>
                      {r.lastEmailedAt && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <MailCheck className="h-3.5 w-3.5 text-emerald-600" /> Last emailed {formatDateTime(r.lastEmailedAt)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700">Completed {r.completedAt ? formatDate(r.completedAt) : ''}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(r)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New request */}
      <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title={!emailLink ? 'Add documents yourself' : kind === 'joining' ? 'Request joining documents' : 'Request documents'} size="xl">
        <p className="-mt-2 text-sm text-gray-500">
          {emailLink
            ? `${candidateName} gets an email with a private link to upload these.`
            : 'The list is created without emailing anyone. Upload the files yourself from the Documents card.'}{' '}
          Files are encrypted and only HR can open them.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Request type">
          {(['documents', 'joining'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => {
                setKind(k);
                setItems(PRESETS[k].map((p) => ({ ...p })));
                setWantBank(k === 'joining');
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${kind === k ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
            >
              {k === 'joining' ? 'Joining documents' : 'Documents'}
            </button>
          ))}
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-semibold text-gray-600">What should they upload?</legend>
          <ul className="space-y-1.5">
            {items.map((i, idx) => (
              <li key={i.label} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm text-gray-800">
                  <Checkbox checked={i.on} onChange={(on) => setItems(items.map((x, j) => (j === idx ? { ...x, on } : x)))} />
                  <span className="min-w-0">{i.label}</span>
                </label>
                {i.on && (
                  <button
                    type="button"
                    onClick={() => setItems(items.map((x, j) => (j === idx ? { ...x, required: !x.required } : x)))}
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      i.required ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-500'
                    }`}
                    title="Click to switch between required and optional"
                  >
                    {i.required ? 'Required' : 'Optional'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add another document, e.g. Medical fitness certificate"
              maxLength={120}
              className={`${inputCls} min-w-0 flex-1`}
            />
            <Button variant="outline" onClick={addCustom} disabled={!custom.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </fieldset>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 p-3 text-sm text-gray-800">
          <Checkbox checked={wantBank} onChange={setWantBank} className="mt-0.5" />
          <span>
            <span className="font-semibold">Ask for bank account details</span>
            <span className="block text-xs text-gray-500">Holder name, account number, IFSC, bank and branch. The account number is stored encrypted.</span>
          </span>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold text-gray-600">Message (optional)</span>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            placeholder={kind === 'joining' ? 'e.g. Your joining date is 1 November. Please upload these by 25 October.' : 'Anything the candidate should know'}
            className={`${inputCls} resize-y`}
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 p-3 text-sm text-gray-800">
          <Checkbox checked={emailLink} onChange={setEmailLink} className="mt-0.5" />
          <span>
            <span className="font-semibold">Email the upload link to {candidateName}</span>
            <span className="block text-xs text-gray-500">
              Untick to just create the list and upload the files yourself (e.g. copies handed in at the office). You can email the link later.
            </span>
          </span>
        </label>
        <p className="mt-3 text-xs text-gray-500">Accepted files: {DOC_FORMATS}.</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Link works for
            <SelectField
              size="sm"
              className="!w-32"
              ariaLabel="Link valid for"
              value={days}
              onChange={setDays}
              options={[
                { value: '7', label: '7 days' },
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={send} loading={saving}>
              {emailLink ? <Send className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {emailLink ? 'Email the link' : 'Create list'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ask for re-upload */}
      <Modal isOpen={!!rejecting} onClose={() => !busy && setRejecting(null)} title="Ask to re-upload" size="md">
        <p className="text-sm text-gray-600">
          What&apos;s wrong with <strong className="text-navy">{rejecting?.item.label}</strong>? The candidate sees this.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['The photo is blurred', 'A page is missing', 'Wrong document', 'Name does not match'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setReason(t)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:text-ocean"
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="Reason, e.g. The photo is blurred"
          className={`${inputCls} mt-3`}
          autoFocus
        />
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <Checkbox checked={emailNow} onChange={setEmailNow} className="mt-0.5" />
          <span>
            <span className="font-semibold">Email {candidateName} now</span>
            <span className="block text-xs text-gray-500">
              They get the reason and the same upload link. Untick if you&apos;re asking for more than one file and want to send one email at the end.
            </span>
          </span>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejecting(null)} disabled={busy?.endsWith(':rejected')}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button variant="danger" onClick={askReupload} loading={busy?.endsWith(':rejected')}>
            <RotateCw className="h-4 w-4" /> {emailNow ? 'Ask to re-upload & email' : 'Ask to re-upload'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!confirmItem} onClose={() => setConfirmItem(null)} title="Remove this document?" size="sm">
        <p className="text-sm text-gray-600">
          <strong className="text-navy">{confirmItem?.item.label}</strong> is removed from the list
          {confirmItem?.item.files.length ? ` and its ${confirmItem.item.files.length} file(s) are deleted permanently` : ''}.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmItem(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy === 'remove-item'}
            onClick={async () => {
              if (!confirmItem) return;
              const { rid, item } = confirmItem;
              if (await hrAction('remove-item', () => removeDocumentItem(applicationId, rid, item._id), `Removed "${item.label}"`)) setConfirmItem(null);
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!confirmFile} onClose={() => setConfirmFile(null)} title="Delete this file?" size="sm">
        <p className="text-sm text-gray-600">
          <strong className="text-navy">{confirmFile?.name}</strong> from &quot;{confirmFile?.item.label}&quot; is deleted permanently.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmFile(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy === 'remove-file'}
            onClick={async () => {
              if (!confirmFile) return;
              const { rid, item, fid } = confirmFile;
              if (await hrAction('remove-file', () => adminRemoveDocumentFile(applicationId, rid, item._id, fid), 'File deleted')) setConfirmFile(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!bankEdit} onClose={() => busy !== 'bank' && setBankEdit(null)} title="Bank details" size="md">
        {bankEdit && (
          <div className="space-y-3">
            {[
              { k: 'holder' as const, label: 'Account holder name' },
              {
                k: 'account' as const,
                label: bankEdit.hasAccount ? 'New account number (leave blank to keep the current one)' : 'Account number',
              },
              { k: 'ifsc' as const, label: 'IFSC code' },
              { k: 'bankName' as const, label: 'Bank name' },
              { k: 'branch' as const, label: 'Branch (optional)' },
            ].map((f) => (
              <label key={f.k} className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-600">{f.label}</span>
                <input
                  value={bankEdit.form[f.k]}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (f.k === 'account') v = v.replace(/[^\d\s]/g, '');
                    if (f.k === 'ifsc') v = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                    setBankEdit({ ...bankEdit, form: { ...bankEdit.form, [f.k]: v } });
                  }}
                  inputMode={f.k === 'account' ? 'numeric' : undefined}
                  autoComplete="off"
                  className={`${inputCls} ${f.k === 'ifsc' || f.k === 'account' ? 'font-mono' : ''}`}
                />
              </label>
            ))}
            <div>
              <span className="mb-1 block text-xs font-semibold text-gray-600">Account type</span>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Account type">
                {['savings', 'current'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={bankEdit.form.accountType === t}
                    onClick={() => setBankEdit({ ...bankEdit, form: { ...bankEdit.form, accountType: t } })}
                    className={`rounded-lg py-2 text-sm font-semibold capitalize ${bankEdit.form.accountType === t ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">The account number is stored encrypted. Changes are recorded in the activity log.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setBankEdit(null)} disabled={busy === 'bank'}>
                Cancel
              </Button>
              <Button onClick={saveBank} loading={busy === 'bank'}>
                Save bank details
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete this request?" size="sm">
        <p className="text-sm text-gray-600">
          The upload link stops working and {confirmDelete?.items.reduce((n, i) => n + i.files.length, 0) || 'no'} uploaded file(s) are deleted
          permanently.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
