'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  createEmailDraft,
  deleteEmailDraft,
  getEmailDrafts,
  reorderEmailDrafts,
  updateEmailDraft,
} from '@/lib/services';
import { toast } from '@/lib/toast';
import type { EmailDraft } from '@/types';
import { fillDraft } from './EmailsCard';

const PLACEHOLDERS = [
  { token: '{name}', hint: 'candidate name' },
  { token: '{position}', hint: 'job title' },
  { token: '{applicationNo}', hint: 'e.g. FSD10001' },
];
const SAMPLE = { name: 'Chaitanya Kumar', position: 'Full Stack Developer', applicationNo: 'FSD10001' };

const apiMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

type Form = { label: string; subject: string; message: string };
const EMPTY: Form = { label: '', subject: '', message: '' };

/** Settings → Email drafts: the saved emails HR picks from in "Write email". */
export default function EmailDraftsCard() {
  const [drafts, setDrafts] = useState<EmailDraft[] | null>(null);
  const [editing, setEditing] = useState<EmailDraft | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EmailDraft | null>(null);
  const [preview, setPreview] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Arriving from "Edit drafts" in the compose window (/admin/settings#email-drafts).
  useEffect(() => {
    if (window.location.hash === '#email-drafts') {
      setTimeout(() => document.getElementById('email-drafts')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);

  useEffect(() => {
    getEmailDrafts()
      .then(setDrafts)
      .catch(() => {
        setDrafts([]);
        toast.error('Could not load the email drafts');
      });
  }, []);

  const openEditor = (d: EmailDraft | 'new') => {
    setForm(d === 'new' ? EMPTY : { label: d.label, subject: d.subject, message: d.message });
    setPreview(false);
    setEditing(d);
  };

  /** Put a placeholder where the cursor is in the message. */
  const insertToken = (token: string) => {
    const el = messageRef.current;
    if (!el) return setForm((f) => ({ ...f, message: f.message + token }));
    const { selectionStart: a, selectionEnd: b } = el;
    const next = form.message.slice(0, a) + token + form.message.slice(b);
    setForm((f) => ({ ...f, message: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + token.length, a + token.length);
    });
  };

  const save = async () => {
    const body = { label: form.label.trim(), subject: form.subject.trim(), message: form.message.trim() };
    if (!body.label || !body.subject || !body.message) return toast.error('Fill in the name, subject and message');
    setSaving(true);
    try {
      if (editing === 'new') {
        const d = await createEmailDraft(body);
        setDrafts((list) => [...(list || []), d]);
        toast.success('Draft added');
      } else if (editing) {
        const d = await updateEmailDraft(editing._id, body);
        setDrafts((list) => (list || []).map((x) => (x._id === d._id ? d : x)));
        toast.success('Draft saved');
      }
      setEditing(null);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the draft'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const d = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteEmailDraft(d._id);
      setDrafts((list) => (list || []).filter((x) => x._id !== d._id));
      toast.info(`"${d.label}" deleted`);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete the draft'));
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!drafts) return;
    const next = [...drafts];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    setDrafts(next);
    try {
      setDrafts(await reorderEmailDrafts(next.map((d) => d._id)));
    } catch {
      toast.error('Could not change the order');
    }
  };

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

  return (
    <div id="email-drafts" className="scroll-mt-24 rounded-2xl border border-hairline bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <FileText className="h-5 w-5 text-ocean" /> Email drafts
        </h3>
        <button
          type="button"
          onClick={() => openEditor('new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-ocean"
        >
          <Plus className="h-3.5 w-3.5" /> New draft
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Saved emails HR can pick in <span className="font-semibold text-gray-700">Write email</span> on any application, then edit before sending.
      </p>

      {drafts === null ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">No drafts yet. Add your first one.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
          {drafts.map((d, i) => (
            <li key={d._id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${d.label} up`}
                  className="rounded p-0.5 text-gray-400 hover:text-navy disabled:opacity-25"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === drafts.length - 1}
                  aria-label={`Move ${d.label} down`}
                  className="rounded p-0.5 text-gray-400 hover:text-navy disabled:opacity-25"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <button type="button" onClick={() => openEditor(d)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-navy">{d.label}</p>
                <p className="truncate text-xs text-gray-500">{d.subject}</p>
              </button>
              <button
                type="button"
                onClick={() => openEditor(d)}
                aria-label={`Edit ${d.label}`}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-navy"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(d)}
                aria-label={`Delete ${d.label}`}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => !saving && setEditing(null)}
        title={editing === 'new' ? 'New email draft' : 'Edit email draft'}
        size="2xl"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Name (shown on the button)</span>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              maxLength={60}
              placeholder="e.g. Offer letter"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Subject</span>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              maxLength={200}
              placeholder="e.g. Your offer for {position}"
              className={inputCls}
            />
          </label>
          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-600">Message</span>
              <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold" role="tablist" aria-label="Message view">
                {[
                  { on: false, text: 'Write' },
                  { on: true, text: 'Preview' },
                ].map((t) => (
                  <button
                    key={t.text}
                    type="button"
                    role="tab"
                    aria-selected={preview === t.on}
                    onClick={() => setPreview(t.on)}
                    className={`rounded-md px-3 py-1 ${preview === t.on ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            </div>
            {preview ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-700">
                <p className="font-semibold text-navy">{fillDraft(form.subject, SAMPLE) || 'Subject'}</p>
                <p className="mt-3">Hare Krishna {SAMPLE.name} 🙏</p>
                <p className="mt-3 whitespace-pre-line">{fillDraft(form.message, SAMPLE) || '…'}</p>
                <p className="mt-3 text-gray-500">Regards,<br />Your name<br />HR Team, Hare Krishna Movement, Visakhapatnam</p>
              </div>
            ) : (
              <>
                <textarea
                  ref={messageRef}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={9}
                  maxLength={10000}
                  placeholder="Write the message. The greeting (Hare Krishna, name) and the sender's signature are added automatically."
                  className={`${inputCls} resize-y`}
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <span>Insert:</span>
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.token}
                      type="button"
                      onClick={() => insertToken(p.token)}
                      title={p.hint}
                      className="rounded-full bg-ocean/5 px-2.5 py-1 font-mono font-semibold text-ocean hover:bg-ocean/10"
                    >
                      {p.token}
                    </button>
                  ))}
                  <span className="text-gray-400">filled in automatically when used</span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing === 'new' ? 'Add draft' : 'Save draft'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete draft" size="sm">
        <p className="text-sm text-gray-600">
          Delete <strong className="text-navy">{confirmDelete?.label}</strong>? Emails already sent are not affected.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
