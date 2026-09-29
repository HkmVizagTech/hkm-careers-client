import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Globe, MapPin, Phone, ArrowUpRight, Navigation } from 'lucide-react';

const footerLinks = {
  explore: [
    { href: '/jobs', label: 'Open Positions' },
    { href: '/about', label: 'About Us' },
    { href: '/track', label: 'Track Application' },
  ],
  connect: [
    { href: 'https://harekrishnavizag.org', label: 'Main Website', external: true },
    { href: 'mailto:careers@harekrishnavizag.org', label: 'Email Us', external: true },
  ],
};

const ADDRESS = {
  line1: 'Hare Krishna Vaikuntham Cultural Centre',
  line2: 'IIM Road, opp. Akshaya Patra Foundation, Gambhiram',
  city: 'Visakhapatnam, Andhra Pradesh 530052',
  phone: '+91 89777 61187',
  phoneHref: 'tel:+918977761187',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Hare+Krishna+Vaikuntham+Cultural+Centre+Gambhiram+Visakhapatnam',
  // Keyless Google Maps embed for the temple location.
  mapEmbed:
    'https://www.google.com/maps?q=Hare+Krishna+Vaikuntham+Cultural+Centre,+Gambhiram,+Visakhapatnam,+Andhra+Pradesh+530052&output=embed',
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-3">
              <Image
                src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png"
                alt="Hare Krishna Movement Vizag"
                width={200}
                height={64}
                className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div>
                <p className="text-sm font-bold tracking-tight text-navy">
                  Hare Krishna Movement
                </p>
                <p className="text-xs font-medium uppercase tracking-widest text-ocean">
                  Visakhapatnam
                </p>
              </div>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-500">
              Hare Krishna Movement Vizag is dedicated to serving humanity through spiritual
              education, food distribution, and community development.
            </p>

            {/* Address card */}
            <div className="mt-6 max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Visit Us
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-navy">{ADDRESS.line1}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
                    {ADDRESS.line2},<br />
                    {ADDRESS.city}
                  </p>
                  <a
                    href={ADDRESS.phoneHref}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ocean transition-colors hover:text-navy"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {ADDRESS.phone}
                  </a>
                  <div className="mt-3">
                    <a
                      href={ADDRESS.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy/5 px-3.5 py-2 text-xs font-semibold text-navy transition-all hover:bg-navy/10"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <a
                href="https://harekrishnavizag.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-ocean/10 hover:text-ocean"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="mailto:careers@harekrishnavizag.org"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-ocean/10 hover:text-ocean"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-navy">Explore</h4>
            <ul className="space-y-3.5">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-ocean"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Map column */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-navy">Find Us</h4>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <iframe
                src={ADDRESS.mapEmbed}
                title="Hare Krishna Movement Vizag location map"
                className="h-56 w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-gray-400">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              Gambhiram, Visakhapatnam — near Akshaya Patra Foundation
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-200/80 pt-7 sm:flex-row">
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Hare Krishna Movement Vizag. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Serving humanity through spiritual wisdom &amp; compassion.
          </p>
        </div>
      </div>
    </footer>
  );
}
