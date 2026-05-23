import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Play, StopCircle, Upload } from 'lucide-react';
import { CalibrationPromptModal } from '../components/livestack/CalibrationPromptModal';
import {
  getLivePreviewUrl,
  getLiveState,
  getSession,
  pushLiveFrame,
  startLive,
  stopLive,
} from '../services/sessions';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUiStore } from '../store/uiStore';
import { LiveCanvas, DEFAULT_LEVELS } from '../components/livestack/LiveCanvas';
import type { LiveLevels } from '../components/livestack/LiveCanvas';
import { LevelsPanel } from '../components/livestack/LevelsPanel';
import { RGBBalancePanel } from '../components/livestack/RGBBalancePanel';
import { HistogramPanel } from '../components/livestack/HistogramPanel';
import { RecommendationsPanel } from '../components/livestack/RecommendationsPanel';
import type { WsEvent } from '../types/websocket';

export function LiveSession() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [levels, setLevels] = useState<LiveLevels>(DEFAULT_LEVELS);
  const [previewGeneration, setPreviewGeneration] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [calibrationOpen, setCalibrationOpen] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });

  const stateQuery = useQuery({
    queryKey: ['live-state', sessionId],
    queryFn: () => getLiveState(sessionId!),
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  });

  const startMutation = useMutation({
    mutationFn: () => startLive(sessionId!),
    onSuccess: () => {
      addToast({ variant: 'success', title: t('liveSession.armed') });
      queryClient.invalidateQueries({ queryKey: ['live-state', sessionId] });
    },
    onError: (e) => addToast({ variant: 'error', title: t('liveSession.startFailed'), message: String(e) }),
  });

  const stopMutation = useMutation({
    mutationFn: () => stopLive(sessionId!),
    onSuccess: () => {
      addToast({ variant: 'info', title: t('liveSession.paused') });
      queryClient.invalidateQueries({ queryKey: ['live-state', sessionId] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => pushLiveFrame(sessionId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-state', sessionId] });
    },
    onError: (e) => addToast({ variant: 'error', title: t('liveSession.uploadFailed'), message: String(e) }),
  });

  const handleEvent = useCallback((event: WsEvent) => {
    if (event.type === 'livestack_preview_updated') {
      setPreviewGeneration(event.preview_generation);
      setLogLines((prev) => [t('liveSession.frameStacked', { gen: event.preview_generation }), ...prev].slice(0, 50));
    } else if (event.type === 'livestack_frame_accepted') {
      const fwhmText = event.fwhm != null ? t('liveSession.frameAcceptedFwhm', { index: event.frame_index, count: event.frame_count, fwhm: event.fwhm.toFixed(1) }) : t('liveSession.frameAccepted', { index: event.frame_index, count: event.frame_count });
      setLogLines((prev) =>
        [fwhmText, ...prev].slice(0, 50),
      );
    } else if (event.type === 'livestack_frame_rejected') {
      setLogLines((prev) =>
        [t('liveSession.frameRejected', { index: event.frame_index, message: event.message }), ...prev].slice(0, 50),
      );
    }
  }, [t]);

  useWebSocket({ sessionId: sessionId ?? null, onEvent: handleEvent, enabled: !!sessionId });

  const previewUrl = useMemo(
    () => (sessionId ? getLivePreviewUrl(sessionId, previewGeneration) : null),
    [sessionId, previewGeneration],
  );

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isRunning = stateQuery.data?.is_running ?? false;
  const frameCount = stateQuery.data?.frame_count ?? 0;
  const rejectedCount = stateQuery.data?.rejected_count ?? 0;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[calc(100vh-4rem)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold text-text-primary truncate">
            {sessionQuery.data?.name ?? 'Live session'}
          </h1>
          {sessionQuery.data?.object_name && (
            <span className="text-xs px-2 py-0.5 rounded bg-white/5 font-mono text-text-secondary">
              {sessionQuery.data.object_name}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded font-mono ${
              isRunning ? 'bg-success-muted text-success' : 'bg-white/5 text-text-secondary'
            }`}
          >
            {isRunning ? t('liveSession.live') : t('liveSession.idle')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary hover:bg-primary-hover text-white disabled:opacity-50"
            >
              {startMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              <span>{t('liveSession.startStacking')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-warning-muted text-warning hover:opacity-90 disabled:opacity-50"
            >
              {stopMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <StopCircle size={12} />}
              <span>{t('liveSession.pause')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCalibrationOpen(true)}
            disabled={!sessionQuery.data}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-success-muted text-success hover:opacity-90 disabled:opacity-50"
            title={t('liveSession.terminateHint')}
          >
            <CheckCircle2 size={12} />
            <span>{t('liveSession.terminate')}</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary cursor-pointer">
            <Upload size={12} />
            <span>{uploadMutation.isPending ? t('liveSession.pushFramePending', { name: uploadMutation.variables?.name }) : t('liveSession.pushFrame')}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fits,.fit,.fts,.cr2,.cr3,.nef,.arw,.dng,.raf,.rw2,.orf,.pef"
              multiple
              hidden
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
        <div className="bg-black border border-space-border rounded-xl overflow-hidden flex items-center justify-center min-h-[480px]">
          {frameCount === 0 ? (
            <div className="text-center text-text-muted text-sm p-8">
              <p>{t('liveSession.noFrameStacked')}</p>
              <p className="mt-2 text-xs">
                {t('liveSession.pushHint')}
              </p>
            </div>
          ) : (
            <LiveCanvas imageUrl={previewUrl} levels={levels} className="max-w-full max-h-full" />
          )}
        </div>

        <aside className="flex flex-col gap-3 overflow-y-auto">
          <div className="bg-space-surface border border-space-border rounded-xl p-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">{t('liveSession.stacked')}</div>
              <div className="font-mono text-text-primary text-base">{frameCount}</div>
            </div>
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">{t('liveSession.rejected')}</div>
              <div className="font-mono text-text-primary text-base">{rejectedCount}</div>
            </div>
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">FWHM</div>
              <div className="font-mono text-text-primary">
                {stateQuery.data?.last_fwhm != null ? `${stateQuery.data.last_fwhm.toFixed(1)} px` : '—'}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">{t('liveSession.generation')}</div>
              <div className="font-mono text-text-primary">{previewGeneration}</div>
            </div>
          </div>

          <LevelsPanel levels={levels} onChange={setLevels} />
          <RGBBalancePanel levels={levels} onChange={setLevels} />
          <HistogramPanel imageUrl={previewUrl} />
          {sessionId && (
            <RecommendationsPanel
              sessionId={sessionId}
              previewGeneration={previewGeneration}
            />
          )}

          <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-1 text-[11px] font-mono text-text-secondary max-h-48 overflow-y-auto">
            <h3 className="text-xs font-semibold text-text-primary not-italic mb-1">{t('liveSession.activity')}</h3>
            {logLines.length === 0 && <span className="text-text-muted">{t('liveSession.waitingActivity')}</span>}
            {logLines.map((line, idx) => (
              <span key={idx}>{line}</span>
            ))}
          </div>
        </aside>
      </div>

      {sessionQuery.data && (
        <CalibrationPromptModal
          open={calibrationOpen}
          session={sessionQuery.data}
          onClose={() => setCalibrationOpen(false)}
          onTerminated={() => navigate(`/sessions/${sessionQuery.data!.id}`)}
        />
      )}
    </div>
  );
}
