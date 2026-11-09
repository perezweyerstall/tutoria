'use client';

import React from 'react';
import { SFSymbol, type SFSymbolName } from '../icons/SFSymbol';

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
  id?: string;
  icon?: SFSymbolName;
  badge?: string | number;
}

export interface GlassSegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (val: T) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function GlassSegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel = 'Opciones de selección',
  size = 'md',
  className = '',
}: GlassSegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`glass-segmented-control glass-segmented-${size} ${className}`.trim()}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            id={opt.id}
            role="tab"
            aria-selected={isSelected}
            type="button"
            className={`glass-segmented-item liquid-glass-interactive ${
              isSelected ? 'selected' : ''
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <SFSymbol name={opt.icon} size={size === 'sm' ? 13 : 15} />}
            <span className="glass-segmented-label">{opt.label}</span>
            {opt.badge !== undefined && (
              <span className={`glass-segmented-badge ${isSelected ? 'badge-selected' : ''}`}>
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
