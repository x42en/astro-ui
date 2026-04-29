import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Play, StopCircle, Upload } from 'lucide-react';
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
import type { WsEvent } from '../types/websocket';

/**
 * Live-stacking workspace for a single session.
 *
 * Layout: full-bleed canvas on the left, a stacked column of control
 * panels on the right (levels, RGB balance, histogram, status). The
 * preview JPEG is refreshed each time the worker emits a
 * ``livestack_preview_updated`` event over the session WebSocket.
 */
export function LiveSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [levels, setLevels] = useState<LiveLevels>(DEFAULT_LEVELS);
  const [previewGeneration, setPreviewGeneration] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);

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
      addToast({ variant: 'success', title: 'Live stacking armed' });
      queryClient.invalidateQueries({ queryKey: ['live-state', sessionId] });
    },
    onError: (e) => addToast({ variant: 'error', title: 'Start failed', message: String(e) }),
  });

  const stopMutation = useMutation({
    mutationFn: () => stopLive(sessionId!),
    onSuccess: () => {
      addToast({ variant: 'info', title: 'Live stacking paused' });
      queryClient.invalidateQueries({ queryKey: ['live-state', sessionId] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => pushLiveFrame(sessionId!, file),
    onSuccess: () => {
      // Bumping the cache key gives instant feedback while we wait for
      // the worker's preview-updated event.
      queryClient.invalidateQueries({ queryKey: ['live-state', sessionId] });
    },
    onError: (e) => addToast({ variant: 'error', title: 'Upload failed', message: String(e) }),
  });

  const handleEvent = useCallback((event: WsEvent) => {
    if (event.type === 'livestack_preview_updated') {
      setPreviewGeneration(event.preview_generation);
      setLogLines((prev) => [`Stacked frame · gen ${event.preview_generation}`, ...prev].slice(0, 50));
    } else if (event.type === 'livestack_frame_accepted') {
      const fwhmText = event.fwhm != null ? ` · FWHM ${event.fwhm.toFixed(1)}px` : '';
      setLogLines((prev) =>
        [`✓ Frame ${event.frame_index} stacked (n=${event.frame_count})${fwhmText}`, ...prev].slice(0, 50),
      );
    } else if (event.type === 'livestack_frame_rejected') {
      setLogLines((prev) =>
        [`✗ Frame ${event.frame_index} rejected: ${event.message}`, ...prev].slice(0, 50),
      );
    }
  }, []);

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
            {isRunning ? 'LIVE' : 'IDLE'}
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
              <span>Start stacking</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-warning-muted text-warning hover:opacity-90 disabled:opacity-50"
            >
              {stopMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <StopCircle size={12} />}
              <span>Pause</span>
            </button>
          )}
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary cursor-pointer">
            <Upload size={12} />
            <span>Push frame{uploadMutation.isPending ? ` (${uploadMutation.variables?.name})` : ''}</span>
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
              <p>No frame stacked yet.</p>
              <p className="mt-2 text-xs">
                Push a FITS or RAW frame to seed the stack — the preview will appear here.
              </p>
            </div>
          ) : (
            <LiveCanvas imageUrl={previewUrl} levels={levels} className="max-w-full max-h-full" />
          )}
        </div>

        <aside className="flex flex-col gap-3 overflow-y-auto">
          <div className="bg-space-surface border border-space-border rounded-xl p-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">Stacked</div>
              <div className="font-mono text-text-primary text-base">{frameCount}</div>
            </div>
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">Rejected</div>
              <div className="font-mono text-text-primary text-base">{rejectedCount}</div>
            </div>
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">FWHM</div>
              <div className="font-mono text-text-primary">
                {stateQuery.data?.last_fwhm != null ? `${stateQuery.data.last_fwhm.toFixed(1)} px` : '—'}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-[10px] uppercase tracking-wide">Generation</div>
              <div className="font-mono text-text-primary">{previewGeneration}</div>
            </div>
          </div>

          <LevelsPanel levels={levels} onChange={setLevels} />
          <RGBBalancePanel levels={levels} onChange={setLevels} />
          <HistogramPanel imageUrl={previewUrl} />

          <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-1 text-[11px] font-mono text-text-secondary max-h-48 overflow-y-auto">
            <h3 className="text-xs font-semibold text-text-primary not-italic mb-1">Activity</h3>
            {logLines.length === 0 && <span className="text-text-muted">Waiting for activity…</span>}
            {logLines.map((line, idx) => (
              <span key={idx}>{line}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
