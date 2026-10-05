import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  hover?: boolean;
  padding?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function Card({
  hover = false,
  padding = true,
  className,
  children,
  onClick,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-2xl border border-hairline bg-white shadow-soft',
        padding && 'p-6',
        hover && 'transition-all duration-300 hover:-translate-y-0.5 hover:border-ocean/30 hover:shadow-lift',
        onClick && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
}

Card.displayName = 'Card';

export { Card };
