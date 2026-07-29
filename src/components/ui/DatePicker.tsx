'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePopover, FIELD_TRIGGER_CLASS } from './usePopover';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CALENDAR_WIDTH = 300;

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  minYear?: number;
  maxYear?: number;
  /** Blocks selection of dates after today. */
  disableFuture?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Parses an ISO yyyy-mm-dd string without timezone drift. */
function parseISO(iso?: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplay(date: Date) {
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  error = false,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
  disableFuture = false,
}: DatePickerProps) {
  const selected = parseISO(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { open, setOpen, position, triggerRef, popoverRef } = usePopover({
    width: CALENDAR_WIDTH,
    estimatedHeight: 350,
  });

  const [viewMonth, setViewMonth] = useState((selected || today).getMonth());
  const [viewYear, setViewYear] = useState((selected || today).getFullYear());
  const [yearListOpen, setYearListOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Re-sync the visible month when the value changes from outside.
  useEffect(() => {
    if (selected) {
      setViewMonth(selected.getMonth());
      setViewYear(selected.getFullYear());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) setYearListOpen(false);
  }, [open]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const pick = (day: number) => {
    onChange(toISO(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  };

  const isDisabled = (day: number) =>
    disableFuture && new Date(viewYear, viewMonth, day) > today;

  const isSelected = (day: number) =>
    !!selected &&
    selected.getDate() === day &&
    selected.getMonth() === viewMonth &&
    selected.getFullYear() === viewYear;

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`${FIELD_TRIGGER_CLASS} ${
          error ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
        } ${open ? 'border-ocean ring-2 ring-ocean/30' : 'hover:border-gray-400'}`}
      >
        <Calendar className={`h-4 w-4 flex-shrink-0 ${open ? 'text-ocean' : 'text-gray-400'}`} />
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="ml-auto flex-shrink-0 rounded-md p-0.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && position && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: position.top,
                  left: position.left,
                  width: position.width,
                  zIndex: 9999,
                }}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-navy/20"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-navy via-ocean to-ocean px-3 py-3">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous month"
                    className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setYearListOpen((y) => !y)}
                    className="rounded-lg px-3 py-1 text-sm font-bold text-white transition-colors hover:bg-white/15"
                  >
                    {MONTHS[viewMonth]} {viewYear}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next month"
                    className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {yearListOpen ? (
                  <div className="max-h-[250px] overflow-y-auto p-3">
                    <div className="grid grid-cols-4 gap-1.5">
                      {years.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setViewYear(y);
                            setYearListOpen(false);
                          }}
                          className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                            y === viewYear
                              ? 'bg-gradient-to-br from-navy to-ocean text-white shadow-sm'
                              : 'text-gray-600 hover:bg-ocean/10 hover:text-ocean'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKDAYS.map((d, i) => (
                        <div
                          key={i}
                          className="flex h-8 items-center justify-center text-[11px] font-bold uppercase text-gray-400"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`blank-${i}`} className="h-8" />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const disabled = isDisabled(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={disabled}
                            onClick={() => pick(day)}
                            className={`flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                              isSelected(day)
                                ? 'bg-gradient-to-br from-navy to-ocean text-white shadow-md shadow-navy/20'
                                : disabled
                                  ? 'cursor-not-allowed text-gray-200'
                                  : isToday(day)
                                    ? 'bg-ocean/10 text-ocean ring-1 ring-inset ring-ocean/30 hover:bg-ocean/20'
                                    : 'text-gray-700 hover:bg-ocean/10 hover:text-ocean'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          onChange(toISO(today));
                          setOpen(false);
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ocean transition-colors hover:bg-ocean/10"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onChange('');
                          setOpen(false);
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
