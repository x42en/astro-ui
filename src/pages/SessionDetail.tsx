import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, Layers } from 'lucide-react';
import { getSession, deleteSession, resetSession, getLatestJobForSession } from '../services/sessions';
import { getJob } from '../services/jobs';
import { useUiStore } from '../store/uiStore';
import { ProcessingPanel } from '../components/processing/ProcessingPanel';
import { ThumbnailPlaceholder } from '../components/ui/ThumbnailPlaceholder';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { CalibrationFramesModal } from '../components/sessions/CalibrationFramesModal';
import type { JobRead } from '../types';

export function SessionDetail() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobsBySession = useUiStore((s) => s.jobsBySession);
  const setSessionJob = useUiStore((s) => s.setSessionJob);
  const jobId = sessionId ? jobsBySession[sessionId] : undefined;

  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

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

  const { data: latestJob } = useQuery<JobRead | null>({
    queryKey: ['sessions', sessionId, 'latest-job'],
    queryFn: () => getLatestJobForSession(sessionId!),
    enabled: !!sessionId && !jobId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (sessionId && !jobId && latestJob?.id) {
      setSessionJob(sessionId, latestJob.id);
    }
  }, [sessionId, jobId, latestJob?.id, setSessionJob]);

  const effectiveJob = activeJob ?? latestJob ?? null;

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate('/');
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
  });

  function handleDelete() {
    if (!session) return;
    const isProcessing = session.status === 'processing';
    if (isProcessing) {
      setShowResetConfirm(false);
      alert(t('sessionDetail.cancelBeforeDelete'));
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
          <p className="text-sm text-text-muted">{t('sessionDetail.loading')}</p>
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
        title={t('sessionDetail.deleteConfirm')}
        message={t('sessionDetail.deleteMessage', { name: session.name })}
        confirmLabel={t('sessionDetail.deleteLabel')}
        onConfirm={() => deleteMutation.mutate()}
      />
      <ConfirmModal
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title={t('sessionDetail.resetConfirm')}
        message={t('sessionDetail.resetMessage', { name: session.name })}
        confirmLabel={t('sessionDetail.resetLabel')}
        variant="warning"
        onConfirm={() => resetMutation.mutate()}
      />
      <ProcessingPanel session={session} activeJob={effectiveJob} />

      <CalibrationFramesModal
        open={showCalibration}
        onOpenChange={setShowCalibration}
        session={session}
      />

      <button
        onClick={() => setShowCalibration(true)}
        className="absolute top-4 right-44 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 hover:bg-accent/70 text-white/60 hover:text-white text-xs font-medium transition-all duration-200 backdrop-blur-sm"
        title={t('sessionDetail.calibrationHint')}
      >
        <Layers size={13} />
        {t('sessionDetail.calibration')}
      </button>

      {isProcessing && (
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={resetMutation.isPending}
          className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 hover:bg-warning/70 text-white/50 hover:text-white text-xs font-medium transition-all duration-200 disabled:opacity-40 backdrop-blur-sm"
          title={t('sessionDetail.resetHint')}
        >
          <RotateCcw size={13} />
          {resetMutation.isPending ? t('sessionDetail.resetting') : t('sessionDetail.resetToReady')}
        </button>
      )}

      {!isProcessing && (
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 hover:bg-red-600/80 text-white/50 hover:text-white text-xs font-medium transition-all duration-200 disabled:opacity-40 backdrop-blur-sm"
          title={t('sessionDetail.deleteHint')}
        >
          <Trash2 size={13} />
          {deleteMutation.isPending ? t('sessionDetail.deleting') : t('sessionDetail.delete')}
        </button>
      )}
    </div>
  );
}
