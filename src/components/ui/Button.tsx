'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  primary: 'bg-navy text-white shadow-sm hover:bg-ocean hover:shadow-lift',
  secondary: 'bg-ocean text-white shadow-sm hover:bg-navy hover:shadow-lift',
  outline: 'border border-navy text-navy hover:bg-navy/5 bg-transparent',
  ghost: 'text-navy hover:bg-navy/5 bg-transparent',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  gold: 'bg-gradient-to-r from-gold to-goldDeep text-navy font-bold shadow-md shadow-gold/25 hover:shadow-lg hover:shadow-gold/40',
} as const;

const sizeStyles = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
