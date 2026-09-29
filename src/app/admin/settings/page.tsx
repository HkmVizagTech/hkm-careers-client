'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  User,
  Mail,
  CheckCircle,
  Lock,
  Users,
  UserPlus,
  Trash2,
  Crown,
  AlertCircle,
} from 'lucide-react';
import {
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  updateMyProfile,
} from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { AdminUser } from '@/types';

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-ocean focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<AdminUser | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [teamError, setTeamError] = useState('');

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      setAdmins(await getAdminUsers());
    } catch {
      setTeamError('Failed to load admin accounts.');
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    try {
      const updated = await updateMyProfile(name.trim());
      // Keep the stored session user in sync with the new name.
      updateUser({ id: updated.id, name: updated.name, email: updated.email });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setProfileError(axiosErr.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAdmin = async () => {
    setTeamError('');
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || newAdmin.password.length < 6) {
      setTeamError('All fields are required. Password must be at least 6 characters.');
      return;
    }
    setCreating(true);
    try {
      await createAdminUser({
        name: newAdmin.name.trim(),
        email: newAdmin.email.trim(),
        password: newAdmin.password,
      });
      setAddOpen(false);
      setNewAdmin({ name: '', email: '', password: '' });
      await loadAdmins();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setTeamError(axiosErr.response?.data?.message || 'Failed to create admin.');
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!removeConfirm) return;
    setRemoving(true);
    setTeamError('');
    try {
      await deleteAdminUser(removeConfirm._id);
      setRemoveConfirm(null);
      await loadAdmins();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setTeamError(axiosErr.response?.data?.message || 'Failed to remove admin.');
      setRemoveConfirm(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account and team admins</p>
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />
                {user?.email}
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Locked</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-navy/20 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
            >
              {savingProfile && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              Save Changes
            </button>
            {profileSaved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle className="h-4 w-4" /> Saved successfully
              </motion.span>
            )}
            {profileError && (
              <span className="text-sm text-red-500">{profileError}</span>
            )}
          </div>
        </div>

        {/* Team Admins */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Users className="h-5 w-5 text-ocean" /> Team Admins
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Admins can manage jobs, applications, and departments.
              </p>
            </div>
            <button
              onClick={() => { setAddOpen(true); setTeamError(''); }}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-navy to-ocean px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-navy/20 transition-all hover:scale-[1.02] sm:self-auto"
            >
              <UserPlus className="h-4 w-4" /> Add Admin
            </button>
          </div>

          {teamError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {teamError}
            </div>
          )}

          {loadingAdmins ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {admins.map((admin) => {
                const isSelf = admin._id === user?.id;
                const isFounder = admin.createdAt && admins.length > 0 && admin === admins[0];
                return (
                  <li
                    key={admin._id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors hover:border-gray-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-sm font-bold text-white">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                          {admin.name}
                          {isSelf && (
                            <span className="rounded-full bg-ocean/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ocean">
                              You
                            </span>
                          )}
                          {isFounder && !isSelf && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-goldDeep">
                              <Crown className="h-2.5 w-2.5" /> First admin
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-400">{admin.email} · joined {formatDate(admin.createdAt)}</p>
                      </div>
                    </div>
                    {!isSelf ? (
                      <button
                        onClick={() => setRemoveConfirm(admin)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 sm:self-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-medium text-gray-400 sm:self-auto">
                        <Lock className="h-3 w-3" /> Current session
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
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

      {/* Add Admin Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Team Admin" size="md">
        <div className="space-y-4">
          <p className="rounded-xl bg-ocean/5 p-3 text-xs leading-relaxed text-ocean">
            New admins get full access to the dashboard — jobs, applications, departments, and other admins.
          </p>
          {teamError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {teamError}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              placeholder="e.g. Ravi Kumar"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              placeholder="colleague@harekrishnavizag.org"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Temporary Password <span className="font-normal text-gray-400">(min 6 characters)</span>
            </label>
            <input
              type="text"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              placeholder="Share this with them securely"
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAdmin} loading={creating}>
            <UserPlus className="h-4 w-4" /> Create Admin
          </Button>
        </div>
      </Modal>

      {/* Remove Confirmation */}
      <Modal isOpen={!!removeConfirm} onClose={() => setRemoveConfirm(null)} title="Remove Admin" size="sm">
        <p className="text-sm text-gray-600">
          Remove <strong className="text-gray-900">{removeConfirm?.name}</strong> ({removeConfirm?.email}) as an
          admin? They will immediately lose access to the dashboard.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
          <Button variant="danger" loading={removing} onClick={handleRemoveAdmin}>Remove Admin</Button>
        </div>
      </Modal>
    </div>
  );
}
