import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles } from 'lucide-react';
import { useCurrentUser } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Skeleton } from '../components/ui/Skeleton';
import { ObservationSiteCard } from '../components/profile/ObservationSiteCard';
import { ObservationSiteModal } from '../components/profile/ObservationSiteModal';
import { FollowedObjectCard } from '../components/profile/FollowedObjectCard';
import { FollowObjectModal } from '../components/profile/FollowObjectModal';
import {
  deleteObservationSite,
  listObservationSites,
} from '../services/observationSites';
import { listFollowedObjects, unfollowObject } from '../services/followedObjects';
import type { FollowedObject, ObservationSite } from '../types';

function SectionTitle({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent">
          {kicker}
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mt-1">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function UserProfile() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ObservationSite | undefined>();
  const [followModalOpen, setFollowModalOpen] = useState(false);

  const sitesQuery = useQuery({
    queryKey: ['observation_sites'],
    queryFn: listObservationSites,
  });

  const followedQuery = useQuery({
    queryKey: ['followed_objects'],
    queryFn: listFollowedObjects,
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (site: ObservationSite) => deleteObservationSite(site.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observation_sites'] });
      addToast({ variant: 'success', title: 'Site deleted' });
    },
    onError: (err: Error) =>
      addToast({ variant: 'error', title: 'Could not delete site', message: err.message }),
  });

  const unfollowMutation = useMutation({
    mutationFn: (followed: FollowedObject) => unfollowObject(followed.catalog_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed_objects'] });
      addToast({ variant: 'success', title: 'Unfollowed' });
    },
    onError: (err: Error) =>
      addToast({ variant: 'error', title: 'Could not unfollow', message: err.message }),
  });

  const sites = sitesQuery.data ?? [];
  const primarySite = sites.length > 0 ? sites[0] : null;
  const followed = followedQuery.data ?? [];

  function openCreateSite() {
    setEditingSite(undefined);
    setSiteModalOpen(true);
  }

  function openEditSite(site: ObservationSite) {
    setEditingSite(site);
    setSiteModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-space-bg">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12 animate-fade-in">
        {/* Account section */}
        <section>
          <SectionTitle kicker="Account" title="Your profile" />
          <div className="bg-space-surface border border-space-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-muted flex items-center justify-center text-primary font-semibold uppercase">
              {(user?.name ?? user?.email ?? user?.id ?? '??').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-semibold truncate">
                {user?.name ?? user?.email ?? user?.id}
              </div>
              {user?.email && user?.name && (
                <div className="text-xs text-text-muted truncate">{user.email}</div>
              )}
              {user?.roles && user.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {import.meta.env.VITE_OIDC_AUTHORITY && (
              <a
                href={`${import.meta.env.VITE_OIDC_AUTHORITY}/account`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-xs text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
              >
                Manage account
              </a>
            )}
          </div>
        </section>

        {/* Observation sites */}
        <section>
          <SectionTitle
            kicker="Observation sites"
            title="Where you observe from"
            action={
              <button
                type="button"
                onClick={openCreateSite}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-primary hover:bg-primary-hover text-white transition-colors"
              >
                <Plus size={14} />
                <span>Add a site</span>
              </button>
            }
          />

          {sitesQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          )}

          {!sitesQuery.isLoading && sites.length === 0 && (
            <div className="bg-space-surface border border-dashed border-space-border rounded-xl p-8 text-center">
              <p className="text-sm text-text-secondary">
                No observation sites yet — add your first to plan tonight.
              </p>
            </div>
          )}

          {!sitesQuery.isLoading && sites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {sites.map((site) => (
                <ObservationSiteCard
                  key={site.id}
                  site={site}
                  onEdit={openEditSite}
                  onDelete={(s) => deleteSiteMutation.mutate(s)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Followed objects */}
        <section>
          <SectionTitle
            kicker="Watchlist"
            title="Objects you follow"
            action={
              <button
                type="button"
                onClick={() => setFollowModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-primary hover:bg-primary-hover text-white transition-colors"
              >
                <Sparkles size={14} />
                <span>Follow new</span>
              </button>
            }
          />

          {followedQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          )}

          {!followedQuery.isLoading && followed.length === 0 && (
            <div className="bg-space-surface border border-dashed border-space-border rounded-xl p-8 text-center">
              <p className="text-sm text-text-secondary">
                No followed objects yet — pick one to track when it&apos;s high in the sky.
              </p>
            </div>
          )}

          {!followedQuery.isLoading && followed.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {followed.map((f) => (
                <FollowedObjectCard
                  key={f.id}
                  followed={f}
                  primarySite={primarySite}
                  onUnfollow={(x) => unfollowMutation.mutate(x)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ObservationSiteModal
        open={siteModalOpen}
        onOpenChange={setSiteModalOpen}
        mode={editingSite ? 'edit' : 'create'}
        site={editingSite}
      />
      <FollowObjectModal open={followModalOpen} onOpenChange={setFollowModalOpen} />
    </div>
  );
}
