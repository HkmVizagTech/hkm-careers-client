'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-canvas flex min-h-[70vh] items-center justify-center px-4 pt-24">
      <div className="max-w-md rounded-3xl border border-hairline bg-white p-8 text-center shadow-lift">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-8 ring-red-50/60">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-navy">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We hit an unexpected problem loading this page. Please try again — if it keeps happening, come back in a few minutes.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-ocean hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  );
}
