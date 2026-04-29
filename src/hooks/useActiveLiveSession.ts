import { useQuery } from '@tanstack/react-query';
import { getActiveLiveSession } from '../services/sessions';
import { useIsAuthenticated } from '../store/authStore';
import type { SessionRead } from '../types';

/**
 * Poll the backend for the current user's active live session.
 *
 * Returns ``null`` when the user is anonymous or has no active live
 * session. The query is disabled for anonymous users so we never spam
 * the API with pointless requests.
 */
export function useActiveLiveSession() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<SessionRead | null>({
    queryKey: ['live-active'],
    queryFn: getActiveLiveSession,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
