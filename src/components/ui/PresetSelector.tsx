import { Zap, Star, Diamond, SlidersHorizontal, Check, X } from 'lucide-react';
import type { ProfilePreset } from '../../types';
import { PRESET_FEATURES } from '../../lib/presets';

interface PresetMeta {
  id: Exclude<ProfilePreset, 'advanced'>;
  label: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  stackingNote: string;
}

const PRESETS: PresetMeta[] = [
  {
    id: 'quick',
    label: 'Quick',
    description: 'Minimal AI — best for fast preview checks',
    icon: Zap,
    badge: '~2 min',
    badgeColor: 'text-accent bg-accent-muted border-accent/20',
    stackingNote: 'Sigma rejection',
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Balanced pipeline for most imaging sessions',
    icon: Star,
    badge: '~8 min',
    badgeColor: 'text-primary bg-primary-muted border-primary/20',
    stackingNote: 'Sigma rejection',
  },
  {
    id: 'quality',
    label: 'Quality',
    description: 'Full AI suite — exhibition & print quality',
    icon: Diamond,
    badge: '~20 min',
    badgeColor: 'text-warning bg-warning-muted border-warning/20',
    stackingNote: 'Winsorized rejection',
  },
];

interface PresetSelectorProps {
  selected: ProfilePreset;
  onChange: (preset: ProfilePreset) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
  onAdvancedClick?: () => void;
}

export function PresetSelector({
  selected,
  onChange,
  disabled = false,
  showAdvanced = false,
  onAdvancedClick,
}: PresetSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selected === preset.id;
          const features = PRESET_FEATURES[preset.id];

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => !disabled && onChange(preset.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-start gap-3 p-4 rounded-md border text-left
                transition-all duration-200 group
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected
                  ? 'border-primary bg-primary-muted shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_16px_rgba(59,130,246,0.08)]'
                  : 'border-space-border bg-space-surface hover:border-space-border-light hover:bg-space-elevated'
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-1.5 rounded ${
                    isSelected
                      ? 'bg-primary/20 text-primary'
                      : 'bg-space-elevated text-text-muted group-hover:text-text-secondary'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${preset.badgeColor}`}
                >
                  {preset.badge}
                </span>
              </div>

              <div className="w-full">
                <p
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {preset.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="w-full space-y-1.5">
                <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  {preset.stackingNote}
                </p>
                <div className="flex flex-wrap gap-1">
                  {features.map((f) => (
                    <span
                      key={f.label}
                      className={`
                        inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border
                        ${f.enabled
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                          : 'border-space-border bg-space-bg text-text-muted line-through opacity-50'
                        }
                      `}
                    >
                      {f.enabled
                        ? <Check size={8} strokeWidth={3} />
                        : <X size={8} strokeWidth={3} />
                      }
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {showAdvanced && (
        <button
          type="button"
          onClick={onAdvancedClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-dashed border-space-border text-text-muted hover:border-primary/40 hover:text-text-secondary transition-all duration-200 text-sm"
        >
          <SlidersHorizontal size={14} />
          Use custom profile (Advanced mode)
        </button>
      )}
    </div>
  );
}
