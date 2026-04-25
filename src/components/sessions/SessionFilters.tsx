import { Search, X, Filter } from 'lucide-react';
import type { SessionStatus } from '../../types';

const STATUS_OPTIONS: { value: SessionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

interface SessionFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: SessionStatus | 'all';
  onStatusChange: (v: SessionStatus | 'all') => void;
  total?: number;
}

export function SessionFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  total,
}: SessionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search sessions…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-8 py-2 bg-space-elevated border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Filter size={13} className="text-text-muted flex-shrink-0" />
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150
                ${statusFilter === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-space-elevated text-text-muted hover:text-text-secondary border border-space-border'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {total !== undefined && (
        <span className="text-xs text-text-muted ml-auto flex-shrink-0">
          {total} session{total !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
