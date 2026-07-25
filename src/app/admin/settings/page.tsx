'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Shield, User, Mail, CheckCircle, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your admin account</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-ocean text-base font-bold text-white shadow-lg shadow-navy/20">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <User className="h-5 w-5 text-ocean" /> Profile Information
          </h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />
                {user?.email}
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Locked</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-navy/20 transition-all hover:shadow-lg hover:scale-[1.02]">
              Save Changes
            </button>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle className="h-4 w-4" /> Saved successfully
              </motion.span>
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Shield className="h-5 w-5 text-ocean" /> Security
          </h3>
          <div className="mt-4 rounded-xl bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <Lock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Password</p>
                <p className="text-xs text-gray-500">Contact the system administrator to change your password</p>
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Coming soon — not yet enabled</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
