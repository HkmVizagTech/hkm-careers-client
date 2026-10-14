'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, Search, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getJobAlertSubscribers, removeJobAlertSubscriber } from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import type { JobAlertSubscriber } from '@/types';

/** Settings → people who asked to be emailed about new openings. */
export default function JobAlertSubscribersCard() {
  const [data, setData] = useState<{ total: number; confirmed: number; subscribers: JobAlertSubscriber[] } | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<JobAlertSubscriber | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    getJobAlertSubscribers()
      .then(setData)
      .catch(() => setData({ total: 0, confirmed: 0, subscribers: [] }));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data?.subscribers || [];
    return q ? list.filter((s) => s.email.includes(q) || (s.name || '').toLowerCase().includes(q)) : list;
  }, [data, query]);
  const shown = showAll ? filtered : filtered.slice(0, 10);

  const remove = async () => {
    if (!confirmRemove || !data) return;
    setRemoving(true);
    try {
      await removeJobAlertSubscriber(confirmRemove._id);
      const subscribers = data.subscribers.filter((s) => s._id !== confirmRemove._id);
      setData({ total: subscribers.length, confirmed: subscribers.filter((s) => s.confirmed).length, subscribers });
      toast.success('Removed from job alerts');
      setConfirmRemove(null);
    } catch {
      toast.error('Could not remove. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
      <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <BellRing className="h-5 w-5 text-ocean" /> Job alert subscribers
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        People who asked to be emailed about new openings. Each new job is emailed to them once, when it&apos;s published.
      </p>

      {!data ? (
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="rounded-xl bg-ocean/[0.05] px-4 py-3">
              <p className="text-2xl font-bold text-navy">{data.confirmed}</p>
              <p className="text-xs font-medium text-gray-500">Getting alerts</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-2xl font-bold text-gray-700">{data.total - data.confirmed}</p>
              <p className="text-xs font-medium text-gray-500">Not confirmed yet</p>
            </div>
          </div>

          {data.total > 0 && (
            <>
              {data.total > 10 && (
                <div className="relative mt-4 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search email or name"
                    aria-label="Search subscribers"
                    className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/15"
                  />
                </div>
              )}
              <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
                {shown.map((s) => (
                  <li key={s._id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {s.email}
                        {s.name && <span className="font-normal text-gray-400"> · {s.name}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {s.departments.length ? s.departments.map((d) => d.name).join(', ') : 'All teams'} · since {formatDate(s.createdAt)}
                        {s.alertsSent ? ` · ${s.alertsSent} alert${s.alertsSent > 1 ? 's' : ''} sent` : ''}
                      </p>
                    </div>
                    {!s.confirmed && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Unconfirmed</span>}
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(s)}
                      aria-label={`Remove ${s.email}`}
                      className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No matches.</li>}
              </ul>
              {filtered.length > 10 && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 text-xs font-semibold text-ocean hover:text-navy">
                  {showAll ? 'Show less' : `Show all ${filtered.length}`}
                </button>
              )}
            </>
          )}
        </>
      )}

      <Modal isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Remove subscriber?" size="sm">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{confirmRemove?.email}</span> will stop getting job alerts. They can sign up again from the
          website.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={removing}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
