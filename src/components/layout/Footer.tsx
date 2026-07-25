import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Mail, Globe, ArrowUpRight } from 'lucide-react';

const footerLinks = {
  explore: [
    { href: '/jobs', label: 'Open Positions' },
    { href: '/about', label: 'About Us' },
  ],
  connect: [
    { href: 'https://harekrishnavizag.org', label: 'Main Website', external: true },
    { href: 'mailto:careers@harekrishnavizag.org', label: 'Email Us', external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png"
                alt="Hare Krishna Movement Vizag"
                width={200}
                height={64}
                className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div>
                <p className="text-sm font-bold text-navy tracking-tight">
                  Hare Krishna Movement
                </p>
                <p className="text-xs font-medium text-ocean uppercase tracking-widest">
                  Visakhapatnam
                </p>
              </div>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-500">
              Hare Krishna Movement Vizag is dedicated to serving humanity through spiritual
              education, food distribution, and community development.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://harekrishnavizag.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all duration-300 hover:bg-ocean/10 hover:text-ocean hover:scale-110"
              >
                <Globe className="h-4.5 w-4.5" />
              </a>
              <a
                href="mailto:careers@harekrishnavizag.org"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all duration-300 hover:bg-ocean/10 hover:text-ocean hover:scale-110"
              >
                <Mail className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold text-navy uppercase tracking-wider">Explore</h4>
            <ul className="space-y-3.5">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-ocean"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold text-navy uppercase tracking-wider">Connect</h4>
            <ul className="space-y-3.5">
              {footerLinks.connect.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-ocean"
                  >
                    {link.label}
                    {link.external && (
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200/80 pt-7 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Hare Krishna Movement Vizag. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> for the mission
          </p>
        </div>
      </div>
    </footer>
  );
}
