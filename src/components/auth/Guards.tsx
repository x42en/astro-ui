import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAdmin, useIsAuthenticated } from '../../store/authStore';

interface GuardProps {
  children: ReactNode;
}

/**
 * Redirects anonymous visitors to `/login`, preserving the originally
 * requested path via the `redirect` query parameter so the user lands back
 * on it after signing in.
 */
export function RequireAuth({ children }: GuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

/**
 * Same as {@link RequireAuth} but additionally requires the current user to
 * be an admin.  Non-admin authenticated users are bounced to `/` so they
 * never see a "forbidden" flash.
 */
export function RequireAdmin({ children }: GuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const location = useLocation();
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
