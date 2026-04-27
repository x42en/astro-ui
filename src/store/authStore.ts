import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authenticated user record.
 *
 * The current build is a **preview-only mock**: the backend exposes no auth
 * endpoint yet and any non-empty credentials succeed.  Real authentication
 * via auth-service is tracked on the project roadmap.
 */
export interface AuthUser {
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  /**
   * Accept any non-empty credentials and store the resulting session.
   * Throws on empty input — boundary validation, fail fast.
   */
  login: (username: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (username, password) => {
        const u = username.trim();
        if (!u) throw new Error('Username is required.');
        if (!password) throw new Error('Password is required.');
        set({ user: { username: u } });
      },
      logout: () => set({ user: null }),
    }),
    { name: 'astrostack-auth' },
  ),
);

/** Hook: is a user currently signed in? */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.user !== null);
}

/** Hook: does the current user have admin privileges? */
export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.username === 'admin');
}

/** Hook: current user record (or `null` when anonymous). */
export function useCurrentUser(): AuthUser | null {
  return useAuthStore((s) => s.user);
}
