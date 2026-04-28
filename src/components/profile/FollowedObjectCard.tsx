import { useQuery } from '@tanstack/react-query';
import { BookmarkMinus, CalendarRange } from 'lucide-react';
import { useState } from 'react';
import type { FollowedObject, ObservationSite } from '../../types';
import { getFollowedVisibility } from '../../services/followedObjects';
import { Modal } from '../ui/Modal';
import { ObjectForecastHeatmap } from './ObjectForecastHeatmap';

interface FollowedObjectCardProps {
  followed: FollowedObject;
  primarySite: ObservationSite | null;
  onUnfollow: (followed: FollowedObject) => void;
}

const TYPE_PILL: Record<string, string> = {
  galaxy: 'bg-primary-muted text-primary',
  nebula: 'bg-accent-muted text-accent',
  cluster: 'bg-warning-muted text-warning',
  planetary: 'bg-success-muted text-success',
  supernova: 'bg-error-muted text-error',
  other: 'bg-white/5 text-text-secondary',
};

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
    return new Date(iso).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export function FollowedObjectCard({
  followed,
  primarySite,
  onUnfollow,
}: FollowedObjectCardProps) {
  const obj = followed.catalog_object;
  const today = new Date().toISOString().slice(0, 10);
  const [forecastOpen, setForecastOpen] = useState(false);

  const visibilityQuery = useQuery({
    queryKey: ['follow_visibility', followed.catalog_id, primarySite?.id, today],
    queryFn: () =>
      getFollowedVisibility(followed.catalog_id, {
        lat: primarySite!.latitude,
        lon: primarySite!.longitude,
        elevation_m: primarySite!.elevation_m,
        date: today,
      }),
    enabled: !!primarySite,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <>
      <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-2 hover:border-space-border-light transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[11px] px-2 py-0.5 rounded font-mono shrink-0 ${
              obj ? TYPE_PILL[obj.type] : 'bg-white/5 text-text-muted'
            }`}
          >
            {followed.catalog_id}
          </span>
          <span className="font-semibold text-text-primary truncate">
            {obj?.name ?? followed.catalog_id}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onUnfollow(followed)}
          aria-label={`Unfollow ${followed.catalog_id}`}
          className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-colors shrink-0"
        >
          <BookmarkMinus size={14} />
        </button>
      </div>

      {obj && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span className="capitalize">{obj.type}</span>
          {obj.constellation && <span>· {obj.constellation}</span>}
          {obj.magnitude !== null && <span>· mag {obj.magnitude.toFixed(1)}</span>}
        </div>
      )}

      {followed.note && (
        <p className="text-sm text-text-secondary line-clamp-2 italic">{followed.note}</p>
      )}

      <div className="text-xs text-text-muted mt-1 min-h-[1rem]">
        {!primarySite && <span>Add an observation site to see next visibility.</span>}
        {primarySite && visibilityQuery.isLoading && (
          <span className="inline-block w-40 h-3 bg-white/5 rounded animate-pulse" />
        )}
        {primarySite && visibilityQuery.data && (
          <span>
            From <span className="text-text-secondary">{primarySite.name}</span> tonight: max{' '}
            <span className="text-text-secondary">
              {visibilityQuery.data.max_altitude_deg.toFixed(0)}°
            </span>{' '}
            at{' '}
            <span className="text-text-secondary">
              {formatLocalTime(visibilityQuery.data.transit_time, primarySite.timezone)}
            </span>
          </span>
        )}
        {primarySite && visibilityQuery.isError && (
          <span>Visibility unavailable for tonight.</span>
        )}
      </div>
        {primarySite && (
          <button
            type="button"
            onClick={() => setForecastOpen(true)}
            className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors self-start"
          >
            <CalendarRange size={12} />
            <span>View 90-night forecast</span>
          </button>
        )}
      </div>

      {primarySite && (
        <Modal
          open={forecastOpen}
          onOpenChange={setForecastOpen}
          title={`When can I observe ${obj?.name ?? followed.catalog_id}?`}
          description={`90-night observability heatmap from ${primarySite.name}.`}
          size="lg"
        >
          <ObjectForecastHeatmap catalogId={followed.catalog_id} site={primarySite} />
        </Modal>
      )}
    </>
  );
}
