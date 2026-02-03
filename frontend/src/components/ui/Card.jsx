'use client';

import { clsx } from 'clsx';

export default function Card({
  children,
  className = '',
  padding = 'md',
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-[var(--background)] border border-[var(--border)] rounded-xl',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
