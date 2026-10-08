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
  CheckCheck,
  MessageCircle,
  RotateCw,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import {
  getAdminApplication,
  updateApplicationStatus,
  addApplicationNote,
  deleteApplication,
  resendApplicationNotification,
} from '@/lib/services';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';
import InterviewCard from '@/components/admin/InterviewCard';
import FollowUpsCard from '@/components/admin/FollowUpsCard';
import ResumeActions from '@/components/admin/ResumeActions';
import CloseRemainingModal from '@/components/admin/CloseRemainingModal';

import { formatDate } from '@/lib/utils';
import type { Application, RoleFilled, WhatsAppMessage } from '@/types';

const statuses = [
  { value: 'received', label: 'Received', color: 'bg-gray-100 text-gray-700' },
  { value: 'under-review', label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-amber-100 text-amber-700' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  { value: 'selected', label: 'Selected', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

const deliveryStyles: Record<WhatsAppMessage['status'], { label: string; cls: string }> = {
  submitted: { label: 'Queued', cls: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Sent', cls: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-100 text-emerald-700' },
  read: { label: 'Read', cls: 'bg-teal-100 text-teal-700' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
  skipped: { label: 'Not sent', cls: 'bg-amber-100 text-amber-700' },
};

function DeliveryIcon({ status }: { status: WhatsAppMessage['status'] }) {
  if (status === 'read' || status === 'delivered') return <CheckCheck className="h-3 w-3" />;
  if (status === 'sent') return <Check className="h-3 w-3" />;
  if (status === 'failed') return <AlertTriangle className="h-3 w-3" />;
  if (status === 'skipped') return <Ban className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

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
  const [notifyCandidate, setNotifyCandidate] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resending, setResending] = useState(false);
  const [promptInterview, setPromptInterview] = useState(false);
  const [roleFilled, setRoleFilled] = useState<RoleFilled | null>(null);

  const handleCopyId = async () => {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(app.applicationNumber || app._id);
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
    setUpdatingStatus(true);
    try {
      const send = notifyCandidate && status !== 'received';
      const updated = await updateApplicationStatus(app._id, status, send);
      setApp({ ...app, status: updated.status });
      setStatusConfirm(null);
      reportNotification(updated.notification);
      // Moving to "Interview" without a time yet: open the scheduler.
      if (status === 'interview' && !app.interview?.scheduledAt) setPromptInterview(true);
      // Last opening filled: offer to wrap up the other applicants.
      if (updated.roleFilled) setRoleFilled(updated.roleFilled);
      await load(); // pick up the new message log entry
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const reportNotification = (n?: WhatsAppMessage | null) => {
    if (!n) return;
    if (n.status === 'failed') toast.error(`Status updated, but the WhatsApp message failed: ${n.error ?? 'unknown error'}`);
    else if (n.status === 'skipped') toast.info(`Status updated. WhatsApp message not sent: ${n.error ?? 'skipped'}`);
    else toast.success('Status updated and WhatsApp message sent to the candidate');
  };

  const handleResend = async () => {
    if (!app) return;
    setResending(true);
    try {
      const res = await resendApplicationNotification(app._id);
      setApp({ ...app, whatsappMessages: res.whatsappMessages });
      if (res.notification?.status === 'failed') toast.error(`WhatsApp message failed: ${res.notification.error ?? 'unknown error'}`);
      else if (res.notification?.status === 'skipped') toast.info(`Not sent: ${res.notification.error ?? 'skipped'}`);
      else toast.success('WhatsApp message re-sent');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend message');
    } finally {
      setResending(false);
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
                ID: {app.applicationNumber || app._id}
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
          <p className="mt-1 text-xs text-gray-500">
            Came from: <span className="font-semibold capitalize text-gray-700">{app.source || 'Careers site (direct)'}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Resume */}
          {app.resumeUrl && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <FileText className="h-5 w-5 text-ocean" /> Resume
              </h2>
              <ResumeActions applicationId={app._id} resumeUrl={app.resumeUrl} />
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
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15" />
              <Button onClick={handleAddNote} loading={addingNote} disabled={!noteText.trim()}>Add</Button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-6">
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

          <InterviewCard
            applicationId={app._id}
            candidateName={app.name}
            jobTitle={jobTitle}
            interview={app.interview}
            startEditing={promptInterview}
            onChange={(interview) => { setApp((a) => (a ? { ...a, interview } : a)); setPromptInterview(false); }}
            onMessage={() => load()}
          />

          <FollowUpsCard
            applicationId={app._id}
            followUps={app.followUps || []}
            onChange={(followUps) => setApp((a) => (a ? { ...a, followUps } : a))}
          />

          {/* WhatsApp messages */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <MessageCircle className="h-5 w-5 text-emerald-500" /> WhatsApp Messages
              </h2>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10 disabled:opacity-50"
                title="Re-send the message for the current status"
              >
                <RotateCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} /> Resend
              </button>
            </div>
            {(!app.whatsappMessages || app.whatsappMessages.length === 0) ? (
              <p className="mt-3 text-sm text-gray-500">No messages sent to this candidate yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {[...app.whatsappMessages].reverse().map((m) => {
                  const st = deliveryStyles[m.status];
                  const about = m.kind === 'received'
                    ? 'Application received'
                    : m.kind === 'interview'
                      ? 'Interview details'
                      : `Status: ${statuses.find((s) => s.value === m.applicationStatus)?.label ?? m.applicationStatus}`;
                  return (
                    <li key={m._id} className="border-l-2 border-ocean/25 pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-navy">{about}</p>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                          <DeliveryIcon status={m.status} /> {st.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(m.createdAt)}</p>
                      {m.error && <p className="mt-1 text-xs text-red-600">{m.error}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
            <h2 className="text-base font-bold text-gray-900">Actions</h2>
            <div className="mt-3 space-y-2">
              {app.resumeUrl && (
                <ResumeActions applicationId={app._id} resumeUrl={app.resumeUrl} variant="list" />
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
        {statusConfirm !== 'received' && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-900">
            <input
              type="checkbox"
              checked={notifyCandidate}
              onChange={(e) => setNotifyCandidate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              <span className="flex items-center gap-1.5 font-semibold"><MessageCircle className="h-4 w-4" /> Notify candidate on WhatsApp</span>
              <span className="mt-0.5 block text-xs text-emerald-800/80">Sends the status update to {app.phone || 'the candidate'}.</span>
            </span>
          </label>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setStatusConfirm(null)}>Cancel</Button>
          <Button loading={updatingStatus} onClick={() => statusConfirm && handleStatusChange(statusConfirm)}>Confirm</Button>
        </div>
      </Modal>

      <CloseRemainingModal
        target={roleFilled ? { jobId: roleFilled.jobId, filled: roleFilled } : null}
        onClose={() => setRoleFilled(null)}
      />

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
