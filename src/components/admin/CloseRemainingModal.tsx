'use client';

import { useEffect, useState } from 'react';
import { PartyPopper, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { closeJobRemaining, getJobPipeline } from '@/lib/services';
import { toast } from '@/lib/toast';
import type { JobPipeline, RoleFilled } from '@/types';

interface Props {
  /** Open for this job. `filled` comes from a status change that filled the last opening. */
  target: { jobId: string; filled?: RoleFilled | null } | null;
  onClose: () => void;
  onDone?: (updated: number) => void;
}

/**
 * "Position filled" / "Close job" dialog: closes the job and moves everyone still in
 * progress to Not Selected, optionally sending them the Not Selected WhatsApp.
 */
export default function CloseRemainingModal({ target, onClose, onDone }: Props) {
  const [info, setInfo] = useState<JobPipeline | null>(null);
  const [notify, setNotify] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setInfo(null);
    setNotify(true);
    if (!target) return;
    getJobPipeline(target.jobId)
      .then(setInfo)
      .catch(() => toast.error('Could not load the job'));
  }, [target]);

  const run = async () => {
    if (!target) return;
    setWorking(true);
    try {
      const res = await closeJobRemaining(target.jobId, notify);
      toast.success(
        res.updated
          ? `${res.updated} applicant${res.updated === 1 ? '' : 's'} moved to Not Selected${notify ? ' and are being messaged on WhatsApp' : ''}`
          : 'Job closed'
      );
      onDone?.(res.updated);
      onClose();
    } catch {
      toast.error('Could not update the applicants');
    } finally {
      setWorking(false);
    }
  };

  const filled = target?.filled;
  const remaining = info?.remaining ?? filled?.remaining ?? 0;
  const title = filled ? 'Position filled' : 'Close job';

  return (
    <Modal isOpen={!!target} onClose={onClose} title={title} size="md">
      {filled && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p>
            <strong>{filled.title}</strong>: {filled.selected} of {filled.openings} opening{filled.openings === 1 ? '' : 's'} filled.
            {filled.closedNow ? ' The job has been closed, so it no longer accepts applications.' : ''}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-3 text-sm text-gray-700">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-ocean" />
        {info === null && !filled ? (
          <p className="text-gray-400">Checking applicants…</p>
        ) : remaining === 0 ? (
          <p>No other applicants are still in progress for this job.</p>
        ) : (
          <p>
            <strong>{remaining}</strong> applicant{remaining === 1 ? ' is' : 's are'} still in progress (Received to Interview).
            Move {remaining === 1 ? 'them' : 'all of them'} to <strong>Not Selected</strong>?
          </p>
        )}
      </div>

      {remaining > 0 && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-3.5 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            Send them the &quot;Not Selected&quot; WhatsApp message
            <span className="block text-xs text-gray-500">
              &quot;Thank you for your interest… We encourage you to apply for other openings.&quot;
            </span>
          </span>
        </label>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={working}>
          {remaining > 0 ? 'Leave them for now' : 'Close'}
        </Button>
        {(remaining > 0 || (!filled && info?.status === 'active')) && (
          <Button onClick={run} loading={working}>
            {remaining > 0 ? `Move ${remaining} to Not Selected` : 'Close job'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
