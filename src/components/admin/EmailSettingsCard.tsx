'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle, Mail, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getMailStatus, sendTestEmail } from '@/lib/services';
import { toast } from '@/lib/toast';
import type { MailStatus } from '@/types';

const VIA_LABEL: Record<string, string> = { 'gmail-api': 'Gmail API', smtp: 'SMTP' };

/** Settings → Email: shows whether sending is set up and sends a test message. */
export default function EmailSettingsCard({ defaultTo }: { defaultTo?: string }) {
  const [status, setStatus] = useState<MailStatus | null>(null);
  const [to, setTo] = useState(defaultTo || '');
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState('');

  useEffect(() => {
    getMailStatus().then(setStatus).catch(() => setStatus(null));
  }, []);
  useEffect(() => {
    if (defaultTo && !to) setTo(defaultTo);
  }, [defaultTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const test = async () => {
    setSending(true);
    setLastError('');
    const res = await sendTestEmail(to.trim() || undefined);
    setSending(false);
    if (res.ok) toast.success(`Test email sent to ${res.to}. Check the inbox (and spam).`);
    else {
      setLastError(res.error || 'Could not send');
      toast.error('Test email failed');
    }
  };

  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <dt className="shrink-0 text-gray-500">{k}</dt>
      <dd className="min-w-0 text-right font-medium text-gray-800 [overflow-wrap:anywhere]">{v}</dd>
    </div>
  );

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
      <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <Mail className="h-5 w-5 text-ocean" /> Email
      </h3>
      {!status ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <>
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
              status.configured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
            }`}
          >
            {status.configured ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {status.configured
              ? `Email is set up (${VIA_LABEL[status.via || ''] || status.via})`
              : 'Email is not set up yet. Add the MAIL / GMAIL settings in Railway.'}
          </div>
          <dl className="mt-2 divide-y divide-gray-100">
            <Row k="Sends from" v={status.from || '—'} />
            <Row k="Replies go to" v={status.replyTo || status.from || '—'} />
            <Row k="New-application alerts" v={status.hrRecipients.length ? status.hrRecipients.join(', ') : 'Off'} />
          </dl>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Send a test to…"
              aria-label="Test email address"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15"
            />
            <Button onClick={test} loading={sending} disabled={!status.configured}>
              <Send className="h-4 w-4" /> Send test
            </Button>
          </div>
          {lastError && <p className="mt-2 text-xs text-red-600 [overflow-wrap:anywhere]">{lastError}</p>}
        </>
      )}
    </div>
  );
}
