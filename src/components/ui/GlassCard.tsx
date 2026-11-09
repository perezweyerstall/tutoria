'use client';

import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  elevation?: 'subtle' | 'base' | 'prominent';
  as?: 'div' | 'article' | 'section' | 'aside';
  className?: string;
}

export function GlassCard({
  children,
  interactive = false,
  elevation = 'base',
  as: Component = 'div',
  className = '',
  ...props
}: GlassCardProps) {
  const elevationClass =
    elevation === 'prominent'
      ? 'glass-elevation-prominent'
      : elevation === 'subtle'
      ? 'glass-elevation-subtle'
      : '';

  const interactiveClass = interactive ? 'liquid-glass-interactive' : '';

  return (
    <Component
      className={`liquid-glass-base ${elevationClass} ${interactiveClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
