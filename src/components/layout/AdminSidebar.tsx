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
    <div className="flex h-full flex-col bg-gradient-to-b from-navy via-navy to-[#0a2d6e]">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src="/brand/hkm-logo-white.png" alt="HKM Vizag" className="h-10 w-auto object-contain" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-cyan">Careers Admin</span>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="mx-4 border-t border-white/15" />

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                active
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-active-bar"
                  className="absolute inset-y-2 left-0 w-1 rounded-full bg-gradient-to-b from-cyan to-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-cyan' : 'text-white/60 group-hover:text-white')} />
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
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
              className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden"
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
