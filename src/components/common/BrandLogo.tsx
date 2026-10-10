import React, { useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';

interface BrandLogoProps {
  /** 'full' renders logo (or initials badge + company name); 'mark' renders compact logo/initials only */
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

  const badgeSizes: Record<NonNullable<BrandLogoProps['size']>, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
    '2xl': 'w-16 h-16 text-lg',
  };

  const initials =
    companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'CS';

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName}
          referrerPolicy="no-referrer"
          className={`${imgHeightClasses[size]} w-auto object-contain rounded-lg shrink-0`}
        />
      ) : (
        <>
          <div
            className={`${badgeSizes[size]} rounded-lg bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white font-extrabold flex items-center justify-center shrink-0 shadow-xs tracking-tighter`}
          >
            {initials}
          </div>
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
