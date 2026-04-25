import { CheckCircle2, XCircle, Loader2, SkipForward, RefreshCw, Circle } from 'lucide-react';
import type { StepStatus } from '../../types';

export interface Step {
  name: string;
  display_name?: string;
  status: StepStatus;
  attempt_count?: number;
  error_code?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep?: string | null;
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={16} className="text-success" />;
    case 'failed':
      return <XCircle size={16} className="text-error" />;
    case 'running':
      return <Loader2 size={16} className="text-primary animate-spin" />;
    case 'skipped':
      return <SkipForward size={16} className="text-text-muted" />;
    case 'retrying':
      return <RefreshCw size={16} className="text-warning animate-spin" />;
    default:
      return <Circle size={16} className="text-text-muted" />;
  }
}

function stepDuration(step: Step): string | null {
  if (!step.started_at) return null;
  const end = step.completed_at ? new Date(step.completed_at) : new Date();
  const start = new Date(step.started_at);
  const ms = end.getTime() - start.getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  const completedCount = steps.filter((s) => s.status === 'success').length;
  const totalCount = steps.filter((s) => s.status !== 'skipped').length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted font-medium">
          {completedCount} / {totalCount} steps
        </span>
        <span className="text-xs text-text-secondary font-mono">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="h-1 bg-space-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-0.5">
        {steps.map((step, idx) => {
          const isActive = step.name === currentStep || step.status === 'running';
          const duration = stepDuration(step);

          return (
            <div
              key={`${step.name}-${idx}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-primary-muted border border-primary/20 animate-glow-pulse'
                  : step.status === 'success'
                  ? 'bg-success-muted/30'
                  : step.status === 'failed'
                  ? 'bg-error-muted/30'
                  : 'bg-transparent'
              }`}
            >
              <StepIcon status={step.status} />
              <span
                className={`flex-1 text-sm font-mono tracking-tight truncate ${
                  isActive
                    ? 'text-text-primary'
                    : step.status === 'success'
                    ? 'text-text-secondary'
                    : step.status === 'failed'
                    ? 'text-error'
                    : step.status === 'skipped'
                    ? 'text-text-muted line-through'
                    : 'text-text-muted'
                }`}
              >
                {step.display_name || step.name}
              </span>
              {step.attempt_count !== undefined && step.attempt_count > 1 && (
                <span className="text-xs text-warning font-mono">
                  ×{step.attempt_count}
                </span>
              )}
              {duration && (
                <span className="text-xs text-text-muted font-mono flex-shrink-0">
                  {duration}
                </span>
              )}
              {step.error_code && (
                <span className="text-xs text-error font-mono flex-shrink-0 truncate max-w-24">
                  {step.error_code}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
