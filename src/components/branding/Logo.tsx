import type { CSSProperties } from 'react';

interface LogoProps {
  /**
   * - `mark`     : icon-only mark (favicon-style).
   * - `wordmark` : mark + "AstroStack" wordmark.
   * - `glyph`    : same mark, sized for inline use against busy imagery.
   */
  variant?: 'mark' | 'wordmark' | 'glyph';
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * AstroStack mark.
 *
 * A single white shape combining the universal "AI sparkle" with a tilted
 * orbital ring — the simplest visual shorthand for "AI applied to the night
 * sky". Both shapes use ``currentColor`` so the mark inherits its colour from
 * the surrounding text and stays legible at any size, including 16 px
 * favicons.
 *
 * The static favicon at ``/logo.svg`` ships the same artwork with a media
 * query so it inverts to black on light browser tabs.
 */
function Mark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="flex-shrink-0 mx-auto"
      aria-hidden="true"
    >
      {/* Orbit — tilted ellipse, encircling the sparkle */}
      <ellipse
        cx="32"
        cy="32"
        rx="29"
        ry="10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        transform="rotate(-28 32 32)"
      />
      {/* Star/planet riding the orbit */}
      <circle cx="57.6" cy="18.4" r="2.4" fill="currentColor" />
      {/* AI sparkle — 4-point star with concave sides */}
      <path
        d="M32 12 L35.2 28.8 L52 32 L35.2 35.2 L32 52 L28.8 35.2 L12 32 L28.8 28.8 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  variant = 'wordmark',
  size = 28,
  className = '',
  style,
}: LogoProps) {
  if (variant === 'mark' || variant === 'glyph') {
    return (
      <span className={className} style={style}>
        <Mark size={size} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      style={style}
    >
      <Mark size={size} />
      <span className="font-semibold tracking-tight text-text-primary">
        Astro<span className="text-gradient-accent">Stack</span>
      </span>
    </span>
  );
}
