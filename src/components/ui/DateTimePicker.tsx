'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { SelectField } from './SelectField';

/**
 * Inline date + time picker for scheduling (replaces the browser's datetime-local box).
 * Value is a local "YYYY-MM-DDTHH:mm" string, the same format datetime-local used.
 *
 * Keyboard: arrows move between days, PageUp/PageDown change month, Home/End jump within the week,
 * Enter/Space picks the day. Time slots are radio buttons; "Other time" gives hour/minute selects.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = [
  { short: 'Mo', long: 'Monday' },
  { short: 'Tu', long: 'Tuesday' },
  { short: 'We', long: 'Wednesday' },
  { short: 'Th', long: 'Thursday' },
  { short: 'Fr', long: 'Friday' },
  { short: 'Sa', long: 'Saturday' },
  { short: 'Su', long: 'Sunday' },
];

const PERIODS = [
  { key: 'morning', label: 'Morning', from: 8 * 60, to: 12 * 60 },
  { key: 'afternoon', label: 'Afternoon', from: 12 * 60, to: 16 * 60 + 30 },
  { key: 'evening', label: 'Evening', from: 16 * 60 + 30, to: 20 * 60 + 30 },
] as const;
type PeriodKey = (typeof PERIODS)[number]['key'];

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && dateKey(a) === dateKey(b);

export function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
}

function parse(value?: string): { day: Date | null; minutes: number | null } {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return { day: null, minutes: null };
  return { day: new Date(+m[1], +m[2] - 1, +m[3]), minutes: m[4] ? +m[4] * 60 + +m[5] : null };
}

function periodOf(minutes: number | null): PeriodKey {
  if (minutes === null) return 'morning';
  return (PERIODS.find((p) => minutes >= p.from && minutes < p.to) || PERIODS[minutes < 8 * 60 ? 0 : 2]).key;
}

export interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Days before today can't be picked (default true). */
  disablePast?: boolean;
  idPrefix?: string;
  /** Called when a time slot is clicked (the value is then complete), e.g. to collapse the picker. */
  onTimePicked?: () => void;
}

export function DateTimePicker({ value, onChange, disablePast = true, idPrefix = 'dtp', onTimePicked }: DateTimePickerProps) {
  const today = startOfDay(new Date());
  const { day, minutes } = parse(value);
  const [view, setView] = useState(() => new Date((day || today).getFullYear(), (day || today).getMonth(), 1));
  const [focusDay, setFocusDay] = useState<Date>(day || today);
  const [period, setPeriod] = useState<PeriodKey>(periodOf(minutes));
  const [custom, setCustom] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  // A value set from outside (e.g. opening "Reschedule") moves the calendar to it.
  useEffect(() => {
    if (!day) return;
    setView(new Date(day.getFullYear(), day.getMonth(), 1));
    setFocusDay(day);
    if (minutes !== null) setPeriod(periodOf(minutes));
    if (minutes !== null && minutes % 30 !== 0) setCustom(true);
  }, [value ? value.slice(0, 10) : '']); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep keyboard focus on the focused day after arrow keys.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dateKey(focusDay)}"]`)?.focus();
  }, [focusDay, view]);

  const isDisabled = (d: Date) => disablePast && d < today;

  const emit = (d: Date | null, mins: number | null) => {
    if (!d) return;
    const m = mins ?? (minutes !== null ? minutes : null);
    // No time yet: keep only the day so the time slots light up; the parent sees an incomplete value.
    onChange(m === null ? `${dateKey(d)}T` : `${dateKey(d)}T${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  };

  const pickDay = (d: Date) => {
    if (isDisabled(d)) return;
    setFocusDay(d);
    if (d.getMonth() !== view.getMonth()) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    // Keep the chosen time unless it's already over on that day.
    const keep = minutes !== null && !(sameDay(d, new Date()) && minutes <= nowMinutes()) ? minutes : null;
    emit(d, keep);
  };

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [view]);
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).filter(
    (wk, i) => i < 5 || wk.some((d) => d.getMonth() === view.getMonth())
  );

  const onGridKey = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: Date | null = null;
    if (e.key in step) next = addDays(focusDay, step[e.key]);
    else if (e.key === 'Home') next = addDays(focusDay, -((focusDay.getDay() + 6) % 7));
    else if (e.key === 'End') next = addDays(focusDay, 6 - ((focusDay.getDay() + 6) % 7));
    else if (e.key === 'PageUp') next = new Date(focusDay.getFullYear(), focusDay.getMonth() - 1, focusDay.getDate());
    else if (e.key === 'PageDown') next = new Date(focusDay.getFullYear(), focusDay.getMonth() + 1, focusDay.getDate());
    if (!next) return;
    e.preventDefault();
    moveFocus.current = true;
    setFocusDay(next);
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const quick = [
    { label: 'Today', d: today },
    { label: 'Tomorrow', d: addDays(today, 1) },
    { label: 'Day after', d: addDays(today, 2) },
    { label: 'Next Monday', d: addDays(today, ((8 - today.getDay()) % 7) || 7) },
  ];

  const activePeriod = PERIODS.find((p) => p.key === period)!;
  const slots: number[] = [];
  for (let t = activePeriod.from; t < activePeriod.to; t += 30) slots.push(t);
  const slotPast = (t: number) => !!day && sameDay(day, new Date()) && t <= nowMinutes();

  const canPrev = !disablePast || view > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---- Date ---- */}
      <div>
        <div className="flex flex-wrap gap-1.5" aria-label="Quick dates">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => pickDay(q.d)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                sameDay(day, q.d) ? 'bg-plum text-white ring-plum' : 'bg-white text-gray-600 ring-gray-200 hover:text-plum hover:ring-plum/40'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              disabled={!canPrev}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-navy" aria-live="polite" id={`${idPrefix}-month`}>
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div ref={gridRef} role="grid" aria-labelledby={`${idPrefix}-month`} onKeyDown={onGridKey} className="mt-2">
            <div role="row" className="grid grid-cols-7">
              {WEEKDAYS.map((w) => (
                <span key={w.long} role="columnheader" aria-label={w.long} className="py-1 text-center text-[11px] font-semibold text-gray-400">
                  {w.short}
                </span>
              ))}
            </div>
            {weeks.map((wk, wi) => (
              <div role="row" key={wi} className="grid grid-cols-7">
                {wk.map((d) => {
                  const inMonth = d.getMonth() === view.getMonth();
                  const selected = sameDay(d, day);
                  const isToday = sameDay(d, today);
                  const disabled = isDisabled(d);
                  const focusable = sameDay(d, focusDay);
                  return (
                    <div role="gridcell" key={dateKey(d)} aria-selected={selected} className="flex justify-center py-0.5">
                      <button
                        type="button"
                        data-day={dateKey(d)}
                        tabIndex={focusable ? 0 : -1}
                        disabled={disabled}
                        onClick={() => pickDay(d)}
                        aria-label={d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        aria-current={isToday ? 'date' : undefined}
                        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-1 ${
                          selected
                            ? 'bg-plum font-bold text-white shadow-sm'
                            : disabled
                              ? 'cursor-not-allowed text-gray-300'
                              : inMonth
                                ? 'font-medium text-gray-800 hover:bg-plum/10'
                                : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {d.getDate()}
                        {isToday && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-plum" aria-hidden />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Time ---- */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <Clock className="h-3.5 w-3.5" /> Time {day ? '' : <span className="font-normal text-gray-400">(pick a date first)</span>}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Part of the day">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={period === p.key && !custom}
              onClick={() => {
                setPeriod(p.key);
                setCustom(false);
              }}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                period === p.key && !custom ? 'bg-white text-plum shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {!custom ? (
          <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={`${activePeriod.label} times`}>
            {slots.map((t) => {
              const on = minutes === t;
              const off = !day || slotPast(t);
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={off}
                  onClick={() => {
                    emit(day, t);
                    onTimePicked?.();
                  }}
                  className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-plum ${
                    on
                      ? 'border-plum bg-plum text-white'
                      : off
                        ? 'cursor-not-allowed border-gray-100 text-gray-300'
                        : 'border-gray-200 text-gray-700 hover:border-plum/40 hover:text-plum'
                  }`}
                >
                  {formatTime(t)}
                </button>
              );
            })}
          </div>
        ) : (
          <CustomTime minutes={minutes} disabled={!day} onPick={(t) => emit(day, t)} />
        )}
        <button
          type="button"
          onClick={() => setCustom((c) => !c)}
          className="mt-2 text-xs font-semibold text-ocean hover:text-navy"
        >
          {custom ? 'Show time slots' : 'Other time…'}
        </button>
      </div>
    </div>
  );
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

/** Hour / minute / am-pm pickers for times that aren't on the half hour. */
function CustomTime({ minutes, disabled, onPick }: { minutes: number | null; disabled: boolean; onPick: (m: number) => void }) {
  const m = minutes ?? 10 * 60;
  const h24 = Math.floor(m / 60);
  const hour12 = ((h24 + 11) % 12) + 1;
  const min = m % 60;
  const pm = h24 >= 12;
  const set = (h: number, mm: number, isPm: boolean) => onPick(((h % 12) + (isPm ? 12 : 0)) * 60 + mm);
  return (
    <div className="mt-2 grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-1.5">
      <SelectField
        size="sm"
        ariaLabel="Hour"
        disabled={disabled}
        value={String(hour12)}
        onChange={(v) => set(+v, min, pm)}
        options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
        maxHeight={220}
      />
      <span className="font-bold text-gray-400">:</span>
      <SelectField
        size="sm"
        ariaLabel="Minutes"
        disabled={disabled}
        value={String(min - (min % 5))}
        onChange={(v) => set(hour12, +v, pm)}
        options={Array.from({ length: 12 }, (_, i) => ({ value: String(i * 5), label: pad(i * 5) }))}
        maxHeight={220}
      />
      <SelectField
        size="sm"
        ariaLabel="AM or PM"
        disabled={disabled}
        value={pm ? 'pm' : 'am'}
        onChange={(v) => set(hour12, min, v === 'pm')}
        options={[
          { value: 'am', label: 'am' },
          { value: 'pm', label: 'pm' },
        ]}
      />
    </div>
  );
}

/** "Fri, 16 Oct · 10:30 am" for a picker value, or '' when incomplete. */
export function describeDateTime(value: string) {
  const { day, minutes } = parse(value);
  if (!day) return '';
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  if (day.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  const d = day.toLocaleDateString('en-IN', opts);
  return minutes === null ? d : `${d} · ${formatTime(minutes)}`;
}

/** True when the value has both a date and a time. */
export const isCompleteDateTime = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
