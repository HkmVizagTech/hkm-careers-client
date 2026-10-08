'use client';

import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { downloadResume, viewResume } from '@/lib/services';
import { toast } from '@/lib/toast';

interface Props {
  applicationId: string;
  resumeUrl: string;
  /** "card": two large buttons; "list": stacked full-width buttons for the sidebar */
  variant?: 'card' | 'list';
}

export default function ResumeActions({ applicationId, resumeUrl, variant = 'card' }: Props) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);

  const run = async (kind: 'view' | 'download') => {
    setBusy(kind);
    try {
      if (kind === 'view') await viewResume(applicationId, resumeUrl);
      else await downloadResume(applicationId);
    } catch {
      toast.error(kind === 'view' ? 'Could not open the resume' : 'Could not download the resume');
    } finally {
      setBusy(null);
    }
  };

  const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;

  if (variant === 'list') {
    const cls =
      'flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-ocean/5 hover:border-ocean/30 hover:text-ocean disabled:opacity-60';
    return (
      <>
        <button type="button" onClick={() => run('view')} disabled={!!busy} className={cls}>
          {busy === 'view' ? spinner : <Eye className="h-4 w-4" />} View Resume
        </button>
        <button type="button" onClick={() => run('download')} disabled={!!busy} className={cls}>
          {busy === 'download' ? spinner : <Download className="h-4 w-4" />} Download Resume
        </button>
      </>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={() => run('view')}
        disabled={!!busy}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean to-cyan px-5 py-3 text-sm font-semibold text-white shadow-md shadow-ocean/20 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:hover:scale-100"
      >
        {busy === 'view' ? spinner : <Eye className="h-4 w-4" />} View Resume
      </button>
      <button
        type="button"
        onClick={() => run('download')}
        disabled={!!busy}
        className="inline-flex items-center gap-2 rounded-xl border border-ocean/30 bg-white px-5 py-3 text-sm font-semibold text-ocean transition-all hover:bg-ocean/5 disabled:opacity-60"
      >
        {busy === 'download' ? spinner : <Download className="h-4 w-4" />} Download
      </button>
    </div>
  );
}
