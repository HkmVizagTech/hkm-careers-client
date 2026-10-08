'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, FileText, Link2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';

/** Each platform gets its own link (?src=...) so admin can see where applicants came from. */
const PLATFORMS: { src: string; label: string; tone: string }[] = [
  { src: 'linkedin', label: 'LinkedIn', tone: 'bg-[#0a66c2]/10 text-[#0a66c2]' },
  { src: 'indeed', label: 'Indeed', tone: 'bg-[#2557a7]/10 text-[#2557a7]' },
  { src: 'naukri', label: 'Naukri', tone: 'bg-[#4a90e2]/10 text-[#275df5]' },
  { src: 'whatsapp', label: 'WhatsApp', tone: 'bg-emerald-100 text-emerald-700' },
  { src: 'instagram', label: 'Instagram', tone: 'bg-pink-100 text-pink-700' },
  { src: 'facebook', label: 'Facebook', tone: 'bg-blue-100 text-blue-700' },
  { src: 'referral', label: 'Referral / other', tone: 'bg-gray-100 text-gray-700' },
];

const TYPE_LABEL: Record<Job['type'], string> = {
  'full-time': 'Full time',
  'part-time': 'Part time',
  volunteer: 'Volunteer',
  intern: 'Internship',
};

const points = (text?: string) => (text || '').split('\n').map((l) => l.trim()).filter(Boolean);

function siteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://careers.harekrishnavizag.org';
}

/** Plain-text JD that pastes cleanly into LinkedIn, Indeed and Naukri description boxes. */
function jobDescriptionText(job: Job, link: string) {
  const section = (title: string, text?: string) => {
    const items = points(text);
    return items.length ? `\n${title}\n${items.map((i) => `• ${i}`).join('\n')}\n` : '';
  };
  const meta = [
    `📍 ${job.location}`,
    `💼 ${TYPE_LABEL[job.type] || job.type}`,
    job.experience ? `🎓 Experience: ${job.experience}` : '',
    job.salaryRange ? `💰 ${job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}` : '',
    job.deadline ? `🗓 Apply by ${formatDate(job.deadline)}` : '',
  ].filter(Boolean);
  return [
    `${job.title} – Hare Krishna Movement, Visakhapatnam`,
    '',
    meta.join('\n'),
    section('About the role', job.description),
    section('Responsibilities', job.responsibilities),
    section('Qualifications', job.qualifications),
    job.targetGender && job.targetGender !== 'any' ? `\nThis position is open to ${job.targetGender} applicants only.\n` : '',
    `\nApply here: ${link}`,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure contexts.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export default function ShareJobModal({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const base = job ? `${siteOrigin()}/jobs/${job.slug}` : '';
  const linkFor = (src: string) => `${base}?src=${src}`;
  const jd = useMemo(() => (job ? jobDescriptionText(job, `${base}?src=linkedin`) : ''), [job, base]);
  const [jdFor, setJdFor] = useState('linkedin');

  const doCopy = async (key: string, text: string, what: string) => {
    if (await copy(text)) {
      setCopied(key);
      toast.success(`${what} copied`);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } else toast.error('Could not copy. Please select and copy manually.');
  };

  const notOpen = job && job.status !== 'active';

  return (
    <Modal isOpen={!!job} onClose={onClose} title="Share this job" size="lg">
      {job && (
        <div className="space-y-5">
          {notOpen && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              This job is <strong>{job.status}</strong>, so people opening the link can&apos;t apply yet. Publish it as Active first.
            </p>
          )}

          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
              <Link2 className="h-4 w-4 text-ocean" /> Apply links
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Use the matching link on each platform. Applications record where they came from, shown on the application and in the CSV export.
            </p>
            <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-hairline">
              {PLATFORMS.map((p) => {
                const link = linkFor(p.src);
                return (
                  <li key={p.src} className="flex items-center gap-3 px-3 py-2.5">
                    <span className={`w-24 shrink-0 rounded-md px-2 py-1 text-center text-[11px] font-bold sm:w-28 ${p.tone}`}>{p.label}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-500" title={link}>
                      {link}
                    </span>
                    <button
                      type="button"
                      onClick={() => doCopy(`link-${p.src}`, link, `${p.label} link`)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-navy/5 px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/10"
                      aria-label={`Copy ${p.label} link`}
                    >
                      {copied === `link-${p.src}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                <FileText className="h-4 w-4 text-ocean" /> Full job description
              </h3>
              <select
                value={jdFor}
                onChange={(e) => setJdFor(e.target.value)}
                aria-label="Platform for the apply link inside the description"
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.src} value={p.src}>
                    Link for {p.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">Paste into the description box when creating the job on LinkedIn, Indeed or Naukri.</p>
            <textarea
              readOnly
              value={jd.replace(/\?src=linkedin$/, `?src=${jdFor}`)}
              rows={10}
              className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-700"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => doCopy('jd', jd.replace(/\?src=linkedin$/, `?src=${jdFor}`), 'Job description')}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy/20 hover:shadow-lg"
            >
              {copied === 'jd' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy description
            </button>
          </section>

          <p className="rounded-xl bg-ocean/5 p-3 text-xs leading-relaxed text-gray-600">
            Open jobs are also listed on <strong>Google Jobs</strong> automatically (search “jobs near Visakhapatnam”). It can take a few days for Google to pick up a new job.
          </p>
        </div>
      )}
    </Modal>
  );
}
