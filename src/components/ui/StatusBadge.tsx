import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  SkipForward,
  RefreshCw,
  Pause,
  Zap,
  Radio,
} from 'lucide-react';
import type { SessionStatus, JobStatus, StepStatus } from '../../types';

type AnyStatus = SessionStatus | JobStatus | StepStatus | 'live';

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-text-muted/10 text-text-secondary border-space-border',
  },
  ready: {
    label: 'Ready',
    icon: Zap,
    className: 'bg-accent-muted text-accent border-accent/30',
  },
  running: {
    label: 'Running',
    icon: Loader2,
    className: 'bg-primary-muted text-primary border-primary/30',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-primary-muted text-primary border-primary/30',
  },
  completed: {
    label: 'Rendered',
    icon: CheckCircle2,
    className: 'bg-success-muted text-success border-success/30',
  },
  success: {
    label: 'Success',
    icon: CheckCircle2,
    className: 'bg-success-muted text-success border-success/30',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-error-muted text-error border-error/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-text-muted/10 text-text-muted border-space-border',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    className: 'bg-warning-muted text-warning border-warning/30',
  },
  skipped: {
    label: 'Skipped',
    icon: SkipForward,
    className: 'bg-text-muted/10 text-text-muted border-space-border',
  },
  retrying: {
    label: 'Retrying',
    icon: RefreshCw,
    className: 'bg-warning-muted text-warning border-warning/30',
  },
  live: {
    label: 'Live',
    icon: Radio,
    className: 'bg-error-muted text-error border-error/40',
  },
};

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isSpinning = status === 'running' || status === 'processing' || status === 'retrying';
  const isPulsing = status === 'live';

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tracking-wide ${sizeClasses} ${config.className}`}
    >
      <Icon
        size={iconSize}
        className={isSpinning ? 'animate-spin' : isPulsing ? 'animate-pulse' : ''}
      />
      {config.label}
    </span>
  );
}
