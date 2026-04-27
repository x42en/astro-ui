import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

/**
 * Single selectable option.
 */
export interface SelectOption<T = string> {
  /** Stable identifier; what `onChange` returns. */
  value: T;
  /** Primary display label. */
  label: string;
  /** Optional icon shown before the label. */
  icon?: ReactNode;
  /** Optional secondary text shown muted under the label. */
  description?: string;
  /** Disable selection of this option. */
  disabled?: boolean;
  /** Free-form metadata used for filtering when search is enabled. */
  searchHaystack?: string;
}

/**
 * A non-selectable group header rendered above its options.
 */
export interface SelectGroup<T = string> {
  /** Display label of the group header. */
  label: string;
  /** Options that belong to this group. */
  options: SelectOption<T>[];
}

interface SearchableSelectProps<T = string> {
  /** Currently selected option `value`, or `null` when no option is selected. */
  value: T | null;
  /** Called when the user picks a new option. */
  onChange: (value: T) => void;
  /** Either a flat list of options or a list of grouped options. */
  options: SelectOption<T>[] | SelectGroup<T>[];
  /** Placeholder shown on the trigger when no option is selected. */
  placeholder?: string;
  /** Show a search input above the option list. */
  searchable?: boolean;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Disable interaction entirely. */
  disabled?: boolean;
  /** Optional class added to the trigger button. */
  className?: string;
  /** Optional max height for the dropdown list (CSS value). */
  maxHeight?: number;
  /** Accessible label for the trigger (used when no visible label). */
  ariaLabel?: string;
  /** Custom renderer for the trigger content. Falls back to icon + label. */
  renderTrigger?: (option: SelectOption<T> | null) => ReactNode;
  /** Empty-state message when search yields no results. */
  emptyMessage?: string;
}

function isGrouped<T>(opts: SelectOption<T>[] | SelectGroup<T>[]): opts is SelectGroup<T>[] {
  return opts.length > 0 && typeof (opts[0] as SelectGroup<T>).options !== 'undefined';
}

function flattenOptions<T>(opts: SelectOption<T>[] | SelectGroup<T>[]): SelectOption<T>[] {
  if (isGrouped(opts)) return opts.flatMap((g) => g.options);
  return opts;
}

function matchesQuery<T>(option: SelectOption<T>, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (option.label.toLowerCase().includes(q)) return true;
  if (option.description && option.description.toLowerCase().includes(q)) return true;
  if (option.searchHaystack && option.searchHaystack.toLowerCase().includes(q)) return true;
  if (typeof option.value === 'string' && option.value.toLowerCase().includes(q)) return true;
  return false;
}

/**
 * Professional, accessible drop-in replacement for the native `<select>`.
 *
 * Supports grouping, per-option icons + descriptions, optional search, and
 * full keyboard navigation (↑/↓, Home/End, Enter, Esc).
 *
 * Example:
 * ```tsx
 * <SearchableSelect
 *   value={profileId}
 *   onChange={setProfileId}
 *   searchable
 *   options={[
 *     { label: 'Built-in presets', options: [{ value: 'standard', label: 'Standard' }] },
 *     { label: 'Custom', options: customProfiles.map(...) },
 *   ]}
 * />
 * ```
 */
export function SearchableSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = false,
  searchPlaceholder = 'Search…',
  disabled = false,
  className = '',
  maxHeight = 320,
  ariaLabel,
  renderTrigger,
  emptyMessage = 'No results',
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const flat = useMemo(() => flattenOptions(options), [options]);
  const selected = useMemo(
    () => flat.find((o) => o.value === value) ?? null,
    [flat, value],
  );

  // Filtered list flat (for keyboard nav) and grouped (for render)
  const filteredFlat = useMemo(
    () => flat.filter((o) => matchesQuery(o, query)),
    [flat, query],
  );

  const filteredGrouped = useMemo(() => {
    if (!isGrouped(options)) return null;
    return options
      .map((g) => ({
        label: g.label,
        options: g.options.filter((o) => matchesQuery(o, query)),
      }))
      .filter((g) => g.options.length > 0);
  }, [options, query]);

  // Click-outside + Escape global handler
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Focus search input when opening; reset query on close
  useEffect(() => {
    if (open) {
      const sel = filteredFlat.findIndex((o) => o.value === value);
      setActiveIndex(sel >= 0 ? sel : filteredFlat.length > 0 ? 0 : -1);
      if (searchable) {
        // Focus on next tick so the popover is mounted
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    } else {
      setQuery('');
      setActiveIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset/clamp activeIndex when filter changes
  useEffect(() => {
    if (!open) return;
    if (filteredFlat.length === 0) {
      setActiveIndex(-1);
    } else if (activeIndex >= filteredFlat.length) {
      setActiveIndex(filteredFlat.length - 1);
    } else if (activeIndex < 0) {
      setActiveIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredFlat.length]);

  // Scroll active option into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const commit = useCallback(
    (option: SelectOption<T>) => {
      if (option.disabled) return;
      onChange(option.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(filteredFlat.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(filteredFlat.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredFlat.length) {
          commit(filteredFlat[activeIndex]);
        }
        break;
    }
  };

  const renderOption = (opt: SelectOption<T>, flatIdx: number) => {
    const isSelected = opt.value === value;
    const isActive = flatIdx === activeIndex;
    return (
      <button
        key={String(opt.value)}
        type="button"
        role="option"
        aria-selected={isSelected}
        data-index={flatIdx}
        disabled={opt.disabled}
        onClick={() => commit(opt)}
        onMouseEnter={() => setActiveIndex(flatIdx)}
        className={`
          group w-full text-left px-3 py-2 flex items-start gap-2.5
          transition-colors duration-75
          ${
            opt.disabled
              ? 'opacity-40 cursor-not-allowed'
              : isActive
                ? 'bg-primary-muted text-text-primary'
                : 'text-text-secondary hover:bg-space-border/30'
          }
          ${isSelected ? 'font-medium' : ''}
        `}
      >
        {opt.icon && (
          <span
            className={`flex-shrink-0 mt-0.5 ${
              isSelected ? 'text-primary' : 'text-text-muted'
            }`}
          >
            {opt.icon}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-sm truncate">{opt.label}</span>
          {opt.description && (
            <span className="block text-xs text-text-muted truncate mt-0.5">
              {opt.description}
            </span>
          )}
        </span>
        {isSelected && (
          <Check size={14} className="flex-shrink-0 mt-1 text-primary" />
        )}
      </button>
    );
  };

  // Render the (filtered) options preserving the grouped layout if applicable.
  const body = (() => {
    if (filteredFlat.length === 0) {
      return (
        <div className="px-3 py-6 text-center text-xs text-text-muted">
          {emptyMessage}
        </div>
      );
    }
    if (filteredGrouped) {
      let cursor = 0;
      return (
        <div ref={listRef} role="listbox" id={listboxId}>
          {filteredGrouped.map((group) => (
            <div key={group.label}>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-space-bg/40 sticky top-0 backdrop-blur-sm">
                {group.label}
              </div>
              {group.options.map((opt) => {
                const idx = cursor++;
                return renderOption(opt, idx);
              })}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div ref={listRef} role="listbox" id={listboxId}>
        {filteredFlat.map((opt, i) => renderOption(opt, i))}
      </div>
    );
  })();

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`
          w-full flex items-center gap-2 px-3 py-2
          bg-space-bg border border-space-border rounded
          text-sm text-left transition-all
          focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? 'border-primary/60 ring-1 ring-primary/30' : ''}
          ${className}
        `}
      >
        <span className="flex-1 min-w-0 flex items-center gap-2">
          {renderTrigger ? (
            renderTrigger(selected)
          ) : selected ? (
            <>
              {selected.icon && (
                <span className="flex-shrink-0 text-text-secondary">
                  {selected.icon}
                </span>
              )}
              <span className="truncate text-text-primary">{selected.label}</span>
            </>
          ) : (
            <span className="text-text-muted truncate">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-space-elevated border border-space-border rounded-md shadow-xl overflow-hidden animate-fade-in"
        >
          {searchable && (
            <div className="relative border-b border-space-border bg-space-bg/40">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-2 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {body}
          </div>
        </div>
      )}
    </div>
  );
}
