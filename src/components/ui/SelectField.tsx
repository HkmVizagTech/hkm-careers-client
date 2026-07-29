'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePopover, FIELD_TRIGGER_CLASS } from './usePopover';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional leading glyph, e.g. an emoji or short code. */
  hint?: string;
}

export interface SelectFieldProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  icon?: LucideIcon;
  /** Groups options under sticky headings. Keys must match `option.group`. */
  maxHeight?: number;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Select',
  error = false,
  icon: Icon,
  maxHeight = 280,
}: SelectFieldProps) {
  const { open, setOpen, position, triggerRef, popoverRef } = usePopover({
    width: 'trigger',
    estimatedHeight: maxHeight + 16,
  });
  const [mounted, setMounted] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);

  // Open the list with the current selection focused.
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, options.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const opt = options[highlight];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, highlight, options, onChange, setOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${FIELD_TRIGGER_CLASS} ${
          error ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
        } ${open ? 'border-ocean ring-2 ring-ocean/30' : 'hover:border-gray-400'}`}
      >
        {Icon && (
          <Icon className={`h-4 w-4 flex-shrink-0 ${open ? 'text-ocean' : 'text-gray-400'}`} />
        )}
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-ocean' : ''
          }`}
        />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && position && (
              <motion.div
                ref={popoverRef}
                role="listbox"
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
                  maxHeight,
                }}
                className="overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl shadow-navy/20"
              >
                {options.map((opt, i) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value || `empty-${i}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-r from-navy to-ocean font-semibold text-white'
                          : i === highlight
                            ? 'bg-ocean/10 text-ocean'
                            : 'text-gray-700'
                      }`}
                    >
                      {opt.hint && (
                        <span
                          className={`text-xs font-bold ${isSelected ? 'text-white/70' : 'text-gray-400'}`}
                        >
                          {opt.hint}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
