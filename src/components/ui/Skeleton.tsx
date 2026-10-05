import React from 'react';
import { cn } from '@/lib/utils';

/** Shimmering placeholder block used while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-gradient-to-r from-surfaceSunken via-surfaceAlt to-surfaceSunken', className)}
    />
  );
}

/** Skeleton shaped like a job card, for the careers list. */
export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-soft" aria-hidden="true">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
    </div>
  );
}
