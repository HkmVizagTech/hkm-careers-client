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
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        padding && 'p-6',
        hover && 'transition-shadow duration-200 hover:shadow-lg',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

Card.displayName = 'Card';

export { Card };
