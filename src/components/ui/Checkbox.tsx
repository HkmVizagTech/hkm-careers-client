'use client';

import { Check } from 'lucide-react';

/**
 * Styled checkbox: a real (visually hidden) input, so labels, keyboard (Space) and screen readers work as usual.
 * Put it inside a <label> together with its text.
 */
export function Checkbox({
  checked,
  onChange,
  tone = 'ocean',
  size = 'md',
  className = '',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone?: 'ocean' | 'emerald' | 'plum';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const on = { ocean: 'border-ocean bg-ocean', emerald: 'border-emerald-600 bg-emerald-600', plum: 'border-plum bg-plum' }[tone];
  const ring = { ocean: 'peer-focus-visible:ring-ocean/30', emerald: 'peer-focus-visible:ring-emerald-500/30', plum: 'peer-focus-visible:ring-plum/30' }[tone];
  const box = size === 'sm' ? 'h-4 w-4 rounded' : 'h-[18px] w-[18px] rounded-md';
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex items-center justify-center border-2 text-white transition-colors peer-focus-visible:ring-4 ${ring} ${box} ${
          checked ? on : 'border-gray-300 bg-white'
        }`}
      >
        {checked && <Check className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={3} />}
      </span>
    </span>
  );
}
