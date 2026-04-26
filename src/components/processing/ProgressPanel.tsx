import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, AlertCircle, Eye } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getJob } from '../../services/jobs';
import { ProgressStepper } from '../ui/ProgressStepper';
import { StatusBadge } from '../ui/StatusBadge';
import type { WsEvent } from '../../types/websocket';
import type { JobRead } from '../../types';

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
      if (h > 0) setElapsed(`${h}h ${m % 60}m ${s % 60}s`);
      else if (m > 0) setElapsed(`${m}m ${s % 60}s`);
      else setElapsed(`${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

interface ProgressPanelProps {
  jobId: string;
  sessionId: string;
}

export function ProgressPanel({ jobId, sessionId }: ProgressPanelProps) {
  const queryClient = useQueryClient();
  const isActive = useRef(true);
  const [stepPreviews, setStepPreviews] = useState<Record<string, string>>({});

  const { data: job, isLoading } = useQuery<JobRead>({
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

    // Capture per-step preview URLs as they arrive
    if (evt.type === 'step_status' && evt.status === 'success' && evt.result?.preview_url) {
      setStepPreviews((prev) => ({
        ...prev,
        [evt.step]: evt.result!.preview_url as string,
      }));
    }

    // Reload job on any pipeline status change
    if (
      evt.type === 'completed' ||
      evt.type === 'cancelled' ||
      evt.type === 'step_status' ||
      evt.type === 'error'
    ) {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    }

    // Reload ALL session queries (lists in Sidebar/Dashboard + detail) on terminal events
    const isTerminalError =
      evt.type === 'error' &&
      (!evt.retryable || evt.attempt >= evt.max_attempts);

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
    return () => { isActive.current = false; };
  }, []);

  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted text-sm">
        Loading job status…
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />
          <span className="text-xs text-text-muted font-mono truncate">
            {job.id.slice(0, 8)}…
          </span>
        </div>
        <div className="flex items-center gap-4">
          {elapsed && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
              <Clock size={12} />
              {elapsed}
            </div>
          )}
          <span className="text-xs text-text-muted font-mono capitalize">
            {job.profile_preset}
          </span>
        </div>
      </div>

      {job.error_code && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-error-muted border border-error/20 rounded-md">
          <AlertCircle size={14} className="text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-error">Job failed</p>
            <p className="text-xs text-text-muted font-mono mt-0.5">{job.error_code}</p>
          </div>
        </div>
      )}

      <ProgressStepper
          steps={job.steps.map((s) => ({
            name: s.step_name,
            display_name: s.display_name,
            status: s.status,
            attempt_count: s.attempt_count,
            error_code: s.error_code,
            started_at: s.started_at,
            completed_at: s.completed_at,
          }))}
          currentStep={job.current_step}
        />

      {/* Live step preview — updated after each completed step */}
      {Object.keys(stepPreviews).length > 0 && (() => {
        const latestStep = Object.keys(stepPreviews).at(-1)!;
        const previewUrl = stepPreviews[latestStep];
        return (
          <div className="rounded-md overflow-hidden border border-space-border bg-space-surface animate-fade-in">
            <div className="px-3 py-2 border-b border-space-border flex items-center gap-1.5">
              <Eye size={11} className="text-text-muted" />
              <span className="text-xs font-medium text-text-secondary">
                Step preview — <span className="font-mono text-text-muted">{latestStep}</span>
              </span>
            </div>
            <img
              src={previewUrl}
              alt={`Preview after ${latestStep}`}
              className="w-full object-cover max-h-56"
              loading="lazy"
            />
          </div>
        );
      })()}
    </div>
  );
}
