'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Download,
  FileText,
  MessageSquare,
  Trash2,
  Calendar,
  Phone,
  User,
  Clock,
  Briefcase,
  Building2,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  getAdminApplication,
  updateApplicationStatus,
  addApplicationNote,
  deleteApplication,
} from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';

import { formatDate } from '@/lib/utils';
import type { Application } from '@/types';

const statuses = [
  { value: 'received', label: 'Received', color: 'bg-gray-100 text-gray-700' },
  { value: 'under-review', label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-amber-100 text-amber-700' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  { value: 'selected', label: 'Selected', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = async () => {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(app._id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* Clipboard unavailable — ID remains selectable. */
    }
  };

  const load = async () => {
    try { const data = await getAdminApplication(id); setApp(data); } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const handleStatusChange = async (status: string) => {
    if (!app) return;
    try {
      const updated = await updateApplicationStatus(app._id, status);
      setApp({ ...app, status: updated.status });
      setStatusConfirm(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!app || !noteText.trim()) return;
    setAddingNote(true);
    try { const updated = await addApplicationNote(app._id, noteText); setApp({ ...app, notes: updated.notes }); setNoteText(''); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to add note'); }
    finally { setAddingNote(false); }
  };

  const handleDelete = async () => {
    if (!app) return;
    try { await deleteApplication(app._id); router.push('/admin/applications'); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  if (loading) return <div className="mt-6 space-y-3" aria-busy="true">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  if (!app) return (
    <div className="py-20 text-center">
      <p className="text-gray-500">Application not found</p>
      <Link href="/admin/applications" className="mt-4 inline-block text-sm font-semibold text-ocean hover:text-navy">← Back to Applications</Link>
    </div>
  );

  const jobTitle = typeof app.job === 'object' && app.job !== null ? (app.job as { title: string }).title : '—';
  const initials = app.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <Link href="/admin/applications" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-navy transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Applications
      </Link>

      {/* Header */}
      <div className="mt-6 rounded-2xl border border-hairline bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-ocean text-lg font-bold text-white shadow-lg shadow-navy/20">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{app.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 transition-colors hover:text-ocean"><Mail className="h-3.5 w-3.5" />{app.email}</a>
                {app.phone && <a href={`tel:${app.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 transition-colors hover:text-ocean"><Phone className="h-3.5 w-3.5" />{app.phone}</a>}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Applied {formatDate(app.createdAt)}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Application ID"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-500 transition-colors hover:bg-ocean/10 hover:text-ocean"
              >
                ID: {app._id}
                {copiedId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <Badge variant={app.status as 'received'}>
            {statuses.find((s) => s.value === app.status)?.label || app.status}
          </Badge>
        </div>
        <div className="mt-4 rounded-xl bg-background p-3.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Applied For</p>
          <p className="mt-0.5 font-bold text-navy">{jobTitle}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Resume */}
          {app.resumeUrl && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <FileText className="h-5 w-5 text-ocean" /> Resume
              </h2>
              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ocean to-cyan px-5 py-3 text-sm font-semibold text-white shadow-md shadow-ocean/20 transition-all hover:shadow-lg hover:scale-[1.02]">
                <Download className="h-4 w-4" /> Download Resume
              </a>
            </motion.div>
          )}

          {/* Experience */}
          {app.isExperienced && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Briefcase className="h-5 w-5 text-ocean" /> Work Experience
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {app.yearsOfExperience !== undefined && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Years of Experience</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.yearsOfExperience} year{app.yearsOfExperience !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {app.lastEmployer && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Employer</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.lastEmployer}</p>
                  </div>
                )}
                {app.lastEmploymentFrom && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employment From</p>
                    <p className="mt-1 text-sm font-bold text-navy">{formatDate(app.lastEmploymentFrom)}</p>
                  </div>
                )}
                {app.lastEmploymentTo && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employment To</p>
                    <p className="mt-1 text-sm font-bold text-navy">{formatDate(app.lastEmploymentTo)}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Personal Details */}
          {(app.location || app.gender || app.dateOfBirth) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <User className="h-5 w-5 text-ocean" /> Personal Details
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {app.location && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.location}</p>
                  </div>
                )}
                {app.gender && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</p>
                    <p className="mt-1 text-sm font-bold text-navy capitalize">{app.gender.replace(/-/g, ' ')}</p>
                  </div>
                )}
                {app.dateOfBirth && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date of Birth</p>
                    <p className="mt-1 text-sm font-bold text-navy">{formatDate(app.dateOfBirth)}</p>
                  </div>
                )}
                {app.currentLocation && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Location</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.currentLocation}</p>
                  </div>
                )}
                {app.availableToJoin && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available to Join</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.availableToJoin} days</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Educational Details */}
          {(app.highestDegree || app.collegeName) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Building2 className="h-5 w-5 text-ocean" /> Educational Details
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {app.highestDegree && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Highest Degree</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.highestDegree}</p>
                  </div>
                )}
                {app.collegeName && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">College / University</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.collegeName}</p>
                  </div>
                )}
                {app.collegeCity && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">College City</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.collegeCity}</p>
                  </div>
                )}
                {app.studyYears && (
                  <div className="rounded-xl bg-background p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Study Years</p>
                    <p className="mt-1 text-sm font-bold text-navy">{app.studyYears}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Online Profiles */}
          {(app.linkedinUrl || app.githubUrl || app.portfolioUrl) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Globe className="h-5 w-5 text-ocean" /> Online Profiles
              </h2>
              <div className="mt-4 space-y-2">
                {app.linkedinUrl && (
                  <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm text-ocean hover:bg-ocean/5 transition-colors">
                    <Linkedin className="h-4 w-4" /> {app.linkedinUrl}
                  </a>
                )}
                {app.githubUrl && (
                  <a href={app.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm text-ocean hover:bg-ocean/5 transition-colors">
                    <Github className="h-4 w-4" /> {app.githubUrl}
                  </a>
                )}
                {app.portfolioUrl && (
                  <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm text-ocean hover:bg-ocean/5 transition-colors">
                    <ExternalLink className="h-4 w-4" /> {app.portfolioUrl}
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* Cover Letter */}
          {app.coverLetter && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="text-base font-bold text-gray-900">Cover Letter</h2>
              <div className="mt-3 whitespace-pre-line rounded-xl bg-background p-4 text-sm text-gray-600 leading-relaxed">{app.coverLetter}</div>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <MessageSquare className="h-5 w-5 text-ocean" /> Internal Notes
            </h2>
            <div className="mt-4 space-y-3">
              {app.notes.length === 0 && <p className="text-sm text-gray-400">No notes yet</p>}
              {app.notes.map((note, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">{note.text}</p>
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {typeof note.addedBy === 'object' && note.addedBy !== null ? note.addedBy.name : 'Admin'} · {formatDate(note.createdAt)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input type="text" placeholder="Add a note..." value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15" />
              <Button onClick={handleAddNote} loading={addingNote} disabled={!noteText.trim()}>Add</Button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
            <h2 className="text-base font-bold text-gray-900">Update Status</h2>
            <div className="mt-3 space-y-1.5">
              {statuses.map((s) => (
                <button key={s.value} onClick={() => s.value !== app.status && setStatusConfirm(s.value)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${app.status === s.value ? `${s.color} shadow-sm` : 'text-gray-500 hover:bg-gray-50'}`}>
                  {app.status === s.value && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current" />}
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
            <h2 className="text-base font-bold text-gray-900">Actions</h2>
            <div className="mt-3 space-y-2">
              {app.resumeUrl && (
                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-ocean/5 hover:border-ocean/30 hover:text-ocean">
                  <Download className="h-4 w-4" /> Download Resume
                </a>
              )}
              <button onClick={() => setDeleteConfirm(true)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100">
                <Trash2 className="h-4 w-4" /> Delete Application
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Confirmation */}
      <Modal isOpen={!!statusConfirm} onClose={() => setStatusConfirm(null)} title="Confirm Status Change" size="sm">
        <p className="text-sm text-gray-600">
          Are you sure you want to change the status to{' '}
          <strong className="text-navy">{statuses.find((s) => s.value === statusConfirm)?.label}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setStatusConfirm(null)}>Cancel</Button>
          <Button onClick={() => statusConfirm && handleStatusChange(statusConfirm)}>Confirm</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Application" size="sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete this application? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
