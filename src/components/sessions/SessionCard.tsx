import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Layers, Minus, Clock, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '../ui/StatusBadge';
import { ThumbnailPlaceholder } from '../ui/ThumbnailPlaceholder';
import { ConfirmModal } from '../ui/ConfirmModal';
import { GalleryStarToggle } from '../gallery/GalleryStarToggle';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getLightPreviewUrl, deleteSession } from '../../services/sessions';
import type { SessionRead } from '../../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface SessionCardProps {
  session: SessionRead;
}

export function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobStatusBySession = useUiStore((s) => s.jobStatusBySession);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);

  const [showConfirm, setShowConfirm] = useState(false);

  const liveStatus = jobStatusBySession[session.id] ?? session.status;
  const isRendered = session.status === 'completed';
  const isProcessing = liveStatus === 'processing' || liveStatus === 'running';
  const isLive =
    session.mode === 'live' &&
    session.status !== 'completed' &&
    session.status !== 'failed' &&
    session.status !== 'cancelled';
  const thumbnailUrl = `${apiBaseUrl}/sessions/${session.id}/step-preview/export`;

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (isProcessing) return;
    setShowConfirm(true);
  }

  return (
    <>
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete session"
        message={`Delete “${session.name}”? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
      />
      <div
        className="group relative overflow-hidden rounded-lg cursor-pointer bg-black select-none"
        style={{ aspectRatio: '4/3' }}
        onClick={() => navigate(isLive ? `/sessions/${session.id}/live` : `/sessions/${session.id}`)}
        role="article"
        aria-label={`Session: ${session.name}`}
      >
      {/* Placeholder always rendered below */}
      <ThumbnailPlaceholder
        sessionId={session.id}
        className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
      />

      {/* Light-frame preview — shown for non-completed sessions (hides on 404) */}
      {!isRendered && (
        <img
          src={getLightPreviewUrl(session.id)}
          alt={session.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {/* Real thumbnail on top when completed */}
      {isRendered && (
        <img
          src={thumbnailUrl}
          alt={session.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {/* Gradient overlay — always present */}
      <div className="absolute inset-0 overlay-gradient opacity-75 group-hover:opacity-85 transition-opacity duration-300 pointer-events-none" />

      {/* Top-left: status badge */}
      <div className="absolute top-3 left-3 z-10">
        <StatusBadge status={isLive ? 'live' : (liveStatus as Parameters<typeof StatusBadge>[0]['status'])} />
      </div>

      {/* Top-right: star (when completed), live pulse (processing), trash (idle hover) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {isRendered && (
          <GalleryStarToggle
            sessionId={session.id}
            isPublished={session.is_in_gallery}
            size="sm"
          />
        )}
        {isProcessing ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        ) : (
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-md bg-black/50 hover:bg-red-600/80 text-white/60 hover:text-white disabled:opacity-40"
            aria-label="Delete session"
            title="Delete session"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-4">
        <h3 className="text-sm font-semibold text-white truncate leading-tight">
          {session.name}
        </h3>
        {session.object_name && (
          <p className="text-xs text-accent font-mono mt-0.5 truncate">{session.object_name}</p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2.5">
            {session.frame_count_lights > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-white/45">
                <Sun size={9} className="text-warning/60" />
                {session.frame_count_lights}
              </span>
            )}
            {session.frame_count_darks > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-white/45">
                <Moon size={9} />
                {session.frame_count_darks}
              </span>
            )}
            {session.frame_count_flats > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-white/45">
                <Layers size={9} className="text-accent/60" />
                {session.frame_count_flats}
              </span>
            )}
            {session.frame_count_bias > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-white/45">
                <Minus size={9} />
                {session.frame_count_bias}
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-1 text-[11px] text-white/35"
            title={
              session.acquired_at
                ? `Captured ${new Date(session.acquired_at).toLocaleString()}`
                : `Imported ${new Date(session.created_at).toLocaleString()}`
            }
          >
            <Clock size={9} />
            {formatDate(session.acquired_at ?? session.created_at)}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
