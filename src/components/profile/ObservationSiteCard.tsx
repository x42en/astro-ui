import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { ObservationSite } from '../../types';

interface ObservationSiteCardProps {
  site: ObservationSite;
  onEdit: (site: ObservationSite) => void;
  onDelete: (site: ObservationSite) => void;
}

/**
 * Convert decimal degrees to a degrees/minutes/seconds string with sign.
 */
function toDms(value: number, axis: 'lat' | 'lon'): string {
  const positive = axis === 'lat' ? 'N' : 'E';
  const negative = axis === 'lat' ? 'S' : 'W';
  const hemisphere = value >= 0 ? positive : negative;
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  return `${deg}° ${min.toString().padStart(2, '0')}′ ${sec.toFixed(1).padStart(4, '0')}″ ${hemisphere}`;
}

export function ObservationSiteCard({ site, onEdit, onDelete }: ObservationSiteCardProps) {
  const [showDms, setShowDms] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-3 hover:border-space-border-light transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-text-primary leading-tight truncate">{site.name}</h3>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(site)}
            aria-label={`Edit ${site.name}`}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete ${site.name}`}
            className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {site.description && (
        <p className="text-sm text-text-secondary line-clamp-3">{site.description}</p>
      )}

      <button
        type="button"
        onClick={() => setShowDms((s) => !s)}
        className="grid grid-cols-2 gap-2 text-xs text-left rounded hover:bg-white/[0.02] -mx-1 px-1 py-1 transition-colors"
        title="Click to toggle decimal / DMS"
      >
        <div>
          <div className="text-text-muted uppercase tracking-wide text-[10px]">Latitude</div>
          <div className="text-text-secondary font-mono">
            {showDms ? toDms(site.latitude, 'lat') : `${site.latitude.toFixed(6)}°`}
          </div>
        </div>
        <div>
          <div className="text-text-muted uppercase tracking-wide text-[10px]">Longitude</div>
          <div className="text-text-secondary font-mono">
            {showDms ? toDms(site.longitude, 'lon') : `${site.longitude.toFixed(6)}°`}
          </div>
        </div>
        <div>
          <div className="text-text-muted uppercase tracking-wide text-[10px]">Elevation</div>
          <div className="text-text-secondary font-mono">{Math.round(site.elevation_m)} m</div>
        </div>
        <div>
          <div className="text-text-muted uppercase tracking-wide text-[10px]">Timezone</div>
          <div className="text-text-secondary font-mono truncate" title={site.timezone}>
            {site.timezone}
          </div>
        </div>
      </button>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete observation site"
        message={`Delete "${site.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => onDelete(site)}
      />
    </div>
  );
}
