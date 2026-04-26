import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  SkipForward,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getJob } from '../../services/jobs';
import { useSettingsStore } from '../../store/settingsStore';
import type { WsEvent } from '../../types/websocket';
import type { JobRead, StepStatus } from '../../types';

function useElapsed(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) {
      setElapsed('');
      return;
    }
    const update = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      if (h > 0) setElapsed(`${h}h ${m % 60}m`);
      else if (m > 0) setElapsed(`${m}m ${s % 60}s`);
      else setElapsed(`${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

function formatDuration(start: string, end: string): string {
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60 > 0 ? ` ${s % 60}s` : ''}`;
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={11} className="text-success flex-shrink-0" />;
    case 'failed':
      return <XCircle size={11} className="text-error flex-shrink-0" />;
    case 'running':
      return <Loader2 size={11} className="text-primary animate-spin flex-shrink-0" />;
    case 'skipped':
      return <SkipForward size={11} className="text-text-muted flex-shrink-0" />;
    case 'retrying':
      return <AlertTriangle size={11} className="text-warning flex-shrink-0" />;
    default:
      return <Minus size={11} className="text-text-muted/40 flex-shrink-0" />;
  }
}

interface ProgressPanelProps {
  jobId: string;
  sessionId: string;
  onPreviewUpdate?: (url: string) => void;
}

export function ProgressPanel({ jobId, sessionId, onPreviewUpdate }: ProgressPanelProps) {
  const queryClient = useQueryClient();
  const isActive = useRef(true);
  const [collapsed, setCollapsed] = useState(false);

  const { data: job } = useQuery<JobRead>({
    queryKey: ['jobs', jobId],
    queryFn: () => getJob(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'running' || status === 'pending') return 5000;
      return false;
    },
  });

  const elapsed = useElapsed(job?.started_at ?? null);

  const handleWsEvent = (evt: WsEvent) => {
    if (!isActive.current) return;

    if (evt.type === 'step_status' && evt.status === 'success' && evt.result?.has_preview) {
      const base = useSettingsStore.getState().apiBaseUrl.replace(/\/$/, '');
      const url = `${base}/sessions/${sessionId}/step-preview/${evt.step}`;
      onPreviewUpdate?.(url);
    }

    if (
      evt.type === 'completed' ||
      evt.type === 'cancelled' ||
      evt.type === 'step_status' ||
      evt.type === 'error'
    ) {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    }

    const isTerminalError =
      evt.type === 'error' && (!evt.retryable || evt.attempt >= evt.max_attempts);

    if (
      evt.type === 'completed' ||
      evt.type === 'cancelled' ||
      evt.type === 'session_ready' ||
      isTerminalError
    ) {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  };

  useWebSocket({
    sessionId,
    onEvent: handleWsEvent,
    enabled: job?.status === 'running' || job?.status === 'pending',
  });

  useEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
    };
  }, []);

  if (!job) return null;

  const runningStep = job.steps.find((s) => s.status === 'running');
  const completedCount = job.steps.filter(
    (s) => s.status === 'success' || s.status === 'skipped',
  ).length;
  const total = job.steps.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="hud-glass rounded-lg overflow-hidden animate-slide-in-right shadow-2xl">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/4 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand HUD' : 'Collapse HUD'}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 size={11} className="text-primary animate-spin flex-shrink-0" />
          <span className="text-xs font-medium text-text-primary truncate">
            {runningStep?.display_name ?? 'Processing…'}
          </span>
          <span className="text-[10px] text-text-muted font-mono flex-shrink-0">
            {completedCount}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {elapsed && (
            <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
              <Clock size={9} />
              {elapsed}
            </span>
          )}
          {collapsed ? (
            <ChevronDown size={12} className="text-text-muted" />
          ) : (
            <ChevronUp size={12} className="text-text-muted" />
          )}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-px bg-white/6">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step list */}
      {!collapsed && (
        <div className="py-1.5 max-h-72 overflow-y-auto">
          {job.steps.map((step) => (
            <div
              key={step.step_name}
              className={`flex items-center gap-2 px-3 py-1.5 transition-colors ${
                step.status === 'running' ? 'bg-primary/8' : ''
              }`}
            >
              <StepIcon status={step.status} />
              <span
                className={`text-xs flex-1 truncate ${
                  step.status === 'pending'
                    ? 'text-text-muted'
                    : step.status === 'running'
                      ? 'text-text-primary font-medium'
                      : step.status === 'success'
                        ? 'text-text-secondary'
                        : step.status === 'skipped'
                          ? 'text-text-muted line-through'
                          : 'text-text-secondary'
                }`}
              >
                {step.display_name}
              </span>
              {(step.status === 'success' || step.status === 'failed') &&
                step.completed_at &&
                step.started_at && (
                  <span className="text-[10px] text-text-muted font-mono flex-shrink-0">
                    {formatDuration(step.started_at, step.completed_at)}
                  </span>
                )}
              {step.status === 'retrying' && step.attempt_count > 1 && (
                <span className="text-[10px] text-warning font-mono flex-shrink-0">
                  ×{step.attempt_count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
