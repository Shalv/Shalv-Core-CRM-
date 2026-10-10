import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface DateRange {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
  compact?: boolean;
}

// Helper: check if a date string falls within a DateRange
export function isDateInRange(dateStr?: string | null, range?: DateRange): boolean {
  if (!dateStr || !range) return true;
  // Normalize date string to YYYY-MM-DD if ISO timestamp
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  if (range.startDate && cleanDate < range.startDate) return false;
  if (range.endDate && cleanDate > range.endDate) return false;
  return true;
}

// Helper: Format YYYY-MM-DD to readable format e.g. "01 Apr 2026"
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Helper: Get ISO Date string YYYY-MM-DD
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface PresetOption {
  id: string;
  label: string;
  getRange: () => DateRange;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select Date Range',
  align = 'right',
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary local state while picker popover is open
  const [tempStart, setTempStart] = useState<string>(value.startDate || '');
  const [tempEnd, setTempEnd] = useState<string>(value.endDate || '');
  const [activePreset, setActivePreset] = useState<string>('');

  // Calendar month navigation
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value.startDate) {
      const [y, m] = value.startDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Sync temp state with incoming value
  useEffect(() => {
    setTempStart(value.startDate || '');
    setTempEnd(value.endDate || '');
  }, [value.startDate, value.endDate]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Standard Presets
  const presets: PresetOption[] = [
    {
      id: 'all_time',
      label: 'All Time',
      getRange: () => ({ startDate: '', endDate: '' }),
    },
    {
      id: 'today',
      label: 'Today',
      getRange: () => {
        const now = new Date();
        const iso = toIsoDate(now);
        return { startDate: iso, endDate: iso };
      },
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      getRange: () => {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const iso = toIsoDate(yest);
        return { startDate: iso, endDate: iso };
      },
    },
    {
      id: 'last_7_days',
      label: 'Last 7 Days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
      },
    },
    {
      id: 'last_30_days',
      label: 'Last 30 Days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
      },
    },
    {
      id: 'this_month',
      label: 'This Month',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
      },
    },
    {
      id: 'last_month',
      label: 'Last Month',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
      },
    },
    {
      id: 'this_quarter',
      label: 'This Quarter',
      getRange: () => {
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), q * 3, 1);
        const end = new Date(now.getFullYear(), (q + 1) * 3, 0);
        return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
      },
    },
    {
      id: 'current_fy',
      label: 'Current FY (Apr - Mar)',
      getRange: () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        // Indian Financial Year: Apr 1 of current or previous year
        const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
        const start = new Date(fyStartYear, 3, 1); // Apr 1
        const end = new Date(fyStartYear + 1, 2, 31); // Mar 31
        return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
      },
    },
  ];

  const handleSelectPreset = (p: PresetOption) => {
    const range = p.getRange();
    setTempStart(range.startDate);
    setTempEnd(range.endDate);
    setActivePreset(p.id);

    if (range.startDate) {
      const [y, m] = range.startDate.split('-').map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }

    // Direct apply on preset click for snappy UX
    onChange(range);
    setIsOpen(false);
  };

  const handleApply = () => {
    let s = tempStart;
    let e = tempEnd;
    // Swap if start is after end
    if (s && e && s > e) {
      const swap = s;
      s = e;
      e = swap;
    }
    onChange({ startDate: s, endDate: e });
    setIsOpen(false);
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempStart('');
    setTempEnd('');
    setActivePreset('all_time');
    onChange({ startDate: '', endDate: '' });
    setIsOpen(false);
  };

  const hasFilter = Boolean(value.startDate || value.endDate);

  // Label text representation of current selection
  const getDisplayText = () => {
    if (!value.startDate && !value.endDate) {
      return placeholder;
    }
    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        return formatDisplayDate(value.startDate);
      }
      return `${formatDisplayDate(value.startDate)} – ${formatDisplayDate(value.endDate)}`;
    }
    if (value.startDate && !value.endDate) {
      return `From ${formatDisplayDate(value.startDate)}`;
    }
    return `Up to ${formatDisplayDate(value.endDate!)}`;
  };

  // Calendar Day Click Handler
  const handleDayClick = (dateStr: string) => {
    setActivePreset('custom');
    if (!tempStart || (tempStart && tempEnd)) {
      // Start a new selection
      setTempStart(dateStr);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      // Complete selection
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  // Calendar Generation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-xs ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        {label && (
          <span className="text-[11px] font-semibold text-slate-500">{label}:</span>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 border rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs select-none ${
            compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
          } ${
            hasFilter
              ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 hover:bg-indigo-100/70'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
          title="Filter by custom date range"
        >
          <CalendarIcon
            className={`w-3.5 h-3.5 shrink-0 ${
              hasFilter ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span className="truncate max-w-[210px]">{getDisplayText()}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'
            }`}
          />
        </button>

        {/* Quick Clear Reset Button */}
        {hasFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-w-[340px] sm:min-w-[490px] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{
            animation: 'fadeIn 120ms ease-out',
          }}
        >
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Left Sidebar: Quick Presets */}
            <div className="sm:w-44 bg-slate-50/70 p-3 space-y-1 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                {presets.map((p) => {
                  const isCurrent =
                    activePreset === p.id ||
                    (p.id === 'all_time' && !tempStart && !tempEnd);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      {isCurrent && <Check className="w-3 h-3 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Calendar & Exact Inputs */}
            <div className="p-3.5 flex-1 space-y-3">
              {/* Inputs Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => {
                      setTempStart(e.target.value);
                      setActivePreset('custom');
                      if (e.target.value) {
                        const [y, m] = e.target.value.split('-').map(Number);
                        setViewDate(new Date(y, m - 1, 1));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => {
                      setTempEnd(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Month Navigator Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-900 text-xs">
                  {monthNames[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Month Calendar Grid */}
              <div className="border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                {/* Days of week header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-7 w-7" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isStart = tempStart === dateStr;
                    const isEnd = tempEnd === dateStr;
                    const isInRange =
                      tempStart &&
                      tempEnd &&
                      dateStr >= tempStart &&
                      dateStr <= tempEnd;

                    let cellStyle =
                      'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700';
                    if (isStart || isEnd) {
                      cellStyle =
                        'bg-indigo-600 text-white font-bold rounded-lg shadow-2xs';
                    } else if (isInRange) {
                      cellStyle =
                        'bg-indigo-100/70 text-indigo-900 rounded-none';
                    }

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDayClick(dateStr)}
                        className={`h-7 w-7 mx-auto flex items-center justify-center rounded-md font-mono text-[11px] transition-colors cursor-pointer ${cellStyle}`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleReset()}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
