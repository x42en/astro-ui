import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { getSession, deleteSession } from '../services/sessions';
import { getJob } from '../services/jobs';
import { useUiStore } from '../store/uiStore';
import { ProcessingPanel } from '../components/processing/ProcessingPanel';
import { ThumbnailPlaceholder } from '../components/ui/ThumbnailPlaceholder';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { JobRead } from '../types';

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobsBySession = useUiStore((s) => s.jobsBySession);
  const jobId = sessionId ? jobsBySession[sessionId] : undefined;

  const [showConfirm, setShowConfirm] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate('/');
    },
  });

  function handleDelete() {
    if (!session) return;
    const isProcessing = session.status === 'processing';
    if (isProcessing) {
      alert('Cancel the running job before deleting this session.');
      return;
    }
    setShowConfirm(true);
  }

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

  const isProcessing = session.status === 'processing';

  return (
    <div className="h-[calc(100vh-3.5rem)] relative">
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete session"
        message={`Delete “${session.name}”? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
      />
      <ProcessingPanel session={session} activeJob={activeJob ?? null} />
      {/* Delete button — fixed top-right overlay, hidden while processing */}
      {!isProcessing && (
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 hover:bg-red-600/80 text-white/50 hover:text-white text-xs font-medium transition-all duration-200 disabled:opacity-40 backdrop-blur-sm"
          title="Delete session"
        >
          <Trash2 size={13} />
          {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        </button>
      )}
    </div>
  );
}
