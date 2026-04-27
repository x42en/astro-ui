import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Copy, BookOpen, Share2, Eye } from 'lucide-react';
import { useState } from 'react';
import { deleteProfile } from '../../services/profiles';
import { useUiStore } from '../../store/uiStore';
import { ProfileCardSkeleton } from '../ui/Skeleton';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { ProfileRead } from '../../types';

interface ProfileListProps {
  profiles: ProfileRead[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDuplicate: (profile: ProfileRead) => void;
}

/** Sort: own profiles first, then shared, then alphabetical within each group. */
function sortProfiles(profiles: ProfileRead[]): ProfileRead[] {
  return [...profiles].sort((a, b) => {
    if (a.is_owner !== b.is_owner) return a.is_owner ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function ProfileList({
  profiles,
  loading,
  selectedId,
  onSelect,
  onDuplicate,
}: ProfileListProps) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const [pendingDelete, setPendingDelete] = useState<ProfileRead | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      addToast({ variant: 'success', title: 'Profile deleted' });
      setPendingDelete(null);
    },
    onError: () => {
      addToast({ variant: 'error', title: 'Failed to delete profile' });
      setPendingDelete(null);
    },
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <ProfileCardSkeleton key={i} />)}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-space-elevated flex items-center justify-center mb-3">
          <BookOpen size={20} className="text-text-muted" />
        </div>
        <p className="text-sm text-text-secondary font-medium">No profiles yet</p>
        <p className="text-xs text-text-muted mt-1">Create your first custom profile</p>
      </div>
    );
  }

  const sorted = sortProfiles(profiles);

  return (
    <>
      <div className="space-y-1.5">
        {sorted.map((profile) => {
          const isSelected = profile.id === selectedId;
          const stepsEnabled = Object.values(profile.config).filter(
            (s) => s && typeof s === 'object' && 'enable' in s && s.enable
          ).length;

          return (
            <div
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className={`
                group flex items-center gap-3 px-3 py-3 rounded-md border cursor-pointer
                transition-all duration-150
                ${isSelected
                  ? 'border-primary/40 bg-primary-muted'
                  : 'border-space-border bg-space-surface hover:border-space-border-light hover:bg-space-elevated'
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-sm font-bold
                  ${isSelected ? 'bg-primary/20 text-primary' : 'bg-space-elevated text-text-muted'}
                `}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {profile.name}
                  </p>
                  {profile.is_owner && profile.is_shared && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/15 text-warning border border-warning/20"
                      title="You are sharing this profile with other users"
                    >
                      <Share2 size={9} />
                      Shared by you
                    </span>
                  )}
                  {!profile.is_owner && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-space-elevated text-text-muted border border-space-border"
                      title="Shared by another user — read-only"
                    >
                      <Eye size={9} />
                      Shared
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {stepsEnabled} step{stepsEnabled !== 1 ? 's' : ''} active
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(profile); }}
                  className="p-1.5 text-text-muted hover:text-text-secondary rounded hover:bg-space-elevated transition-colors"
                  title="Duplicate"
                >
                  <Copy size={13} />
                </button>
                {profile.is_owner && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelect(profile.id); }}
                      className="p-1.5 text-text-muted hover:text-primary rounded hover:bg-primary-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(profile); }}
                      className="p-1.5 text-text-muted hover:text-error rounded hover:bg-error-muted transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete profile"
        message={
          pendingDelete
            ? `Permanently delete "${pendingDelete.name}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
      />
    </>
  );
}
