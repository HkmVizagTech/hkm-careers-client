'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, BellOff, BellRing, Check, Loader2 } from 'lucide-react';
import { getDepartments, getJobAlertSettings, unsubscribeJobAlerts, updateJobAlertSettings } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import type { Department } from '@/types';

export default function ManageAlertsPage() {
  return (
    <Suspense fallback={<Shell><Loader2 className="mx-auto h-8 w-8 animate-spin text-ocean" /></Shell>}>
      <Manage />
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 pb-16 pt-[112px] sm:pb-20 sm:pt-[136px]">{children}</div>;
}

function Manage() {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unsubscribed'>('loading');
  const [email, setEmail] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    Promise.all([getJobAlertSettings(token), getDepartments({ active: true }).catch(() => [] as Department[])])
      .then(([s, d]) => {
        setEmail(s.email);
        setPicked(s.departments);
        setDepartments(d);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [token]);

  const toggle = (id: string) => {
    setSaved(false);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await updateJobAlertSettings(token, picked);
      setPicked(r.departments);
      setSaved(true);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    setLeaving(true);
    try {
      await unsubscribeJobAlerts(token);
      setState('unsubscribed');
    } catch {
      setError('Could not unsubscribe. Please try again.');
    } finally {
      setLeaving(false);
    }
  };

  if (state === 'loading') {
    return (
      <Shell>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-ocean" />
      </Shell>
    );
  }

  if (state === 'error' || state === 'unsubscribed') {
    const out = state === 'unsubscribed';
    return (
      <Shell>
        <div className="text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${out ? 'bg-gray-100' : 'bg-red-50'}`}>
            {out ? <BellOff className="h-8 w-8 text-gray-500" /> : <AlertCircle className="h-8 w-8 text-red-500" />}
          </div>
          <h1 className="mt-5 text-2xl font-bold text-navy">{out ? 'You’ve been unsubscribed' : 'This link isn’t working'}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {out
              ? 'You won’t get any more job alerts from us. You can sign up again any time from the jobs page.'
              : 'You may have already unsubscribed. You can sign up again from the jobs page.'}
          </p>
          <Link href="/jobs" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-ocean">
            Browse open jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-soft sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ocean/10">
          <BellRing className="h-5 w-5 text-ocean" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-navy">Your job alerts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sent to <span className="font-semibold text-gray-800">{email}</span>
        </p>

        <h2 className="mt-6 text-sm font-semibold text-gray-700">Email me about openings in</h2>
        <p className="text-xs text-gray-400">Leave everything unselected to hear about every team.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {departments.map((d) => {
            const on = picked.includes(d._id);
            return (
              <button
                key={d._id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(d._id)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  on ? 'bg-ocean text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" />}
                {d.name}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs font-medium text-gray-500">
          {picked.length ? `${picked.length} team${picked.length > 1 ? 's' : ''} selected` : 'All teams'}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={save} loading={saving}>
            Save changes
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>

        <div className="mt-8 border-t border-gray-100 pt-5">
          {confirmLeave ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-700">Stop all job alerts?</span>
              <Button type="button" variant="danger" size="sm" onClick={leave} loading={leaving}>
                Yes, unsubscribe
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmLeave(false)}>
                Keep them
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmLeave(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600">
              <BellOff className="h-4 w-4" /> Unsubscribe from all job alerts
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}
