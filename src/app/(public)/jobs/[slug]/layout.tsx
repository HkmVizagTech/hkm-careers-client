import type { Metadata } from 'next';
import type { Job } from '@/types';
import { blocksToHtml, jobSummary, jobTextBlocks } from '@/lib/jobText';

/**
 * Server-side wrapper for a job page (and its /apply form):
 *  - page title + description + preview card when the link is shared on LinkedIn/WhatsApp
 *  - Google "JobPosting" structured data, so open jobs appear in Google's job search for free
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://careers.harekrishnavizag.org').replace(/\/+$/, '');
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const ORG_NAME = 'Hare Krishna Movement Visakhapatnam';

async function fetchJob(slug: string): Promise<Job | null> {
  try {
    const res = await fetch(`${API_URL}/jobs/public/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as Job;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const job = await fetchJob(params.slug);
  if (!job) return { title: 'Job not found | HKM Vizag Careers' };
  const description = jobSummary(job) || `Apply for ${job.title} at ${ORG_NAME}.`;
  const url = `${SITE_URL}/jobs/${job.slug}`;
  const title = `${job.title} | HKM Vizag Careers`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'HKM Vizag Careers', type: 'website' },
    twitter: { card: 'summary', title, description },
    // Closed jobs stay viewable but should drop out of search.
    robots: job.status === 'active' ? undefined : { index: false },
  };
}

const EMPLOYMENT_TYPE: Record<Job['type'], string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  volunteer: 'VOLUNTEER',
  intern: 'INTERN',
};

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

function jobPostingJsonLd(job: Job) {
  const section = (title: string, text?: string) => {
    const html = blocksToHtml(jobTextBlocks(text, job.descriptionFormat));
    return html ? `<p><strong>${title}</strong></p>${html}` : '';
  };
  const tags = job.qualificationTags?.length
    ? `<ul>${job.qualificationTags.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
    : '';
  const description =
    section('About the role', job.description) +
    section('Responsibilities', job.responsibilities) +
    (tags || job.qualifications ? `<p><strong>Qualifications</strong></p>${tags}${blocksToHtml(jobTextBlocks(job.qualifications, job.descriptionFormat))}` : '') +
    (job.experience ? `<p><strong>Experience:</strong> ${escapeHtml(job.experience)}</p>` : '');

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description,
    identifier: { '@type': 'PropertyValue', name: ORG_NAME, value: job._id },
    datePosted: job.createdAt,
    employmentType: EMPLOYMENT_TYPE[job.type],
    hiringOrganization: {
      '@type': 'Organization',
      name: ORG_NAME,
      sameAs: 'https://harekrishnavizag.org',
      logo: `${SITE_URL}/icon.png`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Visakhapatnam',
        addressRegion: 'Andhra Pradesh',
        addressCountry: 'IN',
      },
    },
    directApply: true,
    url: `${SITE_URL}/jobs/${job.slug}`,
  };
  if (job.deadline) data.validThrough = job.deadline;
  if (typeof job.department === 'object' && job.department?.name) data.industry = job.department.name;
  return data;
}

export default async function JobLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const job = await fetchJob(params.slug);
  // Only open jobs are advertised to Google.
  const open = !!job && job.status === 'active' && (!job.deadline || new Date(job.deadline) > new Date());
  const jsonLd = open && job ? jobPostingJsonLd(job) : null;
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // `<` is escaped so job text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}
