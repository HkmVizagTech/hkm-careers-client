import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-navy/10">
        <span className="text-4xl font-bold text-navy">404</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-navy">Page Not Found</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          Go Home
        </Link>
        <Link
          href="/jobs"
          className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Jobs
        </Link>
      </div>
    </div>
  );
}
