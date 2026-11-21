import React from 'react';

export interface BrandLogoProps {
  variant?: 'full' | 'white' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE_MAP = {
  full: {
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-14 w-auto',
    xl: 'h-18 w-auto',
  },
  white: {
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-14 w-auto',
    xl: 'h-18 w-auto',
  },
  icon: {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  alt = 'CivicResolve - AI-Powered Citizen Platform',
}) => {
  let src = '/logo.png';
  if (variant === 'white') {
    src = '/logo-white.png';
  } else if (variant === 'icon') {
    src = '/logo-icon.png';
  }

  const hasCustomHeight = className.includes('h-');
  const dimensionClass = hasCustomHeight ? '' : SIZE_MAP[variant][size];

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none transition-transform duration-200 ${dimensionClass} ${className}`}
      loading="eager"
    />
  );
};

export default BrandLogo;
