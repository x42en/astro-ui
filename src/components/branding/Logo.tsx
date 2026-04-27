import type { CSSProperties } from 'react';

interface LogoProps {
  /**
   * - `mark`     : icon-only square mark (favicon-style).
   * - `wordmark` : mark + "AstroStack" wordmark next to it.
   * - `glyph`    : minimalist outlined telescope on transparent background,
   *                designed for use against busy imagery (cartouche, watermark).
   */
  variant?: 'mark' | 'wordmark' | 'glyph';
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Branded AstroStack logo, derived from the lucide ``Telescope`` glyph.
 *
 * The full ``mark`` variant ships as a static SVG at ``/logo.svg`` (also used
 * as the favicon).  This component renders the same artwork inline so it can
 * be tinted, animated, and laid out alongside text without any network round
 * trip.
 */
export function Logo({
  variant = 'wordmark',
  size = 28,
  className = '',
  style,
}: LogoProps) {
  if (variant === 'glyph') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
      >
        <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />
        <path d="m13.56 11.747 4.332-.924" />
        <path d="m16 21-3.105-6.21" />
        <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" />
        <path d="m6.158 8.633 1.114 4.456" />
        <path d="m8 21 3.105-6.21" />
        <circle cx="12" cy="21" r="1" fill="currentColor" />
      </svg>
    );
  }

  const mark = (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`asl-bg-${size}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b1220" />
          <stop offset="1" stopColor="#050810" />
        </linearGradient>
        <linearGradient id={`asl-ring-${size}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6ea8fe" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0.30" />
        </linearGradient>
        <linearGradient id={`asl-stroke-${size}`} x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9bb8ff" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <radialGradient id={`asl-glow-${size}`} cx="32" cy="32" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b6cff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3b6cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill={`url(#asl-bg-${size})`} />
      <rect x="2" y="2" width="60" height="60" rx="14" fill={`url(#asl-glow-${size})`} />
      <rect x="2.5" y="2.5" width="59" height="59" rx="13.5" stroke={`url(#asl-ring-${size})`} strokeWidth="1" />
      <circle cx="14" cy="14" r="0.9" fill="#e2e8f0" opacity="0.9" />
      <circle cx="50" cy="12" r="0.6" fill="#cbd5f5" opacity="0.7" />
      <circle cx="52" cy="22" r="0.5" fill="#94a3b8" opacity="0.6" />
      <circle cx="11" cy="48" r="0.7" fill="#e2e8f0" opacity="0.85" />
      <circle cx="20" cy="22" r="0.45" fill="#94a3b8" opacity="0.55" />
      <g
        transform="translate(16 16) scale(1.333)"
        stroke={`url(#asl-stroke-${size})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />
        <path d="m13.56 11.747 4.332-.924" />
        <path d="m16 21-3.105-6.21" />
        <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" />
        <path d="m6.158 8.633 1.114 4.456" />
        <path d="m8 21 3.105-6.21" />
        <circle cx="12" cy="21" r="1" fill={`url(#asl-stroke-${size})`} />
      </g>
    </svg>
  );

  if (variant === 'mark') {
    return (
      <span className={className} style={style}>
        {mark}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
      {mark}
      <span className="font-semibold tracking-tight text-text-primary">
        Astro<span className="text-gradient-accent">Stack</span>
      </span>
    </span>
  );
}
