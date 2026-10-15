import React from 'react';
import { Illustration, type IllustrationName } from './Illustration';

/**
 * Consistent, modern empty state used across every list/table screen.
 * Replaces ad-hoc "no records" text with an illustration, a clear title and an optional action.
 */
export function EmptyState({
  title,
  message,
  illustration = 'generic',
  action,
  compact = false,
}: {
  title: string;
  message?: string;
  illustration?: IllustrationName;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="empty-state animate-rise" style={{ padding: compact ? '1.5rem 1rem' : undefined }}>
      {!compact && <Illustration name={illustration} />}
      <h3 className="text-base font-bold text-slate-800 mt-3">{title}</h3>
      {message && <p className="text-[12.5px] text-slate-500 mt-1 max-w-md">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
