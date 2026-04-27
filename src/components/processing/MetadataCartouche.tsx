import { Camera, Aperture, Timer, Focus, Thermometer, Telescope, Layers, Wand2 } from 'lucide-react';
import type { CaptureMetadata, ProfileSummary, ProfilePreset } from '../../types';

interface MetadataCartoucheProps {
  capture?: CaptureMetadata | null;
  profile?: ProfileSummary | null;
  /**
   * `overlay` — compact, fixed-width pill suitable for absolute-positioned
   *   corners (max-w-xs sm:max-w-sm).
   * `panel` — wider, scrollable inside a sheet/modal (full width of parent).
   */
  variant?: 'overlay' | 'panel';
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
      <Icon size={11} className="text-white/45 flex-shrink-0" />
      <span className="text-[11px] text-white/80 font-mono truncate">{value}</span>
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
  className = '',
}: MetadataCartoucheProps) {
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

  return (
    <div
      className={`hud-glass rounded-xl px-3.5 py-3 text-white shadow-xl ${sizeClass} ${className}`}
      role="region"
      aria-label="Capture and pipeline metadata"
    >
      {hasCapture && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 font-medium">
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
            <div className="pt-1.5 mt-1.5 border-t border-white/8 space-y-1">
              {camera && (
                <div className="flex items-center gap-1.5 min-w-0" title={camera}>
                  <Camera size={11} className="text-white/45 flex-shrink-0" />
                  <span className="text-[11px] text-white/80 truncate">{camera}</span>
                </div>
              )}
              {tele && (
                <div className="flex items-center gap-1.5 min-w-0" title={tele}>
                  <Telescope size={11} className="text-white/45 flex-shrink-0" />
                  <span className="text-[11px] text-white/80 truncate">{tele}</span>
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
          className={`${hasCapture ? 'pt-2.5 mt-2.5 border-t border-white/8' : ''} space-y-1.5`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 font-medium">
              <Wand2 size={10} />
              Pipeline
            </div>
            {profile?.preset && (
              <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                {PRESET_LABELS[profile.preset]}
              </span>
            )}
          </div>
          {enabledTools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {enabledTools.map((label) => (
                <span
                  key={label}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/85 leading-tight"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
