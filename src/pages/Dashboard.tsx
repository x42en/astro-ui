import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Telescope, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { listSessions, startProcessing, cancelSession } from '../services/sessions';
import { SessionCard } from '../components/sessions/SessionCard';
import { SessionFilters } from '../components/sessions/SessionFilters';
import { CreateSessionModal } from '../components/sessions/CreateSessionModal';
import { SessionCardSkeleton } from '../components/ui/Skeleton';
import { useUiStore } from '../store/uiStore';
import type { SessionStatus, ProfilePreset } from '../types';

const PAGE_SIZE = 12;

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedPreset, addToast, setSessionJob, presetsBySession, setSessionPreset } = useUiStore();
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

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sessions', queryParams],
    queryFn: () => listSessions(queryParams),
  });

  const processMutation = useMutation({
    mutationFn: ({ sessionId, preset }: { sessionId: string; preset: ProfilePreset }) =>
      startProcessing(sessionId, preset),
    onSuccess: (data, vars) => {
      setSessionJob(vars.sessionId, data.job_id);
      setSessionPreset(vars.sessionId, vars.preset);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({ variant: 'info', title: 'Processing started' });
      navigate(`/sessions/${vars.sessionId}`);
    },
    onError: () => {
      addToast({ variant: 'error', title: 'Failed to start processing' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({ variant: 'warning', title: 'Processing cancelled' });
    },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Sessions</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage and process your astrophotography sessions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-elevated transition-all duration-150 disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-all duration-150 shadow-sm"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      <SessionFilters
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        total={total}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SessionCardSkeleton key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          search={search}
          statusFilter={statusFilter}
          onNew={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                defaultPreset={presetsBySession[session.id] ?? selectedPreset}
                onProcess={(id, preset) =>
                  processMutation.mutate({ sessionId: id, preset })
                }
                onCancel={(id) => cancelMutation.mutate(id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-elevated disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-text-muted">
                Page <span className="text-text-primary font-medium">{page}</span> of {totalPages}
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
  const hasFilters = search || statusFilter !== 'all';

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-space-elevated border border-space-border flex items-center justify-center mb-4">
        <Telescope size={24} className="text-text-muted" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-semibold text-text-primary">No sessions found</h3>
          <p className="text-sm text-text-muted mt-1">
            Try adjusting your search or filter criteria
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-text-primary">No sessions yet</h3>
          <p className="text-sm text-text-muted mt-1 max-w-xs">
            Upload your FITS or RAW frames to create your first processing session.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all shadow-sm"
          >
            <Plus size={15} />
            Create your first session
          </button>
        </>
      )}
    </div>
  );
}
