'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-200 min-h-[100px] resize-y',
            'focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error && textareaId ? `${textareaId}-error` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={textareaId ? `${textareaId}-error` : undefined}
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
