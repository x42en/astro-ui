/**
 * OIDC Authorization Code callback handler.
 *
 * This page handles the redirect back from the OIDC provider after a
 * successful (or failed) authorization flow.  oidc-client-ts exchanges the
 * authorization code for tokens and restores the user session.
 *
 * Route: /auth/callback  (registered as a public route in App.tsx)
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'oidc-client-ts';
import { userManager } from '../lib/oidc';
import { useAuthStore } from '../store/authStore';

export function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (!userManager) {
      navigate('/', { replace: true });
      return;
    }

    userManager
      .signinRedirectCallback()
      .then((user: User) => {
        // Sync Zustand state from the newly obtained user
        useAuthStore.getState()._setFromOidcUser(user);
        // Restore the pre-login destination stored in the OIDC `state` param
        const returnUrl =
          typeof user.state === 'string' && user.state.startsWith('/')
            ? user.state
            : '/dashboard';
        navigate(returnUrl, { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-text-muted">Signing you in…</p>
      </div>
    </div>
  );
}
