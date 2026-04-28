/**
 * Multi-night observability heatmap for a single catalog object.
 *
 * Renders a per-night calendar where each cell's colour intensity reflects
 * the geometric+lunar score returned by `GET /planning/object/{id}/forecast`.
 * Hovering a cell reveals altitude, hours visible and moon context. No
 * weather is involved — this view is meant for long-term planning.
 */

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getObjectForecast } from '../../services/planning';
import type { NightlyForecastEntry, ObservationSite } from '../../types';

interface ObjectForecastHeatmapProps {
  catalogId: string;
  site: ObservationSite;
  days?: number;
  minAltitude?: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function scoreClass(score: number): string {
  if (score <= 0) return 'bg-white/5';
  if (score < 20) return 'bg-error/30';
  if (score < 40) return 'bg-warning/30';
  if (score < 60) return 'bg-warning/60';
  if (score < 80) return 'bg-success/60';
  return 'bg-success';
}

function formatLocalTime(iso: string | null, timezone: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(iso).toLocaleString('en-GB');
  }
}

function pickBestNights(nights: NightlyForecastEntry[], n = 5): NightlyForecastEntry[] {
  return [...nights].sort((a, b) => b.score - a.score).slice(0, n);
}

function startOfWeekIndex(d: Date): number {
  // Monday-first, 0..6
  return (d.getUTCDay() + 6) % 7;
}

export function ObjectForecastHeatmap({
  catalogId,
  site,
  days = 90,
  minAltitude = 30,
}: ObjectForecastHeatmapProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState<NightlyForecastEntry | null>(null);

  const query = useQuery({
    queryKey: ['object_forecast', catalogId, site.id, today, days, minAltitude],
    queryFn: () =>
      getObjectForecast(catalogId, {
        lat: site.latitude,
        lon: site.longitude,
        elevation: site.elevation_m,
        start_date: today,
        days,
        min_altitude: minAltitude,
        timezone: site.timezone,
      }),
    staleTime: 12 * 60 * 60 * 1000,
    retry: false,
  });

  // Build calendar grid: weeks (cols) × weekdays (rows).
  const grid = useMemo(() => {
    const nights = query.data?.nights ?? [];
    if (nights.length === 0) return { weeks: [] as (NightlyForecastEntry | null)[][] };
    const first = new Date(`${nights[0].date}T00:00:00Z`);
    const offset = startOfWeekIndex(first);
    const cells: (NightlyForecastEntry | null)[] = [];
    for (let i = 0; i < offset; i += 1) cells.push(null);
    for (const n of nights) cells.push(n);
    const weeks: (NightlyForecastEntry | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { weeks };
  }, [query.data]);

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted py-6 justify-center">
        <Loader2 size={14} className="animate-spin" />
        <span>Computing {days}-night forecast…</span>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="text-sm text-text-muted py-4 text-center">
        Forecast unavailable. The ephemeris file may be missing on the server.
      </div>
    );
  }

  const best = pickBestNights(query.data.nights);

  return (
    <div className="space-y-4">
      <div className="text-xs text-text-muted">
        From <span className="text-text-secondary">{site.name}</span> over the next{' '}
        <span className="text-text-secondary">{days}</span> nights at{' '}
        <span className="text-text-secondary">≥{minAltitude}°</span> above the horizon.
        Score is purely geometric (no weather).
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col gap-[3px] text-[10px] text-text-muted pt-3">
          {DAY_LABELS.map((d) => (
            <span key={d} className="leading-[16px]">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {grid.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di];
                if (!cell)
                  return <div key={di} className="w-4 h-4 rounded-sm bg-transparent" />;
                const isSelected = selected?.date === cell.date;
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => setSelected(cell)}
                    title={`${cell.date} — score ${cell.score.toFixed(0)} · max ${cell.max_altitude_deg.toFixed(0)}°`}
                    aria-label={`${cell.date}, score ${cell.score.toFixed(0)}`}
                    className={`w-4 h-4 rounded-sm transition-all ${scoreClass(cell.score)} ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-space-surface'
                        : 'hover:ring-1 hover:ring-white/30'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-white/5" />
        <div className="w-3 h-3 rounded-sm bg-error/30" />
        <div className="w-3 h-3 rounded-sm bg-warning/30" />
        <div className="w-3 h-3 rounded-sm bg-warning/60" />
        <div className="w-3 h-3 rounded-sm bg-success/60" />
        <div className="w-3 h-3 rounded-sm bg-success" />
        <span>More</span>
      </div>

      {/* Selected night detail */}
      {selected && (
        <div className="bg-space-bg border border-space-border rounded-lg p-3 text-xs space-y-1">
          <div className="font-semibold text-text-primary">{selected.date}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-text-secondary">
            <div>
              Max altitude:{' '}
              <span className="text-text-primary font-mono">
                {selected.max_altitude_deg.toFixed(0)}°
              </span>
            </div>
            <div>
              Hours ≥{minAltitude}°:{' '}
              <span className="text-text-primary font-mono">
                {selected.hours_above_min_altitude.toFixed(1)} h
              </span>
            </div>
            <div>
              Transit:{' '}
              <span className="text-text-primary font-mono">
                {formatLocalTime(selected.transit_time, site.timezone)}
              </span>
            </div>
            <div>
              Moon sep:{' '}
              <span className="text-text-primary font-mono">
                {selected.moon_separation_deg.toFixed(0)}°
              </span>
            </div>
            <div>
              Moon illum:{' '}
              <span className="text-text-primary font-mono">
                {Math.round(selected.moon_illumination * 100)}%
              </span>
            </div>
            <div>
              Score: <span className="text-text-primary font-mono">{selected.score.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top picks */}
      {best.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted mb-1">
            Best upcoming nights
          </div>
          <ul className="space-y-1 text-xs">
            {best.map((n) => (
              <li key={n.date} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(n)}
                  className="text-text-secondary hover:text-text-primary truncate text-left"
                >
                  {n.date}
                </button>
                <span className="text-text-muted shrink-0 font-mono">
                  {n.max_altitude_deg.toFixed(0)}° · {n.hours_above_min_altitude.toFixed(1)}h ·{' '}
                  score {n.score.toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
