/**
 * OIDC UserManager singleton (oidc-client-ts).
 *
 * Only instantiated when VITE_AUTH_MODE=oidc (the production default).
 * In mock or disabled mode, userManager is null and helpers return null/empty.
 *
 * The UserManager handles:
 *   - Authorization Code + PKCE flow
 *   - Automatic silent token renewal (via refresh_token, offline_access scope)
 *   - User session persistence in localStorage
 *
 * Environment variables:
 *   VITE_OIDC_AUTHORITY   — AuthService base URL (e.g. https://auth.astromote.com)
 *   VITE_OIDC_CLIENT_ID   — OAuth client_id (= application slug in AuthService)
 *   VITE_AUTH_MODE        — "oidc" | "mock" | "disabled" (default "oidc")
 */

import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE ?? 'oidc') as
  | 'oidc'
  | 'mock'
  | 'disabled';

/**
 * Singleton UserManager, or null when auth mode is not "oidc".
 * Callers must guard: `if (!userManager) return;`
 */
export const userManager: UserManager | null =
  AUTH_MODE === 'oidc'
    ? new UserManager({
        authority: import.meta.env.VITE_OIDC_AUTHORITY ?? '',
        client_id: import.meta.env.VITE_OIDC_CLIENT_ID ?? '',
        redirect_uri: `${window.location.origin}/auth/callback`,
        post_logout_redirect_uri: `${window.location.origin}/`,
        response_type: 'code',
        // Request roles + permissions claims from AuthService.
        // offline_access issues a refresh_token so sessions survive tab reloads.
        scope: 'openid profile email roles permissions offline_access',
        // Claims are already embedded in id_token by AuthService — no extra roundtrip.
        loadUserInfo: false,
        // oidc-client-ts handles refresh-token rotation automatically.
        automaticSilentRenew: true,
        // Store refresh tokens in localStorage so sessions survive page reloads.
        // Trade-off: refresh tokens are XSS-accessible. Mitigated by strict CSP.
        // A BFF / httpOnly-cookie approach can be introduced later without changing
        // the backend JWT validation logic.
        userStore: new WebStorageStateStore({ store: window.localStorage }),
      })
    : null;

/**
 * Synchronously return the current access token from the in-memory OIDC state,
 * or null if there is no active session / auth is not in OIDC mode.
 *
 * Note: oidc-client-ts stores the User object in sessionStorage by default but
 * the actual access_token is kept in memory after the user is loaded.  We
 * read it via the auth store (which subscribes to UserManager events) rather
 * than calling the async getUser() in hot paths like request interceptors.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!userManager) return null;
  const user = await userManager.getUser();
  if (!user || user.expired) return null;
  return user.access_token ?? null;
}
