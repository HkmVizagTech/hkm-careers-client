'use client';

import { useEffect, useState } from 'react';
import { getDepartments } from '@/lib/services';
import JobForm from '@/components/admin/JobForm';
import { Spinner } from '@/components/ui/Spinner';
import type { Department } from '@/types';

export default function NewJobPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return <JobForm departments={departments} />;
}
