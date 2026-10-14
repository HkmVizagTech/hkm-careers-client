'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, BellRing, Loader2, Settings2 } from 'lucide-react';
import { confirmJobAlerts } from '@/lib/services';

export default function ConfirmAlertsPage() {
  return (
    <Suspense fallback={<Centered><Loader2 className="mx-auto h-8 w-8 animate-spin text-ocean" /></Centered>}>
      <Confirm />
    </Suspense>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 pb-20 pt-[128px] text-center sm:pb-24 sm:pt-[152px]">{children}</div>;
}

function Confirm() {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [result, setResult] = useState<{ email: string; departments: string[]; manageToken: string } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState('error');
      return;
    }
    confirmJobAlerts(token)
      .then((r) => {
        setResult(r);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [token]);

  if (state === 'loading') {
    return (
      <Centered>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-ocean" />
        <p className="mt-4 text-sm text-gray-500">Confirming your subscription…</p>
      </Centered>
    );
  }

  if (state === 'error' || !result) {
    return (
      <Centered>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy">This link isn’t working</h1>
        <p className="mt-2 text-sm text-gray-600">It may be old or already used to unsubscribe. You can sign up again from the jobs page.</p>
        <Link href="/jobs" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-ocean">
          Browse open jobs <ArrowRight className="h-4 w-4" />
        </Link>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
        <BellRing className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-navy sm:text-3xl">You’re subscribed!</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        We&apos;ll email <span className="font-semibold text-gray-900">{result.email}</span> when a new opening is posted
        {result.departments.length ? (
          <>
            {' '}in <span className="font-semibold text-gray-900">{result.departments.join(', ')}</span>
          </>
        ) : (
          ' in any team'
        )}
        .
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-ocean">
          Browse open jobs <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/alerts/manage?token=${encodeURIComponent(result.manageToken)}`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-gray-50"
        >
          <Settings2 className="h-4 w-4" /> Change teams
        </Link>
      </div>
    </Centered>
  );
}
