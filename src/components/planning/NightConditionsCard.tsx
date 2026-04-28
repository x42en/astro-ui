import { Moon, Sun, Cloud, Gauge } from 'lucide-react';
import type { ObservationWindow, RecommendationBundle } from '../../types';

interface NightConditionsCardProps {
  window: ObservationWindow;
  weatherSummary: RecommendationBundle['weather_summary'];
  timezone: string;
}

function localTime(iso: string, timezone: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      timeZone: timezone,
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

function moonPhaseLabel(illumination: number): string {
  return `${Math.round(illumination * 100)}%`;
}

function cloudColor(pct: number): string {
  if (pct < 30) return 'text-success';
  if (pct < 60) return 'text-warning';
  return 'text-error';
}

function Stat({
  icon,
  label,
  value,
  detail,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-space-surface border border-space-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[11px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className={`text-lg font-semibold mt-1 ${valueClassName ?? 'text-text-primary'}`}>
        {value}
      </div>
      {detail && <div className="text-xs text-text-secondary mt-0.5">{detail}</div>}
    </div>
  );
}

export function NightConditionsCard({
  window,
  weatherSummary,
  timezone,
}: NightConditionsCardProps) {
  const cloudAvg = weatherSummary?.cloud_cover_avg_pct;
  const score = Math.round(window.darkness_score);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat
          icon={<Sun size={14} />}
          label="Astronomical twilight"
          value={`${localTime(window.astronomical_twilight_end, timezone)} → ${localTime(
            window.astronomical_twilight_start,
            timezone,
          )}`}
          detail="Dark window"
        />
        <Stat
          icon={<Moon size={14} />}
          label="Moon"
          value={moonPhaseLabel(window.moon_illumination)}
          detail={
            window.moonrise && window.moonset
              ? `rise ${localTime(window.moonrise, timezone)} · set ${localTime(window.moonset, timezone)}`
              : window.moon_above_horizon_during_window
                ? 'above horizon all night'
                : 'below horizon all night'
          }
        />
        <Stat
          icon={<Cloud size={14} />}
          label="Cloud cover"
          value={cloudAvg === undefined ? '—' : `${Math.round(cloudAvg)}%`}
          detail={cloudAvg === undefined ? 'forecast unavailable' : 'avg over dark window'}
          valueClassName={cloudAvg === undefined ? 'text-text-secondary' : cloudColor(cloudAvg)}
        />
        <Stat
          icon={<Gauge size={14} />}
          label="Darkness score"
          value={`${score}/100`}
          detail={score >= 70 ? 'great' : score >= 40 ? 'fair' : 'poor'}
        />
      </div>
      <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-error/30 via-warning/30 to-success/40 relative overflow-hidden">
        <div
          className="absolute top-0 h-full w-0.5 bg-text-primary"
          style={{ left: `${Math.max(0, Math.min(100, score))}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
