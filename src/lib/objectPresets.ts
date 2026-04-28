import type { ProcessingProfileConfig } from '../types';

export interface ObjectPreset {
  id: string;
  label: string;
  /** Suggested profile name when the user picks this template.  Used to
   *  pre-fill the "Profile name" field so it is visually obvious that the
   *  template values were applied. */
  suggestedName: string;
  emoji: string;
  description: string;
  config: Partial<ProcessingProfileConfig>;
}

// Templates favour the modern backend defaults: AI gradient removal,
// luminance-only denoise (preserves Hα chrominance), defiltered camera as
// the norm.  Sharpen/denoise strengths are tuned per object class.
export const OBJECT_PRESETS: ObjectPreset[] = [
  {
    id: 'emission-nebula',
    label: 'Emission Nebula',
    suggestedName: 'Emission Nebula template',
    emoji: '🌸',
    description:
      'Hα / OIII targets (M42, IC1396, NGC 7000). Gentle stretch, AI gradient removal, strong nebula sharpen, luminance-only denoise to preserve Hα.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 25,
      color_calibration_enabled: true,
      camera_defiltered: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'ai',
      denoise_enabled: true,
      denoise_strength: 0.55,
      denoise_luminance_only: true,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.25,
      sharpen_nonstellar_amount: 0.55,
    },
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    suggestedName: 'Galaxy template',
    emoji: '🌀',
    description:
      'Spiral arms and dust lanes (M31, M81, M101). Stronger asinh to reveal core detail, balanced sharpen, AI gradient removal.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 70,
      color_calibration_enabled: true,
      camera_defiltered: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'ai',
      denoise_enabled: true,
      denoise_strength: 0.50,
      denoise_luminance_only: true,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.30,
      sharpen_nonstellar_amount: 0.40,
    },
  },
  {
    id: 'star-cluster',
    label: 'Star Cluster',
    suggestedName: 'Star Cluster template',
    emoji: '✨',
    description:
      'Open or globular clusters (M45, NGC 869, M13). Minimal stretch, stellar sharpen dominant, no gradient removal so cluster gradients stay intact.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 18,
      color_calibration_enabled: true,
      camera_defiltered: true,
      gradient_removal_enabled: false,
      denoise_enabled: true,
      denoise_strength: 0.40,
      denoise_luminance_only: true,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.55,
      sharpen_nonstellar_amount: 0.15,
    },
  },
  {
    id: 'planetary-nebula',
    label: 'Planetary Nebula',
    suggestedName: 'Planetary Nebula template',
    emoji: '💫',
    description:
      'Small, high surface brightness shells (M27, M57, M97). Moderate stretch, strong nebula sharpen, gentle denoise to keep concentric structures visible.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 35,
      color_calibration_enabled: true,
      camera_defiltered: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'ai',
      denoise_enabled: true,
      denoise_strength: 0.45,
      denoise_luminance_only: true,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.30,
      sharpen_nonstellar_amount: 0.65,
    },
  },
  {
    id: 'wide-field',
    label: 'Wide Field',
    suggestedName: 'Wide Field template',
    emoji: '🔭',
    description:
      'Milky Way panels, large mosaics. Auto stretch, AI gradient removal handles vignetting, mild sharpen to keep star shapes natural.',
    config: {
      stretch_method: 'auto',
      stretch_strength: 30,
      color_calibration_enabled: true,
      camera_defiltered: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'ai',
      denoise_enabled: true,
      denoise_strength: 0.50,
      denoise_luminance_only: true,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.30,
      sharpen_nonstellar_amount: 0.30,
    },
  },
];
