import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export type StatTone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'cyan' | 'slate';

/**
 * Modern KPI / stat tile: an icon chip, a large tabular value, a caption and an optional delta.
 * Used by the dashboards and by list-view summary strips so every screen shares one look.
 */
export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = 'indigo',
  delta,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  tone?: StatTone;
  delta?: { value: string; direction: 'up' | 'down' };
  onClick?: () => void;
}) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`stat-tile text-left p-4 w-full ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block truncate">{label}</span>
          <span className="stat-value text-2xl text-slate-900 block mt-1.5 truncate">{value}</span>
          {sub && <span className="text-[11px] text-slate-400 block mt-1 truncate">{sub}</span>}
        </div>
        {icon && <div className={`icon-depth icon-depth-${tone} w-10 h-10 shrink-0`}>{icon}</div>}
      </div>
      {delta && (
        <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-semibold ${delta.direction === 'up' ? 'stat-delta-up' : 'stat-delta-down'}`}>
          {delta.direction === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {delta.value}
        </span>
      )}
    </Comp>
  );
}

export default StatTile;
