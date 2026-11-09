'use client';

import React, { useEffect } from 'react';
import { SFSymbol } from '../icons/SFSymbol';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: Parameters<typeof SFSymbol>[0]['name'];
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  ariaLabel?: string;
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = '640px',
  className = '',
  ariaLabel,
}: GlassModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="glass-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`liquid-glass-base glass-modal-dialog ${className}`.trim()}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-modal-header">
          <div className="glass-modal-title-group">
            {icon && (
              <span className="glass-modal-icon-badge">
                <SFSymbol name={icon} size={18} color="var(--apple-blue)" />
              </span>
            )}
            <div>
              <h2 className="glass-modal-title">{title}</h2>
              {subtitle && <p className="glass-modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="glass-close-btn"
            onClick={onClose}
            aria-label="Cerrar ventana modal"
          >
            <SFSymbol name="xmark.circle.fill" size={20} color="var(--ink-tertiary)" />
          </button>
        </div>
        <div className="glass-modal-body">{children}</div>
      </div>
    </div>
  );
}
