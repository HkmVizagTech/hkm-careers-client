'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, CalendarPlus, MapPin, Pencil, Phone, Send, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { clearInterview, resendInterviewNotification, scheduleInterview } from '@/lib/services';
import { toast } from '@/lib/toast';
import { formatDateTime, toDateTimeLocal } from '@/lib/utils';
import type { Interview, InterviewMode, WhatsAppMessage } from '@/types';

const MODES: { value: InterviewMode; label: string; icon: typeof Video }[] = [
  { value: 'in-person', label: 'In person', icon: MapPin },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'video', label: 'Video call', icon: Video },
];

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

const isUrl = (s?: string) => !!s && /^https?:\/\//i.test(s.trim());

/** Google Calendar "add event" link (1 hour slot). */
function calendarLink(interview: Interview, candidate: string, jobTitle: string) {
  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Interview: ${candidate} (${jobTitle})`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [interview.notes, typeof window !== 'undefined' ? window.location.href : ''].filter(Boolean).join('\n\n'),
    location: interview.location || '',
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

interface Props {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  interview?: Interview | null;
  onChange: (interview: Interview | null) => void;
  /** Called after a WhatsApp was attempted, so the page can refresh its message log. */
  onMessage?: () => void;
  /** Open the form straight away (e.g. right after the status was set to Interview). */
  startEditing?: boolean;
}

function reportMessage(n: WhatsAppMessage | null | undefined, savedText: string) {
  if (!n) return toast.success(savedText);
  if (n.status === 'failed') toast.error(`${savedText}, but the WhatsApp failed: ${n.error ?? 'unknown error'}`);
  else if (n.status === 'skipped') toast.info(`${savedText}. WhatsApp not sent: ${n.error ?? 'skipped'}`);
  else toast.success(`${savedText} and the candidate was sent the details on WhatsApp`);
}

export default function InterviewCard({ applicationId, candidateName, jobTitle, interview, onChange, onMessage, startEditing }: Props) {
  const scheduled = interview?.scheduledAt ? interview : null;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [when, setWhen] = useState('');
  const [mode, setMode] = useState<InterviewMode>('in-person');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [notify, setNotify] = useState(true);
  const [resending, setResending] = useState(false);

  const openForm = () => {
    setWhen(scheduled ? toDateTimeLocal(scheduled.scheduledAt) : '');
    setMode(scheduled?.mode || 'in-person');
    setLocation(scheduled?.location || '');
    setNotes(scheduled?.notes || '');
    setNotify(true);
    setEditing(true);
  };

  useEffect(() => {
    if (startEditing && !scheduled) openForm();
  }, [startEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!when) return toast.error('Choose the interview date and time');
    const at = new Date(when);
    if (Number.isNaN(at.getTime())) return toast.error('Invalid date');
    setSaving(true);
    try {
      const res = await scheduleInterview(applicationId, {
        scheduledAt: at.toISOString(),
        mode,
        location: location.trim(),
        notes: notes.trim(),
        notify,
      });
      onChange(res.interview);
      setEditing(false);
      reportMessage(res.notification, scheduled ? 'Interview rescheduled' : 'Interview scheduled');
      if (res.notification) onMessage?.();
    } catch {
      toast.error('Could not save the interview');
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await resendInterviewNotification(applicationId);
      reportMessage(res.notification, 'Interview details re-sent');
      onMessage?.();
    } catch {
      toast.error('Could not send the interview details');
    } finally {
      setResending(false);
    }
  };

  const cancel = async () => {
    setSaving(true);
    try {
      await clearInterview(applicationId);
      onChange(null);
      setEditing(false);
      toast.info('Interview removed');
    } catch {
      toast.error('Could not remove the interview');
    } finally {
      setSaving(false);
    }
  };

  const past = scheduled && new Date(scheduled.scheduledAt).getTime() < Date.now();
  const modeInfo = MODES.find((m) => m.value === scheduled?.mode);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 }}
      className="rounded-2xl border border-hairline bg-white p-6 shadow-soft"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <CalendarClock className="h-5 w-5 text-plum" /> Interview
        </h2>
        {scheduled && !editing && (
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10"
          >
            <Pencil className="h-3.5 w-3.5" /> Reschedule
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Date &amp; time</span>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
          </label>
          <div>
            <span className="mb-1 block text-xs font-semibold text-gray-600">Mode</span>
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-colors ${
                      active ? 'border-plum/40 bg-plum/10 text-plum' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              {mode === 'video' ? 'Meeting link' : mode === 'phone' ? 'Who calls whom (optional)' : 'Venue'}
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={mode === 'video' ? 'https://meet.google.com/…' : mode === 'phone' ? 'HR will call the candidate' : 'HKM Vizag temple office'}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Notes for the panel (optional)</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} />
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              <span className="font-semibold">Send WhatsApp to the candidate</span>
              <span className="block text-emerald-800/80">Date, time, mode and venue/link, with their tracking button.</span>
            </span>
          </label>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} loading={saving} className="flex-1">
              {scheduled ? 'Save changes' : 'Schedule'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Close
            </Button>
          </div>
          {scheduled && (
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Remove interview
            </button>
          )}
          <p className="text-[11px] leading-relaxed text-gray-400">
            Admins also get a reminder in the bell the day before and 2 hours before.
          </p>
        </div>
      ) : scheduled ? (
        <div className="mt-4">
          <div className={`rounded-xl p-4 ${past ? 'bg-gray-50' : 'bg-plum/[0.06]'}`}>
            <p className={`text-base font-bold ${past ? 'text-gray-500' : 'text-navy'}`}>{formatDateTime(scheduled.scheduledAt)}</p>
            {past && <p className="text-xs font-medium text-gray-500">This interview time has passed</p>}
            {modeInfo && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-gray-600">
                <modeInfo.icon className="h-3.5 w-3.5" /> {modeInfo.label}
              </p>
            )}
            {scheduled.location && (
              <p className="mt-1 break-words text-sm text-gray-600">
                {isUrl(scheduled.location) ? (
                  <a href={scheduled.location.trim()} target="_blank" rel="noopener noreferrer" className="font-medium text-ocean hover:underline">
                    {scheduled.location}
                  </a>
                ) : (
                  scheduled.location
                )}
              </p>
            )}
            {scheduled.notes && <p className="mt-2 whitespace-pre-line text-xs text-gray-500">{scheduled.notes}</p>}
          </div>
          {!past && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${resending ? 'animate-pulse' : ''}`} /> Send details on WhatsApp
            </button>
            <a
              href={calendarLink(scheduled, candidateName, jobTitle)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean hover:text-navy"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Add to Google Calendar
            </a>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-gray-500">No interview scheduled.</p>
          <button
            type="button"
            onClick={openForm}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-plum/40 px-4 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5"
          >
            <CalendarPlus className="h-4 w-4" /> Schedule interview
          </button>
        </div>
      )}
    </motion.div>
  );
}
