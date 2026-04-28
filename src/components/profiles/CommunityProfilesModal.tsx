import { useQuery } from '@tanstack/react-query';
import { Copy as CopyIcon, Globe2, User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ProfileCardSkeleton } from '../ui/Skeleton';
import { listSharedProfiles } from '../../services/profiles';
import type { ProfileRead } from '../../types';

interface CommunityProfilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user clicks "Clone" on a community profile.
   *  The parent typically pre-fills the create form with this profile. */
  onClone: (profile: ProfileRead) => void;
}

/** Count enabled processing steps from the flat ``*_enabled`` flags. */
function countEnabledSteps(config: Record<string, unknown> | null | undefined): number {
  if (!config) return 0;
  return Object.entries(config).filter(
    ([key, value]) => key.endsWith('_enabled') && value === true
  ).length;
}

export function CommunityProfilesModal({
  open,
  onOpenChange,
  onClone,
}: CommunityProfilesModalProps) {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles', 'shared'],
    queryFn: listSharedProfiles,
    enabled: open,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Community profiles"
      description="Browse processing profiles shared by other users. Cloning creates an editable private copy in your library."
      size="xl"
    >
      <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-space-elevated flex items-center justify-center mb-3">
              <Globe2 size={20} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              No community profiles yet
            </p>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              Once another user shares a profile, it will appear here ready to clone.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => {
              const stepsEnabled = countEnabledSteps(
                profile.config as Record<string, unknown>
              );
              return (
                <div
                  key={profile.id}
                  className="flex items-start gap-3 px-3 py-3 rounded-md border border-space-border bg-space-surface hover:border-space-border-light hover:bg-space-elevated transition-all"
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-sm font-bold bg-space-elevated text-text-muted">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-secondary truncate">
                        {profile.name}
                      </p>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-space-elevated text-text-muted border border-space-border">
                        <User size={9} />
                        {stepsEnabled} step{stepsEnabled !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {profile.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                        {profile.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClone(profile);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white font-medium rounded transition-all flex-shrink-0"
                  >
                    <CopyIcon size={12} />
                    Clone
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
