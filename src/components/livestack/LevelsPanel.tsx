import type { LiveLevels } from './LiveCanvas';
import { DEFAULT_LEVELS } from './LiveCanvas';

interface LevelsPanelProps {
  levels: LiveLevels;
  onChange: (next: LiveLevels) => void;
}

/** Render an underlined slider row with a numeric readout. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  precision = 2,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  precision?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center justify-between text-text-secondary">
        <span>{label}</span>
        <span className="font-mono text-text-primary">{value.toFixed(precision)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

/**
 * Black point / white point / gamma controls applied client-side via
 * the WebGL2 fragment shader in :class:`LiveCanvas`.
 */
export function LevelsPanel({ levels, onChange }: LevelsPanelProps) {
  return (
    <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Levels</h3>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_LEVELS, redGain: levels.redGain, greenGain: levels.greenGain, blueGain: levels.blueGain })}
          className="text-[11px] text-text-muted hover:text-text-primary"
        >
          Reset
        </button>
      </div>
      <Slider
        label="Black"
        value={levels.black}
        min={0}
        max={0.5}
        step={0.005}
        onChange={(v) => onChange({ ...levels, black: Math.min(v, levels.white - 0.01) })}
        precision={3}
      />
      <Slider
        label="White"
        value={levels.white}
        min={0.5}
        max={1}
        step={0.005}
        onChange={(v) => onChange({ ...levels, white: Math.max(v, levels.black + 0.01) })}
        precision={3}
      />
      <Slider
        label="Gamma"
        value={levels.gamma}
        min={0.3}
        max={3}
        step={0.05}
        onChange={(v) => onChange({ ...levels, gamma: v })}
      />
    </div>
  );
}
