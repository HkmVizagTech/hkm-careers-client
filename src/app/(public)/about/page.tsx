import {
  Heart,
  BookOpen,
  Users,
  Utensils,
  Globe,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

const values = [
  { icon: Heart, title: 'Compassion', desc: 'We believe in serving all living beings with love and care, regardless of background.', color: 'from-red-400 to-pink-500' },
  { icon: BookOpen, title: 'Knowledge', desc: 'Spreading Vedic wisdom and modern education to uplift individuals and communities.', color: 'from-blue-400 to-indigo-500' },
  { icon: Users, title: 'Community', desc: 'Building a strong, supportive community that works together for a higher purpose.', color: 'from-emerald-400 to-teal-500' },
  { icon: Utensils, title: 'Service', desc: 'Selfless service (Seva) is at the heart of everything we do at HKM.', color: 'from-amber-400 to-orange-500' },
];

const testimonials = [
  { name: 'Radha Devi Dasi', role: 'Program Coordinator, 5+ years', quote: 'Working at HKM has been the most fulfilling experience of my career. Every day I get to see the impact of our programs on peoples lives.', initials: 'RD' },
  { name: 'Krishna Das', role: 'IT Volunteer, 3+ years', quote: 'The environment here is unlike any workplace. The dedication of everyone to the mission is truly inspiring.', initials: 'KD' },
  { name: 'Lakshmi Priya', role: 'Education Department, 4+ years', quote: 'I started as a volunteer and grew into a leadership role. HKM invests in its people as much as it invests in the community.', initials: 'LP' },
];

const stats = [
  { label: 'Meals Served Daily', value: '10,000+' },
  { label: 'Students Educated', value: '5,000+' },
  { label: 'Years of Service', value: '25+' },
  { label: 'Team Members', value: '200+' },
];

const benefits = [
  'Meaningful work with real community impact',
  'Spiritual growth opportunities',
  'Supportive and inclusive work environment',
  'Health and wellness programs',
  'Continuous learning and development',
  'Work-life balance',
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean py-16 pt-[104px] sm:py-24 sm:pt-[120px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan/10 animate-float" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gold/10 animate-float-delayed" />
        </div>
        <Reveal y={16} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-cyan backdrop-blur-sm border border-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            Our Story
          </div>
          <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            About HKM Vizag
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
            Hare Krishna Movement Visakhapatnam has been serving the community since 1998 through
            spiritual education, food distribution, and social welfare programs.
          </p>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="page-canvas relative -mt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" stagger={0.07}>
            {stats.map((stat) => (
              <RevealItem key={stat.label} className="rounded-2xl border border-hairline bg-white p-4 text-center shadow-lift sm:p-6">
                <p className="text-2xl font-bold text-gradient sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">{stat.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Mission + Values */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <span className="eyebrow">Our Mission</span>
              <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
                Creating a Society Based on Spiritual Values
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed">
                To create a society based on spiritual values, where every individual has access
                to education, food, and the opportunity to develop their divine consciousness.
                We work tirelessly to relieve hunger, promote education, and build a compassionate community.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Our programs include daily food distribution (Annaprasadam), Vedic education centers,
                youth empowerment programs, rural development initiatives, and environmental conservation efforts.
              </p>
              <a href="https://harekrishnavizag.org" target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy/5 px-5 py-2.5 text-sm font-semibold text-navy transition-all hover:bg-navy/10">
                <Globe className="h-4 w-4" /> Visit our main website <ArrowRight className="h-4 w-4" />
              </a>
            </Reveal>
            <RevealGroup className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2">
              {values.map((v) => (
                <RevealItem key={v.title} className="rounded-2xl border border-hairline bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${v.color} text-white shadow-md`}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-navy">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="page-canvas py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col items-center text-center">
            <span className="eyebrow">Benefits</span>
            <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">Why Join Us</h2>
          </Reveal>
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {benefits.map((b) => (
              <RevealItem key={b} className="flex h-full items-center gap-3 rounded-2xl border border-hairline bg-white p-5 shadow-soft">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{b}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col items-center text-center">
            <span className="eyebrow">Testimonials</span>
            <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">What Our Team Says</h2>
          </Reveal>
          <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <RevealItem key={t.name} className="h-full rounded-2xl border border-hairline bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
                </div>
                <p className="mt-4 text-sm text-gray-600 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy to-ocean text-xs font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="page-canvas py-16 sm:py-20">
        <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">Want to Be Part of Our Story?</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Join a team that wakes up every day with a purpose — to serve, educate, and uplift.
          </p>
          <Link href="/jobs"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-navy to-ocean px-8 py-4 text-sm font-bold text-white shadow-lg shadow-navy/20 transition-all hover:shadow-xl hover:scale-[1.02]">
            View Open Positions <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
