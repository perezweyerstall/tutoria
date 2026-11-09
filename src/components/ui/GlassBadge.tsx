'use client';

import React from 'react';
import { SFSymbol, type SFSymbolName } from '../icons/SFSymbol';

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'teal' | 'sage' | 'amber' | 'terracotta' | 'purple' | 'neutral';
  icon?: SFSymbolName;
  className?: string;
  size?: 'sm' | 'md';
}

export function GlassBadge({
  children,
  variant = 'neutral',
  icon,
  className = '',
  size = 'md',
}: GlassBadgeProps) {
  const variantClass = `glass-badge-${variant}`;
  const sizeClass = size === 'sm' ? 'glass-badge-sm' : '';

  return (
    <span className={`glass-badge ${variantClass} ${sizeClass} ${className}`.trim()}>
      {icon && <SFSymbol name={icon} size={size === 'sm' ? 11 : 13} />}
      <span>{children}</span>
    </span>
  );
}
