'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Download,
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
  createDocumentRequest,
  deleteDocumentRequest,
  fetchDocumentFile,
  remindDocumentRequest,
  revealBankAccount,
  reviewDocumentItem,
} from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { DocumentItem, DocumentRequest } from '@/types';

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

const ITEM: Record<DocumentItem['status'], { label: string; cls: string }> = {
  pending: { label: 'Not uploaded', cls: 'text-gray-500' },
  uploaded: { label: 'To review', cls: 'text-blue-700' },
  approved: { label: 'Approved', cls: 'text-emerald-700' },
  rejected: { label: 'Re-upload asked', cls: 'text-red-600' },
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
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ rid: string; item: DocumentItem } | null>(null);
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<DocumentRequest | null>(null);
  const [accounts, setAccounts] = useState<Record<string, string>>({});

  const startRequest = (k: DocumentRequest['kind']) => {
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
      });
      onChange(res.requests);
      setOpen(false);
      onActivity?.();
      if (res.email?.status === 'sent') toast.success(`Upload link emailed to ${candidateName}`);
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

  const review = async (rid: string, item: DocumentItem, next: 'approved' | 'rejected', note?: string) => {
    setBusy(item._id);
    try {
      const res = await reviewDocumentItem(applicationId, rid, item._id, { status: next, note });
      onChange(res.requests);
      onActivity?.();
      if (next === 'rejected') toast.info('Marked for re-upload. Use "Email the candidate" to let them know.');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update'));
    } finally {
      setBusy(null);
    }
  };

  const remind = async (r: DocumentRequest) => {
    setBusy(r._id);
    try {
      const res = await remindDocumentRequest(applicationId, r._id);
      onChange(res.requests);
      onActivity?.();
      if (res.email?.status === 'sent') toast.success('Emailed the candidate');
      else toast.error(`Email not sent${res.email?.error ? `: ${res.email.error}` : ''}`);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not send the email'));
    } finally {
      setBusy(null);
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
          Nothing requested yet. The candidate gets a private link to upload files; you review them here.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {requests.map((r) => {
            const st = STATUS[r.status];
            return (
              <div key={r._id} className="rounded-xl border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy">{r.kind === 'joining' ? 'Joining documents' : 'Documents'}</p>
                    <p className="text-xs text-gray-500">
                      Requested {formatDate(r.createdAt)}
                      {r.submittedAt ? ` · uploaded ${formatDateTime(r.submittedAt)}` : ''}
                      {r.status !== 'completed' && r.expiresAt ? ` · link ${r.expired ? 'expired' : 'valid till'} ${formatDate(r.expiresAt)}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                </div>

                <ul className="divide-y divide-gray-100">
                  {r.items.map((item) => {
                    const ist = ITEM[item.status];
                    return (
                      <li key={item._id} className="px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {item.label}
                              {!item.required && <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>}
                            </p>
                            <p className={`text-xs font-semibold ${ist.cls}`}>
                              {ist.label}
                              {item.status === 'rejected' && item.note ? `: ${item.note}` : ''}
                            </p>
                          </div>
                          {!!item.files.length && item.status !== 'approved' && (
                            <div className="flex shrink-0 gap-1.5">
                              <button
                                type="button"
                                disabled={busy === item._id}
                                onClick={() => review(r._id, item, 'approved')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                              {item.status !== 'rejected' && (
                                <button
                                  type="button"
                                  disabled={busy === item._id}
                                  onClick={() => {
                                    setReason('');
                                    setRejecting({ rid: r._id, item });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <RotateCw className="h-3.5 w-3.5" /> Ask re-upload
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {!!item.files.length && (
                          <ul className="mt-2 space-y-1.5">
                            {item.files.map((f) => (
                              <li key={f._id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                                <span className="min-w-0 truncate text-gray-700" title={f.name}>
                                  {f.name} <span className="text-gray-400">· {kb(f.size)}</span>
                                </span>
                                <span className="flex shrink-0 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openFile(r._id, f._id, true)}
                                    aria-label={`View ${f.name}`}
                                    className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-ocean"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openFile(r._id, f._id, false)}
                                    aria-label={`Download ${f.name}`}
                                    className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-ocean"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                  {r.bank?.wanted && (
                    <li className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <Landmark className="h-4 w-4 text-ocean" /> Bank details
                      </p>
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
                    <button
                      type="button"
                      onClick={() => remind(r)}
                      disabled={busy === r._id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean hover:text-navy disabled:opacity-50"
                    >
                      <Send className={`h-3.5 w-3.5 ${busy === r._id ? 'animate-pulse' : ''}`} />
                      {r.items.some((i) => i.status === 'rejected') ? 'Email the candidate to re-upload' : 'Send the link again'}
                    </button>
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
      <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title={kind === 'joining' ? 'Request joining documents' : 'Request documents'} size="xl">
        <p className="-mt-2 text-sm text-gray-500">
          {candidateName} gets an email with a private link to upload these. Files are encrypted and only HR can open them.
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
              <Send className="h-4 w-4" /> Email the link
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ask for re-upload */}
      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Ask to re-upload" size="md">
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
          placeholder="Reason"
          className={`${inputCls} mt-3`}
          autoFocus
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejecting(null)}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={() => {
              if (!rejecting) return;
              review(rejecting.rid, rejecting.item, 'rejected', reason.trim() || undefined);
              setRejecting(null);
            }}
          >
            Ask re-upload
          </Button>
        </div>
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
