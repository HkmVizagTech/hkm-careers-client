'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Toaster } from '@/components/ui/Toaster';

const pageTitles: [string, string][] = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/jobs', 'Jobs'],
  ['/admin/applications', 'Applications'],
  ['/admin/departments', 'Departments'],
  ['/admin/settings', 'Settings & Team'],
];

const publicAdminRoutes = ['/admin/login'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = publicAdminRoutes.includes(pathname);
  const title = pageTitles.find(([p]) => pathname === p || pathname.startsWith(p + '/'))?.[1] ?? 'Admin';

  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicRoute) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router, isPublicRoute]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  if (!isAuthenticated && isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader title={title} onMenuToggle={() => setSidebarOpen(true)} />
        <main id="admin-main" className="flex-1 overflow-y-auto bg-surfaceAlt/50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
