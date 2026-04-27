import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import type { SessionStatus } from '../../types';

const STATUS_OPTIONS: { value: SessionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All sessions' },
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
  const activeStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter);
  const hasFilters = statusFilter !== 'all' || search !== '';

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search box — matches name OR object */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name or object…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-8 py-2 bg-space-elevated border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter popover trigger */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="Filters"
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded text-sm border transition-all duration-150 ${
              statusFilter !== 'all'
                ? 'border-primary/60 bg-primary/10 text-text-primary'
                : 'border-space-border bg-space-elevated text-text-muted hover:text-text-secondary'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filters</span>
            {statusFilter !== 'all' && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold text-white">
                1
              </span>
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="start"
            className="z-50 min-w-[220px] rounded-lg border border-space-border bg-space-elevated/95 backdrop-blur-md shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95"
          >
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted">
              Status
            </div>
            {STATUS_OPTIONS.map((opt) => {
              const selected = opt.value === statusFilter;
              return (
                <DropdownMenu.Item
                  key={opt.value}
                  onSelect={() => onStatusChange(opt.value)}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm cursor-pointer outline-none transition-colors ${
                    selected
                      ? 'bg-primary/15 text-text-primary'
                      : 'text-text-secondary hover:bg-white/5 focus:bg-white/5'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && <Check size={13} className="text-primary" />}
                </DropdownMenu.Item>
              );
            })}

            {hasFilters && (
              <>
                <DropdownMenu.Separator className="my-1 h-px bg-space-border" />
                <DropdownMenu.Item
                  onSelect={() => {
                    onStatusChange('all');
                    onSearchChange('');
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-muted hover:bg-white/5 hover:text-text-secondary cursor-pointer outline-none"
                >
                  <X size={13} />
                  Reset filters
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Active status chip (mirrors what's in the popover) */}
      {statusFilter !== 'all' && activeStatus && (
        <button
          type="button"
          onClick={() => onStatusChange('all')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-primary/10 border border-primary/30 text-text-primary hover:bg-primary/15 transition-colors"
          title="Clear status filter"
        >
          {activeStatus.label}
          <X size={11} className="text-text-muted" />
        </button>
      )}

      {total !== undefined && (
        <span className="text-xs text-text-muted ml-auto flex-shrink-0">
          {total} session{total !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
