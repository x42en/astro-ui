import { useState } from 'react';
import {
  Layers,
  Droplets,
  Cpu,
  MapPin,
  Blend,
  Palette,
  Wand2,
  Focus,
  Maximize2,
  Sparkles,
  RefreshCw,
  Crosshair,
} from 'lucide-react';
import { StepSection, SliderField, SelectField, ToggleField } from './StepSection';
import type { ProcessingProfileConfig } from '../../types';
import { DEFAULT_ADVANCED_CONFIG } from '../../lib/presets';
import { OBJECT_PRESETS } from '../../lib/objectPresets';

interface ProfileFormProps {
  initialConfig?: ProcessingProfileConfig;
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onConfigChange: (config: ProcessingProfileConfig) => void;
  /** When true, disables every input/select/button rendered by the form. */
  readOnly?: boolean;
}

export function ProfileForm({
  initialConfig,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onConfigChange,
  readOnly = false,
}: ProfileFormProps) {
  const [config, setConfig] = useState<ProcessingProfileConfig>(
    initialConfig ?? DEFAULT_ADVANCED_CONFIG
  );

  const update = (patch: Partial<ProcessingProfileConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onConfigChange(next);
  };

  const c = config;

  return (
    <fieldset
      disabled={readOnly}
      className="space-y-4 disabled:opacity-80 disabled:cursor-not-allowed"
    >

      {/* ── Object-type templates ── */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Start from template
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {OBJECT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              onClick={() => {
                update(preset.config);
                // Pre-fill the profile name only when the user hasn't typed
                // anything yet — never overwrite an existing name so picking
                // a template at any time stays non-destructive.
                if (!name.trim()) {
                  onNameChange(preset.suggestedName);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-space-border hover:border-white/20 text-text-muted hover:text-text-secondary text-xs transition-all duration-150"
            >
              <span>{preset.emoji}</span>
              <span className="font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Profile name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My custom profile"
            className="w-full px-3 py-2 bg-space-elevated border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Description <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe when to use this profile…"
            rows={2}
            className="w-full px-3 py-2 bg-space-elevated border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
          />
        </div>
      </div>

      <div className="border-t border-space-border pt-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Pipeline configuration
        </p>

        <div className="space-y-2">

          <StepSection
            title="Stacking"
            description="Combines aligned light frames using statistical pixel rejection to suppress noise, satellites and cosmic rays."
            icon={<Layers size={13} />}
            enabled={true}
            onEnabledChange={() => {}}
            hideToggle
            defaultOpen={false}
          >
            <SelectField
              label="Rejection algorithm"
              value={c.rejection_algorithm ?? 'sigma'}
              options={[
                { value: 'sigma', label: 'Sigma clipping' },
                { value: 'winsorized', label: 'Winsorized sigma' },
                { value: 'linear', label: 'Linear' },
                { value: 'none', label: 'None' },
              ]}
              onChange={(v) => update({ rejection_algorithm: v as ProcessingProfileConfig['rejection_algorithm'] })}
            />
            <SliderField
              label="Rejection low (σ)"
              value={c.rejection_low ?? 3.0}
              min={1.0}
              max={5.0}
              step={0.5}
              onChange={(v) => update({ rejection_low: v })}
            />
            <SliderField
              label="Rejection high (σ)"
              value={c.rejection_high ?? 3.0}
              min={1.0}
              max={5.0}
              step={0.5}
              onChange={(v) => update({ rejection_high: v })}
            />
            <SelectField
              label="Normalization"
              value={c.normalization ?? 'addscale'}
              options={[
                { value: 'addscale', label: 'Additive + scale' },
                { value: 'mulscale', label: 'Multiplicative + scale' },
                { value: 'none', label: 'None' },
              ]}
              onChange={(v) => update({ normalization: v as ProcessingProfileConfig['normalization'] })}
            />
          </StepSection>

          <StepSection
            title="Debayer"
            description="Reconstructs full RGB colour from the Bayer mosaic of OSC / DSLR sensors. Leave on auto unless your camera reports the wrong pattern."
            icon={<Cpu size={13} />}
            enabled={true}
            onEnabledChange={() => {}}
            hideToggle
            defaultOpen={false}
          >
            <SelectField
              label="Bayer pattern"
              value={c.debayer_pattern ?? 'auto'}
              options={[
                { value: 'auto', label: 'Auto-detect' },
                { value: 'RGGB', label: 'RGGB' },
                { value: 'BGGR', label: 'BGGR' },
                { value: 'GRBG', label: 'GRBG' },
                { value: 'GBRG', label: 'GBRG' },
              ]}
              onChange={(v) => update({ debayer_pattern: v as ProcessingProfileConfig['debayer_pattern'] })}
            />
          </StepSection>

          <StepSection
            title="Star Detection (advanced)"
            description="Tunes Siril's findstar detector used by frame registration (alignment before stacking). Leave OFF unless your subs fail to align: relaxed values let non-stellar structures (nebula edges, hot pixels) become alignment anchors, which causes micro-jitter between frames and smears fine chrominance on bright nebula cores (e.g. M42)."
            icon={<Crosshair size={13} />}
            enabled={c.findstar_override_enabled ?? false}
            onEnabledChange={(v) => update({ findstar_override_enabled: v })}
            defaultOpen={false}
          >
            <SliderField
              label="Detection radius (px)"
              value={c.findstar_radius ?? 10}
              min={3}
              max={30}
              step={1}
              unit="px"
              onChange={(v) => update({ findstar_radius: v })}
            />
            <SliderField
              label="Sigma threshold"
              value={c.findstar_sigma ?? 1.0}
              min={0.3}
              max={3.0}
              step={0.1}
              onChange={(v) => update({ findstar_sigma: v })}
            />
            <SliderField
              label="Roundness threshold"
              value={c.findstar_roundness ?? 0.5}
              min={0.1}
              max={0.9}
              step={0.05}
              onChange={(v) => update({ findstar_roundness: v })}
            />
            <ToggleField
              label="Relax mode (accept marginal candidates)"
              value={c.findstar_relax ?? false}
              onChange={(v) => update({ findstar_relax: v })}
            />
          </StepSection>

          <StepSection
            title="Drizzle"
            description="Sub-pixel resampling that increases effective resolution when many dithered sub-frames are available. Costly in time and disk."
            icon={<Droplets size={13} />}
            enabled={c.drizzle_enabled ?? false}
            onEnabledChange={(v) => update({ drizzle_enabled: v })}
            defaultOpen={false}
          >
            <SelectField
              label="Scale factor"
              value={String(c.drizzle_scale ?? 2)}
              options={[
                { value: '2', label: '2×' },
                { value: '3', label: '3×' },
              ]}
              onChange={(v) => update({ drizzle_scale: Number(v) })}
            />
            <SliderField
              label="Pixel fraction"
              value={c.drizzle_pixfrac ?? 0.7}
              min={0.1}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ drizzle_pixfrac: v })}
            />
          </StepSection>

          <StepSection
            title="Plate Solving"
            description="Astrometric WCS solve via ASTAP. Required for photometric colour calibration and for the target-coordinate hint."
            icon={<MapPin size={13} />}
            enabled={c.plate_solving_enabled ?? true}
            onEnabledChange={(v) => update({ plate_solving_enabled: v })}
            defaultOpen={false}
          >
            <SliderField
              label="Search radius (°)"
              value={c.plate_solving_radius_deg ?? 30.0}
              min={1}
              max={90}
              step={1}
              unit="°"
              onChange={(v) => update({ plate_solving_radius_deg: v })}
            />
            <SelectField
              label="Speed"
              value={c.plate_solving_speed ?? 'auto'}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'fast', label: 'Fast' },
                { value: 'slow', label: 'Slow (thorough)' },
              ]}
              onChange={(v) => update({ plate_solving_speed: v as ProcessingProfileConfig['plate_solving_speed'] })}
            />
          </StepSection>

          <StepSection
            title="Gradient Removal"
            description="Subtracts smooth background gradients caused by light pollution and vignetting. AI mode (GraXpert) is generally safer on heavy nebulosity."
            icon={<Blend size={13} />}
            enabled={c.gradient_removal_enabled ?? true}
            onEnabledChange={(v) => update({ gradient_removal_enabled: v })}
            defaultOpen={false}
          >
            <SelectField
              label="Method"
              value={c.gradient_removal_method ?? 'ai'}
              options={[
                { value: 'ai', label: 'AI (GraXpert)' },
                { value: 'polynomial', label: 'Polynomial' },
              ]}
              onChange={(v) => update({ gradient_removal_method: v as ProcessingProfileConfig['gradient_removal_method'] })}
            />
            {(c.gradient_removal_method ?? 'ai') === 'ai' && (
              <SelectField
                label="AI model"
                value={c.gradient_removal_ai_model ?? '1.0.1'}
                options={[
                  { value: '1.0.1', label: 'GraXpert BGE 1.0.1 (recommended)' },
                ]}
                onChange={(v) => update({ gradient_removal_ai_model: v })}
              />
            )}
          </StepSection>

          <StepSection
            title="Stretch & Color"
            description="Tone curve and colour balance. Asinh lifts faint nebulosity while preserving stellar cores. Toggle 'Defiltered camera' to match your acquisition hardware."
            icon={<Palette size={13} />}
            enabled={true}
            onEnabledChange={() => {}}
            hideToggle
            defaultOpen={false}
          >
            <SelectField
              label="Stretch method"
              value={c.stretch_method ?? 'asinh'}
              options={[
                { value: 'asinh', label: 'Arcsinh (asinh)' },
                { value: 'auto', label: 'Auto' },
                { value: 'linear', label: 'Linear' },
              ]}
              onChange={(v) => update({ stretch_method: v as ProcessingProfileConfig['stretch_method'] })}
            />
            <SliderField
              label="Stretch strength"
              value={c.stretch_strength ?? 30}
              min={1}
              max={200}
              step={1}
              onChange={(v) => update({ stretch_strength: v })}
            />
            <ToggleField
              label="Color calibration"
              value={c.color_calibration_enabled ?? true}
              onChange={(v) => update({ color_calibration_enabled: v })}
            />
            <ToggleField
              label="Defiltered camera (OSC / astro-modified DSLR)"
              value={c.camera_defiltered ?? true}
              onChange={(v) => update({ camera_defiltered: v })}
            />
            <ToggleField
              label="Photometric calibration (Siril pcc, requires plate-solve)"
              value={c.photometric_calibration_enabled ?? false}
              onChange={(v) => update({ photometric_calibration_enabled: v })}
            />
          </StepSection>

          <StepSection
            title="Denoise"
            description="AI denoise. Choose between Cosmic Clarity (default; tuned for emission nebulae) and GraXpert (alternative; better on noisy galaxy frames)."
            icon={<Wand2 size={13} />}
            enabled={c.denoise_enabled ?? true}
            onEnabledChange={(v) => update({ denoise_enabled: v })}
            defaultOpen={false}
          >
            <SelectField
              label="Engine"
              value={c.denoise_engine ?? 'cosmic_clarity'}
              options={[
                { value: 'cosmic_clarity', label: 'Cosmic Clarity (recommended)' },
                { value: 'graxpert', label: 'GraXpert' },
              ]}
              onChange={(v) =>
                update({ denoise_engine: v as ProcessingProfileConfig['denoise_engine'] })
              }
            />
            <SliderField
              label="Strength"
              value={c.denoise_strength ?? 0.8}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ denoise_strength: v })}
            />
            {(c.denoise_engine ?? 'cosmic_clarity') === 'cosmic_clarity' ? (
              <ToggleField
                label="Luminance only"
                value={c.denoise_luminance_only ?? false}
                onChange={(v) => update({ denoise_luminance_only: v })}
              />
            ) : (
              <>
                <SelectField
                  label="GraXpert AI model"
                  value={c.denoise_graxpert_ai_model ?? '3.0.2'}
                  options={[{ value: '3.0.2', label: '3.0.2 (server-installed)' }]}
                  onChange={(v) => update({ denoise_graxpert_ai_model: v })}
                />
                <SliderField
                  label="Batch size (lower this if GPU runs out of memory)"
                  value={c.denoise_graxpert_batch_size ?? 4}
                  min={1}
                  max={32}
                  step={1}
                  onChange={(v) => update({ denoise_graxpert_batch_size: v })}
                />
              </>
            )}
          </StepSection>

          <StepSection
            title="Sharpen"
            description="Cosmic Clarity AI deconvolution. Tightens stars (stellar) and recovers nebular structure (non-stellar) independently."
            icon={<Focus size={13} />}
            enabled={c.sharpen_enabled ?? true}
            onEnabledChange={(v) => update({ sharpen_enabled: v })}
            defaultOpen={false}
          >
            <SliderField
              label="Stellar amount"
              value={c.sharpen_stellar_amount ?? 0.5}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ sharpen_stellar_amount: v })}
            />
            <SliderField
              label="Non-stellar amount"
              value={c.sharpen_nonstellar_amount ?? 0.7}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ sharpen_nonstellar_amount: v })}
            />
            <SliderField
              label="Radius (px)"
              value={c.sharpen_radius ?? 2}
              min={1}
              max={5}
              step={1}
              unit="px"
              onChange={(v) => update({ sharpen_radius: v })}
            />
          </StepSection>

          <StepSection
            title="Super Resolution"
            description="Neural 2× upscaling for final delivery. GPU-intensive; only meaningful when seeing and sampling allow."
            icon={<Maximize2 size={13} />}
            enabled={c.super_resolution_enabled ?? false}
            onEnabledChange={(v) => update({ super_resolution_enabled: v })}
            defaultOpen={false}
          >
            <SelectField
              label="Scale factor"
              value={String(c.super_resolution_scale ?? 2)}
              options={[
                { value: '2', label: '2×' },
              ]}
              onChange={(v) => update({ super_resolution_scale: Number(v) })}
            />
          </StepSection>

          <StepSection
            title="Star Separation"
            description="Splits stars from nebulosity for independent processing, then recombines them with adjustable weights."
            icon={<Sparkles size={13} />}
            enabled={c.star_separation_enabled ?? false}
            onEnabledChange={(v) => update({ star_separation_enabled: v })}
            defaultOpen={false}
          >
            <ToggleField
              label="Recombine stars"
              value={c.star_separation_recombine ?? true}
              onChange={(v) => update({ star_separation_recombine: v })}
            />
            <SliderField
              label="Nebula weight"
              value={c.star_separation_nebula_weight ?? 0.8}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ star_separation_nebula_weight: v })}
            />
            <SliderField
              label="Star weight"
              value={c.star_separation_star_weight ?? 0.5}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ star_separation_star_weight: v })}
            />
          </StepSection>

          <StepSection
            title="Retry"
            description="Automatic retry policy for transient failures (network timeouts, GPU contention)."
            icon={<RefreshCw size={13} />}
            enabled={true}
            onEnabledChange={() => {}}
            hideToggle
            defaultOpen={false}
          >
            <SliderField
              label="Max retries"
              value={c.max_retries ?? 3}
              min={0}
              max={10}
              step={1}
              onChange={(v) => update({ max_retries: v })}
            />
          </StepSection>

        </div>
      </div>
    </fieldset>
  );
}
