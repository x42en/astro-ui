import type { AltAzPoint } from '../../types';

interface AltitudeSparklineProps {
  curve: AltAzPoint[];
  minAltitudeDeg: number;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Tiny inline SVG showing how an object's altitude evolves through the night.
 *
 * The horizontal axis spans the curve's time range; the vertical axis spans
 * 0–90°. A horizon line is drawn at altitude 0 and a dashed gridline marks
 * the user's minimum-altitude threshold.
 */
export function AltitudeSparkline({
  curve,
  minAltitudeDeg,
  width = 120,
  height = 32,
  className,
}: AltitudeSparklineProps) {
  if (curve.length < 2) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
        <line
          x1={0}
          x2={width}
          y1={height - 1}
          y2={height - 1}
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeWidth={1}
        />
      </svg>
    );
  }

  const maxAltDisplay = 90;
  const yForAlt = (alt: number): number =>
    height - (Math.max(0, Math.min(maxAltDisplay, alt)) / maxAltDisplay) * (height - 1);
  const xForIdx = (i: number): number => (i / (curve.length - 1)) * width;

  const polyPoints = curve.map((p, i) => `${xForIdx(i).toFixed(1)},${yForAlt(p.altitude_deg).toFixed(1)}`).join(' ');
  const horizonY = yForAlt(0);
  const minAltY = yForAlt(minAltitudeDeg);

  // Build an "above horizon" filled area by clipping below 0.
  const areaPoints = [
    `0,${horizonY.toFixed(1)}`,
    polyPoints,
    `${width},${horizonY.toFixed(1)}`,
  ].join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="Altitude through the night"
    >
      {/* Min-altitude gridline (dashed) */}
      <line
        x1={0}
        x2={width}
        y1={minAltY}
        y2={minAltY}
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeDasharray="2 2"
        strokeWidth={0.5}
      />
      {/* Filled area above horizon */}
      <polygon points={areaPoints} fill="currentColor" fillOpacity={0.15} />
      {/* Horizon */}
      <line
        x1={0}
        x2={width}
        y1={horizonY}
        y2={horizonY}
        stroke="currentColor"
        strokeOpacity={0.4}
        strokeWidth={0.5}
      />
      {/* Altitude curve */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
