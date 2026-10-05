'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      window.location.href = '/admin/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#2a1d6b] to-ocean px-4 py-10">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan/10 animate-float" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gold/10 animate-float-delayed" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-48 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
              <img
                src="https://pub-4e0da5167b73428c8f43c54f8376882d.r2.dev/logo/hkm%20logo%20png%20sp%20colored%20-%20black%20font.png"
                alt="HKM Vizag"
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="mt-5 text-xl font-bold text-white">Welcome Back</h1>
            <p className="mt-1 text-sm text-white/70">
              Sign in to the admin panel
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/20 p-3 text-center text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-xs font-semibold text-white/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@hkmvizag.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-10 pr-4 text-base text-white placeholder:text-white/40 focus:border-cyan/60 focus:outline-none focus:ring-4 focus:ring-cyan/25 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-xs font-semibold text-white/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-10 pr-12 text-base text-white placeholder:text-white/40 focus:border-cyan/60 focus:outline-none focus:ring-4 focus:ring-cyan/25 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              loading={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-gold to-goldDeep py-3 text-sm font-bold text-navy shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/30"
            >
              Sign In
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
