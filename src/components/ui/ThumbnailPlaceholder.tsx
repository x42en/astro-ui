import type { FC } from 'react';

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface ThumbnailPlaceholderProps {
  sessionId: string;
  className?: string;
}

export const ThumbnailPlaceholder: FC<ThumbnailPlaceholderProps> = ({
  sessionId,
  className,
}) => {
  const seed = hashCode(sessionId);
  const rand = makeRng(seed);

  // Dim background stars
  const stars = Array.from({ length: 90 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: rand() * 0.9 + 0.2,
    opacity: rand() * 0.55 + 0.15,
  }));

  // Brighter foreground stars
  const brightStars = Array.from({ length: 15 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: rand() * 1.8 + 1.0,
    opacity: rand() * 0.45 + 0.55,
  }));

  // Faint nebula blobs
  const nebulae = Array.from({ length: 4 }, () => ({
    cx: rand() * 80 + 10,
    cy: rand() * 70 + 10,
    rx: rand() * 22 + 10,
    ry: rand() * 16 + 8,
    hue: Math.floor(rand() * 80 + 195), // blue-purple range
    opacity: rand() * 0.055 + 0.02,
  }));

  const uid = `ph-${seed}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 75"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="45%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#0e0e14" />
          <stop offset="100%" stopColor="#040406" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="100" height="75" fill={`url(#${uid}-bg)`} />

      {/* Nebula blobs */}
      {nebulae.map((n, i) => (
        <ellipse
          key={i}
          cx={n.cx}
          cy={n.cy}
          rx={n.rx}
          ry={n.ry}
          fill={`hsla(${n.hue},55%,58%,${n.opacity})`}
          filter={`url(#${uid}-blur)`}
        />
      ))}

      {/* Dim stars */}
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={`rgba(215,225,255,${s.opacity})`}
        />
      ))}

      {/* Bright stars */}
      {brightStars.map((s, i) => (
        <circle
          key={`b${i}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={`rgba(245,248,255,${s.opacity})`}
        />
      ))}
    </svg>
  );
};
