import React from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-navy text-white',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-ocean',

  // Job type variants
  'full-time': 'bg-navy/10 text-navy',
  'part-time': 'bg-ocean/10 text-ocean',
  volunteer: 'bg-green-100 text-green-700',
  intern: 'bg-amber-100 text-amber-700',
  internship: 'bg-amber-100 text-amber-700',

  // Application status variants
  received: 'bg-gray-100 text-gray-700',
  'under-review': 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-cyan-100 text-cyan-700',
  interview: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-amber-100 text-amber-700',
  selected: 'bg-green-100 text-green-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
} as const;

export interface BadgeProps {
  variant?: keyof typeof variantStyles;
  children: React.ReactNode;
  className?: string;
}

function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export { Badge };
