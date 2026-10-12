import React, { useEffect, useId } from 'react';
import { useCrm } from '../../context/CrmContext';

export const SwirlingRibbonEmblem: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10',
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Quadrant 0 (Top-Left: Cyan to Cobalt Blue) */}
        <linearGradient id={`${uid}-q0Main`} x1="12" y1="74" x2="102" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="45%" stopColor="#0099FF" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${uid}-q0Fold`} x1="28" y1="60" x2="88" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="60%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id={`${uid}-q0Wing`} x1="10" y1="64" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <radialGradient id={`${uid}-q0Dot`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </radialGradient>

        {/* Quadrant 1 (Top-Right: Hot Magenta to Violet & Blue) */}
        <linearGradient id={`${uid}-q1Main`} x1="12" y1="74" x2="102" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF0844" />
          <stop offset="45%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id={`${uid}-q1Fold`} x1="28" y1="60" x2="88" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="60%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id={`${uid}-q1Wing`} x1="10" y1="64" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <radialGradient id={`${uid}-q1Dot`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#3B0764" />
        </radialGradient>

        {/* Quadrant 2 (Bottom-Right: Fiery Orange-Red to Golden Amber) */}
        <linearGradient id={`${uid}-q2Main`} x1="12" y1="74" x2="102" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="45%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
        <linearGradient id={`${uid}-q2Fold`} x1="28" y1="60" x2="88" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="60%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={`${uid}-q2Wing`} x1="10" y1="64" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
        <radialGradient id={`${uid}-q2Dot`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>

        {/* Quadrant 3 (Bottom-Left: Vibrant Lime-Emerald to Teal-Cyan) */}
        <linearGradient id={`${uid}-q3Main`} x1="12" y1="74" x2="102" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A3E635" />
          <stop offset="45%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={`${uid}-q3Fold`} x1="28" y1="60" x2="88" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="60%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id={`${uid}-q3Wing`} x1="10" y1="64" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BEF264" />
          <stop offset="55%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <radialGradient id={`${uid}-q3Dot`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#BEF264" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#065F46" />
        </radialGradient>
      </defs>

      {/* Layer 1: Inner 3D Ribbon Folds */}
      <g transform="rotate(0 64 64)">
        <path d="M 48 22 C 64 19, 80 25, 89 36 C 78 30, 64 28, 52 31 C 38 34, 30 46, 32 62 C 25 50, 27 30, 48 22 Z" fill={`url(#${uid}-q0Fold)`} />
      </g>
      <g transform="rotate(90 64 64)">
        <path d="M 48 22 C 64 19, 80 25, 89 36 C 78 30, 64 28, 52 31 C 38 34, 30 46, 32 62 C 25 50, 27 30, 48 22 Z" fill={`url(#${uid}-q1Fold)`} />
      </g>
      <g transform="rotate(180 64 64)">
        <path d="M 48 22 C 64 19, 80 25, 89 36 C 78 30, 64 28, 52 31 C 38 34, 30 46, 32 62 C 25 50, 27 30, 48 22 Z" fill={`url(#${uid}-q2Fold)`} />
      </g>
      <g transform="rotate(270 64 64)">
        <path d="M 48 22 C 64 19, 80 25, 89 36 C 78 30, 64 28, 52 31 C 38 34, 30 46, 32 62 C 25 50, 27 30, 48 22 Z" fill={`url(#${uid}-q3Fold)`} />
      </g>

      {/* Layer 2: Main Sweeping 3D Crescent Ribbons */}
      <g transform="rotate(0 64 64)">
        <path d="M 14 78 C 5 48, 18 16, 50 9 C 72 4, 94 12, 106 30 C 90 19, 72 16, 54 20 C 34 25, 21 42, 20 64 C 19 70, 17 75, 14 78 Z" fill={`url(#${uid}-q0Main)`} />
      </g>
      <g transform="rotate(90 64 64)">
        <path d="M 14 78 C 5 48, 18 16, 50 9 C 72 4, 94 12, 106 30 C 90 19, 72 16, 54 20 C 34 25, 21 42, 20 64 C 19 70, 17 75, 14 78 Z" fill={`url(#${uid}-q1Main)`} />
      </g>
      <g transform="rotate(180 64 64)">
        <path d="M 14 78 C 5 48, 18 16, 50 9 C 72 4, 94 12, 106 30 C 90 19, 72 16, 54 20 C 34 25, 21 42, 20 64 C 19 70, 17 75, 14 78 Z" fill={`url(#${uid}-q2Main)`} />
      </g>
      <g transform="rotate(270 64 64)">
        <path d="M 14 78 C 5 48, 18 16, 50 9 C 72 4, 94 12, 106 30 C 90 19, 72 16, 54 20 C 34 25, 21 42, 20 64 C 19 70, 17 75, 14 78 Z" fill={`url(#${uid}-q3Main)`} />
      </g>

      {/* Layer 3: Outer Rim S-Wing Highlights */}
      <g transform="rotate(0 64 64)">
        <path d="M 11 66 C 6 40, 22 14, 52 8 C 70 5, 86 9, 98 19 C 82 11, 64 9, 46 14 C 24 20, 13 40, 11 66 Z" fill={`url(#${uid}-q0Wing)`} opacity="0.92" />
      </g>
      <g transform="rotate(90 64 64)">
        <path d="M 11 66 C 6 40, 22 14, 52 8 C 70 5, 86 9, 98 19 C 82 11, 64 9, 46 14 C 24 20, 13 40, 11 66 Z" fill={`url(#${uid}-q1Wing)`} opacity="0.92" />
      </g>
      <g transform="rotate(180 64 64)">
        <path d="M 11 66 C 6 40, 22 14, 52 8 C 70 5, 86 9, 98 19 C 82 11, 64 9, 46 14 C 24 20, 13 40, 11 66 Z" fill={`url(#${uid}-q2Wing)`} opacity="0.92" />
      </g>
      <g transform="rotate(270 64 64)">
        <path d="M 11 66 C 6 40, 22 14, 52 8 C 70 5, 86 9, 98 19 C 82 11, 64 9, 46 14 C 24 20, 13 40, 11 66 Z" fill={`url(#${uid}-q3Wing)`} opacity="0.92" />
      </g>

      {/* Layer 4: 4 Community Spheres */}
      <circle cx="44" cy="44" r="6.8" fill={`url(#${uid}-q0Dot)`} />
      <circle cx="84" cy="44" r="6.8" fill={`url(#${uid}-q1Dot)`} />
      <circle cx="84" cy="84" r="6.8" fill={`url(#${uid}-q2Dot)`} />
      <circle cx="44" cy="84" r="6.8" fill={`url(#${uid}-q3Dot)`} />
    </svg>
  );
};

interface BrandLogoProps {
  /** 'full' renders logo (or emblem + company name); 'mark' renders compact logo/emblem only */
  variant?: 'full' | 'mark';
  /** Height size preset */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Optional click handler (e.g. navigate to dashboard) */
  onClick?: () => void;
  className?: string;
  /** Optional subtitle badge or text */
  showTagline?: boolean;
  /** Text color theme for dark vs light backgrounds */
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  onClick,
  className = '',
  showTagline = false,
  theme = 'light',
}) => {
  const { supplierCompany } = useCrm();
  const logoUrl = supplierCompany?.logoUrl || '';
  const companyName = supplierCompany?.name || 'Coreenact Solutions';

  // Keep browser tab title set to Enact 360 and apply the dedicated favicon on the browser tab
  useEffect(() => {
    document.title = 'Enact 360 - Enterprise CRM & Sales Management System';
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = '/favicon.svg';
  }, [logoUrl]);

  const imgHeightClasses: Record<NonNullable<BrandLogoProps['size']>, string> = {
    xs: 'h-6 max-w-[140px]',
    sm: 'h-8 max-w-[170px]',
    md: 'h-10 max-w-[210px]',
    lg: 'h-14 max-w-[260px]',
    xl: 'h-16 sm:h-20 max-w-[320px]',
    '2xl': 'h-20 sm:h-24 max-w-[380px]',
  };

  const emblemSizes: Record<NonNullable<BrandLogoProps['size']>, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const hasCustomUploadedLogo = Boolean(logoUrl && logoUrl !== '/favicon.svg');

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {hasCustomUploadedLogo ? (
        <img
          src={logoUrl}
          alt={companyName}
          referrerPolicy="no-referrer"
          className={`${imgHeightClasses[size]} w-auto object-contain rounded-lg shrink-0`}
        />
      ) : (
        <>
          <SwirlingRibbonEmblem
            className={`${emblemSizes[size]} shrink-0 drop-shadow-xs`}
          />
          {variant === 'full' && (
            <div className="flex flex-col leading-tight min-w-0">
              <span
                className={`font-extrabold text-sm tracking-tight truncate max-w-[200px] ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
              >
                {companyName}
              </span>
              {showTagline && (
                <span
                  className={`text-[10px] font-medium ${
                    theme === 'dark' ? 'text-blue-200/80' : 'text-black'
                  }`}
                >
                  CRM & Sales Management
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition hover:opacity-90 cursor-pointer"
        title={companyName}
      >
        {content}
      </button>
    );
  }

  return content;
};
