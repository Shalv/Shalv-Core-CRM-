import React from 'react';

/**
 * Colourful clipart-style icons for the ESS dashboard.
 *
 * Flat, multi-colour illustrations drawn inline as SVG — the graphic icon style used on
 * the dashboard cards. Vector only: no external images or stock art, crisp at any size.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 48 48' });

/** Attendance — a calendar with a ticked day. */
export const ClipartCalendar: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Attendance calendar">
    <defs>
      <linearGradient id="cc-bar" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5aa9f8" />
        <stop offset="100%" stopColor="#2f7fe0" />
      </linearGradient>
    </defs>
    <rect x="7" y="11" width="34" height="30" rx="6" fill="#ffffff" stroke="#dbe3ef" />
    <path d="M7 17a6 6 0 0 1 6-6h22a6 6 0 0 1 6 6v3H7z" fill="url(#cc-bar)" />
    <rect x="14" y="6" width="4" height="9" rx="2" fill="#1e4d5c" />
    <rect x="30" y="6" width="4" height="9" rx="2" fill="#1e4d5c" />
    <circle cx="17" cy="27" r="3" fill="#cfe0f7" />
    <circle cx="27" cy="27" r="3" fill="#cfe0f7" />
    <circle cx="17" cy="35" r="3" fill="#cfe0f7" />
    <path d="M25 35l3 3 6-7" fill="none" stroke="#03c95a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Leave — a sun over a palm frond. */
export const ClipartLeave: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Leave">
    <defs>
      <linearGradient id="cl-sun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd166" />
        <stop offset="100%" stopColor="#f5a524" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="17" r="9" fill="url(#cl-sun)" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <rect
        key={a}
        x="17.2"
        y="3"
        width="1.6"
        height="4.6"
        rx="0.8"
        fill="#f5a524"
        transform={`rotate(${a} 18 17)`}
      />
    ))}
    <path d="M40 40c-9-2-16-8-18-16 8 1 15 7 18 16z" fill="#03c95a" />
    <path d="M40 40c-2-9-8-15-16-17 1 9 7 16 16 17z" fill="#0f9d58" opacity="0.85" />
    <path d="M40 40C32 32 26 26 20 22" stroke="#0b7a44" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <rect x="6" y="38" width="36" height="4" rx="2" fill="#e8f0fe" />
  </svg>
);

/** Claims — a receipt with a coin. */
export const ClipartClaim: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Claims and reimbursements">
    <defs>
      <linearGradient id="ck-coin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd166" />
        <stop offset="100%" stopColor="#e8a317" />
      </linearGradient>
    </defs>
    <path
      d="M10 8h22a3 3 0 0 1 3 3v29l-4-3-4 3-4-3-4 3-4-3-4 3V11a3 3 0 0 1 3-3z"
      fill="#ffffff"
      stroke="#dbe3ef"
    />
    <rect x="15" y="15" width="14" height="2.6" rx="1.3" fill="#c8d4e6" />
    <rect x="15" y="21" width="11" height="2.6" rx="1.3" fill="#c8d4e6" />
    <rect x="15" y="27" width="8" height="2.6" rx="1.3" fill="#c8d4e6" />
    <circle cx="34" cy="33" r="9" fill="url(#ck-coin)" stroke="#ffffff" strokeWidth="2" />
    <path d="M34 28v10M31.4 30.4h4.2a1.9 1.9 0 0 1 0 3.8h-3.2a1.9 1.9 0 0 0 0 3.8h4.4" stroke="#8a5a00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </svg>
);

/** Pay — a wallet with coins. */
export const ClipartMoney: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Net pay">
    <defs>
      <linearGradient id="cm-wallet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f37438" />
        <stop offset="100%" stopColor="#e2541a" />
      </linearGradient>
      <linearGradient id="cm-coin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd166" />
        <stop offset="100%" stopColor="#e8a317" />
      </linearGradient>
    </defs>
    <rect x="6" y="15" width="36" height="24" rx="6" fill="url(#cm-wallet)" />
    <rect x="6" y="15" width="36" height="8" rx="4" fill="#d9520f" opacity="0.55" />
    <rect x="27" y="23" width="15" height="8" rx="4" fill="#ffffff" opacity="0.92" />
    <circle cx="34" cy="27" r="2.2" fill="#d9520f" />
    <circle cx="19" cy="12" r="6" fill="url(#cm-coin)" stroke="#ffffff" strokeWidth="2" />
    <path d="M19 8v8M17 9.6h3a1.5 1.5 0 0 1 0 3h-2.2a1.5 1.5 0 0 0 0 3h3.4" stroke="#8a5a00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

/** Punch — a clock. */
export const ClipartClock: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Punch clock">
    <defs>
      <linearGradient id="cp-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7c9cff" />
        <stop offset="100%" stopColor="#4a6cf7" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="25" r="16" fill="#ffffff" stroke="url(#cp-ring)" strokeWidth="4" />
    <path d="M24 16v9l6 4" stroke="#f26522" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="25" r="2.6" fill="#1e4d5c" />
    <rect x="19" y="4" width="10" height="4" rx="2" fill="#1e4d5c" />
  </svg>
);

/** Payslip — a document with a tick. */
export const ClipartPayslip: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Payslip">
    <path d="M12 5h17l8 8v30a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#ffffff" stroke="#dbe3ef" />
    <path d="M29 5l8 8h-8z" fill="#cfe0f7" />
    <rect x="15" y="19" width="17" height="2.6" rx="1.3" fill="#c8d4e6" />
    <rect x="15" y="25" width="13" height="2.6" rx="1.3" fill="#c8d4e6" />
    <rect x="15" y="31" width="9" height="2.6" rx="1.3" fill="#c8d4e6" />
    <circle cx="34" cy="35" r="8" fill="#03c95a" stroke="#ffffff" strokeWidth="2" />
    <path d="M30.5 35l2.6 2.6 5-5.4" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Help desk — a support ticket. */
export const ClipartTicket: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Help desk">
    <defs>
      <linearGradient id="ct-tick" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f37438" />
        <stop offset="100%" stopColor="#e2541a" />
      </linearGradient>
    </defs>
    <path
      d="M6 16a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v5a4 4 0 0 0 0 8v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4v-5a4 4 0 0 0 0-8z"
      fill="url(#ct-tick)"
    />
    <path d="M24 13v24" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 4" opacity="0.75" />
    <circle cx="33" cy="25" r="6" fill="#ffffff" />
    <path d="M30.4 25l1.9 2 3.5-3.8" fill="none" stroke="#e2541a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="11" y="21" width="8" height="2.4" rx="1.2" fill="#ffffff" opacity="0.85" />
    <rect x="11" y="27" width="5" height="2.4" rx="1.2" fill="#ffffff" opacity="0.65" />
  </svg>
);

/** Career — a rocket. */
export const ClipartRocket: React.FC<IconProps> = ({ size = 40, className }) => (
  <svg {...base(size)} className={className} role="img" aria-label="Career and growth">
    <defs>
      <linearGradient id="cr-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e6ecf7" />
      </linearGradient>
      <linearGradient id="cr-flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffd166" />
        <stop offset="100%" stopColor="#f26522" />
      </linearGradient>
    </defs>
    <path d="M24 4c7 5 10 12 10 19l-4 5H18l-4-5c0-7 3-14 10-19z" fill="url(#cr-body)" stroke="#dbe3ef" />
    <circle cx="24" cy="19" r="4.6" fill="#4a6cf7" stroke="#ffffff" strokeWidth="1.6" />
    <path d="M14 24l-5 6 6-1zM34 24l5 6-6-1z" fill="#f26522" />
    <path d="M20 29h8l-4 11z" fill="url(#cr-flame)" />
    <circle cx="40" cy="10" r="2" fill="#ffd166" />
    <circle cx="8" cy="14" r="1.6" fill="#7c9cff" />
  </svg>
);

/** A small brand-style app tile, used for module headers. */
export const ClipartAppTile: React.FC<{ size?: number; className?: string; hue?: string }> = ({
  size = 40,
  className,
  hue = '#4a6cf7',
}) => (
  <svg {...base(size)} className={className} role="img" aria-label="Module">
    <defs>
      <linearGradient id={`at-${hue.replace('#', '')}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={hue} stopOpacity="0.95" />
        <stop offset="100%" stopColor={hue} stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="38" height="38" rx="11" fill={`url(#at-${hue.replace('#', '')})`} />
    <rect x="14" y="15" width="20" height="3" rx="1.5" fill="#ffffff" opacity="0.9" />
    <rect x="14" y="22" width="14" height="3" rx="1.5" fill="#ffffff" opacity="0.7" />
    <rect x="14" y="29" width="9" height="3" rx="1.5" fill="#ffffff" opacity="0.5" />
  </svg>
);

export default ClipartCalendar;
