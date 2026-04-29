import { useState } from 'react';
import { Wand2, X } from 'lucide-react';
import type { JobRead } from '../../types';

interface AdaptiveOverrideField {
  from: unknown;
  to: unknown;
  source?: string;
}

interface AdaptiveOverridesPayload {
  object_type: string | null;
  fields: Record<string, AdaptiveOverrideField>;
}

/**
 * Read the adaptive-overrides payload persisted on the export step's
 * `output_metadata`. Returns `null` when the job has not yet completed
 * the export step or when no overrides were applied.
 */
function extractOverrides(job: JobRead | null): AdaptiveOverridesPayload | null {
  if (!job) return null;
  for (const step of job.steps) {
    const meta = step.output_metadata;
    if (meta && typeof meta === 'object' && 'adaptive_overrides_applied' in meta) {
      const candidate = (meta as Record<string, unknown>).adaptive_overrides_applied;
      if (
        candidate &&
        typeof candidate === 'object' &&
        'fields' in candidate &&
        typeof (candidate as Record<string, unknown>).fields === 'object'
      ) {
        return candidate as AdaptiveOverridesPayload;
      }
    }
  }
  return null;
}

const SOURCE_LABEL: Record<string, string> = {
  auto: 'Catalogue',
  auto_catalogue: 'Catalogue',
  auto_default: 'Auto (default)',
  force_on: 'Force ON',
  force_off: 'Force OFF',
};

function formatValue(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'on' : 'off';
  if (v == null) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

interface AdaptiveOverridesPanelProps {
  job: JobRead | null;
}

/**
 * Read-only overlay listing the parameters the orchestrator changed at job
 * start via the catalogue (object-type adaptation) or via the user's
 * tri-state mode flags. Renders nothing when no overrides apply.
 */
export function AdaptiveOverridesPanel({ job }: AdaptiveOverridesPanelProps) {
  const [open, setOpen] = useState(false);
  const payload = extractOverrides(job);

  if (!payload || Object.keys(payload.fields).length === 0) return null;

  const entries = Object.entries(payload.fields);
  const objectLabel = payload.object_type ?? 'user policy';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hud-glass absolute bottom-20 left-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/85 hover:text-white shadow-lg"
        title="Show adaptive overrides applied to the profile"
      >
        <Wand2 size={13} />
        <span className="hidden sm:inline">Auto adjustments ({entries.length})</span>
      </button>

      {open && (
        <div
          className="hud-glass absolute bottom-32 left-4 z-30 max-w-sm w-[min(92vw,22rem)] rounded-lg p-3 text-xs text-white/90 shadow-xl animate-slide-in-up"
          role="dialog"
          aria-label="Adaptive overrides"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Wand2 size={13} className="text-accent" />
              <span className="font-semibold">
                Adaptive profile · <span className="text-accent">{objectLabel}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white"
              aria-label="Close"
            >
              <X size={13} />
            </button>
          </div>
          <p className="mb-2 text-white/60">
            Parameters changed automatically before processing started.
          </p>
          <ul className="space-y-1">
            {entries.map(([field, change]) => {
              const sourceKey = change.source ?? 'auto';
              const sourceLabel = SOURCE_LABEL[sourceKey] ?? sourceKey;
              return (
                <li
                  key={field}
                  className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1 last:border-0"
                >
                  <span className="font-mono text-[11px] text-white/80 truncate" title={field}>
                    {field}
                  </span>
                  <span className="flex items-baseline gap-1 text-[11px] shrink-0">
                    <span className="text-white/50 line-through">{formatValue(change.from)}</span>
                    <span className="text-white/40">→</span>
                    <span className="text-accent font-medium">{formatValue(change.to)}</span>
                    <span className="ml-1 rounded bg-white/10 px-1 text-[10px] uppercase tracking-wide text-white/70">
                      {sourceLabel}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
