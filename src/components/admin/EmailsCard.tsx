'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Ban, Check, ChevronDown, Mail, PenLine } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { sendApplicationEmail } from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDateTime } from '@/lib/utils';
import type { EmailLog } from '@/types';

const KIND_LABEL: Record<EmailLog['kind'], string> = {
  received: 'Application received',
  status: 'Status update',
  interview: 'Interview details',
  custom: 'Message from HR',
  'hr-new-application': 'New-application alert to HR',
};

const STATUS_STYLE: Record<EmailLog['status'], { label: string; cls: string; icon: typeof Check }> = {
  sent: { label: 'Sent', cls: 'bg-emerald-100 text-emerald-700', icon: Check },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
  skipped: { label: 'Not sent', cls: 'bg-amber-100 text-amber-700', icon: Ban },
};

/** Ready-made starting points; HR edits before sending. */
const QUICK: { label: string; subject: string; message: string }[] = [
  {
    label: 'Request documents',
    subject: 'Documents required for your application',
    message:
      'Thank you for your application. To take it forward, please reply to this email with the following documents:\n\n1. Updated resume\n2. Educational certificates\n3. A government photo ID\n\nPlease send them within the next 3 days.',
  },
  {
    label: 'Ask for availability',
    subject: 'Your availability for an interview',
    message:
      'We would like to speak with you about your application. Please reply with two or three dates and times over the next week when you are available for a short interview.',
  },
  {
    label: 'Offer follow-up',
    subject: 'Next steps for joining',
    message:
      'Congratulations once again. Our HR team will share the joining details shortly. Please reply to this email if you have any questions in the meantime.',
  },
];

interface Props {
  applicationId: string;
  candidateEmail: string;
  emails: EmailLog[];
  onChange: (emails: EmailLog[]) => void;
}

export default function EmailsCard({ applicationId, candidateEmail, emails, onChange }: Props) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const open = (preset?: (typeof QUICK)[number]) => {
    setSubject(preset?.subject ?? '');
    setMessage(preset?.message ?? '');
    setComposeOpen(true);
  };

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
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10"
        >
          <PenLine className="h-3.5 w-3.5" /> Compose
        </button>
      </div>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No emails yet.</p>
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
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => open(q)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 transition-colors hover:text-ocean hover:ring-ocean/40"
            >
              {q.label}
            </button>
          ))}
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
