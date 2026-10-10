'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, GraduationCap, Heading, List, ListOrdered, Maximize2, Minimize2, Pencil, Plus, Trash2, X } from 'lucide-react';
import JobText from '@/components/ui/JobText';
import { tidyPastedText } from '@/lib/jobText';
import {
  createQualificationOption,
  deleteQualificationOption,
  getQualificationOptions,
  updateQualificationOption,
} from '@/lib/services';
import { toast } from '@/lib/toast';
import type { QualificationOption } from '@/types';

const apiMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const MARKER = /^(\s*)(?:[•\-*]\s+|\d{1,2}[.)]\s+)/;

/** Apply a list style to every line touched by the selection [a, b). Returns the new text and selection. */
function formatLines(value: string, a: number, b: number, kind: 'bullet' | 'number' | 'heading') {
  const start = value.lastIndexOf('\n', a - 1) + 1;
  let end = value.indexOf('\n', b > a && value[b - 1] === '\n' ? b - 1 : b);
  if (end === -1) end = value.length;
  const lines = value.slice(start, end).split('\n');
  const filled = lines.filter((l) => l.trim());
  const strip = (l: string) => l.replace(MARKER, '$1').replace(/:\s*$/, '');

  let out: string[];
  if (kind === 'bullet') {
    const on = filled.length > 0 && filled.every((l) => /^\s*[•\-*]\s+/.test(l));
    out = lines.map((l) => (!l.trim() && lines.length > 1 ? l : on ? strip(l) : `• ${strip(l).trimStart()}`));
  } else if (kind === 'number') {
    const on = filled.length > 0 && filled.every((l) => /^\s*\d{1,2}[.)]\s+/.test(l));
    let n = 0;
    out = lines.map((l) => (!l.trim() && lines.length > 1 ? l : on ? strip(l) : `${++n}. ${strip(l).trimStart()}`));
  } else {
    // A short line ending with ":" is shown as a heading on the job page.
    const on = filled.length > 0 && filled.every((l) => /:\s*$/.test(l) && !MARKER.test(l));
    out = lines.map((l) => (!l.trim() ? l : on ? l.replace(/:\s*$/, '') : `${strip(l).trim()}:`));
  }
  const text = out.join('\n');
  return { value: value.slice(0, start) + text + value.slice(end), selStart: start, selEnd: start + text.length };
}

/** A plain text box that grows with its content, with a Write / Preview switch. */
export function JobTextArea({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  hint,
  required,
  error,
  minRows = 6,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  required?: boolean;
  error?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tall, setTall] = useState(false);

  // Grow with the text up to a comfortable height (then scroll); "Expand" shows the whole thing.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || preview) return;
    const cap = expanded ? Infinity : Math.max(320, Math.round(window.innerHeight * 0.6));
    el.style.height = 'auto';
    const full = el.scrollHeight + 2;
    el.style.height = `${Math.min(full, cap)}px`;
    el.style.overflowY = full > cap ? 'auto' : 'hidden';
    setTall(full > Math.max(320, Math.round(window.innerHeight * 0.6)));
  }, [value, preview, expanded]);

  // Pasted JDs (PDF, Word, LinkedIn) come with stray bullets and blank lines: tidy just the pasted part.
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text/plain');
    if (!pasted || !pasted.includes('\n')) return;
    const tidy = tidyPastedText(pasted);
    if (tidy === pasted) return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: a, selectionEnd: b } = el;
    pendingSel.current = [a + tidy.length, a + tidy.length];
    onChange(value.slice(0, a) + tidy + value.slice(b));
  };

  // Caret position to restore right after React re-renders the new text (before the next keystroke).
  const pendingSel = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !pendingSel.current) return;
    const [a, b] = pendingSel.current;
    pendingSel.current = null;
    el.focus();
    el.setSelectionRange(a, b);
  }, [value]);

  const setAndSelect = (next: string, a: number, b = a) => {
    pendingSel.current = [a, b];
    onChange(next);
  };

  const applyFormat = (kind: 'bullet' | 'number' | 'heading') => {
    const el = ref.current;
    if (!el) return;
    const r = formatLines(value, el.selectionStart, el.selectionEnd, kind);
    setAndSelect(r.value, r.selEnd);
  };

  // Enter on a "• " or "1. " line starts the next point; Enter on an empty point ends the list.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    const el = e.currentTarget;
    const a = el.selectionStart;
    if (a !== el.selectionEnd) return;
    const lineStart = value.lastIndexOf('\n', a - 1) + 1;
    const line = value.slice(lineStart, a);
    const m = line.match(/^(\s*)(•|[-*]|\d{1,2}[.)])\s+/);
    if (!m) return;
    e.preventDefault();
    if (!line.slice(m[0].length).trim()) {
      setAndSelect(value.slice(0, lineStart) + value.slice(a), lineStart); // empty point: stop the list
      return;
    }
    const num = m[2].match(/^(\d{1,2})([.)])$/);
    const marker = `${m[1]}${num ? `${Number(num[1]) + 1}${num[2]}` : m[2]} `;
    setAndSelect(`${value.slice(0, a)}\n${marker}${value.slice(a)}`, a + 1 + marker.length);
  };

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Icon className="h-4 w-4 text-ocean" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold" role="tablist" aria-label={`${label} view`}>
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
              className={`rounded-md px-3 py-1 transition-colors ${
                preview === t.on ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.text}
            </button>
          ))}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}

      {preview ? (
        <div className="mt-2 min-h-[8rem] rounded-xl border border-dashed border-gray-200 bg-white p-4 sm:p-5">
          {value.trim() ? (
            <JobText text={value} format="text" compact />
          ) : (
            <p className="text-sm text-gray-400">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <>
        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`${label} formatting`}>
          {(
            [
              { kind: 'bullet', icon: List, text: 'Bullets' },
              { kind: 'number', icon: ListOrdered, text: 'Numbered' },
              { kind: 'heading', icon: Heading, text: 'Heading' },
            ] as const
          ).map((b) => (
            <button
              key={b.kind}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep the text selection
              onClick={() => applyFormat(b.kind)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-ocean/40 hover:text-ocean"
            >
              <b.icon className="h-3.5 w-3.5" /> {b.text}
            </button>
          ))}
          <span className="text-[11px] text-gray-400">Select lines, then click. Enter adds the next point.</span>
        </div>
        <textarea
          id={id}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          rows={minRows}
          placeholder={placeholder}
          spellCheck
          className={`mt-2 block w-full resize-y rounded-xl border bg-gray-50 px-4 py-3 text-sm leading-relaxed transition-colors focus:bg-white focus:outline-none focus:ring-4 focus:ring-ocean/15 ${
            error ? 'border-red-400 bg-red-50/40 focus:border-red-400' : 'border-gray-200 focus:border-ocean'
          }`}
        />
        </>
      )}
      <div className="mt-1 flex items-center justify-between gap-3 text-xs">
        <span className="text-red-500">{error}</span>
        <span className="flex shrink-0 items-center gap-3 text-gray-400">
          {words > 0 && <span>{words} words</span>}
          {!preview && (tall || expanded) && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 font-semibold text-ocean hover:text-navy"
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Qualification checkboxes. The list itself (Post Graduation, B.Tech, ...) is shared by all jobs
 * and can be renamed, removed or extended right here with "Edit list".
 */
export function QualificationPicker({ selected, onChange }: { selected: string[]; onChange: (tags: string[]) => void }) {
  const [options, setOptions] = useState<QualificationOption[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherLabel, setOtherLabel] = useState('');
  const [otherSave, setOtherSave] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getQualificationOptions()
      .then(setOptions)
      .catch(() => {
        setOptions([]);
        toast.error('Could not load the qualification list');
      });
  }, []);

  const dropDraft = (id: string) =>
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });

  const isOn = (label: string) => selected.some((s) => s.toLowerCase() === label.toLowerCase());
  const toggle = (label: string) =>
    onChange(isOn(label) ? selected.filter((s) => s.toLowerCase() !== label.toLowerCase()) : [...selected, label]);

  // "Other": a qualification just for this job (e.g. Diploma), optionally saved to the list too.
  const addOther = async () => {
    const label = otherLabel.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!label) return;
    const existing = (options || []).find((o) => o.label.toLowerCase() === label.toLowerCase());
    if (existing || !otherSave) {
      if (!isOn(existing?.label ?? label)) onChange([...selected, existing?.label ?? label]);
    } else {
      setBusy('other');
      try {
        const opt = await createQualificationOption(label);
        setOptions((o) => [...(o || []), opt]);
        if (!isOn(opt.label)) onChange([...selected, opt.label]);
      } catch (err) {
        toast.error(apiMessage(err, 'Could not add it'));
        return;
      } finally {
        setBusy(null);
      }
    }
    setOtherLabel('');
    setOtherOpen(false);
    setOtherSave(false);
  };

  // Ticked on this job but not in the shared list ("Other" entries, or options removed later): keep them visible.
  const orphans = selected.filter((s) => !(options || []).some((o) => o.label.toLowerCase() === s.toLowerCase()));

  const add = async () => {
    const label = newLabel.replace(/\s+/g, ' ').trim();
    if (!label) return;
    setBusy('new');
    try {
      const opt = await createQualificationOption(label);
      setOptions((o) => [...(o || []), opt]);
      setNewLabel('');
      if (!isOn(opt.label)) onChange([...selected, opt.label]);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not add it'));
    } finally {
      setBusy(null);
    }
  };

  const rename = async (opt: QualificationOption) => {
    const label = (drafts[opt._id] ?? opt.label).replace(/\s+/g, ' ').trim();
    if (!label || label === opt.label) {
      dropDraft(opt._id);
      return;
    }
    setBusy(opt._id);
    try {
      const updated = await updateQualificationOption(opt._id, label);
      setOptions((o) => (o || []).map((x) => (x._id === opt._id ? updated : x)));
      dropDraft(opt._id);
      // Keep this job's tick on the renamed option.
      if (isOn(opt.label)) onChange(selected.map((s) => (s.toLowerCase() === opt.label.toLowerCase() ? updated.label : s)));
    } catch (err) {
      toast.error(apiMessage(err, 'Could not rename it'));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (opt: QualificationOption) => {
    setBusy(opt._id);
    try {
      await deleteQualificationOption(opt._id);
      setOptions((o) => (o || []).filter((x) => x._id !== opt._id));
      if (isOn(opt.label)) onChange(selected.filter((s) => s.toLowerCase() !== opt.label.toLowerCase()));
    } catch (err) {
      toast.error(apiMessage(err, 'Could not remove it'));
    } finally {
      setBusy(null);
    }
  };

  const chip = (label: string, on: boolean, key: string) => (
    <button
      key={key}
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={() => toggle(label)}
      className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
        on ? 'border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5 text-ocean' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
          on ? 'border-ocean bg-ocean text-white' : 'border-gray-300 bg-white'
        }`}
      >
        {on && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <GraduationCap className="h-4 w-4 text-ocean" />
          Education
        </span>
        <button
          type="button"
          onClick={() => {
            setEditing((v) => !v);
            setDrafts({});
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-ocean hover:text-navy"
        >
          {editing ? (
            <>
              <Check className="h-3.5 w-3.5" /> Done
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" /> Edit list
            </>
          )}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        {editing ? 'Changes to this list apply to every job form. Jobs already posted keep what they show.' : 'Tick everything accepted for this job. Use Other for anything not in the list.'}
      </p>

      {options === null ? (
        <div className="mt-3 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : editing ? (
        <div className="mt-3 space-y-2">
          {options.map((opt) => (
            <div key={opt._id} className="flex items-center gap-2">
              <input
                value={drafts[opt._id] ?? opt.label}
                onChange={(e) => setDrafts((d) => ({ ...d, [opt._id]: e.target.value }))}
                onBlur={() => rename(opt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === 'Escape') dropDraft(opt._id);
                }}
                maxLength={80}
                aria-label={`Rename ${opt.label}`}
                disabled={busy === opt._id}
                className="w-0 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm focus:border-ocean focus:bg-white focus:outline-none focus:ring-4 focus:ring-ocean/15"
              />
              <button
                type="button"
                onClick={() => remove(opt)}
                disabled={busy === opt._id}
                aria-label={`Remove ${opt.label}`}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
              maxLength={80}
              placeholder="Add an option, e.g. MBA"
              className="w-0 min-w-0 flex-1 rounded-xl border-2 border-dashed border-gray-200 bg-white px-3.5 py-2 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15"
            />
            <button
              type="button"
              onClick={add}
              disabled={!newLabel.trim() || busy === 'new'}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-navy px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((opt) => chip(opt.label, isOn(opt.label), opt._id))}
          {orphans.map((label) => (
            <button
              key={`orphan-${label}`}
              type="button"
              onClick={() => toggle(label)}
              title="Only for this job. Click to remove."
              aria-label={`Remove ${label}`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-ocean bg-gradient-to-br from-ocean/10 to-cyan/5 px-3 py-2 text-sm font-semibold text-ocean"
            >
              {label} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          {!otherOpen && (
            <button
              type="button"
              onClick={() => setOtherOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:border-ocean hover:text-ocean"
            >
              <Plus className="h-4 w-4" /> Other
            </button>
          )}
          {otherOpen && (
            <div className="w-full rounded-xl border border-ocean/30 bg-white p-3">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={otherLabel}
                  onChange={(e) => setOtherLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOther();
                    }
                    if (e.key === 'Escape') setOtherOpen(false);
                  }}
                  maxLength={80}
                  placeholder="e.g. Diploma, ITI, Any degree"
                  aria-label="Other qualification"
                  className="w-0 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm focus:border-ocean focus:bg-white focus:outline-none focus:ring-4 focus:ring-ocean/15"
                />
                <button
                  type="button"
                  onClick={addOther}
                  disabled={!otherLabel.trim() || busy === 'other'}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-navy px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtherOpen(false);
                    setOtherLabel('');
                  }}
                  aria-label="Cancel"
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={otherSave}
                  onChange={(e) => setOtherSave(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ocean"
                />
                Also add it to the list for future jobs
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
