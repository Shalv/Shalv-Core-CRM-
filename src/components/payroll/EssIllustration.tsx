import React from 'react';

/**
 * Colourful flat illustrations drawn inline as SVG — the graphic-card style used on the
 * dashboard. Vector only: no external images or stock art, crisp at any size.
 */

/** A person at a workspace — used on the dashboard promo / "your day" card. */
export const WorkspaceIllustration: React.FC<{ width?: number; height?: number }> = ({
  width = 210,
  height = 150,
}) => (
  <svg width={width} height={height} viewBox="0 0 210 150" role="img" aria-label="Employee at a workspace">
    <defs>
      <linearGradient id="ws-blob" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fdeee4" />
        <stop offset="100%" stopColor="#fef6f1" />
      </linearGradient>
      <linearGradient id="ws-screen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2c6e84" />
        <stop offset="100%" stopColor="#1e4d5c" />
      </linearGradient>
    </defs>

    {/* backdrop */}
    <ellipse cx="105" cy="132" rx="88" ry="12" fill="#eef1f6" />
    <circle cx="105" cy="70" r="62" fill="url(#ws-blob)" />

    {/* plant */}
    <g transform="translate(24,74)">
      <path d="M12 34 L6 8 Q14 2 22 8 L16 34 Z" fill="#03c95a" opacity="0.85" />
      <path d="M16 34 L16 10" stroke="#0f9d58" strokeWidth="1.6" />
      <path d="M2 34 L10 20 Q18 22 18 34 Z" fill="#0f9d58" opacity="0.9" />
      <rect x="2" y="34" width="24" height="16" rx="4" fill="#f26522" />
      <rect x="2" y="34" width="24" height="5" rx="2.5" fill="#d9520f" />
    </g>

    {/* desk */}
    <rect x="52" y="104" width="118" height="9" rx="4.5" fill="#1e4d5c" />
    <rect x="60" y="113" width="7" height="16" rx="3" fill="#16414f" />
    <rect x="155" y="113" width="7" height="16" rx="3" fill="#16414f" />

    {/* monitor */}
    <g transform="translate(88,52)">
      <rect x="0" y="0" width="64" height="42" rx="6" fill="#0f172a" />
      <rect x="4" y="4" width="56" height="34" rx="4" fill="url(#ws-screen)" />
      {/* chart on screen */}
      <path d="M10 30 L22 22 L32 26 L44 14 L52 18" fill="none" stroke="#f5b942" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="44" cy="14" r="2.6" fill="#ffffff" />
      <rect x="10" y="9" width="16" height="3" rx="1.5" fill="#ffffff" opacity="0.55" />
      <rect x="10" y="15" width="9" height="3" rx="1.5" fill="#ffffff" opacity="0.35" />
      <rect x="28" y="46" width="8" height="6" rx="2" fill="#0f172a" />
      <rect x="20" y="52" width="24" height="4" rx="2" fill="#1e4d5c" />
    </g>

    {/* person */}
    <g transform="translate(46,60)">
      <circle cx="18" cy="12" r="11" fill="#f3c39b" />
      <path d="M7 10 Q18 -3 29 10 Q29 4 18 2 Q7 4 7 10 Z" fill="#2b2b2b" />
      <path d="M6 44 Q6 24 18 24 Q30 24 30 44 Z" fill="#4a90e2" />
      <path d="M30 30 Q40 32 42 40" stroke="#f3c39b" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>

    {/* coffee */}
    <g transform="translate(166,86)">
      <rect x="0" y="0" width="14" height="17" rx="3" fill="#ffffff" stroke="#dfe5ee" />
      <path d="M14 4 q7 0 7 5 t-7 5" fill="none" stroke="#dfe5ee" strokeWidth="2.4" />
      <rect x="0" y="0" width="14" height="5" rx="2.5" fill="#f5b942" />
    </g>

    {/* floating accents */}
    <circle cx="176" cy="34" r="6" fill="#f5b942" opacity="0.85" />
    <circle cx="34" cy="40" r="4" fill="#4a90e2" opacity="0.7" />
    <rect x="150" y="24" width="14" height="14" rx="4" fill="#f26522" opacity="0.28" transform="rotate(18 157 31)" />
  </svg>
);

/** A small celebratory graphic for "all clear" / empty states. */
export const AllClearIllustration: React.FC<{ width?: number; height?: number }> = ({
  width = 120,
  height = 100,
}) => (
  <svg width={width} height={height} viewBox="0 0 120 100" role="img" aria-label="All clear">
    <ellipse cx="60" cy="88" rx="42" ry="7" fill="#eef1f6" />
    <circle cx="60" cy="48" r="34" fill="#e7f6ee" />
    <path d="M44 50 L56 62 L78 36" fill="none" stroke="#03c95a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="26" r="5" fill="#f5b942" opacity="0.8" />
    <circle cx="102" cy="30" r="4" fill="#4a90e2" opacity="0.7" />
    <rect x="94" y="58" width="11" height="11" rx="3.5" fill="#f26522" opacity="0.3" transform="rotate(16 99 63)" />
  </svg>
);

export default WorkspaceIllustration;
