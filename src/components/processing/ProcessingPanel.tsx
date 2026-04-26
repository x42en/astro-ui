import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Square,
  Sun,
  Moon,
  Layers,
  Minus,
  MapPin,
  Loader2,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { startProcessing, cancelSession, getLightPreviewUrl } from '../../services/sessions';
import { listProfiles } from '../../services/profiles';
import { getPreviewUrl } from '../../services/jobs';
import { ThumbnailPlaceholder } from '../ui/ThumbnailPlaceholder';
import { ProgressPanel } from './ProgressPanel';
import { OutputActions } from './OutputActions';
import { StatusBadge } from '../ui/StatusBadge';
import type { SessionRead, JobRead, ProfilePreset } from '../../types';

interface ProcessingPanelProps {
  session: SessionRead;
  activeJob: JobRead | null;
}

export function ProcessingPanel({ session, activeJob }: ProcessingPanelProps) {
  const queryClient = useQueryClient();
  const {
    viewMode,
    addToast,
    setSessionJob,
    presetsBySession,
    setSessionPreset,
    profileIdsBySession,
    setSessionProfileId,
  } = useUiStore();

  const sessionPreset = useMemo<ProfilePreset>(
    () => presetsBySession[session.id] ?? 'standard',
    [presetsBySession, session.id],
  );

  const [localPreset, setLocalPreset] = useState<ProfilePreset>(sessionPreset);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profileIdsBySession[session.id] ?? '',
  );
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(
    () => getLightPreviewUrl(session.id),
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
    enabled: viewMode === 'advanced',
  });

  const processMutation = useMutation({
    mutationFn: ({
      preset,
      profileId,
    }: {
      preset: ProfilePreset;
      profileId?: string;
    }) => startProcessing(session.id, preset, profileId),
    onSuccess: (data, vars) => {
      setSessionJob(session.id, data.job_id);
      setSessionPreset(session.id, vars.preset);
      if (vars.profileId) setSessionProfileId(session.id, vars.profileId);
      queryClient.setQueryData<SessionRead>(['sessions', session.id], (old) =>
        old ? { ...old, status: 'processing' } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({
        variant: 'info',
        title: 'Processing started',
        message: `Running ${vars.preset} pipeline`,
      });
    },
    onError: (err: { message?: string }) => {
      addToast({
        variant: 'error',
        title: 'Failed to start',
        message: err?.message ?? 'Unknown error',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSession(session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({ variant: 'warning', title: 'Processing cancelled' });
    },
    onError: () => {
      addToast({ variant: 'error', title: 'Could not cancel job' });
    },
  });

  const handleStart = () => {
    if (viewMode === 'advanced' && selectedProfileId) {
      processMutation.mutate({ preset: 'advanced', profileId: selectedProfileId });
    } else {
      processMutation.mutate({ preset: localPreset });
    }
  };

  const isProcessing =
    session.status === 'processing' || activeJob?.status === 'running';
  const isCompleted = activeJob?.status === 'completed';
  const canStart =
    (session.status === 'ready' ||
      session.status === 'completed' ||
      session.status === 'failed') &&
    !isProcessing;

  // Determine background image
  const bgUrl =
    isCompleted && activeJob?.output_preview_path
      ? getPreviewUrl(activeJob.id)
      : livePreviewUrl;

  const PRESETS: Array<{ value: Exclude<ProfilePreset, 'advanced'>; label: string }> = [
    { value: 'quick', label: 'Quick' },
    { value: 'standard', label: 'Standard' },
    { value: 'quality', label: 'Quality' },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* ── Background ── */}
      {bgUrl ? (
        <img
          src={bgUrl}
          alt="Render"
          className="absolute inset-0 w-full h-full object-contain animate-fade-in"
        />
      ) : (
        <ThumbnailPlaceholder
          sessionId={session.id}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* ── Vignette ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top fade for HUD readability */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
        {/* Bottom fade for overlay readability */}
        <div className="absolute bottom-0 inset-x-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />
      </div>

      {/* ── Processing HUD — top right ── */}
      {activeJob && isProcessing && (
        <div className="absolute top-4 right-4 z-30 w-72 sm:w-80">
          <ProgressPanel
            jobId={activeJob.id}
            sessionId={session.id}
            onPreviewUpdate={setLivePreviewUrl}
          />
        </div>
      )}

      {/* ── Cancel button — top left (when processing) ── */}
      {isProcessing && (
        <div className="absolute top-4 left-4 z-30">
          <button
            type="button"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="hud-glass rounded px-3 py-1.5 text-xs text-error hover:text-red-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Square size={11} />
            Cancel
          </button>
        </div>
      )}

      {/* ── Start card — centered (when can start, not completed) ── */}
      {canStart && !isCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="hud-glass rounded-xl p-6 sm:p-8 max-w-sm w-full space-y-5 animate-slide-in-up shadow-2xl">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {session.name}
              </h2>
              {session.object_name && (
                <p className="text-sm text-accent font-mono">{session.object_name}</p>
              )}
              {session.status === 'failed' && (
                <p className="text-xs text-error mt-2">
                  Previous job failed — retry with a new profile
                </p>
              )}
            </div>

            {/* Preset pills */}
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 text-center">
                Processing profile
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setLocalPreset(p.value);
                      setSelectedProfileId('');
                    }}
                    className={`py-2 rounded text-xs font-medium capitalize transition-all duration-150 ${
                      localPreset === p.value && !selectedProfileId
                        ? 'bg-white/15 text-white ring-1 ring-white/20'
                        : 'bg-white/5 border border-white/8 text-text-muted hover:text-text-secondary hover:bg-white/8'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced: custom profile picker */}
            {viewMode === 'advanced' && profiles.length > 0 && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">
                  <SlidersHorizontal size={10} className="inline mr-1" />
                  Custom profile
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs transition-all ${
                        selectedProfileId === p.id
                          ? 'bg-primary/20 text-text-primary ring-1 ring-primary/30'
                          : 'bg-white/4 text-text-muted hover:text-text-secondary hover:bg-white/8'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          selectedProfileId === p.id ? 'bg-primary' : 'bg-white/20'
                        }`}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={processMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={15} />
              )}
              {processMutation.isPending ? 'Starting…' : 'Start Processing'}
            </button>
          </div>
        </div>
      )}

      {/* ── Output actions strip — completed ── */}
      {isCompleted && activeJob && (
        <div className="absolute bottom-0 inset-x-0 z-20">
          <OutputActions job={activeJob} onReprocess={handleStart} />
        </div>
      )}

      {/* ── Bottom metadata strip — when not completed and not in start mode ── */}
      {!isCompleted && !canStart && (
        <div className="absolute bottom-0 inset-x-0 z-10 p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <StatusBadge status={session.status} />
              </div>
              <h2 className="text-base font-semibold text-white truncate">
                {session.name}
              </h2>
              {session.object_name && (
                <p className="text-sm text-accent font-mono mt-0.5 truncate">
                  {session.object_name}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-white/45 text-xs font-mono flex-wrap">
                {session.frame_count_lights > 0 && (
                  <span className="flex items-center gap-1">
                    <Sun size={10} className="text-warning/60" />
                    {session.frame_count_lights}L
                  </span>
                )}
                {session.frame_count_darks > 0 && (
                  <span className="flex items-center gap-1">
                    <Moon size={10} />
                    {session.frame_count_darks}D
                  </span>
                )}
                {session.frame_count_flats > 0 && (
                  <span className="flex items-center gap-1">
                    <Layers size={10} className="text-accent/60" />
                    {session.frame_count_flats}F
                  </span>
                )}
                {session.frame_count_bias > 0 && (
                  <span className="flex items-center gap-1">
                    <Minus size={10} />
                    {session.frame_count_bias}B
                  </span>
                )}
                {session.ra != null && session.dec != null && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {session.ra.toFixed(2)}° / {session.dec.toFixed(2)}°
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending state indicator ── */}
      {session.status === 'pending' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50">Scanning for frames…</p>
        </div>
      )}
    </div>
  );
}
