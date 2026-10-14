'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Ban, Check, ChevronDown, Mail, PenLine, Settings2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getEmailDrafts, sendApplicationEmail } from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDateTime } from '@/lib/utils';
import type { EmailDraft, EmailLog } from '@/types';

const KIND_LABEL: Record<EmailLog['kind'], string> = {
  received: 'Application received',
  status: 'Status update',
  interview: 'Interview details',
  custom: 'Message from HR',
  'hr-new-application': 'New-application alert to HR',
  documents: 'Document upload link',
  'hr-documents': 'Documents-received alert to HR',
};

const STATUS_STYLE: Record<EmailLog['status'], { label: string; cls: string; icon: typeof Check }> = {
  sent: { label: 'Sent', cls: 'bg-emerald-100 text-emerald-700', icon: Check },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
  skipped: { label: 'Not sent', cls: 'bg-amber-100 text-amber-700', icon: Ban },
};

/** Fills {name}, {position} and {applicationNo} in a saved draft. */
export function fillDraft(text: string, vars: { name: string; position: string; applicationNo: string }) {
  return text
    .replace(/\{name\}/gi, vars.name)
    .replace(/\{position\}/gi, vars.position)
    .replace(/\{applicationNo\}/gi, vars.applicationNo);
}

interface Props {
  applicationId: string;
  candidateEmail: string;
  emails: EmailLog[];
  onChange: (emails: EmailLog[]) => void;
  /** Bump this number to open the compose window (e.g. from the page header's "Email candidate" button). */
  composeRequest?: number;
  /** For filling {name}, {position} and {applicationNo} in saved drafts. */
  candidateName?: string;
  jobTitle?: string;
  applicationNo?: string;
}

export default function EmailsCard({
  applicationId,
  candidateEmail,
  emails,
  onChange,
  composeRequest,
  candidateName = '',
  jobTitle = '',
  applicationNo = '',
}: Props) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<EmailDraft[] | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const vars = { name: candidateName, position: jobTitle || 'the position', applicationNo };

  const open = () => {
    setSubject('');
    setMessage('');
    setDraftId(null);
    setComposeOpen(true);
    // Saved drafts are edited in Settings; fetch fresh each time the window opens.
    getEmailDrafts().then(setDrafts).catch(() => setDrafts((d) => d ?? []));
  };

  const applyDraft = (d: EmailDraft) => {
    setSubject(fillDraft(d.subject, vars));
    setMessage(fillDraft(d.message, vars));
    setDraftId(d._id);
  };

  useEffect(() => {
    if (composeRequest) open();
  }, [composeRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!subject.trim() || !message.trim()) return toast.error('Add a subject and a message');
    setSending(true);
    try {
      const res = await sendApplicationEmail(applicationId, { subject: subject.trim(), message: message.trim() });
      onChange(res.emails);
      if (res.email.status === 'sent') {
        toast.success(`Email sent to ${candidateEmail}`);
        setComposeOpen(false);
      } else {
        toast.error(`Email not sent: ${res.email.error ?? res.email.status}`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Could not send the email');
    } finally {
      setSending(false);
    }
  };

  const list = [...emails].reverse();
  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 }}
      className="rounded-2xl border border-hairline bg-white p-6 shadow-soft"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Mail className="h-5 w-5 text-ocean" /> Emails
        </h2>
        <button
          type="button"
          onClick={() => open()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-ocean"
        >
          <PenLine className="h-3.5 w-3.5" /> Write email
        </button>
      </div>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No emails yet. Updates are emailed automatically when you change the status or schedule an interview.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((e) => {
            const st = STATUS_STYLE[e.status] || STATUS_STYLE.sent;
            const Icon = st.icon;
            const by = typeof e.sentBy === 'object' && e.sentBy ? e.sentBy.name : null;
            const isOpen = expanded === e._id;
            return (
              <li key={e._id} className="border-l-2 border-ocean/25 pl-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{KIND_LABEL[e.kind] || e.kind}</p>
                    {e.subject && <p className="truncate text-xs text-gray-600" title={e.subject}>{e.subject}</p>}
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                    <Icon className="h-3 w-3" /> {st.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatDateTime(e.createdAt)}
                  {by ? ` · ${by}` : ''}
                  {e.kind === 'hr-new-application' && e.to ? ` · to ${e.to}` : ''}
                </p>
                {e.error && <p className="mt-1 text-xs text-red-600 [overflow-wrap:anywhere]">{e.error}</p>}
                {e.body && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : e._id)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ocean hover:text-navy"
                    >
                      {isOpen ? 'Hide message' : 'Show message'}
                      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <p className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-xs text-gray-700 [overflow-wrap:anywhere]">{e.body}</p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={composeOpen} onClose={() => !sending && setComposeOpen(false)} title="Email the candidate" size="lg">
        <p className="text-xs text-gray-500">
          To <span className="font-semibold text-gray-700">{candidateEmail}</span>. Sent in the HKM Vizag email design with a
          greeting and your name. Replies come back to the HR inbox.
        </p>
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-600">Start from a saved draft</span>
            <Link href="/admin/settings#email-drafts" className="inline-flex items-center gap-1 text-xs font-semibold text-ocean hover:text-navy">
              <Settings2 className="h-3.5 w-3.5" /> Edit drafts
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {drafts === null ? (
              <span className="h-7 w-40 animate-pulse rounded-full bg-gray-200" />
            ) : drafts.length === 0 ? (
              <span className="text-xs text-gray-400">No saved drafts yet. Add them in Settings.</span>
            ) : (
              drafts.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => applyDraft(d)}
                  aria-pressed={draftId === d._id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                    draftId === d._id ? 'bg-navy text-white ring-navy' : 'bg-white text-gray-600 ring-gray-200 hover:text-ocean hover:ring-ocean/40'
                  }`}
                >
                  {d.label}
                </button>
              ))
            )}
          </div>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold text-gray-600">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className={inputCls} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold text-gray-600">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            maxLength={10000}
            placeholder="Write your message. A greeting (Hare Krishna, name) and your signature are added automatically."
            className={`${inputCls} resize-y`}
          />
        </label>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setComposeOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} loading={sending} disabled={!subject.trim() || !message.trim()}>
            <Mail className="h-4 w-4" /> Send email
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
