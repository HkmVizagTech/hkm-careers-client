'use client';

import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/admin/NotificationBell';

interface AdminHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export default function AdminHeader({ title, onMenuToggle }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-white/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-lg font-bold tracking-tight text-navy sm:text-xl">{title}</p>
        </div>

        {/* Right: user info + logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBell />
          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-ocean text-sm font-semibold text-white shadow-md shadow-navy/20"
              >
                {user.name?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
