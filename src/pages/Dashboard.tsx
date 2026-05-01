import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Telescope, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listSessions } from '../services/sessions';
import { SessionCard } from '../components/sessions/SessionCard';
import { SessionFilters } from '../components/sessions/SessionFilters';
import { CreateSessionModal } from '../components/sessions/CreateSessionModal';
import { SessionCardSkeleton } from '../components/ui/Skeleton';
import type { SessionStatus } from '../types';

const PAGE_SIZE = 12;

export function Dashboard() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = {
    page,
    page_size: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', queryParams],
    queryFn: () => listSessions(queryParams),
  });

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((v: SessionStatus | 'all') => {
    setStatusFilter(v);
    setPage(1);
  }, []);

  const sessions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasMore = data?.has_more ?? false;

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent mb-1.5">{t('dashboard.title')}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{t('dashboard.subtitle')}</h1>
            <p className="text-base text-text-secondary mt-2 leading-relaxed">
              {total > 0
                ? t('dashboard.description_with_count', { count: total })
                : t('dashboard.description')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-all duration-150"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">{t('dashboard.newSession')}</span>
              <span className="sm:hidden">{t('dashboard.new')}</span>
            </button>
          </div>
        </div>
      </div>

      <SessionFilters
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        total={total}
      />

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SessionCardSkeleton key={i} />)}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            search={search}
            statusFilter={statusFilter}
            onNew={() => setCreateOpen(true)}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-elevated disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-sm text-text-muted">
                  {t('dashboard.page')} <span className="text-text-primary font-medium">{page}</span> {t('dashboard.of')} {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="p-1.5 rounded border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-elevated disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateSessionModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function EmptyState({
  search,
  statusFilter,
  onNew,
}: {
  search: string;
  statusFilter: SessionStatus | 'all';
  onNew: () => void;
}) {
  const { t } = useTranslation();
  const hasFilters = search || statusFilter !== 'all';

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-space-elevated border border-space-border flex items-center justify-center mb-4">
        <Telescope size={24} className="text-text-muted" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-semibold text-text-primary">{t('dashboard.noSessionsFound')}</h3>
          <p className="text-sm text-text-muted mt-1">
            {t('dashboard.tryAdjustingFilters')}
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-text-primary">{t('dashboard.noSessionsYet')}</h3>
          <p className="text-sm text-text-muted mt-1 max-w-xs">
            {t('dashboard.uploadFrames')}
          </p>
          <button
            type="button"
            onClick={onNew}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all shadow-sm"
          >
            <Plus size={15} />
            {t('dashboard.createFirstSession')}
          </button>
        </>
      )}
    </div>
  );
}
