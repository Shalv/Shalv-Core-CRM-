import React from 'react';

/**
 * Inline-SVG illustrations for empty states and hero areas. Deliberately self-contained
 * (no external images, no network) so they render instantly and offline, and carry the
 * product accent colour. Each scene is a light, modern line-and-fill composition.
 */

export type IllustrationName =
  | 'generic'
  | 'invoices'
  | 'customers'
  | 'orders'
  | 'payments'
  | 'leads'
  | 'support'
  | 'search'
  | 'hero';

const PALETTE = {
  ink: '#334155',
  soft: '#cbd5e1',
  faint: '#e6ebf2',
  accent: '#6366f1',
  accentSoft: '#c7d2fe',
  sky: '#38bdf8',
  emerald: '#34d399',
  amber: '#fbbf24',
};

function Scene({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 140" width="100%" height="100%" role="img" aria-hidden="true" style={{ maxWidth: 200 }}>
      <defs>
        <linearGradient id="ill-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PALETTE.accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={PALETTE.sky} stopOpacity="0.10" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

export function Illustration({ name = 'generic', className }: { name?: IllustrationName; className?: string }) {
  const stroke = PALETTE.ink;
  const common = { fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  let scene: React.ReactNode;
  switch (name) {
    case 'invoices':
      scene = (
        <>
          <rect x="46" y="24" width="88" height="104" rx="10" fill="#fff" stroke={PALETTE.soft} />
          <rect x="58" y="38" width="52" height="7" rx="3.5" fill={PALETTE.accentSoft} />
          {[58, 70, 82].map((y) => (
            <rect key={y} x="58" y={y + 14} width={y === 82 ? 34 : 64} height="5" rx="2.5" fill={PALETTE.faint} />
          ))}
          <rect x="58" y="108" width="34" height="8" rx="4" fill={PALETTE.emerald} opacity="0.8" />
          <circle cx="150" cy="40" r="16" fill="url(#ill-accent)" stroke={PALETTE.accentSoft} />
          <path d="M143 40l5 5 9-10" {...common} stroke={PALETTE.accent} />
        </>
      );
      break;
    case 'customers':
      scene = (
        <>
          <circle cx="76" cy="52" r="20" fill="url(#ill-accent)" stroke={PALETTE.accentSoft} />
          <path d="M44 116c0-18 14-30 32-30s32 12 32 30" {...common} stroke={PALETTE.soft} />
          <circle cx="140" cy="66" r="14" fill="#fff" stroke={PALETTE.soft} />
          <path d="M118 116c0-13 10-22 22-22s22 9 22 22" {...common} stroke={PALETTE.faint} />
        </>
      );
      break;
    case 'orders':
      scene = (
        <>
          <rect x="40" y="46" width="120" height="70" rx="10" fill="#fff" stroke={PALETTE.soft} />
          <path d="M40 64h120" {...common} stroke={PALETTE.faint} />
          <circle cx="52" cy="55" r="2.5" fill={PALETTE.soft} />
          <circle cx="62" cy="55" r="2.5" fill={PALETTE.soft} />
          <path d="M58 84h56M58 96h40" {...common} stroke={PALETTE.faint} />
          <circle cx="146" cy="40" r="14" fill={PALETTE.amber} opacity="0.85" />
          <path d="M140 40h12M146 34v12" {...common} stroke="#fff" strokeWidth={2.4} />
        </>
      );
      break;
    case 'payments':
      scene = (
        <>
          <rect x="40" y="44" width="120" height="72" rx="12" fill="url(#ill-accent)" stroke={PALETTE.accentSoft} />
          <rect x="40" y="62" width="120" height="16" fill={PALETTE.accent} opacity="0.25" />
          <rect x="54" y="92" width="42" height="9" rx="4.5" fill="#fff" stroke={PALETTE.soft} />
          <circle cx="140" cy="98" r="10" fill={PALETTE.emerald} opacity="0.85" />
          <path d="M135 98l4 4 7-8" {...common} stroke="#fff" strokeWidth={2.4} />
        </>
      );
      break;
    case 'leads':
      scene = (
        <>
          <circle cx="100" cy="52" r="10" fill={PALETTE.accent} />
          <path d="M100 62v20M100 82l-24 22M100 82l24 22M78 96h44" {...common} stroke={PALETTE.soft} />
          <circle cx="100" cy="52" r="26" fill="none" stroke={PALETTE.accentSoft} strokeDasharray="4 6" />
          <circle cx="72" cy="106" r="7" fill={PALETTE.sky} opacity="0.85" />
          <circle cx="128" cy="106" r="7" fill={PALETTE.emerald} opacity="0.85" />
        </>
      );
      break;
    case 'support':
      scene = (
        <>
          <path d="M52 60a48 34 0 0196 0v22a14 14 0 01-14 14h-8" {...common} stroke={PALETTE.soft} />
          <rect x="44" y="60" width="14" height="24" rx="6" fill={PALETTE.accent} opacity="0.85" />
          <rect x="142" y="60" width="14" height="24" rx="6" fill={PALETTE.accent} opacity="0.85" />
          <path d="M100 96v14" {...common} stroke={PALETTE.faint} />
          <circle cx="100" cy="116" r="7" fill={PALETTE.sky} opacity="0.85" />
        </>
      );
      break;
    case 'search':
      scene = (
        <>
          <circle cx="92" cy="62" r="30" fill="url(#ill-accent)" stroke={PALETTE.accentSoft} />
          <path d="M114 84l24 24" {...common} stroke={PALETTE.ink} strokeWidth={4} />
          <path d="M80 62h24M92 50v24" {...common} stroke={PALETTE.accent} strokeWidth={2} />
        </>
      );
      break;
    case 'hero':
      scene = (
        <>
          <rect x="30" y="34" width="140" height="72" rx="12" fill="url(#ill-accent)" stroke={PALETTE.accentSoft} />
          <path d="M46 92l24-26 20 16 18-30 24 40" {...common} stroke={PALETTE.accent} strokeWidth={3} />
          <circle cx="70" cy="66" r="4" fill={PALETTE.sky} />
          <circle cx="108" cy="52" r="4" fill={PALETTE.emerald} />
          <rect x="46" y="44" width="34" height="6" rx="3" fill={PALETTE.soft} />
        </>
      );
      break;
    default:
      scene = (
        <>
          <rect x="52" y="34" width="96" height="72" rx="12" fill="#fff" stroke={PALETTE.soft} />
          <path d="M70 60h60M70 74h60M70 88h38" {...common} stroke={PALETTE.faint} />
          <circle cx="146" cy="40" r="14" fill="url(#ill-accent)" stroke={PALETTE.accentSoft} />
        </>
      );
  }

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Scene>{scene}</Scene>
    </div>
  );
}

export default Illustration;
