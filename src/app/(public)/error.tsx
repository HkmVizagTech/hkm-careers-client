'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <span className="text-2xl font-bold text-red-600">!</span>
        </div>
        <h1 className="mt-4 text-xl font-bold text-navy">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean">
          Try Again
        </button>
      </div>
    </div>
  );
}
