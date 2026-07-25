import React from 'react';
import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizeStyles;
  className?: string;
}

function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-ocean/30 border-t-ocean',
        sizeStyles[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

Spinner.displayName = 'Spinner';

export { Spinner };
