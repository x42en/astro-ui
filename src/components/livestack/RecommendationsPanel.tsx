import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import {
  getLiveRecommendations,
  type Recommendation,
  type RecommendationSeverity,
} from '../../services/sessions';

interface RecommendationsPanelProps {
  sessionId: string;
  /** Bumped on each preview update — used to refresh the advice. */
  previewGeneration: number;
}

const SEVERITY_STYLES: Record<RecommendationSeverity, { tint: string; Icon: typeof AlertTriangle }> = {
  critical: { tint: 'text-error border-error/40 bg-error-muted', Icon: AlertTriangle },
  warn: { tint: 'text-warning border-warning/40 bg-warning-muted', Icon: AlertTriangle },
  info: { tint: 'text-text-secondary border-space-border bg-space-elevated', Icon: Info },
};

const CATEGORY_LABEL: Record<Recommendation['category'], string> = {
  exposure: 'Exposition',
  iso: 'ISO',
  white_balance: 'Balance des blancs',
  focus: 'Focus / suivi',
  general: 'Général',
};

/**
 * Sidebar panel that polls the backend recommender and renders its
 * advice as severity-coded cards. Refreshes whenever the live
 * preview generation changes (debounced by react-query).
 */
export function RecommendationsPanel({ sessionId, previewGeneration }: RecommendationsPanelProps) {
  const query = useQuery({
    queryKey: ['live-recommendations', sessionId],
    queryFn: () => getLiveRecommendations(sessionId),
    enabled: !!sessionId,
    staleTime: 5_000,
    retry: false,
  });

  // Refetch when a new preview is available, but never more than once
  // every 5 s thanks to ``staleTime`` above.
  useEffect(() => {
    if (previewGeneration > 0) {
      query.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewGeneration]);

  const noStackYet =
    isAxiosError(query.error) && query.error.response?.status === 404;

  return (
    <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-3 min-h-0">
      <header className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          Recommandations
        </h3>
        {query.isFetching && <Loader2 size={12} className="animate-spin text-text-muted" />}
      </header>

      {noStackYet && (
        <p className="text-xs text-text-muted">
          Empilez au moins une frame pour obtenir des recommandations.
        </p>
      )}

      {!noStackYet && query.error && (
        <p className="text-xs text-error">
          Impossible de charger les recommandations.
        </p>
      )}

      {query.data && (
        <>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-text-secondary font-mono">
            <Stat label="Médiane R" value={query.data.stats.median_r} />
            <Stat label="Médiane V" value={query.data.stats.median_g} />
            <Stat label="Médiane B" value={query.data.stats.median_b} />
            <Stat label="Saturé %" value={query.data.stats.clip_high_pct} digits={2} />
            <Stat label="Plancher %" value={query.data.stats.clip_low_pct} digits={2} />
            <Stat
              label="FWHM"
              value={query.data.stats.last_fwhm ?? null}
              suffix="px"
              digits={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            {query.data.recommendations.map((rec, idx) => {
              const style = SEVERITY_STYLES[rec.severity];
              const Icon = rec.severity === 'info' && rec.category === 'general' ? CheckCircle2 : style.Icon;
              return (
                <div
                  key={idx}
                  className={`border rounded-md px-3 py-2 text-xs space-y-1 ${style.tint}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon size={12} />
                    <span>{CATEGORY_LABEL[rec.category]}</span>
                  </div>
                  <p>{rec.message}</p>
                  <p className="text-text-secondary">{rec.action}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = '',
  digits = 3,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  digits?: number;
}) {
  return (
    <div>
      <div className="text-text-muted text-[10px] uppercase">{label}</div>
      <div className="text-text-primary">
        {value == null ? '—' : `${value.toFixed(digits)}${suffix}`}
      </div>
    </div>
  );
}
