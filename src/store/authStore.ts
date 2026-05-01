import type { User } from 'oidc-client-ts';
import { create } from 'zustand';
import { AUTH_MODE, userManager } from '../lib/oidc';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Authenticated user record populated from the OIDC id_token claims. */
export interface AuthUser {
  /** OIDC subject identifier (UUID string from BetterAuth). */
  id: string;
  email: string | null;
  name: string | null;
  roles: string[];
  permissions: string[];
}

export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous' | 'error';

interface AuthState {
  user: AuthUser | null;
  /** In-memory access token (never persisted to localStorage). */
  accessToken: string | null;
  status: AuthStatus;

  /**
   * Bootstrap the auth state from the existing OIDC session (if any).
   * Must be called once at app mount.
   */
  bootstrap: () => Promise<void>;

  /** Redirect to the OIDC provider login page. */
  loginRedirect: (returnUrl?: string) => Promise<void>;

  /** Sign out of the OIDC provider and clear local state. */
  logout: () => Promise<void>;

  /** Internal: sync Zustand state from an oidc-client-ts User object. */
  _setFromOidcUser: (oidcUser: User | null) => void;
}

// ---------------------------------------------------------------------------
// Mock-mode helpers
// ---------------------------------------------------------------------------

/** Legacy mock user stored in localStorage during development (AUTH_MODE=mock). */
interface MockUser {
  username: string;
}

const MOCK_STORAGE_KEY = 'astrostack-auth';
const MOCK_ADMIN_USER = 'admin';

function loadMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { user?: MockUser } };
    return parsed?.state?.user ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  status: 'initializing',

  _setFromOidcUser: (oidcUser: User | null) => {
    if (!oidcUser || oidcUser.expired) {
      set({ user: null, accessToken: null, status: 'anonymous' });
      return;
    }
    const profile = oidcUser.profile;
    set({
      user: {
        id: profile.sub,
        email: (profile.email as string | undefined) ?? null,
        name: (profile.name as string | undefined) ?? null,
        roles: ((profile as Record<string, unknown>).roles as string[] | undefined) ?? [],
        permissions:
          ((profile as Record<string, unknown>).permissions as string[] | undefined) ?? [],
      },
      accessToken: oidcUser.access_token ?? null,
      status: 'authenticated',
    });
  },

  bootstrap: async () => {
    // ── Disabled mode — auto-authenticate as a local admin user ──────────
    // No login UI is ever shown; the app behaves as a single-user workstation.
    if (AUTH_MODE === 'disabled') {
      set({
        user: {
          id: 'local-admin',
          email: null,
          name: 'Local Admin',
          roles: ['admin', 'user'],
          permissions: [],
        },
        accessToken: null,
        status: 'authenticated',
      });
      return;
    }

    // ── Mock mode ─────────────────────────────────────────────────────────
    if (AUTH_MODE === 'mock') {
      const mock = loadMockUser();
      if (mock) {
        set({
          user: {
            id: mock.username,
            email: null,
            name: mock.username,
            roles: mock.username === MOCK_ADMIN_USER ? ['admin'] : ['user'],
            permissions: [],
          },
          accessToken: null,
          status: 'authenticated',
        });
      } else {
        set({ user: null, accessToken: null, status: 'anonymous' });
      }
      return;
    }

    // ── OIDC mode ─────────────────────────────────────────────────────────
    if (!userManager) {
      set({ status: 'anonymous' });
      return;
    }

    try {
      const oidcUser = await userManager.getUser();
      get()._setFromOidcUser(oidcUser);
    } catch {
      set({ user: null, accessToken: null, status: 'anonymous' });
    }

    // Subscribe to UserManager lifecycle events
    userManager.events.addUserLoaded((oidcUser) => {
      get()._setFromOidcUser(oidcUser);
    });

    userManager.events.addUserUnloaded(() => {
      set({ user: null, accessToken: null, status: 'anonymous' });
    });

    userManager.events.addAccessTokenExpired(() => {
      // oidc-client-ts will automatically attempt silent renew when
      // automaticSilentRenew=true. This fires first as a warning.
      set((s) => ({ ...s, accessToken: null }));
    });

    userManager.events.addSilentRenewError(() => {
      // Silent renew failed (refresh token expired, revoked, etc.)
      set({ user: null, accessToken: null, status: 'anonymous' });
    });
  },

  loginRedirect: async (returnUrl?: string) => {
    // Disabled mode: simply re-run bootstrap to materialise the synthetic user.
    if (AUTH_MODE === 'disabled') {
      await get().bootstrap();
      return;
    }
    if (AUTH_MODE === 'mock') {
      // Redirect to the mock login page
      window.location.href = `/login${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`;
      return;
    }
    if (!userManager) return;
    await userManager.signinRedirect({
      state: returnUrl ?? window.location.pathname,
    });
  },

  logout: async () => {
    // Disabled mode: logout is a no-op — re-bootstrap immediately as admin.
    if (AUTH_MODE === 'disabled') {
      await get().bootstrap();
      return;
    }
    if (AUTH_MODE === 'mock') {
      localStorage.removeItem(MOCK_STORAGE_KEY);
      set({ user: null, accessToken: null, status: 'anonymous' });
      return;
    }
    if (!userManager) return;
    // Clear local state immediately for a snappy UX
    set({ user: null, accessToken: null, status: 'anonymous' });
    // Then redirect to the OIDC end-session endpoint
    await userManager.signoutRedirect();
  },
}));

// ---------------------------------------------------------------------------
// Convenience hooks
// ---------------------------------------------------------------------------

/** Hook: is a user currently signed in? */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.status === 'authenticated');
}

/** Hook: is the auth state still loading (e.g., restoring session)? */
export function useIsAuthLoading(): boolean {
  return useAuthStore((s) => s.status === 'initializing');
}

/** Hook: does the current user have the given role? */
export function useHasRole(role: string): boolean {
  return useAuthStore((s) => s.user?.roles.includes(role) ?? false);
}

/** Hook: is the current user an admin? */
export function useIsAdmin(): boolean {
  return useHasRole('admin');
}

/** Hook: does the current user have the given OIDC permission? */
export function useHasPermission(permission: string): boolean {
  return useAuthStore((s) => s.user?.permissions.includes(permission) ?? false);
}

/** Hook: current user record (or null when anonymous). */
export function useCurrentUser(): AuthUser | null {
  return useAuthStore((s) => s.user);
}

