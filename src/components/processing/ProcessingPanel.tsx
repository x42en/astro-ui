import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Square, SlidersHorizontal } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { startProcessing, cancelSession } from '../../services/sessions';
import { listProfiles } from '../../services/profiles';
import { PresetSelector } from '../ui/PresetSelector';
import { ProgressPanel } from './ProgressPanel';
import { OutputActions } from './OutputActions';
import type { SessionRead, JobRead, ProfilePreset } from '../../types';

interface ProcessingPanelProps {
  session: SessionRead;
  activeJob: JobRead | null;
}

export function ProcessingPanel({ session, activeJob }: ProcessingPanelProps) {
  const queryClient = useQueryClient();
  const { viewMode, selectedPreset, setSelectedPreset, addToast, setSessionJob, presetsBySession, setSessionPreset, profileIdsBySession, setSessionProfileId } = useUiStore();

  const sessionPreset = useMemo<ProfilePreset>(
    () => presetsBySession[session.id] ?? selectedPreset,
    [presetsBySession, session.id, selectedPreset]
  );

  const [localPreset, setLocalPreset] = useState<ProfilePreset>(sessionPreset);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profileIdsBySession[session.id] ?? ''
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
    enabled: viewMode === 'advanced',
  });

  const processMutation = useMutation({
    mutationFn: ({ preset, profileId }: { preset: ProfilePreset; profileId?: string }) =>
      startProcessing(session.id, preset, profileId),
    onSuccess: (data, vars) => {
      setSessionJob(session.id, data.job_id);
      setSessionPreset(session.id, vars.preset);
      if (vars.profileId) setSessionProfileId(session.id, vars.profileId);
      // Optimistically set session status to 'processing' for immediate badge feedback
      queryClient.setQueryData<SessionRead>(['sessions', session.id], (old) =>
        old ? { ...old, status: 'processing' } : old
      );
      // Invalidate all session queries (lists in Sidebar/Dashboard + detail)
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({ variant: 'info', title: 'Processing started', message: `Running ${vars.preset} pipeline` });
    },
    onError: (err: { message?: string }) => {
      addToast({ variant: 'error', title: 'Failed to start', message: err?.message ?? 'Unknown error' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSession(session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast({ variant: 'warning', title: 'Processing cancelled' });
    },
    onError: () => {
      addToast({ variant: 'error', title: 'Could not cancel job' });
    },
  });

  const handleStart = () => {
    if (viewMode === 'advanced' && selectedProfileId) {
      processMutation.mutate({ preset: 'advanced', profileId: selectedProfileId });
    } else {
      setSelectedPreset(localPreset);
      processMutation.mutate({ preset: localPreset });
    }
  };

  const isProcessing = session.status === 'processing' || activeJob?.status === 'running';
  const isCompleted = activeJob?.status === 'completed';
  const canStart =
    (session.status === 'ready' || session.status === 'completed' || session.status === 'failed') &&
    !isProcessing;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Processing</h2>
        {isProcessing && (
          <button
            type="button"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-error border border-error/30 hover:bg-error-muted rounded transition-all duration-150 disabled:opacity-50"
          >
            <Square size={11} />
            Cancel
          </button>
        )}
      </div>

      {!isProcessing && !isCompleted && (
        <div className="space-y-4">
          {viewMode === 'simple' ? (
            <PresetSelector
              selected={localPreset}
              onChange={setLocalPreset}
              disabled={processMutation.isPending}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <SlidersHorizontal size={13} />
                <span>Select a custom processing profile</span>
              </div>
              {profiles.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-space-border rounded-lg">
                  <SlidersHorizontal size={20} className="text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No profiles yet</p>
                  <p className="text-xs text-text-muted mt-1">
                    Create one in the Profiles section
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md border text-left transition-all duration-150 ${
                        selectedProfileId === p.id
                          ? 'border-primary/40 bg-primary-muted'
                          : 'border-space-border bg-space-surface hover:border-space-border-light'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${selectedProfileId === p.id ? 'bg-primary' : 'bg-space-border'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">{p.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-space-border">
                <p className="text-xs text-text-muted mb-2">Or use a preset:</p>
                <PresetSelector
                  selected={localPreset}
                  onChange={(p) => { setLocalPreset(p); setSelectedProfileId(''); }}
                  disabled={processMutation.isPending}
                />
              </div>
            </div>
          )}

          {canStart && (
            <button
              type="button"
              onClick={handleStart}
              disabled={processMutation.isPending || (viewMode === 'advanced' && !selectedProfileId && selectedPreset === 'advanced')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Play size={15} />
                  Start Processing
                </>
              )}
            </button>
          )}
        </div>
      )}

      {activeJob && isProcessing && (
        <div className="flex-1 overflow-y-auto">
          <ProgressPanel jobId={activeJob.id} sessionId={session.id} />
        </div>
      )}

      {isCompleted && activeJob && (
        <OutputActions job={activeJob} />
      )}

      {isCompleted && activeJob && (
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-space-border hover:border-primary/40 text-text-muted hover:text-text-secondary text-sm rounded-md transition-all duration-150"
        >
          <Play size={13} />
          Re-process
        </button>
      )}
    </div>
  );
}
