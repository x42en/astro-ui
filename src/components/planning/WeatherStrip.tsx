import { useMemo } from 'react';
import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import type { WeatherForecast } from '../../types';

interface WeatherStripProps {
  forecast: WeatherForecast | undefined;
  isLoading: boolean;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

interface DailyAggregate {
  date: string;
  cloudAvgPct: number;
  moonPhase: number;
  best: boolean;
}

const MOON_GLYPHS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

function moonGlyph(phase: number): string {
  // Open-Meteo returns moon_phase 0..1 (0 = new, 0.5 = full).
  const idx = Math.round((phase * 8) % 8);
  return MOON_GLYPHS[(idx + 8) % 8];
}

function cloudIcon(pct: number) {
  if (pct < 25) return <Sun size={20} className="text-warning" />;
  if (pct < 55) return <CloudSun size={20} className="text-text-secondary" />;
  if (pct < 80) return <Cloud size={20} className="text-text-secondary" />;
  return <CloudRain size={20} className="text-text-muted" />;
}

function formatWeekday(iso: string): { weekday: string; day: string } {
  const d = new Date(`${iso}T12:00:00Z`);
  return {
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    day: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  };
}

export function WeatherStrip({
  forecast,
  isLoading,
  selectedDate,
  onDateSelect,
}: WeatherStripProps) {
  const days = useMemo<DailyAggregate[]>(() => {
    if (!forecast) return [];
    // Aggregate hourly cloud_cover per local-date; fall back to daily entries
    // (Open-Meteo daily array may not include cloud cover so we compute it).
    const buckets = new Map<string, { sum: number; n: number }>();
    for (const h of forecast.hourly) {
      const date = h.time.slice(0, 10);
      const b = buckets.get(date) ?? { sum: 0, n: 0 };
      b.sum += h.cloud_cover_pct;
      b.n += 1;
      buckets.set(date, b);
    }
    return forecast.daily.map((d) => {
      const b = buckets.get(d.date);
      const cloudAvg = b ? b.sum / b.n : 0;
      const best = cloudAvg < 40 && d.moon_phase < 0.4;
      return { date: d.date, cloudAvgPct: cloudAvg, moonPhase: d.moon_phase, best };
    });
  }, [forecast]);

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="min-w-[88px] h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden">
      {days.map((d) => {
        const { weekday, day } = formatWeekday(d.date);
        const active = d.date === selectedDate;
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onDateSelect(d.date)}
            className={[
              'min-w-[88px] snap-start bg-space-surface border rounded-lg p-2 text-center cursor-pointer transition-colors',
              active
                ? 'border-primary ring-1 ring-primary/40'
                : 'border-space-border hover:border-space-border-light',
            ].join(' ')}
          >
            <div className="text-[11px] uppercase tracking-wide text-text-muted">{weekday}</div>
            <div className="text-sm text-text-primary font-semibold">{day}</div>
            <div className="flex items-center justify-center my-1">{cloudIcon(d.cloudAvgPct)}</div>
            <div className="text-[11px] text-text-secondary">{Math.round(d.cloudAvgPct)}%</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-base leading-none" aria-hidden>
                {moonGlyph(d.moonPhase)}
              </span>
              {d.best && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-success"
                  aria-label="Best window"
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
