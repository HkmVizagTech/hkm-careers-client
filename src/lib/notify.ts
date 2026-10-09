import { toast } from '@/lib/toast';
import type { CandidateNotification } from '@/types';

/**
 * One toast summarising a WhatsApp + email attempt, e.g.
 * "Status updated. Sent on WhatsApp and email." or
 * "Status updated. WhatsApp sent; email not sent: Email is not set up".
 */
export function reportDelivery(n: CandidateNotification | null | undefined, done: string) {
  if (!n) return toast.success(done);
  const wa = n.status === 'failed' || n.status === 'skipped' ? { ok: false, why: n.error || n.status } : { ok: true, why: '' };
  const em = n.email
    ? n.email.status === 'sent'
      ? { ok: true, why: '' }
      : { ok: false, why: n.email.error || n.email.status }
    : null;

  if (wa.ok && (!em || em.ok)) return toast.success(`${done}. Sent on WhatsApp${em ? ' and email' : ''}.`);

  const parts = [
    wa.ok ? 'WhatsApp sent' : `WhatsApp not sent (${wa.why})`,
    em ? (em.ok ? 'email sent' : `email not sent (${em.why})`) : '',
  ].filter(Boolean);
  const anyFailed = n.status === 'failed' || n.email?.status === 'failed';
  (anyFailed ? toast.error : toast.info)(`${done}. ${parts.join('; ')}.`);
}
