import React, { useState } from 'react';
import { Clock, LogIn, LogOut, ChevronDown, Building2, ChevronRight } from 'lucide-react';

export interface PayChakraMetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  colorBg?: string; // e.g. "bg-sky-50 text-sky-600"
  badgeColor?: string; // e.g. "bg-emerald-500"
  onClick?: () => void;
}

interface PayChakraScreenHeaderProps {
  title: string;
  subtitle: string;
  shiftTime?: string;
  isPunchedIn: boolean;
  onPunchToggle: () => void;
  onSwitchToCrm?: () => void;
  onSignOut: () => void;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  metrics?: PayChakraMetricItem[];
}

export const PayChakraScreenHeader: React.FC<PayChakraScreenHeaderProps> = ({
  title,
  subtitle,
  shiftTime = '09:30 AM',
  isPunchedIn,
  onPunchToggle,
  onSwitchToCrm,
  onSignOut,
  primaryAction,
  secondaryAction,
  metrics,
}) => {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. TOP PAGE HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Right Action Cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shift Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your shift · {shiftTime}</span>
          </div>

          {/* Punch Button: Punch out (red outline) or Punch in (emerald outline) */}
          <button
            type="button"
            onClick={onPunchToggle}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              isPunchedIn
                ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50'
                : 'bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-50'
            }`}
            title={isPunchedIn ? 'Punch Out for shift' : 'Punch In with GPS Location'}
          >
            {isPunchedIn ? (
              <>
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Punch out</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Punch in</span>
              </>
            )}
          </button>

          {/* Workspace Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWorkspaceMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs transition"
            >
              <span>Admin workspace</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>
                {onSwitchToCrm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      onSwitchToCrm();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>CRM Enterprise Workspace</span>
                  </button>
                )}
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onSignOut();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Secondary Action (if provided) */}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {/* Primary Action Button (if provided) */}
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-semibold shadow-xs cursor-pointer transition"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. OPTIONAL KPI METRICS ROW (4 Cards) */}
      {metrics && metrics.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(metrics.length, 4)} gap-4`}>
          {metrics.map((m, idx) => (
            <div
              key={idx}
              onClick={m.onClick}
              className={`bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs transition-all flex flex-col justify-between ${
                m.onClick ? 'hover:shadow-xs hover:border-slate-300 cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    m.colorBg || 'bg-teal-50 text-teal-600'
                  }`}
                >
                  {m.icon}
                </div>
                {m.onClick && <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-500 font-medium">{m.label}</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight font-mono">
                  {m.value}
                </div>
                {m.subtext && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${m.badgeColor || 'bg-emerald-500'}`}
                    />
                    <span>{m.subtext}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
