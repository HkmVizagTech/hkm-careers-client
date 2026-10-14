'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Check, MailCheck } from 'lucide-react';
import { getDepartments, subscribeJobAlerts } from '@/lib/services';
import type { Department } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * "Notify me about new openings": email sign-up with optional department choice.
 * `variant="banner"` is a wide block for list pages, `"card"` a compact sidebar card.
 */
export default function JobAlertSignup({
  variant = 'banner',
  defaultDepartment,
  departments: given,
  title,
  className = '',
}: {
  variant?: 'banner' | 'card';
  defaultDepartment?: string;
  departments?: Department[];
  title?: string;
  className?: string;
}) {
  const [departments, setDepartments] = useState<Department[]>(given || []);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>(defaultDepartment ? [defaultDepartment] : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<'confirm-sent' | 'already-subscribed' | null>(null);

  useEffect(() => {
    if (given) setDepartments(given);
    else getDepartments({ active: true }).then(setDepartments).catch(() => {});
  }, [given]);

  useEffect(() => {
    setPicked(defaultDepartment ? [defaultDepartment] : []);
  }, [defaultDepartment]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      const res = await subscribeJobAlerts({ email: value, name: name.trim() || undefined, departments: picked });
      setDone(res.status);
    } catch (err) {
      const e2 = err as { response?: { status?: number; data?: { message?: string } } };
      setError(
        e2.response?.status === 429
          ? 'Too many attempts. Please try again in a few minutes.'
          : e2.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const compact = variant === 'card';
  const heading = title || (compact ? 'Get alerts for new openings' : 'Don’t see the right role yet?');

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 ${compact ? '' : 'sm:p-7'} ${className}`}
        role="status"
      >
        <div className="flex gap-3">
          <MailCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold">{done === 'already-subscribed' ? 'You’re already subscribed' : 'Check your inbox'}</p>
            <p className="mt-1 text-sm leading-relaxed opacity-90">
              {done === 'already-subscribed'
                ? `We've emailed ${email.trim()} a link to change your alert settings.`
                : `We've sent a confirmation link to ${email.trim()}. Click it to start getting alerts. (Check spam if you don't see it.)`}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const chips = departments.length > 0 && (
    <div className="mt-4">
      <p className={`text-xs font-semibold ${compact ? 'text-gray-500' : 'text-white/70'}`}>Which teams? (leave blank for all)</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {departments.map((d) => {
          const on = picked.includes(d._id);
          return (
            <button
              key={d._id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(d._id)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                compact
                  ? on
                    ? 'bg-ocean text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : on
                    ? 'bg-white text-navy'
                    : 'bg-white/10 text-white/80 ring-1 ring-white/20 hover:bg-white/20'
              }`}
            >
              {on && <Check className="h-3 w-3" />}
              {d.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft ${className}`}>
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
            <BellRing className="h-4 w-4 text-ocean" /> {heading}
          </h3>
        </div>
        <form onSubmit={submit} className="p-6" noValidate>
          <p className="text-sm text-gray-500">We&apos;ll email you when a new job is posted. No spam, unsubscribe any time.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            aria-label="Your email"
            autoComplete="email"
            className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
          />
          {chips}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-60"
          >
            <BellRing className="h-4 w-4" /> {busy ? 'Subscribing…' : 'Notify me'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean p-6 text-white shadow-lift sm:p-9 ${className}`}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/10" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <BellRing className="h-5 w-5 text-cyan" />
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{heading}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            Get an email the moment a new opening is posted at HKM Vizag. Pick the teams you care about. No spam, unsubscribe any time.
          </p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Your email"
              autoComplete="email"
              className="min-w-0 flex-[1.4] rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-cyan/30"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              aria-label="Your name (optional)"
              autoComplete="name"
              maxLength={100}
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-cyan/30"
            />
          </div>
          {chips}
          {error && <p className="mt-3 text-sm font-medium text-red-200">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-goldDeep px-6 py-3 text-sm font-bold text-navy shadow-md shadow-gold/25 transition-all hover:shadow-lg disabled:opacity-60 sm:w-auto"
          >
            <BellRing className="h-4 w-4" /> {busy ? 'Subscribing…' : 'Notify me about new jobs'}
          </button>
        </form>
      </div>
    </div>
  );
}
