import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAdmin, useIsAuthenticated, useIsAuthLoading, useHasRole } from '../../store/authStore';

interface GuardProps {
  children: ReactNode;
}

/**
 * Renders a minimal full-screen spinner while the OIDC session is being
 * restored from storage (prevents the login-flash on page reload).
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-space-bg">
      <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * Redirects anonymous visitors to `/login`, preserving the originally
 * requested path via the `redirect` query parameter so the user lands back
 * on it after signing in.
 *
 * Renders a loading spinner while the OIDC session is initialising to avoid
 * a spurious redirect to /login on page reload.
 */
export function RequireAuth({ children }: GuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsAuthLoading();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

/**
 * Generic role-based guard.  Redirects to `/login` when unauthenticated,
 * or to `/` when the user lacks the required role.
 */
export function RequireRole({ role, children }: GuardProps & { role: string }) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsAuthLoading();
  const hasRole = useHasRole(role);
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!hasRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Convenience guard for the admin role.
 * Equivalent to `<RequireRole role="admin">`.
 */
export function RequireAdmin({ children }: GuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsAuthLoading();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
