'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Careers' },
  { href: '/about', label: 'About Us' },
  { href: '/track', label: 'Track Application' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Frosted navy-glass bar — HKMV-style */}
      <div
        className={cn(
          'transition-all duration-300',
          scrolled
            ? 'bg-navy/95 shadow-2xl shadow-navy/25 backdrop-blur-2xl'
            : 'bg-gradient-to-r from-navy/95 via-ocean/90 to-navy/95 backdrop-blur-xl'
        )}
      >
        <div
          className={cn(
            'mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-all duration-300 sm:px-6 lg:px-8',
            scrolled ? 'h-16' : 'h-[72px]'
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png"
              alt="Hare Krishna Movement Vizag"
              width={200}
              height={56}
              className="h-10 w-auto rounded-lg bg-white object-contain p-1 shadow-sm transition-transform group-hover:scale-105 sm:h-11"
              priority
            />
            <div className="hidden sm:block">
              <p className="text-[13px] font-bold leading-tight tracking-tight text-white">
                Hare Krishna Movement
              </p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-cyan">
                Visakhapatnam
              </p>
            </div>
          </Link>

          {/* Desktop nav — pill highlight */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-white/15 font-semibold text-white shadow-inner'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mx-2 h-6 w-px bg-white/15" />
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-goldDeep px-5 py-2.5 text-sm font-bold text-navy shadow-lg shadow-gold/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-gold/35 active:scale-[0.98]"
            >
              <Briefcase className="h-4 w-4" />
              Apply Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[64px] z-40 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="animate-slide-down relative mx-3 mt-2 overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl shadow-navy/30 backdrop-blur-2xl">
            <div className="h-1 bg-gradient-to-r from-navy via-ocean to-cyan" />
            <nav className="flex flex-col gap-1 p-3">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-gradient-to-r from-navy to-ocean font-semibold text-white shadow-md'
                        : 'text-gray-600 hover:bg-navy/5 hover:text-navy'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                    <ArrowRight
                      className={cn('h-4 w-4', active ? 'text-cyan' : 'text-gray-300')}
                    />
                  </Link>
                );
              })}
              <Link
                href="/jobs"
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-goldDeep px-5 py-3.5 text-sm font-bold text-navy shadow-lg shadow-gold/25"
                onClick={() => setMobileOpen(false)}
              >
                <Briefcase className="h-4 w-4" />
                Apply Now
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
