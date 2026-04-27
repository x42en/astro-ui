import { useState } from 'react';
import {
  Camera,
  Aperture,
  Timer,
  Focus,
  Thermometer,
  Telescope,
  Layers,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Logo } from '../branding/Logo';
import type { CaptureMetadata, ProfileSummary, ProfilePreset } from '../../types';

interface MetadataCartoucheProps {
  capture?: CaptureMetadata | null;
  profile?: ProfileSummary | null;
  /**
   * `overlay` — compact, fixed-width pill suitable for absolute-positioned
   *   corners (max-w-xs sm:max-w-sm). Collapsible by default.
   * `panel` — wider, scrollable inside a sheet/modal (full width of parent).
   *   Always expanded.
   */
  variant?: 'overlay' | 'panel';
  /**
   * When true, renders a header with a chevron toggle. Defaults to `true` for
   * `overlay`, `false` for `panel`.
   */
  collapsible?: boolean;
  /**
   * Initial expanded state when `collapsible`. Defaults to `false` (collapsed)
   * so an overlay does not obscure the underlying image until the user opts in.
   */
  defaultOpen?: boolean;
  className?: string;
}

const PRESET_LABELS: Record<ProfilePreset, string> = {
  quick: 'Quick',
  standard: 'Standard',
  quality: 'Quality',
  advanced: 'Advanced',
};

const TOOL_LABELS: Record<string, string> = {
  drizzle_enabled: 'Drizzle',
  plate_solving_enabled: 'Plate solve',
  gradient_removal_enabled: 'GraXpert',
  color_calibration_enabled: 'Colour cal.',
  photometric_calibration_enabled: 'PCC',
  denoise_enabled: 'Denoise',
  sharpen_enabled: 'Sharpen',
  super_resolution_enabled: 'Super-res',
  star_separation_enabled: 'Star sep.',
};

function formatExposure(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  if (seconds < 1) {
    const denom = Math.round(1 / seconds);
    return `1/${denom} s`;
  }
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatRange(min?: number, max?: number, suffix = ''): string | null {
  if (min == null || max == null) return null;
  return `${formatExposure(min) ?? min}${suffix} – ${formatExposure(max) ?? max}${suffix}`;
}

function formatDuration(totalSeconds?: number): string | null {
  if (!totalSeconds) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function formatCamera(c: CaptureMetadata): string | null {
  const parts: string[] = [];
  if (c.camera_make) parts.push(c.camera_make);
  if (c.camera_model && (!c.camera_make || !c.camera_model.startsWith(c.camera_make))) {
    parts.push(c.camera_model);
  } else if (c.camera_model) {
    return c.camera_model;
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

interface FieldProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | null;
  title?: string;
}

function Field({ icon: Icon, label, value, title }: FieldProps) {
  if (!value) return null;
  return (
    <div
      className="flex items-center gap-1.5 min-w-0"
      title={title ?? `${label}: ${value}`}
    >
      <Icon size={11} className="text-white/40 flex-shrink-0" />
      <span className="text-[11px] text-white/85 font-mono truncate">{value}</span>
    </div>
  );
}

/**
 * Discrete glass cartouche surfacing capture EXIF + pipeline profile.
 *
 * Renders nothing when both inputs are empty (graceful fallback for legacy
 * sessions that pre-date EXIF aggregation / profile snapshots).
 */
export function MetadataCartouche({
  capture,
  profile,
  variant = 'overlay',
  collapsible,
  defaultOpen,
  className = '',
}: MetadataCartoucheProps) {
  const isCollapsible = collapsible ?? variant === 'overlay';
  const initialOpen = defaultOpen ?? variant === 'panel';
  const [open, setOpen] = useState(initialOpen);

  const hasCapture = !!capture && Object.keys(capture).some(
    (k) => k !== 'frame_count' && k !== 'with_metadata' && capture[k] != null,
  );
  const hasProfile = !!profile && (profile.preset || profile.tools);
  if (!hasCapture && !hasProfile) return null;

  const exposure = capture?.exposure_seconds != null
    ? formatExposure(capture.exposure_seconds)
    : formatRange(capture?.exposure_seconds_min, capture?.exposure_seconds_max);
  const iso = capture?.iso != null
    ? `ISO ${capture.iso}`
    : capture?.iso_min && capture?.iso_max
      ? `ISO ${capture.iso_min}–${capture.iso_max}`
      : null;
  const fnum = capture?.f_number != null ? `f/${capture.f_number.toFixed(1)}` : null;
  const focal = capture?.focal_length_mm != null ? `${Math.round(capture.focal_length_mm)} mm` : null;
  const camera = capture ? formatCamera(capture) : null;
  const temp = capture?.temperature_c != null ? `${capture.temperature_c.toFixed(1)} °C` : null;
  const tele = capture?.telescope ?? null;
  const filt = capture?.filter ?? null;
  const integ = formatDuration(capture?.total_integration_seconds);
  const frames = capture?.frame_count ? `${capture.frame_count} × frames` : null;

  const enabledTools = profile?.tools
    ? (Object.entries(profile.tools)
        .filter(([, on]) => on)
        .map(([k]) => TOOL_LABELS[k] ?? k))
    : [];

  const sizeClass = variant === 'overlay'
    ? 'max-w-xs sm:max-w-sm'
    : 'w-full';

  // ── Surface tokens ────────────────────────────────────────────────────────
  // Deep-black translucent panel matching the overall dark space theme.
  const surface =
    'bg-black/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/60';

  // ── Collapsed pill ────────────────────────────────────────────────────────
  if (isCollapsible && !open) {
    const summaryBits: string[] = [];
    if (exposure) summaryBits.push(exposure);
    if (frames) summaryBits.push(frames.replace(' × frames', '×'));
    if (profile?.preset) summaryBits.push(PRESET_LABELS[profile.preset]);
    const summary = summaryBits.slice(0, 2).join(' · ');

    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Show capture and pipeline metadata"
        className={`group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-white/85 hover:text-white transition-colors ${surface} ${className}`}
      >
        <Logo variant="glyph" size={13} className="text-accent/80 group-hover:text-accent" />
        <span className="text-[10.5px] uppercase tracking-[0.12em] font-medium">
          Metadata
        </span>
        {summary && (
          <span className="text-[10.5px] text-white/50 font-mono normal-case tracking-normal">
            · {summary}
          </span>
        )}
        <ChevronDown
          size={12}
          className="text-white/40 group-hover:text-white/70 transition-colors"
        />
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl text-white ${surface} ${sizeClass} ${className}`}
      role="region"
      aria-label="Capture and pipeline metadata"
    >
      {/* Header bar with brand mark + collapse control */}
      <div className="flex items-center justify-between gap-2 px-3.5 pt-2.5 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <Logo variant="glyph" size={13} className="text-accent/80 flex-shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/70">
            AstroStack
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            · Metadata
          </span>
        </div>
        {isCollapsible && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded={true}
            aria-label="Hide metadata"
            className="text-white/40 hover:text-white/80 transition-colors -mr-1 p-1"
          >
            <ChevronUp size={13} />
          </button>
        )}
      </div>

      <div className="px-3.5 py-3 space-y-3">
        {hasCapture && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.14em] text-white/45 font-semibold">
              <Camera size={10} />
              Acquisition
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <Field icon={Timer} label="Exposure" value={exposure} />
              <Field icon={Camera} label="ISO" value={iso} />
              <Field icon={Aperture} label="Aperture" value={fnum} />
              <Field icon={Focus} label="Focal length" value={focal} />
              <Field icon={Thermometer} label="Sensor temp" value={temp} />
              <Field icon={Layers} label="Frames" value={frames} />
            </div>
            {(camera || tele || filt || integ) && (
              <div className="pt-1.5 mt-1.5 border-t border-white/[0.06] space-y-1">
                {camera && (
                  <div className="flex items-center gap-1.5 min-w-0" title={camera}>
                    <Camera size={11} className="text-white/40 flex-shrink-0" />
                    <span className="text-[11px] text-white/85 truncate">{camera}</span>
                  </div>
                )}
                {tele && (
                  <div className="flex items-center gap-1.5 min-w-0" title={tele}>
                    <Telescope size={11} className="text-white/40 flex-shrink-0" />
                    <span className="text-[11px] text-white/85 truncate">{tele}</span>
                  </div>
                )}
                {(filt || integ) && (
                  <div className="flex items-center gap-3 text-[11px] text-white/65 font-mono">
                    {filt && <span>{filt}</span>}
                    {integ && <span title="Total integration">∑ {integ}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {hasProfile && (
          <div
            className={`${hasCapture ? 'pt-2.5 border-t border-white/[0.06]' : ''} space-y-1.5`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.14em] text-white/45 font-semibold">
                <Wand2 size={10} />
                Pipeline
              </div>
              {profile?.preset && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25 text-[9.5px] uppercase tracking-[0.10em] text-accent font-semibold">
                  {PRESET_LABELS[profile.preset]}
                </span>
              )}
            </div>
            {enabledTools.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {enabledTools.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md bg-white/[0.03] border border-white/[0.08] text-[9.5px] uppercase tracking-[0.08em] text-white/75 font-medium leading-tight"
                  >
                    <span className="w-1 h-1 rounded-full bg-accent/70" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
