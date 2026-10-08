'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlarmClock, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { addFollowUp, deleteFollowUp, updateFollowUp } from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDateTime, toDateTimeLocal } from '@/lib/utils';
import type { FollowUp } from '@/types';

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

/** Quick picks, all at 10:00 local time. */
function preset(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return toDateTimeLocal(d);
}
const PRESETS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];

interface Props {
  applicationId: string;
  followUps: FollowUp[];
  onChange: (list: FollowUp[]) => void;
}

export default function FollowUpsCard({ applicationId, followUps, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [when, setWhen] = useState(preset(1));
  const [note, setNote] = useState('');
  const [showDone, setShowDone] = useState(false);

  const open = useMemo(
    () => followUps.filter((f) => !f.done).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt)),
    [followUps]
  );
  const done = useMemo(() => followUps.filter((f) => f.done), [followUps]);

  const save = async () => {
    if (!note.trim()) return toast.error('Add what to follow up on');
    const at = new Date(when);
    if (!when || Number.isNaN(at.getTime())) return toast.error('Choose when to be reminded');
    setSaving(true);
    try {
      onChange(await addFollowUp(applicationId, { dueAt: at.toISOString(), note: note.trim() }));
      setNote('');
      setWhen(preset(1));
      setAdding(false);
      toast.success(`Reminder set for ${formatDateTime(at)}`);
    } catch {
      toast.error('Could not save the reminder');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (f: FollowUp) => {
    setBusyId(f._id);
    try {
      onChange(await updateFollowUp(applicationId, f._id, { done: !f.done }));
    } catch {
      toast.error('Could not update the reminder');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (f: FollowUp) => {
    setBusyId(f._id);
    try {
      onChange(await deleteFollowUp(applicationId, f._id));
    } catch {
      toast.error('Could not delete the reminder');
    } finally {
      setBusyId(null);
    }
  };

  const Row = ({ f }: { f: FollowUp }) => {
    const overdue = !f.done && new Date(f.dueAt).getTime() < Date.now();
    const by = typeof f.createdBy === 'object' && f.createdBy ? f.createdBy.name : null;
    return (
      <li className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => toggle(f)}
          disabled={busyId === f._id}
          aria-label={f.done ? 'Mark as not done' : 'Mark as done'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
            f.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 hover:border-ocean'
          }`}
        >
          {f.done && <Check className="h-3.5 w-3.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${f.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{f.note}</p>
          <p className={`mt-0.5 text-xs ${overdue ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
            {overdue ? 'Overdue · ' : ''}
            {formatDateTime(f.dueAt)}
            {by ? ` · ${by}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => remove(f)}
          disabled={busyId === f._id}
          aria-label="Delete reminder"
          className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 }}
      className="rounded-2xl border border-hairline bg-white p-6 shadow-soft"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <AlarmClock className="h-5 w-5 text-teal" /> Follow-up Reminders
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-4 space-y-3 rounded-xl bg-surfaceAlt/60 p-3.5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="e.g. Call about notice period"
            maxLength={500}
            autoFocus
            className={inputCls}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const v = preset(p.days);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setWhen(v)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    when === v ? 'bg-teal text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-teal/50'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} aria-label="Remind me at" />
          <div className="flex gap-2">
            <Button onClick={save} loading={saving} className="flex-1">
              Set reminder
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {open.length === 0 && !adding ? (
        <p className="mt-3 text-sm text-gray-500">No pending reminders. Add one to get an alert in the bell when it&apos;s due.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {open.map((f) => (
            <Row key={f._id} f={f} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="mt-4 border-t border-hairline pt-3">
          <button type="button" onClick={() => setShowDone((s) => !s)} className="text-xs font-semibold text-gray-500 hover:text-navy">
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </button>
          {showDone && (
            <ul className="mt-3 space-y-3">
              {done.map((f) => (
                <Row key={f._id} f={f} />
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}
