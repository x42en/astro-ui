import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { BookmarkPlus, ExternalLink, Info, Loader2, Telescope } from 'lucide-react';
import { AltitudeSparkline } from './AltitudeSparkline';
import { Modal } from '../ui/Modal';
import { useIsAuthenticated } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { followObject } from '../../services/followedObjects';
import { createLiveSession } from '../../services/sessions';
import type { ObjectVisibility } from '../../types';

const TYPE_PILL: Record<string, string> = {
  galaxy: 'bg-primary-muted text-primary',
  nebula: 'bg-accent-muted text-accent',
  cluster: 'bg-warning-muted text-warning',
  planetary: 'bg-success-muted text-success',
  supernova: 'bg-error-muted text-error',
  other: 'bg-white/5 text-text-secondary',
};

interface RecommendationCardProps {
  visibility: ObjectVisibility;
  minAltitudeDeg: number;
  timezone: string;
}

function localTime(iso: string | null, timezone: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-success-muted text-success';
  if (score >= 40) return 'bg-warning-muted text-warning';
  return 'bg-white/5 text-text-secondary';
}

export function RecommendationCard({ visibility, minAltitudeDeg, timezone }: RecommendationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const isAuth = useIsAuthenticated();
  const { addToast } = useUiStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const startLiveMutation = useMutation({
    mutationFn: () =>
      createLiveSession({
        name: `${visibility.catalog_id} — ${new Date().toISOString().slice(0, 10)}`,
        object_name: visibility.name,
        target_ra: visibility.ra_deg ?? undefined,
        target_dec: visibility.dec_deg ?? undefined,
        acquired_at: new Date().toISOString(),
      }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({
        variant: 'success',
        title: 'Live session ready',
        message: `Streaming preview for ${visibility.catalog_id}.`,
      });
      navigate(`/sessions/${session.id}/live`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      addToast({ variant: 'error', title: 'Could not start session', message });
    },
  });

  const followMutation = useMutation({
    mutationFn: () =>
      followObject({
        catalog_id: visibility.catalog_id,
        note: null,
        notify_when_visible: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed_objects'] });
      addToast({ variant: 'success', title: `Following ${visibility.catalog_id}` });
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        addToast({
          variant: 'info',
          title: 'Already followed',
          message: `${visibility.catalog_id} is in your watchlist.`,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      addToast({ variant: 'error', title: 'Could not follow', message });
    },
  });

  const moonClose = visibility.moon_separation_deg < 30;

  return (
    <>
      <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-3 hover:border-space-border-light transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-mono shrink-0 ${
                TYPE_PILL[visibility.type] ?? TYPE_PILL.other
              }`}
            >
              {visibility.catalog_id}
            </span>
            <span className="font-semibold text-text-primary truncate">{visibility.name}</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded shrink-0 font-mono ${scoreColor(visibility.score)}`}
            title="Visibility score"
          >
            {Math.round(visibility.score)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span className="capitalize">{visibility.type}</span>
          {visibility.constellation && <span>· {visibility.constellation}</span>}
          {visibility.magnitude !== null && <span>· mag {visibility.magnitude.toFixed(1)}</span>}
        </div>

        <div className="text-text-secondary">
          <AltitudeSparkline
            curve={visibility.altitude_curve}
            minAltitudeDeg={minAltitudeDeg}
            className="w-full text-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-text-muted text-[10px] uppercase tracking-wide">Max alt</div>
            <div className="text-text-primary font-mono">{visibility.max_altitude_deg.toFixed(0)}°</div>
          </div>
          <div>
            <div className="text-text-muted text-[10px] uppercase tracking-wide">Transit</div>
            <div className="text-text-primary font-mono">
              {localTime(visibility.transit_time, timezone)}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-[10px] uppercase tracking-wide">Moon sep</div>
            <div className={`font-mono ${moonClose ? 'text-warning' : 'text-text-primary'}`}>
              {visibility.moon_separation_deg.toFixed(0)}°
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-1 border-t border-space-border">
          {isAuth ? (
            <button
              type="button"
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
            >
              {followMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <BookmarkPlus size={12} />
              )}
              <span>Follow</span>
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/[0.02] text-text-muted cursor-not-allowed"
              title="Sign in to follow this object"
            >
              <BookmarkPlus size={12} />
              <span>Follow</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Info size={12} />
            <span>Details</span>
          </button>
          {isAuth ? (
            <button
              type="button"
              onClick={() => startLiveMutation.mutate()}
              disabled={startLiveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary hover:bg-primary-hover text-white disabled:opacity-50 transition-colors"
              title="Create a live-stacking session pre-filled with this target"
            >
              {startLiveMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Telescope size={12} />
              )}
              <span>Start session</span>
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/[0.02] text-text-muted cursor-not-allowed"
              title="Sign in to start a live session"
            >
              <Telescope size={12} />
              <span>Start session</span>
            </span>
          )}
        </div>
      </div>

      <RecommendationDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        visibility={visibility}
        minAltitudeDeg={minAltitudeDeg}
        timezone={timezone}
      />
    </>
  );
}

interface RecommendationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: ObjectVisibility;
  minAltitudeDeg: number;
  timezone: string;
}

function RecommendationDetailModal({
  open,
  onOpenChange,
  visibility,
  minAltitudeDeg,
  timezone,
}: RecommendationDetailModalProps) {
  const simbadUrl = `https://simbad.u-strasbg.fr/simbad/sim-id?Ident=${encodeURIComponent(
    visibility.catalog_id,
  )}`;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${visibility.catalog_id} — ${visibility.name}`}
      description={`${visibility.constellation}${
        visibility.magnitude !== null ? ` · mag ${visibility.magnitude.toFixed(1)}` : ''
      }`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="text-text-secondary">
          <AltitudeSparkline
            curve={visibility.altitude_curve}
            minAltitudeDeg={minAltitudeDeg}
            width={600}
            height={200}
            className="w-full text-primary"
          />
          <p className="text-xs text-text-muted mt-1">
            Altitude through the night (dashed line at min {minAltitudeDeg}°).
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Max altitude" value={`${visibility.max_altitude_deg.toFixed(1)}°`} />
          <Stat label="Transit" value={localTime(visibility.transit_time, timezone)} />
          <Stat label="Rise" value={localTime(visibility.rise_time, timezone)} />
          <Stat label="Set" value={localTime(visibility.set_time, timezone)} />
          <Stat label="Moon sep" value={`${visibility.moon_separation_deg.toFixed(1)}°`} />
          <Stat label="Score" value={`${Math.round(visibility.score)}/100`} />
          <Stat label="RA" value={`${visibility.ra_deg.toFixed(3)}°`} />
          <Stat label="Dec" value={`${visibility.dec_deg.toFixed(3)}°`} />
        </div>

        <div className="flex justify-end pt-2 border-t border-space-border">
          <a
            href={simbadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ExternalLink size={14} />
            <span>Open in SIMBAD</span>
          </a>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-space-bg border border-space-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-text-primary font-mono mt-0.5">{value}</div>
    </div>
  );
}
