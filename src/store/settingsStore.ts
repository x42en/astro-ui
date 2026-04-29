import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppSettings {
  apiBaseUrl: string;
  wsBaseUrl: string;
}

interface SettingsStore extends AppSettings {
  update: (partial: Partial<AppSettings>) => void;
  reset: () => void;
}

/**
 * Derive the WebSocket base URL from the current page origin at runtime.
 * Uses wss:// when the page is served over HTTPS, ws:// otherwise.
 * Falls back to the VITE_WS_BASE_URL build-time variable if set.
 */
function getDefaultWsUrl(): string {
  if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL;
  if (typeof window === 'undefined') return 'ws://localhost:8080/ws';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

const DEFAULTS: AppSettings = {
  // Relative URL — works regardless of the domain the app is served from.
  // Traefik routes /api/** to the backend container automatically.
  // Override at runtime via the Settings page or set VITE_API_BASE_URL at build time.
  // Use || rather than ?? so that an empty-string build arg falls through to the default.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || getDefaultWsUrl(),
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (partial) => set((s) => ({ ...s, ...partial })),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      // Version bump clears stale localStorage entries that held the old
      // settings including the now-removed operational fields (inboxPath,
      // ollamaUrl, pipelineMaxRetries, sessionStabilityDelay) which have
      // been migrated to the backend database.
      name: 'astrostack-settings-v4',
    }
  )
);
