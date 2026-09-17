import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { JobRead } from '../../types';

interface AdaptiveIterationRecord {
  iteration: number;
  satisfied: boolean;
  confidence: number;
  reasoning: string;
  patch_proposed: Record<string, unknown>;
  patch_applied: Record<string, unknown>;
  human_approved: boolean | null;
}

interface StepAdaptiveTrace {
  step: string;
  displayName: string;
  converged: boolean;
  iterations: AdaptiveIterationRecord[];
}

/**
 * Read every step's persisted adaptive-critic trace (`adaptive_iterations`
 * in `JobStep.output_metadata`, see `app.pipeline.adaptive.types.AdaptiveLoopResult`).
 * Returns an empty array when the loop never ran (the default, since
 * `adaptive_critic_enabled` is off unless explicitly turned on).
 */
function extractAdaptiveTraces(job: JobRead | null): StepAdaptiveTrace[] {
  if (!job) return [];
  const traces: StepAdaptiveTrace[] = [];
  for (const step of job.steps) {
    const meta = step.output_metadata;
    if (!meta || typeof meta !== 'object' || !('adaptive_iterations' in meta)) continue;
    const iterations = (meta as Record<string, unknown>).adaptive_iterations;
    if (!Array.isArray(iterations) || iterations.length === 0) continue;
    traces.push({
      step: step.step_name,
      displayName: step.display_name,
      converged: Boolean((meta as Record<string, unknown>).adaptive_converged),
      iterations: iterations as AdaptiveIterationRecord[],
    });
  }
  return traces;
}

function formatPatch(patch: Record<string, unknown>): string {
  const entries = Object.entries(patch);
  if (entries.length === 0) return 'no change';
  return entries
    .map(([field, value]) => `${field}=${typeof value === 'number' ? value.toFixed(2) : String(value)}`)
    .join(', ');
}

interface AdaptiveIterationsPanelProps {
  job: JobRead | null;
}

/**
 * Read-only reasoning trace for the Phase 2 adaptive vision-critic loop:
 * per refined step, what the critic saw, decided, and changed at each
 * iteration. Renders nothing when the loop never ran for this job.
 */
export function AdaptiveIterationsPanel({ job }: AdaptiveIterationsPanelProps) {
  const [open, setOpen] = useState(false);
  const traces = extractAdaptiveTraces(job);

  if (traces.length === 0) return null;

  const totalIterations = traces.reduce((sum, t) => sum + t.iterations.length, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hud-glass rounded-full px-3 py-1.5 text-xs text-white/85 hover:text-white shadow-lg flex items-center gap-1.5"
        title="Show the adaptive vision-critic reasoning trace"
      >
        <Sparkles size={13} />
        <span className="hidden sm:inline">AI critic ({totalIterations})</span>
      </button>

      {open && (
        <div
          className="absolute top-12 left-0 z-30 max-w-sm w-[min(92vw,24rem)] rounded-lg p-3 text-xs text-white/90 shadow-xl hud-glass animate-slide-in-up"
          role="dialog"
          aria-label="Adaptive critic reasoning trace"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" />
              <span className="font-semibold">Adaptive critic trace</span>
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
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {traces.map((trace) => (
              <div key={trace.step} className="border-b border-white/5 pb-2 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] text-white/80">{trace.displayName}</span>
                  <span
                    className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      trace.converged
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {trace.converged ? 'converged' : 'budget exhausted'}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {trace.iterations.map((it) => (
                    <li key={it.iteration} className="text-white/70">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white/50">#{it.iteration + 1}</span>
                        <span className="text-[11px]">{it.reasoning}</span>
                      </div>
                      <div className="text-[10px] text-white/50 pl-4">
                        confidence {(it.confidence * 100).toFixed(0)}% ·{' '}
                        {formatPatch(it.patch_applied)}
                        {it.human_approved !== null && (
                          <> · {it.human_approved ? 'approved' : 'rejected'} by reviewer</>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
