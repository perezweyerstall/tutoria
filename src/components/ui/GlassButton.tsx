'use client';

import React from 'react';
import { SFSymbol, type SFSymbolName } from '../icons/SFSymbol';

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'tinted-sage' | 'tinted-amber' | 'destructive' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  icon?: SFSymbolName;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export function GlassButton({
  variant = 'glass',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: GlassButtonProps) {
  const variantClass = `glass-btn-${variant}`;
  const sizeClass = `glass-btn-${size}`;

  return (
    <button
      className={`glass-button liquid-glass-interactive ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <SFSymbol name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <SFSymbol name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      )}
    </button>
  );
}
