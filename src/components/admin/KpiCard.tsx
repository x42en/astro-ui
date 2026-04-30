import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  /** Lucide icon component to display. */
  icon: LucideIcon;
  /** Numeric value displayed prominently. */
  value: number;
  /** Short label beneath the value. */
  label: string;
  /** Optional colour accent class applied to the icon. Defaults to `text-primary`. */
  accent?: string;
}

/**
 * Compact statistics card for the admin analytics dashboard.
 *
 * Renders an icon, a large numeric value, and a descriptive label inside a
 * `space-surface` card following the project's design tokens.
 */
export function KpiCard({ icon: Icon, value, label, accent = 'text-primary' }: KpiCardProps) {
  return (
    <div className="bg-space-surface border border-space-border rounded-lg px-5 py-4 flex items-center gap-4">
      <div className={`w-9 h-9 rounded-md bg-space-elevated border border-space-border flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-text-primary tabular-nums leading-none">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}
