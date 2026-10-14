'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ListChecks, Plus, Trash2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { SelectField } from '@/components/ui/SelectField';
import type { QuestionType, ScreeningQuestion } from '@/types';

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'yesno', label: 'Yes / No' },
  { value: 'choice', label: 'Pick one option' },
  { value: 'number', label: 'Number' },
  { value: 'text', label: 'Short answer' },
  { value: 'paragraph', label: 'Long answer' },
];

/** One-click starters for common screening questions. */
const SUGGESTIONS: ScreeningQuestion[] = [
  { label: 'Can you work on weekends and festival days?', type: 'yesno', required: true, accept: ['yes'] },
  { label: 'Are you willing to relocate to Visakhapatnam?', type: 'yesno', required: true, accept: ['yes'] },
  { label: 'Can you read and speak Telugu?', type: 'yesno', required: true, accept: [] },
  { label: 'Expected monthly salary (₹)', type: 'number', required: true },
  { label: 'Notice period (days)', type: 'number', required: true },
  { label: 'Which shift suits you?', type: 'choice', required: true, options: ['Morning', 'Evening', 'Any'], accept: [] },
];

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

/** Builder for a job's screening questions (shown on the apply form). Answers that miss a requirement are flagged for HR. */
export default function ScreeningQuestionsEditor({
  questions,
  onChange,
}: {
  questions: ScreeningQuestion[];
  onChange: (q: ScreeningQuestion[]) => void;
}) {
  const [optionDraft, setOptionDraft] = useState<Record<number, string>>({});

  const update = (i: number, patch: Partial<ScreeningQuestion>) => onChange(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...questions];
    const [q] = next.splice(i, 1);
    next.splice(i + dir, 0, q);
    onChange(next);
  };
  const add = (q?: ScreeningQuestion) =>
    onChange([...questions, q ? { ...q, options: q.options ? [...q.options] : undefined, accept: q.accept ? [...q.accept] : undefined } : { label: '', type: 'yesno', required: true, accept: [] }]);

  const addOption = (i: number) => {
    const text = (optionDraft[i] || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const opts = questions[i].options || [];
    if (opts.some((o) => o.toLowerCase() === text.toLowerCase())) return;
    update(i, { options: [...opts, text] });
    setOptionDraft((d) => ({ ...d, [i]: '' }));
  };

  const unused = SUGGESTIONS.filter((s) => !questions.some((q) => q.label.toLowerCase() === s.label.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <ListChecks className="h-4 w-4 text-ocean" /> Screening questions
        </span>
        <span className="text-xs text-gray-400">{questions.length}/15</span>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Asked on the apply form. Set a required answer and anyone who doesn&apos;t meet it is flagged for you (never rejected automatically).
      </p>

      {questions.length > 0 && (
        <ol className="mt-3 space-y-3">
          {questions.map((q, i) => (
            <li key={q._id || i} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
              <div className="flex items-start gap-2">
                <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-navy/[0.07] text-xs font-bold text-navy">{i + 1}</span>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <input
                    value={q.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    maxLength={200}
                    placeholder="Question, e.g. Can you work on weekends?"
                    aria-label={`Question ${i + 1}`}
                    className={inputCls}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <SelectField
                      size="sm"
                      className="!w-48"
                      ariaLabel={`Answer type for question ${i + 1}`}
                      value={q.type}
                      onChange={(t) =>
                        update(i, {
                          type: t as QuestionType,
                          options: t === 'choice' ? q.options || [] : undefined,
                          accept: [],
                          min: null,
                          max: null,
                        })
                      }
                      options={TYPE_OPTIONS}
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
                      <Checkbox size="sm" checked={q.required} onChange={(required) => update(i, { required })} />
                      Must answer
                    </label>
                  </div>

                  {q.type === 'choice' && (
                    <div className="rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
                      <p className="mb-1.5 text-[11px] font-semibold text-gray-500">Options · tick the ones that are acceptable (leave all unticked for no requirement)</p>
                      <ul className="space-y-1">
                        {(q.options || []).map((o) => (
                          <li key={o} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              size="sm"
                              checked={!!q.accept?.includes(o)}
                              onChange={(on) => update(i, { accept: on ? [...(q.accept || []), o] : (q.accept || []).filter((a) => a !== o) })}
                            />
                            <span className="min-w-0 flex-1 truncate">{o}</span>
                            <button
                              type="button"
                              aria-label={`Remove option ${o}`}
                              onClick={() => update(i, { options: (q.options || []).filter((x) => x !== o), accept: (q.accept || []).filter((x) => x !== o) })}
                              className="rounded p-1 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={optionDraft[i] || ''}
                          onChange={(e) => setOptionDraft((d) => ({ ...d, [i]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOption(i);
                            }
                          }}
                          maxLength={100}
                          placeholder="Add an option"
                          className={`${inputCls} py-2`}
                        />
                        <button
                          type="button"
                          onClick={() => addOption(i)}
                          className="shrink-0 rounded-xl bg-navy px-3 text-xs font-semibold text-white hover:bg-ocean"
                        >
                          Add
                        </button>
                      </div>
                      {(q.options || []).length < 2 && <p className="mt-1.5 text-[11px] text-amber-700">Add at least two options.</p>}
                    </div>
                  )}

                  {q.type === 'yesno' && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="font-semibold">Required answer:</span>
                      <div className="flex rounded-lg bg-gray-100 p-0.5" role="radiogroup" aria-label="Required answer">
                        {[
                          { v: '', l: 'Any' },
                          { v: 'yes', l: 'Yes' },
                          { v: 'no', l: 'No' },
                        ].map((o) => {
                          const on = (q.accept?.[0] || '') === o.v;
                          return (
                            <button
                              key={o.l}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => update(i, { accept: o.v ? [o.v] : [] })}
                              className={`rounded-md px-3 py-1 font-semibold ${on ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
                            >
                              {o.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {q.type === 'number' && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="font-semibold">Flag if below</span>
                      <input
                        inputMode="decimal"
                        value={q.min ?? ''}
                        onChange={(e) => update(i, { min: e.target.value === '' ? null : Number(e.target.value.replace(/[^\d.]/g, '')) })}
                        aria-label="Minimum"
                        placeholder="—"
                        className="w-24 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-ocean focus:outline-none"
                      />
                      <span className="font-semibold">or above</span>
                      <input
                        inputMode="decimal"
                        value={q.max ?? ''}
                        onChange={(e) => update(i, { max: e.target.value === '' ? null : Number(e.target.value.replace(/[^\d.]/g, '')) })}
                        aria-label="Maximum"
                        placeholder="—"
                        className="w-24 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-ocean focus:outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded p-1 text-gray-400 hover:text-navy disabled:opacity-25">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === questions.length - 1}
                    aria-label="Move down"
                    className="rounded p-1 text-gray-400 hover:text-navy disabled:opacity-25"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(questions.filter((_, j) => j !== i))}
                    aria-label={`Delete question ${i + 1}`}
                    className="mt-1 rounded p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {questions.length < 15 && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => add()}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:border-ocean hover:text-ocean"
          >
            <Plus className="h-4 w-4" /> Add a question
          </button>
          {unused.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400">Quick add:</span>
              {unused.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => add(s)}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:text-ocean hover:ring-ocean/40"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
