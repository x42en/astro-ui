import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Layers,
  Minus,
  MapPin,
  Clock,
  ChevronRight,
  Play,
  Square,
  MoreHorizontal,
  ChevronDown,
  Zap,
  Star,
  Diamond,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { StatusBadge } from '../ui/StatusBadge';
import type { SessionRead, ProfilePreset } from '../../types';

const PRESET_LABELS: Record<Exclude<ProfilePreset, 'advanced'>, { label: string; icon: React.ElementType; color: string }> = {
  quick: { label: 'Quick', icon: Zap, color: 'text-accent' },
  standard: { label: 'Standard', icon: Star, color: 'text-primary' },
  quality: { label: 'Quality', icon: Diamond, color: 'text-warning' },
};

function FrameCount({
  count,
  label,
  icon: Icon,
  color,
}: {
  count: number;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`flex items-center gap-1 font-mono text-base font-semibold ${color}`}>
        <Icon size={12} className="opacity-70" />
        {count}
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface SessionCardProps {
  session: SessionRead;
  defaultPreset?: ProfilePreset;
  onProcess?: (id: string, preset: ProfilePreset) => void;
  onCancel?: (id: string) => void;
}

export function SessionCard({ session, defaultPreset = 'standard', onProcess, onCancel }: SessionCardProps) {
  const navigate = useNavigate();
  const isProcessing = session.status === 'processing';
  const canProcess =
    session.status === 'ready' ||
    session.status === 'completed' ||
    session.status === 'failed';

  const safePreset: Exclude<ProfilePreset, 'advanced'> =
    defaultPreset === 'advanced' ? 'standard' : defaultPreset;
  const presetMeta = PRESET_LABELS[safePreset];
  const PresetIcon = presetMeta.icon;

  const PRESET_CHOICES: Array<{ preset: Exclude<ProfilePreset, 'advanced'>; label: string; icon: React.ElementType; color: string }> = [
    { preset: 'quick', label: 'Quick', icon: Zap, color: 'text-accent' },
    { preset: 'standard', label: 'Standard', icon: Star, color: 'text-primary' },
    { preset: 'quality', label: 'Quality', icon: Diamond, color: 'text-warning' },
  ];

  return (
    <div
      className={`
        group relative bg-space-surface border rounded-lg p-5 flex flex-col gap-4
        hover:border-space-border-light hover:shadow-lg hover:shadow-black/20
        transition-all duration-200 cursor-pointer
        ${isProcessing ? 'border-primary/30' : 'border-space-border'}
      `}
      onClick={() => navigate(`/sessions/${session.id}`)}
      role="article"
      aria-label={`Session: ${session.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-white transition-colors">
            {session.name}
          </h3>
          {session.object_name && (
            <p className="text-xs text-accent font-mono mt-0.5 truncate">
              {session.object_name}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={11} className="text-text-muted" />
            <span className="text-xs text-text-muted">{formatDate(session.created_at)}</span>
            {session.input_format && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-xs text-text-muted font-mono uppercase">
                  {session.input_format.replace('_', ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={session.status} />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-space-elevated transition-all opacity-0 group-hover:opacity-100"
                aria-label="Session actions"
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-40 bg-space-elevated border border-space-border rounded-lg shadow-xl p-1 animate-fade-in"
                sideOffset={4}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-space-border rounded-md cursor-pointer outline-none"
                  onSelect={() => navigate(`/sessions/${session.id}`)}
                >
                  <ChevronRight size={13} />
                  View details
                </DropdownMenu.Item>
                {canProcess && onProcess && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-space-border rounded-md cursor-pointer outline-none"
                    onSelect={() => onProcess(session.id, safePreset)}
                  >
                    <Play size={13} />
                    Process
                  </DropdownMenu.Item>
                )}
                {isProcessing && onCancel && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-muted rounded-md cursor-pointer outline-none"
                    onSelect={() => onCancel(session.id)}
                  >
                    <Square size={13} />
                    Cancel
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 py-3 border-y border-space-border/50">
        <FrameCount count={session.frame_count_lights} label="Lights" icon={Sun} color="text-warning" />
        <FrameCount count={session.frame_count_darks} label="Darks" icon={Moon} color="text-text-secondary" />
        <FrameCount count={session.frame_count_flats} label="Flats" icon={Layers} color="text-accent" />
        <FrameCount count={session.frame_count_bias} label="Bias" icon={Minus} color="text-text-muted" />
      </div>

      <div className="flex items-center justify-between">
        {session.ra != null && session.dec != null ? (
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <MapPin size={11} />
            RA {session.ra.toFixed(4)}° / Dec {session.dec.toFixed(4)}°
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin size={11} />
            No coordinates
          </div>
        )}

        {canProcess && onProcess && (
          <div
            className="flex items-center flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onProcess(session.id, safePreset)}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-l transition-all duration-150 shadow-sm border-r border-white/20"
              title={`Process with ${presetMeta.label}`}
            >
              <Play size={11} />
              <PresetIcon size={10} className="opacity-80" />
              <span>{presetMeta.label}</span>
            </button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center px-1.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs rounded-r transition-all duration-150 shadow-sm"
                  aria-label="Choose preset"
                >
                  <ChevronDown size={11} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-44 bg-space-elevated border border-space-border rounded-lg shadow-xl p-1 animate-fade-in"
                  sideOffset={4}
                  align="end"
                >
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Launch with preset
                  </p>
                  {PRESET_CHOICES.map(({ preset, label, icon: Icon, color }) => (
                    <DropdownMenu.Item
                      key={preset}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${
                        preset === safePreset
                          ? 'bg-primary-muted text-text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-space-border'
                      }`}
                      onSelect={() => onProcess(session.id, preset)}
                    >
                      <Icon size={13} className={color} />
                      {label}
                      {preset === safePreset && (
                        <span className="ml-auto text-[10px] text-text-muted">default</span>
                      )}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">Running</span>
          </div>
        )}
      </div>
    </div>
  );
}
