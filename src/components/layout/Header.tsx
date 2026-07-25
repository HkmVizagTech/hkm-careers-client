'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Careers' },
  { href: '/about', label: 'About Us' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-navy/10 bg-white/90 shadow-lg shadow-navy/[0.04] backdrop-blur-2xl'
          : 'border-b border-transparent bg-white/70 backdrop-blur-xl'
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - larger */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png"
            alt="Hare Krishna Movement Vizag"
            width={200}
            height={56}
            className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-[13px] font-bold leading-tight text-navy tracking-tight">
              Hare Krishna Movement
            </p>
            <p className="text-[11px] font-medium text-ocean tracking-wide uppercase">
              Visakhapatnam
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'text-navy bg-navy/5 font-semibold'
                    : 'text-gray-500 hover:text-navy hover:bg-gray-100/70'
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-ocean to-cyan" />
                )}
              </Link>
            );
          })}
          <div className="ml-3 h-6 w-px bg-gray-200" />
          <Link
            href="/jobs"
            className="ml-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy via-ocean to-ocean px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean/20 transition-all duration-300 hover:shadow-xl hover:shadow-ocean/30 hover:scale-[1.03] active:scale-[0.98]"
          >
            Apply Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-navy/5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-xl px-4 py-3.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-navy/5 text-navy font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/jobs"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-5 py-3.5 text-center text-sm font-semibold text-white shadow-md"
              onClick={() => setMobileOpen(false)}
            >
              Apply Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
