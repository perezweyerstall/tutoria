'use client';

import React from 'react';

export type SFSymbolName =
  | 'book.pages'
  | 'graduationcap'
  | 'brain.head.profile'
  | 'waveform'
  | 'chart.xyaxis.line'
  | 'externaldrive'
  | 'timer'
  | 'play.fill'
  | 'pause.fill'
  | 'slider.horizontal.3'
  | 'sparkles'
  | 'checkmark.circle.fill'
  | 'xmark.circle.fill'
  | 'exclamationmark.triangle.fill'
  | 'magnifyingglass'
  | 'arrow.clockwise'
  | 'plus'
  | 'trash'
  | 'square.and.pencil'
  | 'square.and.arrow.down'
  | 'square.and.arrow.up'
  | 'sun.max.fill'
  | 'moon.fill'
  | 'gearshape'
  | 'mic.fill'
  | 'mic.slash'
  | 'speaker.wave.2.fill'
  | 'doc.text'
  | 'bolt.fill'
  | 'wrench.and.screwdriver'
  | 'chevron.right'
  | 'chevron.down'
  | 'shield.lefthalf.filled';

export interface SFSymbolProps {
  name: SFSymbolName;
  size?: number | string;
  className?: string;
  color?: string;
  hierarchical?: boolean;
}

/**
 * Authentic Apple SF Symbols vector renderer designed according to
 * Apple Human Interface Guidelines with hierarchical opacity support.
 */
export function SFSymbol({
  name,
  size = 18,
  className = '',
  color = 'currentColor',
  hierarchical = false,
}: SFSymbolProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  const renderPath = () => {
    switch (name) {
      case 'book.pages':
        return (
          <>
            <path
              d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={hierarchical ? 0.45 : 1}
            />
            <path
              d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M8 7h8M8 11h6"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={hierarchical ? 0.75 : 1}
            />
          </>
        );

      case 'graduationcap':
        return (
          <>
            <path
              d="M22 10v6M2 10l10-5 10 5-10 5z"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={hierarchical ? 'currentColor' : 'none'}
              fillOpacity={hierarchical ? 0.2 : 0}
            />
            <path
              d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={hierarchical ? 0.7 : 1}
            />
          </>
        );

      case 'brain.head.profile':
        return (
          <>
            <path
              d="M9.5 2A4.5 4.5 0 0 0 5 6.5c0 1.25.5 2.4 1.3 3.2A5.5 5.5 0 0 0 6 15v3a2 2 0 0 0 2 2h3v2h2v-4.5a3.5 3.5 0 0 1 3.5-3.5h.5a5 5 0 0 0 5-5c0-4-3.5-7.2-12.5-7z"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={hierarchical ? 'currentColor' : 'none'}
              fillOpacity={hierarchical ? 0.15 : 0}
            />
            <path
              d="M12 7a2 2 0 0 1 2 2M10 11a3 3 0 0 1 3-3"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={hierarchical ? 0.6 : 1}
            />
          </>
        );

      case 'waveform':
        return (
          <>
            <path
              d="M3 12h2M7 8v8M11 4v16M15 6v12M19 9v6M23 12h-2"
              stroke={color}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'chart.xyaxis.line':
        return (
          <>
            <path
              d="M3 3v18h18"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={hierarchical ? 0.5 : 1}
            />
            <path
              d="M7 15l4-5 4 4 5-8"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="6" r="2" fill={color} />
          </>
        );

      case 'externaldrive':
        return (
          <>
            <rect
              x="2"
              y="6"
              width="20"
              height="12"
              rx="3"
              stroke={color}
              strokeWidth="2"
              fill={hierarchical ? 'currentColor' : 'none'}
              fillOpacity={hierarchical ? 0.15 : 0}
            />
            <circle cx="17.5" cy="12" r="1.5" fill={color} />
            <path d="M6 12h7" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'timer':
        return (
          <>
            <circle
              cx="12"
              cy="13"
              r="8"
              stroke={color}
              strokeWidth="2"
              fill={hierarchical ? 'currentColor' : 'none'}
              fillOpacity={hierarchical ? 0.12 : 0}
            />
            <path d="M12 9v4l2.5 2.5M10 2h4M12 2v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'play.fill':
        return <polygon points="6 4 20 12 6 20 6 4" fill={color} />;

      case 'pause.fill':
        return (
          <>
            <rect x="6" y="4" width="4" height="16" rx="1.5" fill={color} />
            <rect x="14" y="4" width="4" height="16" rx="1.5" fill={color} />
          </>
        );

      case 'slider.horizontal.3':
        return (
          <>
            <path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={hierarchical ? 0.45 : 1} />
            <circle cx="9" cy="6" r="2.5" fill={color} stroke="#ffffff" strokeWidth="1" />
            <circle cx="15" cy="12" r="2.5" fill={color} stroke="#ffffff" strokeWidth="1" />
            <circle cx="8" cy="18" r="2.5" fill={color} stroke="#ffffff" strokeWidth="1" />
          </>
        );

      case 'sparkles':
        return (
          <>
            <path
              d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z"
              fill={color}
            />
            <path
              d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"
              fill={color}
              opacity={hierarchical ? 0.65 : 1}
            />
          </>
        );

      case 'checkmark.circle.fill':
        return (
          <>
            <circle cx="12" cy="12" r="10" fill={color} />
            <path
              d="M8 12l2.5 2.5L16 9"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        );

      case 'xmark.circle.fill':
        return (
          <>
            <circle cx="12" cy="12" r="10" fill={color} />
            <path
              d="M15 9l-6 6M9 9l6 6"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );

      case 'exclamationmark.triangle.fill':
        return (
          <>
            <path
              d="M12 2.5l9.5 17a1 1 0 0 1-.87 1.5H3.37a1 1 0 0 1-.87-1.5l9.5-17z"
              fill={color}
            />
            <path d="M12 9v5M12 17h.01" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          </>
        );

      case 'magnifyingglass':
        return (
          <>
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke={color}
              strokeWidth="2"
              fill="none"
            />
            <path d="M21 21l-4.8-4.8" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          </>
        );

      case 'arrow.clockwise':
        return (
          <>
            <path
              d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73.81"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        );

      case 'plus':
        return <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />;

      case 'trash':
        return (
          <>
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={hierarchical ? 0.6 : 1} />
          </>
        );

      case 'square.and.pencil':
        return (
          <>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'square.and.arrow.down':
        return (
          <>
            <path d="M12 3v12M8 11l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 17v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={hierarchical ? 0.6 : 1} />
          </>
        );

      case 'square.and.arrow.up':
        return (
          <>
            <path d="M12 15V3M8 7l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={hierarchical ? 0.6 : 1} />
          </>
        );

      case 'sun.max.fill':
        return (
          <>
            <circle cx="12" cy="12" r="4.5" fill={color} />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        );

      case 'moon.fill':
        return (
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill={color}
          />
        );

      case 'gearshape':
        return (
          <>
            <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={hierarchical ? 'currentColor' : 'none'}
              fillOpacity={hierarchical ? 0.15 : 0}
            />
          </>
        );

      case 'mic.fill':
        return (
          <>
            <rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
            <path d="M5 10a7 7 0 0 0 14 0M12 18v4M8 22h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'mic.slash':
        return (
          <>
            <line x1="2" y1="2" x2="22" y2="22" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M18.89 13.23A7.12 7.12 0 0 0 19 10M12 18v4M8 22h8M5 10a7 7 0 0 0 10.79 5.91M15 9.34V5a3 3 0 0 0-5.68-1.33" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        );

      case 'speaker.wave.2.fill':
        return (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        );

      case 'doc.text':
        return (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" fill="none" />
            <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2" fill="none" />
            <line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <polyline points="10 9 9 9 8 9" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'bolt.fill':
        return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} />;

      case 'wrench.and.screwdriver':
        return (
          <>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="2" fill="none" />
          </>
        );

      case 'chevron.right':
        return <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />;

      case 'chevron.down':
        return <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />;

      case 'shield.lefthalf.filled':
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" fill="none" />
            <path d="M12 2.2V22c-5.5-2.8-8-6.8-8-9.8V5.3l8-3.1z" fill={color} />
          </>
        );

      default:
        return <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" fill="none" />;
    }
  };

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      className={`sf-symbol sf-symbol-${name.replace(/\./g, '-')} ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      {renderPath()}
    </svg>
  );
}
