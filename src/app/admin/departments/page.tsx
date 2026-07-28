'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { Department } from '@/types';

const deptColors = ['from-navy to-ocean', 'from-ocean to-cyan', 'from-gold to-amber-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-indigo-500', 'from-pink-500 to-rose-500'];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { const data = await getDepartments(); setDepartments(data); } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setError(''); setModalOpen(true); };
  const openEdit = (dept: Department) => { setEditing(dept); setName(dept.name); setDescription(dept.description || ''); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { setError('Department name is required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) { await updateDepartment(editing._id, { name, description }); } else { await createDepartment({ name, description }); }
      setModalOpen(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDepartment(id); setDeleteConfirm(null); load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage organizational departments</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy to-ocean px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-navy/20 transition-all hover:shadow-lg hover:scale-[1.02]">
          <Plus className="h-4 w-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : departments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><Building2 className="h-8 w-8 text-gray-300" /></div>
          <p className="mt-4 text-base font-bold text-gray-900">No departments yet</p>
          <p className="mt-1 text-sm text-gray-500">Create your first department to organize job postings.</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-ocean">Add Department</button>
        </div>
      ) : (
        <>
          {/* Card grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept, i) => (
              <motion.div key={dept._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${deptColors[i % deptColors.length]} text-white shadow-md`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-navy">{dept.name}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{dept.description || 'No description'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">{formatDate(dept.createdAt)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(dept)} className="rounded-lg p-1.5 text-gray-400 hover:bg-ocean/10 hover:text-ocean transition-colors" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(dept._id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Table fallback */}
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-gray-200 bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dept, i) => (
                  <motion.tr key={dept._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{dept.name}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-gray-500">{dept.description || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(dept.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(dept)} className="rounded-lg p-1.5 text-gray-400 hover:bg-ocean/10 hover:text-ocean transition-colors"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteConfirm(dept._id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Department Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen, Education, Media"
              className="w-full rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the department..." rows={3}
              className="w-full rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 resize-none" />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Department" size="sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete this department? Jobs cannot be deleted if they have active applications.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
