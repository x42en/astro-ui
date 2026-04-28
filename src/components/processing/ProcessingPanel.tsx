import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Square,
  Sun,
  Moon,
  Layers,
  Minus,
  MapPin,
  Loader2,
  Image as ImageIcon,
  Sliders,
  Info,
  X,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { startProcessing, cancelSession, getLightPreviewUrl, getStepPreviewUrl } from '../../services/sessions';
import { getPreviewUrl } from '../../services/jobs';
import { ThumbnailPlaceholder } from '../ui/ThumbnailPlaceholder';
import { ProgressPanel } from './ProgressPanel';
import { OutputActions } from './OutputActions';
import { MetadataCartouche } from './MetadataCartouche';
import { ProfileChoiceSelect, type ProfileChoice } from './ProfileChoiceSelect';
import { StatusBadge } from '../ui/StatusBadge';
import { GalleryStarToggle } from '../gallery/GalleryStarToggle';
import type { SessionRead, JobRead, ProfilePreset, ProfileSummary } from '../../types';

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
  // Per-step preview override: when set, the background switches to the JPEG
  // produced after that pipeline step (browsable on completed sessions).
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

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

  const profileChoice: ProfileChoice = selectedProfileId
    ? { kind: 'profile', profileId: selectedProfileId }
    : { kind: 'preset', preset: localPreset as Exclude<ProfilePreset, 'advanced'> };

  const handleProfileChoiceChange = (choice: ProfileChoice) => {
    if (choice.kind === 'profile') {
      setSelectedProfileId(choice.profileId);
    } else {
      setLocalPreset(choice.preset);
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
    selectedStep
      ? getStepPreviewUrl(session.id, selectedStep)
      : isCompleted && viewMode === 'result' && activeJob?.output_preview_path
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

      {/* ── Step browser — completed sessions, when in result view ── */}
      {isCompleted && activeJob && viewMode === 'result' && (
        <div className="absolute top-16 right-4 z-30 w-72 sm:w-80">
          <ProgressPanel
            jobId={activeJob.id}
            sessionId={session.id}
            selectedStep={selectedStep}
            onStepSelect={setSelectedStep}
          />
        </div>
      )}

      {/* ── Back-to-final-render chip — when browsing a step preview ── */}
      {selectedStep && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <button
            type="button"
            onClick={() => setSelectedStep(null)}
            className="hud-glass rounded-full px-3 py-1.5 text-xs text-text-primary hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <X size={11} />
            Retour au rendu final
          </button>
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
              <ProfileChoiceSelect
                value={profileChoice}
                onChange={handleProfileChoiceChange}
                ariaLabel="Processing profile"
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

      {/* ── Capture + pipeline metadata cartouche (Result mode only) ── */}
      {showResultStrip && (
        <MetadataOverlay session={session} job={activeJob} />
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

// ─── Metadata overlay (capture EXIF + pipeline summary) ──────────────────
//
// Desktop (md+): rendered as a discrete glass cartouche above the
// OutputActions strip in the bottom-right corner.  Mobile: collapsed to
// a single floating Info button at the same location; tapping it slides
// up a bottom sheet that occupies at most 40 % of the viewport so the
// image stays the dominant element.
function deriveProfileSummary(job: JobRead): ProfileSummary {
  const snap = job.profile_snapshot ?? null;
  const summary: ProfileSummary = { preset: job.profile_preset };
  if (snap) {
    const tools = {
      drizzle_enabled: !!snap.drizzle_enabled,
      plate_solving_enabled: !!snap.plate_solving_enabled,
      gradient_removal_enabled: !!snap.gradient_removal_enabled,
      color_calibration_enabled: !!snap.color_calibration_enabled,
      photometric_calibration_enabled: !!snap.photometric_calibration_enabled,
      denoise_enabled: !!snap.denoise_enabled,
      sharpen_enabled: !!snap.sharpen_enabled,
      super_resolution_enabled: !!snap.super_resolution_enabled,
      star_separation_enabled: !!snap.star_separation_enabled,
    };
    summary.tools = tools;
    if (snap.stretch_method) summary.stretch_method = snap.stretch_method;
  }
  return summary;
}

interface MetadataOverlayProps {
  session: SessionRead;
  job: JobRead;
}

function MetadataOverlay({ session, job }: MetadataOverlayProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = deriveProfileSummary(job);
  const capture = session.capture_metadata;
  const hasContent =
    (capture && Object.keys(capture).some((k) =>
      k !== 'frame_count' && k !== 'with_metadata' && (capture as Record<string, unknown>)[k] != null,
    )) ||
    !!profile.preset;

  if (!hasContent) return null;

  return (
    <>
      {/* Desktop cartouche */}
      <div className="hidden md:block absolute bottom-24 right-4 z-30 max-w-sm">
        <MetadataCartouche capture={capture} profile={profile} variant="overlay" />
      </div>

      {/* Mobile: floating Info button */}
      <div className="md:hidden absolute bottom-20 right-4 z-30">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="metadata-sheet"
          className="hud-glass rounded-full p-2.5 text-white/85 hover:text-white shadow-lg"
          title={mobileOpen ? 'Hide metadata' : 'Show capture and pipeline metadata'}
        >
          {mobileOpen ? <X size={14} /> : <Info size={14} />}
        </button>
      </div>

      {/* Mobile: collapsible bottom sheet */}
      {mobileOpen && (
        <div
          id="metadata-sheet"
          className="md:hidden absolute inset-x-3 bottom-20 z-30 max-h-[40vh] overflow-y-auto animate-slide-in-up"
        >
          <MetadataCartouche capture={capture} profile={profile} variant="panel" />
        </div>
      )}
    </>
  );
}
