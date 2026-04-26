import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sun,
  Moon,
  Layers,
  Minus,
  MapPin,
  FolderOpen,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { getSession } from '../services/sessions';
import { getJob } from '../services/jobs';
import { useUiStore } from '../store/uiStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProcessingPanel } from '../components/processing/ProcessingPanel';
import { Skeleton } from '../components/ui/Skeleton';
import type { JobRead } from '../types';

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <div className="text-sm text-text-secondary mt-0.5 break-all">{value}</div>
      </div>
    </div>
  );
}

function FrameStat({
  count,
  label,
  icon: Icon,
  color,
}: {
  count: number;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-4 bg-space-elevated rounded-md border border-space-border">
      <div className={`flex items-center gap-1.5 font-mono text-xl font-bold ${color}`}>
        <Icon size={14} className="opacity-70" />
        {count}
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const processingPanelRef = useRef<HTMLDivElement>(null);
  const prevJobStatus = useRef<string | undefined>(undefined);

  const jobsBySession = useUiStore((s) => s.jobsBySession);
  const jobId = sessionId ? jobsBySession[sessionId] : undefined;

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });

  const { data: activeJob } = useQuery<JobRead>({
    queryKey: ['jobs', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'running' || status === 'pending') return 4000;
      return false;
    },
  });

  // Auto-scroll to the processing panel when the job transitions to completed
  useEffect(() => {
    if (activeJob?.status === 'completed' && prevJobStatus.current === 'running') {
      processingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevJobStatus.current = activeJob?.status;
  }, [activeJob?.status]);

  if (isLoading || !session) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
        <span className="text-space-border">/</span>
        <h1 className="text-xl font-semibold text-text-primary truncate">
          {session.name}
        </h1>
        <StatusBadge status={session.status} />

        <button
          type="button"
          onClick={() => refetch()}
          className="ml-auto p-1.5 rounded border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-elevated transition-all"
          aria-label="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-space-surface border border-space-border rounded-lg p-5">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              Session details
            </h2>

            <div className="space-y-3.5">
              <InfoRow
                icon={Calendar}
                label="Created"
                value={formatDateTime(session.created_at)}
              />
              <InfoRow
                icon={FolderOpen}
                label="Inbox path"
                value={
                  <span className="font-mono text-xs text-text-muted break-all">
                    {session.inbox_path}
                  </span>
                }
              />
              {session.object_name && (
                <InfoRow
                  icon={Sun}
                  label="Object"
                  value={
                    <span className="font-medium text-accent">{session.object_name}</span>
                  }
                />
              )}
              {session.ra != null && session.dec != null && (
                <InfoRow
                  icon={MapPin}
                  label="Coordinates"
                  value={
                    <span className="font-mono text-xs">
                      RA {session.ra.toFixed(6)}° / Dec {session.dec.toFixed(6)}°
                    </span>
                  }
                />
              )}
              {session.input_format && (
                <InfoRow
                  icon={Layers}
                  label="Input format"
                  value={
                    <span className="font-mono uppercase text-xs">
                      {session.input_format.replace('_', ' ')}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          <div className="bg-space-surface border border-space-border rounded-lg p-5">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              Frame counts
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <FrameStat count={session.frame_count_lights} label="Lights" icon={Sun} color="text-warning" />
              <FrameStat count={session.frame_count_darks} label="Darks" icon={Moon} color="text-text-secondary" />
              <FrameStat count={session.frame_count_flats} label="Flats" icon={Layers} color="text-accent" />
              <FrameStat count={session.frame_count_bias} label="Bias" icon={Minus} color="text-text-muted" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div ref={processingPanelRef} className="bg-space-surface border border-space-border rounded-lg p-5 h-full">
            <ProcessingPanel
              session={session}
              activeJob={activeJob ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
