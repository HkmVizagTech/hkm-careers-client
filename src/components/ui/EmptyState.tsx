import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className="mb-5 rounded-full bg-gradient-to-br from-ocean/10 to-cyan/20 p-5 ring-8 ring-ocean/5">
        <Icon className="h-8 w-8 text-ocean" strokeWidth={1.5} />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-navy">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

export { EmptyState };
