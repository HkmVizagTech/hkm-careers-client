'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  FileText,
  MessageSquare,
  Trash2,
  Calendar,
  Phone,
  User,
  Clock,
  Briefcase,
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
  CalendarClock,
  ChevronDown,
  GraduationCap,
  PenLine,
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
import type { Application, CandidateNotification, RoleFilled, WhatsAppMessage } from '@/types';
import { reportDelivery } from '@/lib/notify';
import EmailsCard from '@/components/admin/EmailsCard';
import DocumentsCard from '@/components/admin/DocumentsCard';
import ActivityCard from '@/components/admin/ActivityCard';
import { Checkbox } from '@/components/ui/Checkbox';

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

/** One label/value pair in the compact details grid. Renders nothing without a value. */
function Detail({ label, children, wide }: { label: string; children?: React.ReactNode; wide?: boolean }) {
  if (children === undefined || children === null || children === '' || children === false) return null;
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2 sm:col-span-3' : ''}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-navy [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function DetailGroup({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-gray-500">
        <Icon className="h-3.5 w-3.5 text-ocean" /> {title}
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

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
  const [composeRequest, setComposeRequest] = useState(0);
  const [scheduleRequest, setScheduleRequest] = useState(0);

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

  const reportNotification = (n?: CandidateNotification | null) => {
    if (!n) return toast.success('Status updated');
    reportDelivery(n, 'Status updated');
  };

  const handleResend = async () => {
    if (!app) return;
    setResending(true);
    try {
      const res = await resendApplicationNotification(app._id);
      setApp({ ...app, whatsappMessages: res.whatsappMessages });
      reportDelivery(res.notification, 'Re-sent');
      load(); // picks up the new email log entry
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend message');
    } finally {
      setResending(false);
    }
  };

  const handleAddNote = async () => {
    if (!app || !noteText.trim()) return;
    setAddingNote(true);
    try { const updated = await addApplicationNote(app._id, noteText); setApp({ ...app, notes: updated.notes }); setNoteText(''); load(); }
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
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {!!app.screeningFlags?.length && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200"
                title={`Doesn't meet: ${app.screeningFlags.join(', ')}`}
              >
                <AlertTriangle className="h-3.5 w-3.5" /> {app.screeningFlags.length} screening flag{app.screeningFlags.length === 1 ? '' : 's'}
              </span>
            )}
            <Badge variant={app.status as 'received'}>
              {statuses.find((s) => s.value === app.status)?.label || app.status}
            </Badge>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-background p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Applied For</p>
            <p className="mt-0.5 font-bold text-navy">{jobTitle}</p>
            <p className="mt-1 text-xs text-gray-500">
              Came from: <span className="font-semibold capitalize text-gray-700">{app.source || 'Careers site (direct)'}</span>
            </p>
            {!!app.otherApplications?.length && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-amber-700">Also applied for:</span>
                {app.otherApplications.map((o) => (
                  <Link
                    key={o._id}
                    href={`/admin/applications/${o._id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
                    title={`${o.applicationNumber || ''} · applied ${formatDate(o.createdAt)}`}
                  >
                    {o.job?.title || 'Another job'}
                    <span className="font-normal text-amber-800/80">
                      · {statuses.find((s) => s.value === o.status)?.label || o.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* The things HR does most, one tap away. */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setComposeRequest((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ocean"
            >
              <PenLine className="h-4 w-4" /> Email candidate
            </button>
            <button
              type="button"
              onClick={() => setScheduleRequest((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-plum/30 bg-white px-4 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5"
            >
              <CalendarClock className="h-4 w-4" /> {app.interview?.scheduledAt ? 'Reschedule' : 'Schedule interview'}
            </button>
            {app.phone && (
              <a
                href={`tel:${app.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-ocean/40 hover:text-ocean"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
          </div>
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

          {/* Candidate details: personal, experience, education and profiles in one compact card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <User className="h-5 w-5 text-ocean" /> Candidate Details
            </h2>
            <div className="mt-4 divide-y divide-gray-100">
              {(app.gender || app.dateOfBirth || app.location || app.currentLocation || app.availableToJoin) && (
              <DetailGroup icon={User} title="Personal">
                <Detail label="Gender">{app.gender ? <span className="capitalize">{app.gender.replace(/-/g, ' ')}</span> : undefined}</Detail>
                <Detail label="Date of birth">{app.dateOfBirth ? formatDate(app.dateOfBirth) : undefined}</Detail>
                <Detail label="Location">{app.location}</Detail>
                <Detail label="Current location">{app.currentLocation}</Detail>
                <Detail label="Available to join">{app.availableToJoin ? (/^\d+$/.test(app.availableToJoin.trim()) ? `${app.availableToJoin.trim()} days` : app.availableToJoin) : undefined}</Detail>
              </DetailGroup>
              )}
              <DetailGroup icon={Briefcase} title="Experience">
                {app.isExperienced ? (
                  <>
                    <Detail label="Experience">
                      {app.yearsOfExperience !== undefined ? `${app.yearsOfExperience} year${app.yearsOfExperience !== 1 ? 's' : ''}` : 'Experienced'}
                    </Detail>
                    <Detail label="Last employer">{app.lastEmployer}</Detail>
                    <Detail label="Worked">
                      {app.lastEmploymentFrom
                        ? `${formatDate(app.lastEmploymentFrom)} – ${app.lastEmploymentTo ? formatDate(app.lastEmploymentTo) : 'now'}`
                        : undefined}
                    </Detail>
                  </>
                ) : (
                  <Detail label="Experience">Fresher</Detail>
                )}
              </DetailGroup>
              {(app.highestDegree || app.collegeName) && (
                <DetailGroup icon={GraduationCap} title="Education">
                  <Detail label="Highest degree">{app.highestDegree}</Detail>
                  <Detail label="Years">{app.studyYears}</Detail>
                  <Detail label="College / University" wide>
                    {app.collegeName ? `${app.collegeName}${app.collegeCity ? `, ${app.collegeCity}` : ''}` : undefined}
                  </Detail>
                </DetailGroup>
              )}
              {(app.linkedinUrl || app.githubUrl || app.portfolioUrl) && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {[
                    { url: app.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
                    { url: app.githubUrl, label: 'GitHub', icon: Github },
                    { url: app.portfolioUrl, label: 'Portfolio', icon: ExternalLink },
                  ]
                    .filter((l) => l.url)
                    .map((l) => (
                      <a
                        key={l.label}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={l.url}
                        className="inline-flex items-center gap-1.5 rounded-full bg-ocean/5 px-3 py-1.5 text-xs font-semibold text-ocean transition-colors hover:bg-ocean/10"
                      >
                        <l.icon className="h-3.5 w-3.5" /> {l.label}
                      </a>
                    ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Screening answers */}
          {!!app.answers?.length && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <MessageSquare className="h-5 w-5 text-ocean" /> Screening Answers
              </h2>
              <ul className="mt-4 divide-y divide-gray-100">
                {app.answers.map((a, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500">{a.label}</p>
                      <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-navy [overflow-wrap:anywhere]">
                        {a.type === 'yesno' ? (a.value === 'yes' ? 'Yes' : 'No') : a.value}
                      </p>
                    </div>
                    {a.meets === false && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Doesn&apos;t meet
                      </span>
                    )}
                    {a.meets === true && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Check className="h-3 w-3" /> Meets
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <DocumentsCard
            applicationId={app._id}
            candidateName={app.name}
            status={app.status}
            requests={app.documentRequests || []}
            onChange={(documentRequests) => setApp((a) => (a ? { ...a, documentRequests } : a))}
            onActivity={() => load()}
          />

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

          <ActivityCard activity={app.activity || []} />
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-6">
          {/* Status Update */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
            <h2 className="text-base font-bold text-gray-900">Update Status</h2>
            <div className="mt-3 space-y-1.5">
              {statuses.map((s) => (
                <button key={s.value} onClick={() => {
                  if (s.value === app.status) return;
                  // Moving to Interview opens the scheduler, whose email carries the date and time: skip the extra one.
                  setNotifyCandidate(!(s.value === 'interview' && !app.interview?.scheduledAt));
                  setStatusConfirm(s.value);
                }}
                  aria-current={app.status === s.value ? 'true' : undefined}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-all ${app.status === s.value ? `${s.color} shadow-sm` : 'text-gray-500 hover:bg-gray-50'}`}>
                  {app.status === s.value && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current" />}
                  {s.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ocean hover:text-navy disabled:opacity-50"
              title="Email the candidate the update for the current status again"
            >
              <RotateCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} /> Re-send status email
            </button>
          </motion.div>

          <EmailsCard
            applicationId={app._id}
            candidateEmail={app.email}
            emails={app.emails || []}
            onChange={(emails) => { setApp((a) => (a ? { ...a, emails } : a)); load(); }}
            composeRequest={composeRequest}
            candidateName={app.name}
            jobTitle={jobTitle === '—' ? '' : jobTitle}
            applicationNo={app.applicationNumber || ''}
          />

          <InterviewCard
            applicationId={app._id}
            candidateName={app.name}
            jobTitle={jobTitle}
            interview={app.interview}
            startEditing={promptInterview}
            openRequest={scheduleRequest}
            onChange={(interview) => { setApp((a) => (a ? { ...a, interview } : a)); setPromptInterview(false); load(); }}
            onMessage={() => load()}
          />

          <FollowUpsCard
            applicationId={app._id}
            followUps={app.followUps || []}
            onChange={(followUps) => { setApp((a) => (a ? { ...a, followUps } : a)); load(); }}
          />

          {/* WhatsApp is no longer used; earlier messages stay viewable. */}
          {!!app.whatsappMessages?.length && (
            <details className="group rounded-2xl border border-hairline bg-white p-5 shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-gray-700">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-500" /> Earlier WhatsApp messages ({app.whatsappMessages.length})
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-4 space-y-3">
                {[...app.whatsappMessages].reverse().map((m) => {
                  const st = deliveryStyles[m.status] || deliveryStyles.submitted;
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
            </details>
          )}

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
            <Checkbox checked={notifyCandidate} onChange={setNotifyCandidate} tone="emerald" className="mt-0.5" />
            <span>
              <span className="flex items-center gap-1.5 font-semibold"><Mail className="h-4 w-4" /> Email the candidate</span>
              <span className="mt-0.5 block text-xs text-emerald-800/80">
                {statusConfirm === 'interview' && !app.interview?.scheduledAt
                  ? 'Usually not needed: the scheduler opens next, and scheduling emails them the date and time.'
                  : `Sends the status update to ${app.email}.`}
              </span>
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
