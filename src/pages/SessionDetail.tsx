import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSession } from '../services/sessions';
import { getJob } from '../services/jobs';
import { useUiStore } from '../store/uiStore';
import { ProcessingPanel } from '../components/processing/ProcessingPanel';
import { ThumbnailPlaceholder } from '../components/ui/ThumbnailPlaceholder';
import type { JobRead } from '../types';

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const jobsBySession = useUiStore((s) => s.jobsBySession);
  const jobId = sessionId ? jobsBySession[sessionId] : undefined;

  const { data: session, isLoading } = useQuery({
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

  if (isLoading || !session) {
    return (
      <div className="h-[calc(100vh-3.5rem)] bg-black flex items-center justify-center">
        {sessionId ? (
          <ThumbnailPlaceholder
            sessionId={sessionId}
            className="w-full h-full absolute inset-0 opacity-40"
          />
        ) : null}
        <div className="relative z-10 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-muted">Loading session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <ProcessingPanel session={session} activeJob={activeJob ?? null} />
    </div>
  );
}
