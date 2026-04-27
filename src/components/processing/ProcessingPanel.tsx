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
  Zap,
  Star,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { startProcessing, cancelSession, getLightPreviewUrl } from '../../services/sessions';
import { listProfiles } from '../../services/profiles';
import { getPreviewUrl } from '../../services/jobs';
import { ThumbnailPlaceholder } from '../ui/ThumbnailPlaceholder';
import { ProgressPanel } from './ProgressPanel';
import { OutputActions } from './OutputActions';
import { SearchableSelect, type SelectGroup } from '../ui/SearchableSelect';
import { StatusBadge } from '../ui/StatusBadge';
import { GalleryStarToggle } from '../gallery/GalleryStarToggle';
import type { SessionRead, JobRead, ProfilePreset } from '../../types';

const PRESET_CONFIG = [
  {
    value: 'quick' as const,
    label: 'Quick',
    description: 'Fast pipeline — no plate solving, gradient or color calibration',
    Icon: Zap,
    features: ['Denoise'],
  },
  {
    value: 'standard' as const,
    label: 'Standard',
    description: 'Balanced quality — plate solving, gradient removal, color calibration',
    Icon: Layers,
    features: ['Plate solving', 'Gradient', 'Colors', 'Denoise', 'Sharpen'],
  },
  {
    value: 'quality' as const,
    label: 'Quality',
    description: 'Maximum quality — Drizzle ×2, super-resolution, star separation',
    Icon: Star,
    features: ['Drizzle ×2', 'Plate solving', 'Gradient', 'Colors', 'Denoise', 'Sharpen', 'Super-res', 'Star sep.'],
  },
];

interface ProcessingPanelProps {
  session: SessionRead;
  activeJob: JobRead | null;
}

export function ProcessingPanel({ session, activeJob }: ProcessingPanelProps) {
  const queryClient = useQueryClient();
  const {
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
    if (selectedProfileId) {
      processMutation.mutate({ preset: 'advanced', profileId: selectedProfileId });
    } else {
      processMutation.mutate({ preset: localPreset });
    }
  };

  // ── Build grouped option list for the SearchableSelect ──
  // Encoded as `preset:<name>` or `profile:<uuid>` so we can drive both
  // localPreset and selectedProfileId from a single value.
  const selectorOptions = useMemo<SelectGroup<string>[]>(() => {
    const presetOpts = PRESET_CONFIG.map((p) => ({
      value: `preset:${p.value}`,
      label: p.label,
      description: p.description,
      icon: <p.Icon size={13} />,
      searchHaystack: `${p.label} ${p.description} ${p.features.join(' ')}`,
    }));
    const profileOpts = profiles.map((p) => ({
      value: `profile:${p.id}`,
      label: p.name,
      description: p.description ?? 'Custom profile',
      icon: <SlidersHorizontal size={13} />,
      searchHaystack: `${p.name} ${p.description ?? ''}`,
    }));
    const groups: SelectGroup<string>[] = [
      { label: 'Presets', options: presetOpts },
    ];
    if (profileOpts.length > 0) {
      groups.push({ label: 'My profiles', options: profileOpts });
    }
    return groups;
  }, [profiles]);

  const selectedSelectorValue = selectedProfileId
    ? `profile:${selectedProfileId}`
    : `preset:${localPreset}`;

  const handleSelectorChange = (value: string) => {
    if (value.startsWith('profile:')) {
      setSelectedProfileId(value.slice('profile:'.length));
    } else if (value.startsWith('preset:')) {
      setLocalPreset(value.slice('preset:'.length) as ProfilePreset);
      setSelectedProfileId('');
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

  // ── View mode toggle (Result ↔ Setup) ──
  // Only meaningful for completed sessions: when a render is available we
  // default to showing it (Result), and the user can opt into Setup to
  // re-launch a new processing run with a different profile.
  const [viewMode, setViewMode] = useState<'result' | 'setup'>('result');
  const showLaunchCard =
    canStart && (!isCompleted || viewMode === 'setup');
  const showResultStrip = isCompleted && viewMode === 'result' && !!activeJob;
  const showModeToggle = isCompleted && !isProcessing;

  // Determine background image
  const bgUrl =
    isCompleted && viewMode === 'result' && activeJob?.output_preview_path
      ? getPreviewUrl(activeJob.id)
      : livePreviewUrl;

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

      {/* ── Pending HUD — top right (job queued, worker not yet started) ── */}
      {activeJob?.status === 'pending' && (
        <div className="absolute top-4 right-4 z-30 w-72 sm:w-80">
          <div className="hud-glass rounded-xl p-4 flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-white/50 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-primary">Queued</p>
              <p className="text-[11px] text-text-muted mt-0.5">Waiting for a worker to pick up…</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing HUD — top right ── */}
      {activeJob?.status === 'running' && (
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

      {/* ── Star toggle — top right (when completed) ── */}
      {showModeToggle && (
        <div className="absolute top-4 right-4 z-30">
          <GalleryStarToggle
            sessionId={session.id}
            isPublished={session.is_in_gallery}
            size="md"
            stopPropagation={false}
          />
        </div>
      )}

      {/* ── View-mode pill — top center (only on completed sessions) ── */}
      {showModeToggle && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div
            role="tablist"
            aria-label="Session view mode"
            className="hud-glass rounded-full p-0.5 flex items-center gap-0.5 shadow-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'result'}
              onClick={() => setViewMode('result')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full transition-all duration-150 ${
                viewMode === 'result'
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:text-white/85'
              }`}
              title="Show the rendered image"
            >
              <ImageIcon size={11} />
              Result
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'setup'}
              onClick={() => setViewMode('setup')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full transition-all duration-150 ${
                viewMode === 'setup'
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:text-white/85'
              }`}
              title="Re-launch processing with a new profile"
            >
              <Sliders size={11} />
              Setup
            </button>
          </div>
        </div>
      )}

      {/* ── Start card — centered (when can start, not completed) ── */}
      {showLaunchCard && (
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

            {/* Unified profile selector */}
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 text-center">
                Processing profile
              </p>
              <SearchableSelect<string>
                value={selectedSelectorValue}
                onChange={handleSelectorChange}
                options={selectorOptions}
                searchable={profiles.length > 3}
                searchPlaceholder="Search profiles…"
                ariaLabel="Processing profile"
                maxHeight={280}
                className="w-full bg-white/5 border-white/10 hover:bg-white/8"
              />
            </div>

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

      {/* ── Output actions strip — completed (Result mode) ── */}
      {showResultStrip && (
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
