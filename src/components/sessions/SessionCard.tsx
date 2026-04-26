import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Layers, Minus, Clock } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { ThumbnailPlaceholder } from '../ui/ThumbnailPlaceholder';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
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
  const jobStatusBySession = useUiStore((s) => s.jobStatusBySession);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);

  const liveStatus = jobStatusBySession[session.id] ?? session.status;
  const isRendered = session.status === 'completed';
  const thumbnailUrl = `${apiBaseUrl}/sessions/${session.id}/step-preview/export`;

  return (
    <div
      className="group relative overflow-hidden rounded-lg cursor-pointer bg-black select-none"
      style={{ aspectRatio: '4/3' }}
      onClick={() => navigate(`/sessions/${session.id}`)}
      role="article"
      aria-label={`Session: ${session.name}`}
    >
      {/* Placeholder always rendered below */}
      <ThumbnailPlaceholder
        sessionId={session.id}
        className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
      />

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
        <StatusBadge status={liveStatus as Parameters<typeof StatusBadge>[0]['status']} />
      </div>

      {/* Top-right: live pulse when processing */}
      {(liveStatus === 'processing' || liveStatus === 'running') && (
        <div className="absolute top-3 right-3 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        </div>
      )}

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
          <div className="flex items-center gap-1 text-[11px] text-white/35">
            <Clock size={9} />
            {formatDate(session.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
