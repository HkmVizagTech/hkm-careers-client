'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Building2,
  Settings,
  ExternalLink,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/admin/settings', label: 'Settings & Team', icon: Settings },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#052057' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <img src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png" alt="HKM Admin" className="h-9 w-auto brightness-0 invert" />
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="mx-4 border-t border-white/15" />

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'border-l-[3px] border-[#2bcdee] bg-[#0f618a] text-white'
                  : 'border-l-[3px] border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-white/60 group-hover:text-white')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="px-3 pb-6">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          Back to Site
        </Link>
      </div>
    </div>
  );
}

export default function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 lg:block">
        <div className="fixed left-0 top-0 h-screen w-64">
          <SidebarContent pathname={pathname} />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onToggle}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed left-0 top-0 z-50 h-screen w-64 shadow-2xl lg:hidden"
            >
              <SidebarContent pathname={pathname} onNavigate={onToggle} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
