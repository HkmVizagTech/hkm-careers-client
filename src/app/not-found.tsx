import Link from 'next/link';
import { Home, Briefcase } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-canvas flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="bg-gradient-to-br from-navy via-ocean to-cyan bg-clip-text text-8xl font-black tracking-tight text-transparent sm:text-9xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-navy">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-ocean hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-6 py-3 text-sm font-semibold text-navy shadow-sm transition-all hover:border-ocean/40 hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
        >
          <Briefcase className="h-4 w-4" /> View jobs
        </Link>
      </div>
    </div>
  );
}
