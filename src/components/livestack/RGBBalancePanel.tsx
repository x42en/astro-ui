import type { LiveLevels } from './LiveCanvas';

interface RGBBalancePanelProps {
  levels: LiveLevels;
  onChange: (next: LiveLevels) => void;
}

function ColorSlider({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center justify-between text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="font-mono text-text-primary">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0.5}
        max={1.5}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

/**
 * Per-channel multiplicative gain. Applied after the levels stretch
 * inside the fragment shader, so changes are perceptually instant.
 */
export function RGBBalancePanel({ levels, onChange }: RGBBalancePanelProps) {
  return (
    <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">RGB balance</h3>
        <button
          type="button"
          onClick={() => onChange({ ...levels, redGain: 1, greenGain: 1, blueGain: 1 })}
          className="text-[11px] text-text-muted hover:text-text-primary"
        >
          Neutral
        </button>
      </div>
      <ColorSlider
        label="Red"
        color="#ff5b5b"
        value={levels.redGain}
        onChange={(v) => onChange({ ...levels, redGain: v })}
      />
      <ColorSlider
        label="Green"
        color="#5bff7a"
        value={levels.greenGain}
        onChange={(v) => onChange({ ...levels, greenGain: v })}
      />
      <ColorSlider
        label="Blue"
        color="#5b9bff"
        value={levels.blueGain}
        onChange={(v) => onChange({ ...levels, blueGain: v })}
      />
    </div>
  );
}
