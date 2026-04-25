import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function SliderField({ label, value, min, max, step = 1, unit, onChange, disabled }: SliderFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-text-secondary w-36 flex-shrink-0">{label}</label>
      <div className="flex items-center gap-3 flex-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 h-1 accent-primary cursor-pointer disabled:opacity-50"
        />
        <span className="text-xs font-mono text-text-muted w-14 text-right">
          {value}{unit ?? ''}
        </span>
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

function SelectField({ label, value, options, onChange, disabled }: SelectFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-text-secondary w-36 flex-shrink-0">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 px-2 py-1.5 text-xs bg-space-bg border border-space-border rounded text-text-primary focus:outline-none focus:border-primary/60 disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleField({ label, value, onChange, disabled }: ToggleFieldProps) {
  const id = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-xs text-text-secondary">{label}</label>
      <Switch.Root
        id={id}
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        className={`
          relative inline-flex h-4 w-8 items-center rounded-full border transition-colors duration-150
          focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50
          ${value ? 'bg-primary border-primary' : 'bg-space-border border-space-border-light'}
        `}
      >
        <Switch.Thumb
          className={`
            block h-3 w-3 rounded-full bg-white shadow transition-transform duration-150
            ${value ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </Switch.Root>
    </div>
  );
}

interface StepSectionProps {
  title: string;
  icon?: React.ReactNode;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  hideToggle?: boolean;
}

export function StepSection({
  title,
  icon,
  enabled,
  onEnabledChange,
  children,
  defaultOpen = false,
  hideToggle = false,
}: StepSectionProps) {
  const [open, setOpen] = useState(defaultOpen && enabled);
  const id = `step-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`border rounded-md transition-colors duration-150 ${enabled ? 'border-space-border' : 'border-space-border/50'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => enabled && setOpen(!open)}
          className={`flex items-center gap-2.5 flex-1 text-left ${enabled ? 'cursor-pointer' : 'cursor-default'}`}
          aria-expanded={open}
          aria-controls={id}
        >
          <span className={`transition-transform duration-150 ${open ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={13} className={enabled ? 'text-text-secondary' : 'text-text-muted'} />
          </span>
          {icon && <span className="text-text-muted">{icon}</span>}
          <span className={`text-sm font-medium ${enabled ? 'text-text-primary' : 'text-text-muted'}`}>
            {title}
          </span>
        </button>

        {!hideToggle && (
          <Switch.Root
            checked={enabled}
            onCheckedChange={(v) => {
              onEnabledChange(v);
              if (!v) setOpen(false);
            }}
            className={`
              relative inline-flex h-4 w-8 items-center rounded-full border transition-colors duration-150 flex-shrink-0
              focus:outline-none focus:ring-1 focus:ring-primary/40
              ${enabled ? 'bg-primary border-primary' : 'bg-space-border border-space-border-light'}
            `}
          >
            <Switch.Thumb
              className={`
                block h-3 w-3 rounded-full bg-white shadow transition-transform duration-150
                ${enabled ? 'translate-x-4' : 'translate-x-0.5'}
              `}
            />
          </Switch.Root>
        )}
      </div>

      {open && enabled && children && (
        <div id={id} className="px-4 pb-4 space-y-3 border-t border-space-border/50 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export { SliderField, SelectField, ToggleField };
