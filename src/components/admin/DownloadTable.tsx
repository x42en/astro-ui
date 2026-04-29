import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import type {
  GalleryDownloadRow,
  GalleryDownloadsQuery,
  PaginatedGalleryDownloads,
} from '../../types';

interface DownloadTableProps {
  /** Current paginated result from the API. */
  data: PaginatedGalleryDownloads | undefined;
  /** Current query parameters (for rendering controlled filter inputs). */
  query: GalleryDownloadsQuery;
  /** Loading state — shows skeleton rows when true. */
  isLoading: boolean;
  /** Callback when the user changes any filter, sort, or page state. */
  onChange: (patch: Partial<GalleryDownloadsQuery>) => void;
}

type SortField = NonNullable<GalleryDownloadsQuery['sort_by']>;

function SortIcon({
  field,
  active,
  dir,
}: {
  field: SortField;
  active: SortField;
  dir: GalleryDownloadsQuery['sort_dir'];
}) {
  if (field !== active) return <ChevronsUpDown size={13} className="text-text-muted opacity-40" />;
  return dir === 'asc' ? (
    <ChevronUp size={13} className="text-primary" />
  ) : (
    <ChevronDown size={13} className="text-primary" />
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Filterable, sortable, paginated table of gallery download records.
 *
 * All filter / sort / page changes are lifted to the parent via `onChange`
 * so that the parent can keep a single `query` state and refetch via
 * TanStack Query.
 */
export function DownloadTable({ data, query, isLoading, onChange }: DownloadTableProps) {
  const [emailInput, setEmailInput] = useState(query.email ?? '');

  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 25;
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function handleSort(field: SortField) {
    if (query.sort_by === field) {
      onChange({ sort_dir: query.sort_dir === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      onChange({ sort_by: field, sort_dir: 'desc', page: 1 });
    }
  }

  function commitEmailFilter() {
    onChange({ email: emailInput || undefined, page: 1 });
  }

  const currentSortBy: SortField = query.sort_by ?? 'requested_at';
  const currentDir = query.sort_dir ?? 'desc';

  return (
    <div className="space-y-3">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Email filter */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Filter by email…"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && commitEmailFilter()}
            onBlur={commitEmailFilter}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-space-surface border border-space-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
          />
        </div>

        {/* Format filter */}
        <select
          value={query.format ?? ''}
          onChange={e =>
            onChange({
              format: (e.target.value || undefined) as GalleryDownloadsQuery['format'],
              page: 1,
            })
          }
          className="py-1.5 px-3 text-sm bg-space-surface border border-space-border rounded-md text-text-primary focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
        >
          <option value="">All formats</option>
          <option value="tiff">TIFF</option>
          <option value="fits">FITS</option>
        </select>

        {/* Session ID filter */}
        <input
          type="text"
          placeholder="Session ID…"
          value={query.session_id ?? ''}
          onChange={e => onChange({ session_id: e.target.value || undefined, page: 1 })}
          className="py-1.5 px-3 text-sm bg-space-surface border border-space-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition min-w-[220px] font-mono text-xs"
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-space-border">
        <table className="w-full text-sm">
          <thead className="bg-space-elevated border-b border-space-border">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-1.5 hover:text-text-primary transition"
                >
                  Email
                  <SortIcon field="email" active={currentSortBy} dir={currentDir} />
                </button>
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                <button
                  onClick={() => handleSort('format')}
                  className="flex items-center gap-1.5 hover:text-text-primary transition"
                >
                  Format
                  <SortIcon field="format" active={currentSortBy} dir={currentDir} />
                </button>
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                Session
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                IP
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                <button
                  onClick={() => handleSort('requested_at')}
                  className="flex items-center gap-1.5 hover:text-text-primary transition"
                >
                  Requested at
                  <SortIcon field="requested_at" active={currentSortBy} dir={currentDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 bg-space-elevated rounded w-full max-w-[180px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : (data?.items ?? []).map((row: GalleryDownloadRow) => (
                  <tr
                    key={row.id}
                    className="hover:bg-space-elevated/40 transition"
                  >
                    <td className="px-4 py-3 text-text-primary">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-space-elevated border border-space-border text-text-secondary uppercase">
                        {row.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate" title={row.session_name ?? row.session_id}>
                      {row.session_name ?? (
                        <span className="font-mono text-xs text-text-muted">{row.session_id.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {row.requester_ip ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                      {formatDate(row.requested_at)}
                    </td>
                  </tr>
                ))}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {total > 0
            ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()} records`
            : '0 records'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange({ page: page - 1 })}
            disabled={page <= 1}
            className="px-2 py-1 rounded border border-space-border bg-space-surface hover:bg-space-elevated disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-text-primary font-medium">
            {page} / {pageCount}
          </span>
          <button
            onClick={() => onChange({ page: page + 1 })}
            disabled={page >= pageCount}
            className="px-2 py-1 rounded border border-space-border bg-space-surface hover:bg-space-elevated disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
