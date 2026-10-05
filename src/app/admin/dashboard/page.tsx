'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Users,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { Application } from '@/types';

interface Stats {
  openPositions: number;
  totalApplications: number;
  pendingReviews: number;
  recentApplications: (Application & { job: { title: string } | string })[];
  recentCount: number;
}

const statusLabels: Record<string, string> = {
  received: 'Received',
  'under-review': 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  selected: 'Selected',
  rejected: 'Rejected',
};

const statCards = [
  { label: 'Open Positions', key: 'openPositions' as const, icon: Briefcase, gradient: 'from-navy to-ocean', shadowColor: 'shadow-navy/20' },
  { label: 'Total Applications', key: 'totalApplications' as const, icon: FileText, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/20' },
  { label: 'Pending Reviews', key: 'pendingReviews' as const, icon: Clock, gradient: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/20' },
  { label: 'Recent (30d)', key: 'recentCount' as const, icon: TrendingUp, gradient: 'from-cyan to-blue-500', shadowColor: 'shadow-cyan/20' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats({ ...data, recentCount: data.recentApplications?.length || 0 });
      } catch {
        try {
          const [jobsRes, appsRes] = await Promise.all([
            api.get('/jobs', { params: { status: 'active', limit: 100 } }),
            api.get('/applications', { params: { limit: 10 } }),
          ]);
          setStats({
            openPositions: jobsRes.data.jobs?.length || 0,
            totalApplications: appsRes.data.pagination?.total || 0,
            pendingReviews: 0,
            recentApplications: appsRes.data.applications || [],
            recentCount: appsRes.data.applications?.length || 0,
          });
        } catch { /* */ }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="mt-8 h-72" />
    </div>
  );

  const displayStats = stats ? {
    openPositions: stats.openPositions,
    totalApplications: stats.totalApplications,
    pendingReviews: stats.pendingReviews,
    recentCount: stats.recentApplications?.length || 0,
  } : { openPositions: 0, totalApplications: 0, pendingReviews: 0, recentCount: 0 };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your careers portal</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className={`rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg ${card.shadowColor} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{card.label}</p>
                    <p className="mt-1 text-3xl font-bold">
                      {displayStats[card.key] ?? 0}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Applications */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Recent Applications</h2>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1 text-sm font-medium text-ocean hover:text-navy transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {(!stats?.recentApplications || stats.recentApplications.length === 0) ? (
          <div className="mt-4 rounded-2xl border border-hairline bg-white shadow-soft">
            <EmptyState icon={FileText} title="No applications yet" description="Applications will appear here once candidates start applying." />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surfaceAlt/70">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Candidate</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Job</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentApplications.map((app) => (
                    <tr key={app._id} className="transition-colors hover:bg-ocean/[0.04]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-ocean text-xs font-bold text-white">
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{app.name}</p>
                            <p className="text-xs text-gray-500">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {typeof app.job === 'object' && app.job !== null ? app.job.title : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={app.status as 'received'}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(app.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
