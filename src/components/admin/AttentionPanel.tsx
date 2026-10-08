'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlarmClock, ArrowRight, CalendarClock, Clock, Hourglass, PartyPopper, type LucideIcon } from 'lucide-react';
import { getAttentionSummary } from '@/lib/services';
import { formatDateTime } from '@/lib/utils';
import type { AttentionSummary } from '@/types';

const daysSince = (iso: string) => Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

function Section({
  icon: Icon,
  tone,
  title,
  count,
  href,
  hrefLabel,
  children,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  count: number;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-hairline bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{count}</span>
      </div>
      <ul className="mt-3 flex-1 space-y-2">{children}</ul>
      {href && count > 0 && (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ocean hover:text-navy">
          {hrefLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Item({ href, primary, secondary, urgent }: { href: string; primary: string; secondary: string; urgent?: boolean }) {
  return (
    <li>
      <Link href={href} className="block rounded-xl px-3 py-2 transition-colors hover:bg-ocean/[0.05]">
        <p className="truncate text-sm font-semibold text-gray-800">{primary}</p>
        <p className={`line-clamp-2 text-xs ${urgent ? 'font-semibold text-red-600' : 'text-gray-500'}`}>{secondary}</p>
      </Link>
    </li>
  );
}

const Empty = ({ text }: { text: string }) => <li className="px-3 py-2 text-xs text-gray-400">{text}</li>;

export default function AttentionPanel() {
  const [data, setData] = useState<AttentionSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAttentionSummary().then(setData).catch(() => setFailed(true));
  }, []);

  if (failed) return null;
  if (!data) return <div className="mt-8 h-48 animate-pulse rounded-2xl bg-gray-100" aria-busy="true" />;

  const allClear =
    data.unreviewedCount === 0 && data.interviews.length === 0 && data.closingJobs.length === 0 && data.followUps.length === 0;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8">
      <h2 className="text-lg font-bold text-navy">Needs Attention</h2>
      {allClear ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-emerald-800">
          <PartyPopper className="h-5 w-5 shrink-0" />
          Nothing pending: no overdue reviews, interviews this week, closing jobs or due follow-ups.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Section
            icon={Hourglass}
            tone="bg-amber-100 text-amber-700"
            title={`Waiting > ${data.unreviewedDays} days`}
            count={data.unreviewedCount}
            href="/admin/applications?status=received"
            hrefLabel="Review all"
          >
            {data.unreviewed.length === 0 ? (
              <Empty text="All new applications are being reviewed." />
            ) : (
              data.unreviewed.map((a) => (
                <Item
                  key={a._id}
                  href={`/admin/applications/${a._id}`}
                  primary={a.name}
                  secondary={`${a.job?.title ?? '—'} · ${daysSince(a.createdAt)} days`}
                  urgent={daysSince(a.createdAt) >= data.unreviewedDays * 2}
                />
              ))
            )}
          </Section>

          <Section icon={CalendarClock} tone="bg-plum/10 text-plum" title="Interviews (7 days)" count={data.interviews.length}>
            {data.interviews.length === 0 ? (
              <Empty text="No interviews scheduled this week." />
            ) : (
              data.interviews.map((a) => (
                <Item
                  key={a._id}
                  href={`/admin/applications/${a._id}`}
                  primary={a.name}
                  secondary={`${formatDateTime(a.interview.scheduledAt)}${a.job?.title ? ` · ${a.job.title}` : ''}`}
                />
              ))
            )}
          </Section>

          <Section icon={Clock} tone="bg-orange-100 text-orange-700" title="Jobs closing soon" count={data.closingJobs.length} href="/admin/jobs" hrefLabel="Manage jobs">
            {data.closingJobs.length === 0 ? (
              <Empty text="No deadlines in the next 7 days." />
            ) : (
              data.closingJobs.map((j) => {
                const d = daysUntil(j.deadline);
                return (
                  <Item
                    key={j._id}
                    href="/admin/jobs"
                    primary={j.title}
                    secondary={`${d <= 0 ? 'Closes today' : d === 1 ? 'Closes tomorrow' : `Closes in ${d} days`} · ${j.applicationCount} applied`}
                    urgent={d <= 1}
                  />
                );
              })
            )}
          </Section>

          <Section icon={AlarmClock} tone="bg-teal/10 text-teal" title="Follow-ups due" count={data.followUps.length}>
            {data.followUps.length === 0 ? (
              <Empty text="No follow-ups due today." />
            ) : (
              data.followUps.map((f) => (
                <Item
                  key={f._id}
                  href={`/admin/applications/${f.applicationId}`}
                  primary={`${f.name}: ${f.note}`}
                  secondary={`${f.overdue ? 'Overdue · ' : ''}${formatDateTime(f.dueAt)}`}
                  urgent={f.overdue}
                />
              ))
            )}
          </Section>
        </div>
      )}
    </motion.section>
  );
}
