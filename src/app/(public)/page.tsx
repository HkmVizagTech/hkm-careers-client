'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import {
  Search,
  MapPin,
  Briefcase,
  ArrowRight,
  Users,
  Heart,
  BookOpen,
  Utensils,
  ChevronRight,
  Sparkles,
  Globe,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { getPublicJobs, getDepartments } from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { Job, Department } from '@/types';

const typeLabels: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  volunteer: 'Volunteer',
  intern: 'Internship',
};

const highlights = [
  { icon: Heart, title: 'Food Distribution', desc: '10,000+ meals served daily through our Annaprasadam program across Visakhapatnam', color: 'from-red-400 to-pink-500' },
  { icon: BookOpen, title: 'Spiritual Education', desc: 'Vedic wisdom and modern education reaching thousands of students and families', color: 'from-blue-400 to-indigo-500' },
  { icon: Users, title: 'Community Service', desc: 'Building compassionate communities through outreach and social welfare programs', color: 'from-emerald-400 to-teal-500' },
  { icon: Utensils, title: 'Temple Activities', desc: 'Daily worship, festivals, and spiritual gatherings that uplift the soul', color: 'from-amber-400 to-orange-500' },
];

const steps = [
  { num: '01', title: 'Browse Openings', desc: 'Explore roles across our departments and find what resonates with you' },
  { num: '02', title: 'Apply Online', desc: 'Submit your application with resume and cover letter in minutes' },
  { num: '03', title: 'Get Reviewed', desc: 'Our HR team reviews every application with care and attention' },
  { num: '04', title: 'Join the Mission', desc: 'Welcome aboard — start making a real difference from day one' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, depts] = await Promise.all([
          getPublicJobs({ limit: 6 }),
          getDepartments({ active: true }),
        ]);
        setFeaturedJobs(jobsRes.jobs);
        setDepartments(depts);
      } catch { /* */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/jobs?search=${encodeURIComponent(searchQuery)}`);
  };

  const departmentName = (dept: Job['department']): string => {
    if (typeof dept === 'object' && dept !== null && 'name' in dept) return dept.name;
    return '';
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-navy via-[#0a2d6e] to-[#0c3d8f]">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gold/10 animate-float-delayed" />
          <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-ocean/20 animate-float-slow" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-cyan backdrop-blur-sm border border-white/10">
                <Sparkles className="h-3.5 w-3.5" />
                We&apos;re hiring across multiple departments
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Build a Career{' '}
                <br className="hidden sm:block" />
                That <span className="text-gradient">Matters</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                Join Hare Krishna Movement Vizag and dedicate your skills to
                serving humanity through spiritual education, food distribution,
                and community development.
              </p>

              <form onSubmit={handleSearch} className="mt-8">
                <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search positions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-sm text-gray-900 shadow-2xl shadow-black/10 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-gold to-goldDeep px-8 py-4 text-sm font-bold text-navy shadow-lg shadow-gold/25 transition-all hover:shadow-xl hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/jobs"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 border border-white/10"
                >
                  View All Openings
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
                >
                  Learn About Us
                </Link>
              </div>
            </motion.div>

            {/* Right: Stats cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:grid grid-cols-2 gap-4"
            >
              {[
                { label: 'Open Positions', value: featuredJobs.length || 1, suffix: '+', icon: Briefcase, gradient: 'from-cyan to-ocean' },
                { label: 'Team Members', value: 200, suffix: '+', icon: Users, gradient: 'from-gold to-goldDeep' },
                { label: 'Meals Daily', value: 10000, suffix: '+', icon: Utensils, gradient: 'from-emerald-400 to-teal-500' },
                { label: 'Years Serving', value: 25, suffix: '+', icon: Globe, gradient: 'from-purple-400 to-indigo-500' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="glass-dark rounded-3xl p-6 transition-all hover:bg-white/[0.12]"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} mb-3`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-sm text-white/50">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="#f5f7fa"/>
          </svg>
        </div>
      </section>

      {/* Department Pills */}
      {departments.length > 0 && (
        <section className="relative -mt-1 bg-background py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-3">
              {departments.map((dept) => (
                <Link
                  key={dept._id}
                  href={`/jobs?department=${dept._id}`}
                  className="group inline-flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-navy shadow-sm transition-all hover:border-ocean hover:shadow-md hover:shadow-ocean/5 hover:-translate-y-0.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean/10 text-ocean transition-colors group-hover:bg-ocean group-hover:text-white">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  {dept.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Openings */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-sm font-semibold text-ocean">Open Positions</span>
              <h2 className="mt-1 text-3xl font-bold text-navy sm:text-4xl">
                Featured Openings
              </h2>
              <p className="mt-2 text-gray-500">
                Join a team making a real difference
              </p>
            </div>
            <Link
              href="/jobs"
              className="hidden items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-navy transition-all hover:shadow-md hover:border-ocean sm:inline-flex"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-white py-16 text-center">
              <Briefcase className="mx-auto h-14 w-14 text-gray-200" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                No open positions at the moment
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Check back soon — new roles are posted regularly
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job, i) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/jobs/${job.slug}`}>
                    <div className="group gradient-border h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-navy/5 hover:-translate-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-ocean text-white">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <Badge variant={job.type}>{typeLabels[job.type]}</Badge>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-navy transition-colors group-hover:text-ocean">
                        {job.title}
                      </h3>
                      <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-ocean/60" />
                          {departmentName(job.department)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-ocean/60" />
                          {job.location}
                        </span>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                        {job.salaryRange && (
                          <span className="text-sm font-semibold text-navy">
                            {job.salaryRange.startsWith('₹') ? job.salaryRange : `₹${job.salaryRange}`}
                          </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-ocean transition-all group-hover:gap-2">
                          Apply
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-6 py-3 text-sm font-medium text-white"
            >
              View all openings
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold text-ocean">Process</span>
            <h2 className="mt-1 text-3xl font-bold text-navy sm:text-4xl">
              How to Get Started
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">
              A simple, transparent process from application to onboarding
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-2xl border border-gray-200 bg-background p-6"
              >
                <span className="text-5xl font-black text-navy/[0.06]">
                  {step.num}
                </span>
                <h3 className="mt-2 text-lg font-bold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 text-gray-300 lg:block">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Life at HKM */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold text-ocean">Why Us</span>
            <h2 className="mt-1 text-3xl font-bold text-navy sm:text-4xl">
              Life at HKM Vizag
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">
              More than a workplace — a chance to be part of something meaningful
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:shadow-navy/5 hover:-translate-y-1"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0a2d6e] to-ocean p-8 sm:p-12 lg:p-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan/10" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gold/10" />
            <div className="relative">
              <Award className="h-10 w-10 text-gold" />
              <blockquote className="mt-6 max-w-2xl text-xl font-medium text-white/90 sm:text-2xl leading-relaxed">
                &ldquo;Working at HKM has been the most fulfilling experience of
                my career. Every day, I see the direct impact of our work on
                thousands of lives. This is not just a job — it&apos;s a calling.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold to-goldDeep text-sm font-bold text-navy">
                  RD
                </div>
                <div>
                  <p className="font-semibold text-white">Radha Devi Dasi</p>
                  <p className="text-sm text-white/50">Program Coordinator, 5+ years</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Join a team that works every day to spread joy, knowledge, and
              compassion across Visakhapatnam and beyond.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/jobs"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-navy to-ocean px-8 py-4 text-sm font-bold text-white shadow-lg shadow-navy/20 transition-all hover:shadow-xl hover:shadow-navy/30 hover:scale-[1.02]"
              >
                Explore Careers
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-navy/20 px-8 py-4 text-sm font-bold text-navy transition-all hover:border-navy hover:bg-navy/5"
              >
                Learn About Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
