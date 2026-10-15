import React from 'react';
import { Building2 } from 'lucide-react';

export const PayChakraFooter: React.FC = () => {
  return (
    <footer className="w-full shrink-0 bg-white border-t border-slate-200/90 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 select-none">
      <div className="flex items-center gap-2">
        {/* CoreEnact Stylized Box Icon */}
        <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center p-0.5">
          <svg className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="font-bold text-slate-800">CoreEnact Solutions</span>
        <span className="text-slate-300 font-light" aria-hidden="true">
          |
        </span>
        <span className="text-slate-500 font-normal">Powering People Operations</span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span>PayChakra v2.4</span>
        <span aria-hidden="true">·</span>
        <span>Enterprise HRMS &amp; Unified Payroll Cloud</span>
      </div>
    </footer>
  );
};
