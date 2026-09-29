'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getAdminJob, getDepartments } from '@/lib/services';
import JobForm from '@/components/admin/JobForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Job, Department } from '@/types';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [jobData, depts] = await Promise.all([getAdminJob(id), getDepartments()]);
        setJob(jobData);
        setDepartments(depts);
      } catch {
        setError('Job not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">{error || 'Job not found'}</h2>
        <p className="mt-1 text-sm text-gray-500">This job may have been deleted.</p>
        <Button variant="secondary" className="mt-5" onClick={() => router.push('/admin/jobs')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-navy lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <JobForm departments={departments} job={job} />
    </div>
  );
}
