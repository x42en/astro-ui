import type { AltAzPoint } from '../../types';

interface AltitudeSparklineProps {
  curve: AltAzPoint[];
  minAltitudeDeg: number;
  width?: number;
  height?: number;
  className?: string;
  /**
   * Visual variant.
   * - ``auto`` keeps the legacy ``currentColor`` behaviour (matches text).
   * - ``over-image`` switches to a white stroke (red in night-mode via
   *   a scoped CSS rule) for legibility on top of a photo background.
   */
  variant?: 'auto' | 'over-image';
  riseTime?: string | null;
  transitTime?: string | null;
  setTime?: string | null;
  timezone?: string;
}

interface MarkerSpec {
  label: 'Rise' | 'Transit' | 'Set';
  iso: string;
}

function formatTime(iso: string, timezone?: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      timeZone: timezone || undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

/** Interpolate the fractional index (and altitude) of an ISO time on the curve. */
function locateOnCurve(
  curve: AltAzPoint[],
  iso: string,
): { idx: number; alt: number } | null {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return null;
  const t0 = Date.parse(curve[0].time);
  const tN = Date.parse(curve[curve.length - 1].time);
  if (Number.isNaN(t0) || Number.isNaN(tN) || tN === t0) return null;
  const clamped = Math.max(t0, Math.min(tN, target));
  const ratio = (clamped - t0) / (tN - t0);
  const idx = ratio * (curve.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(curve.length - 1, lo + 1);
  const frac = idx - lo;
  const alt =
    curve[lo].altitude_deg * (1 - frac) + curve[hi].altitude_deg * frac;
  return { idx, alt };
}

/**
 * Inline SVG showing how an object's altitude evolves through the
 * astronomical night.
 *
 * Horizontal axis spans the curve's full time range; vertical axis spans
 * 0–90°. A horizon line sits at 0° and a dashed gridline marks the user's
 * minimum-altitude threshold. When ``rise``/``transit``/``set`` times are
 * supplied, three discreet markers are drawn at the matching positions;
 * each carries a native SVG ``<title>`` tooltip (Rise / Transit / Set —
 * local time in the requested timezone) shown on hover.
 */
export function AltitudeSparkline({
  curve,
  minAltitudeDeg,
  width = 120,
  height = 32,
  className,
  variant = 'auto',
  riseTime,
  transitTime,
  setTime,
  timezone,
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

  const polyPoints = curve
    .map((p, i) => `${xForIdx(i).toFixed(1)},${yForAlt(p.altitude_deg).toFixed(1)}`)
    .join(' ');
  const horizonY = yForAlt(0);
  const minAltY = yForAlt(minAltitudeDeg);

  const areaPoints = [
    `0,${horizonY.toFixed(1)}`,
    polyPoints,
    `${width},${horizonY.toFixed(1)}`,
  ].join(' ');

  const overImage = variant === 'over-image';
  // The trace stroke needs to read on top of a photo: white by default,
  // overridden to the theme red in night-mode via a scoped CSS rule (see
  // ``src/styles/theme.css``). For the auto variant, fall back to the
  // surrounding text colour as before.
  const traceStrokeColor = overImage ? 'rgb(255 255 255)' : 'currentColor';
  const auxColor = overImage ? 'rgb(255 255 255)' : 'currentColor';

  const markers: MarkerSpec[] = [];
  if (riseTime) markers.push({ label: 'Rise', iso: riseTime });
  if (transitTime) markers.push({ label: 'Transit', iso: transitTime });
  if (setTime) markers.push({ label: 'Set', iso: setTime });

  const svgClassName = [className ?? '', overImage ? 'altitude-sparkline--over-image' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={svgClassName}
      aria-label="Altitude through the night"
      role="img"
    >
      {/* Min-altitude gridline (dashed) */}
      <line
        x1={0}
        x2={width}
        y1={minAltY}
        y2={minAltY}
        stroke={auxColor}
        strokeOpacity={overImage ? 0.4 : 0.25}
        strokeDasharray="2 2"
        strokeWidth={0.5}
        className={overImage ? 'altitude-sparkline__aux' : undefined}
      />
      {/* Filled area above horizon */}
      <polygon
        points={areaPoints}
        fill={auxColor}
        fillOpacity={overImage ? 0.18 : 0.15}
        className={overImage ? 'altitude-sparkline__area' : undefined}
      />
      {/* Horizon */}
      <line
        x1={0}
        x2={width}
        y1={horizonY}
        y2={horizonY}
        stroke={auxColor}
        strokeOpacity={overImage ? 0.55 : 0.4}
        strokeWidth={0.5}
        className={overImage ? 'altitude-sparkline__aux' : undefined}
      />
      {/* Altitude curve */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={traceStrokeColor}
        strokeWidth={overImage ? 1.5 : 1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={overImage ? 'altitude-sparkline__trace' : undefined}
      />
      {/* Hover markers for Rise / Transit / Set */}
      {markers.map((m) => {
        const loc = locateOnCurve(curve, m.iso);
        if (loc === null) return null;
        const cx = xForIdx(loc.idx);
        const cy = yForAlt(loc.alt);
        return (
          <g key={m.label} className="altitude-sparkline__marker">
            <circle
              cx={cx}
              cy={cy}
              r={2.4}
              fill={traceStrokeColor}
              fillOpacity={0.9}
              stroke="rgb(0 0 0)"
              strokeOpacity={0.4}
              strokeWidth={0.5}
              className={overImage ? 'altitude-sparkline__trace' : undefined}
            />
            {/* Generous invisible hit area for hover tooltip. */}
            <circle cx={cx} cy={cy} r={Math.max(6, height / 6)} fill="transparent">
              <title>{`${m.label}: ${formatTime(m.iso, timezone)}`}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
