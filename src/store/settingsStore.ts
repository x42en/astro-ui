import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppSettings {
  apiBaseUrl: string;
  wsBaseUrl: string;
  apiKey: string;
  authEnabled: boolean;
  inboxPath: string;
  ollamaUrl: string;
  pipelineMaxRetries: number;
  sessionStabilityDelay: number;
}

interface SettingsStore extends AppSettings {
  update: (partial: Partial<AppSettings>) => void;
  reset: () => void;
}

const DEFAULTS: AppSettings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080/ws',
  apiKey: '',
  authEnabled: false,
  inboxPath: '/data/inbox',
  ollamaUrl: 'http://localhost:11434',
  pipelineMaxRetries: 3,
  sessionStabilityDelay: 5,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (partial) => set((s) => ({ ...s, ...partial })),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'astrostack-settings',
    }
  )
);
