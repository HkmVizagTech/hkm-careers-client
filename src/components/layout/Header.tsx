'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';
import { Menu, X, ArrowRight, Briefcase, Home, Info, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/jobs', label: 'Careers', icon: Briefcase },
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/track', label: 'Track Application', icon: Search },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();

  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  // Morph into a floating pill after a little scroll. The bar always stays visible.
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  useEffect(() => {
    setScrolled(window.scrollY > 24);
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

  // Close the drawer whenever the route changes; Escape also closes it.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const activeHref = navLinks.find((l) => isActive(l.href))?.href ?? null;
  const pillTarget = hovered ?? activeHref;

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'transition-[padding] duration-500 ease-out',
          scrolled ? 'px-3 pt-2 sm:px-6 sm:pt-3' : 'px-0 pt-0'
        )}
      >
        {/* Bar: full-bleed at the top, floating glass pill once scrolled */}
        <div
          className={cn(
            'relative mx-auto overflow-hidden border transition-all duration-500 ease-out',
            scrolled
              ? 'max-w-5xl rounded-2xl border-white/15 bg-navy/80 shadow-2xl shadow-navy/30 backdrop-blur-2xl sm:rounded-full'
              : 'max-w-[100rem] rounded-none border-transparent bg-gradient-to-r from-navy/95 via-ocean/90 to-navy/95 backdrop-blur-xl'
          )}
        >
          <div
            className={cn(
              'mx-auto flex items-center justify-between gap-3 px-4 transition-all duration-500 ease-out sm:px-6',
              scrolled ? 'h-14 lg:px-5' : 'h-[72px] lg:px-8',
              !scrolled && 'max-w-7xl'
            )}
          >
            {/* Logo */}
            <Link href="/" className="group flex min-w-0 items-center gap-2.5">
              <Image
                src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png"
                alt="Hare Krishna Movement Vizag"
                width={200}
                height={56}
                className={cn(
                  'w-auto rounded-lg bg-white object-contain p-1 shadow-sm transition-all duration-500 group-hover:scale-105',
                  scrolled ? 'h-8 sm:h-9' : 'h-10 sm:h-11'
                )}
                priority
              />
              <div
                className={cn(
                  'hidden overflow-hidden transition-all duration-500 sm:block',
                  scrolled ? 'max-w-0 opacity-0 xl:max-w-[14rem] xl:opacity-100' : 'max-w-[14rem] opacity-100'
                )}
              >
                <p className="whitespace-nowrap text-[13px] font-bold leading-tight tracking-tight text-white">
                  Hare Krishna Movement
                </p>
                <p className="whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-cyan">
                  Visakhapatnam
                </p>
              </div>
            </Link>

            {/* Desktop nav — sliding pill follows hover and rests on the active page */}
            <nav
              className="hidden items-center gap-1 md:flex"
              onMouseLeave={() => setHovered(null)}
            >
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHovered(link.href)}
                    onFocus={() => setHovered(link.href)}
                    onBlur={() => setHovered(null)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                      active || hovered === link.href ? 'text-white' : 'text-white/70'
                    )}
                  >
                    {pillTarget === link.href && (
                      <motion.span
                        layoutId="nav-pill"
                        className={cn(
                          'absolute inset-0 -z-0 rounded-full',
                          active && hovered === null ? 'bg-white/20' : 'bg-white/12'
                        )}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold"
                      />
                    )}
                  </Link>
                );
              })}
              <div className="mx-2 h-6 w-px bg-white/15" />
              <Link
                href="/jobs"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold to-goldDeep px-5 py-2 text-sm font-bold text-navy shadow-lg shadow-gold/25 transition-all duration-200 hover:scale-[1.04] hover:shadow-xl hover:shadow-gold/40 active:scale-[0.97]"
              >
                <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/40 transition-all duration-700 group-hover:left-[150%]" />
                <Briefcase className="relative h-4 w-4" />
                <span className="relative">Apply Now</span>
                <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                  className="flex"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

          {/* Reading-progress line */}
          <motion.div
            aria-hidden="true"
            style={{ scaleX: progress }}
            className={cn(
              'absolute inset-x-0 bottom-0 h-[3px] origin-left bg-gradient-to-r from-cyan via-plum to-gold transition-opacity duration-300',
              scrolled ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
      </div>
    </header>

      {/* Mobile drawer (sibling of the header so its fixed overlay isn't affected by the header's transform) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-navy/70 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-3 mt-[84px] overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl shadow-navy/30 backdrop-blur-2xl"
            >
              <div className="h-1 bg-gradient-to-r from-navy via-ocean to-cyan" />
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map((link, i) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.05, duration: 0.25 }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors',
                          active
                            ? 'bg-gradient-to-r from-navy to-ocean font-semibold text-white shadow-md'
                            : 'text-gray-600 hover:bg-navy/5 hover:text-navy'
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className={cn('h-4 w-4', active ? 'text-cyan' : 'text-gray-400')} />
                        <span className="flex-1">{link.label}</span>
                        <ArrowRight className={cn('h-4 w-4', active ? 'text-cyan' : 'text-gray-300')} />
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.25 }}
                >
                  <Link
                    href="/jobs"
                    className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-goldDeep px-5 py-3.5 text-sm font-bold text-navy shadow-lg shadow-gold/25"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Briefcase className="h-4 w-4" />
                    Apply Now
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
