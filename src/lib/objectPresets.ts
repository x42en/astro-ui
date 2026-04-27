import type { ProcessingProfileConfig } from '../types';

export interface ObjectPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  config: Partial<ProcessingProfileConfig>;
}

export const OBJECT_PRESETS: ObjectPreset[] = [
  {
    id: 'emission-nebula',
    label: 'Emission Nebula',
    emoji: '🌸',
    description: 'H-alpha / OIII targets. Gentle stretch, strong colour calibration, emphasise nebulosity sharpening.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 25,
      color_calibration_enabled: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'polynomial',
      denoise_enabled: true,
      denoise_strength: 0.8,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.3,
      sharpen_nonstellar_amount: 0.9,
    },
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    emoji: '🌀',
    description: 'Rich detail in spiral arms and core. Stronger stretch, balanced sharpen to reveal dust lanes.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 55,
      color_calibration_enabled: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'polynomial',
      denoise_enabled: true,
      denoise_strength: 0.7,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.5,
      sharpen_nonstellar_amount: 0.5,
    },
  },
  {
    id: 'star-cluster',
    label: 'Star Cluster',
    emoji: '✨',
    description: 'Tight or open clusters. Bright, saturated stars with minimal stretch to preserve separation.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 20,
      color_calibration_enabled: true,
      gradient_removal_enabled: false,
      denoise_enabled: true,
      denoise_strength: 0.5,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.8,
      sharpen_nonstellar_amount: 0.2,
    },
  },
  {
    id: 'planetary-nebula',
    label: 'Planetary Nebula',
    emoji: '💫',
    description: 'Small, high-surface-brightness targets. Moderate stretch, focus on fine structural detail.',
    config: {
      stretch_method: 'asinh',
      stretch_strength: 30,
      color_calibration_enabled: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'polynomial',
      denoise_enabled: true,
      denoise_strength: 0.9,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.4,
      sharpen_nonstellar_amount: 0.7,
    },
  },
  {
    id: 'wide-field',
    label: 'Wide Field',
    emoji: '🔭',
    description: 'Milky Way or mosaic panels. Auto-stretch, mild sharpening to keep star shapes natural.',
    config: {
      stretch_method: 'auto',
      stretch_strength: 30,
      color_calibration_enabled: true,
      gradient_removal_enabled: true,
      gradient_removal_method: 'polynomial',
      denoise_enabled: true,
      denoise_strength: 0.6,
      sharpen_enabled: true,
      sharpen_stellar_amount: 0.4,
      sharpen_nonstellar_amount: 0.4,
    },
  },
];
