import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfilePreset } from '../types';
import type { UploadProgress } from '../lib/upload';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
}

export interface UploadState {
  fileId: string;
  fileName: string;
  progress: UploadProgress;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface UiStore {
  selectedPreset: ProfilePreset;
  setSelectedPreset: (preset: ProfilePreset) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  /** Observation night mode — shifts the entire colour palette to red tones. */
  nightMode: boolean;
  toggleNightMode: () => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  jobsBySession: Record<string, string>;
  setSessionJob: (sessionId: string, jobId: string) => void;

  jobStatusBySession: Record<string, string>;
  setJobStatus: (sessionId: string, status: string) => void;

  presetsBySession: Record<string, ProfilePreset>;
  setSessionPreset: (sessionId: string, preset: ProfilePreset) => void;

  profileIdsBySession: Record<string, string>;
  setSessionProfileId: (sessionId: string, profileId: string) => void;

  uploads: Record<string, UploadState>;
  setUpload: (fileId: string, state: UploadState) => void;
  removeUpload: (fileId: string) => void;
  clearUploads: () => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      selectedPreset: 'standard',
      setSelectedPreset: (preset) => set({ selectedPreset: preset }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      nightMode: false,
      toggleNightMode: () => set((s) => ({ nightMode: !s.nightMode })),

      toasts: [],
      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: `toast-${Date.now()}-${Math.random()}` },
          ].slice(-5),
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      jobsBySession: {},
      setSessionJob: (sessionId, jobId) =>
        set((s) => ({ jobsBySession: { ...s.jobsBySession, [sessionId]: jobId } })),

      jobStatusBySession: {},
      setJobStatus: (sessionId, status) =>
        set((s) => ({ jobStatusBySession: { ...s.jobStatusBySession, [sessionId]: status } })),

      presetsBySession: {},
      setSessionPreset: (sessionId, preset) =>
        set((s) => ({ presetsBySession: { ...s.presetsBySession, [sessionId]: preset } })),

      profileIdsBySession: {},
      setSessionProfileId: (sessionId, profileId) =>
        set((s) => ({ profileIdsBySession: { ...s.profileIdsBySession, [sessionId]: profileId } })),

      uploads: {},
      setUpload: (fileId, state) =>
        set((s) => ({ uploads: { ...s.uploads, [fileId]: state } })),
      removeUpload: (fileId) =>
        set((s) => {
          const next = { ...s.uploads };
          delete next[fileId];
          return { uploads: next };
        }),
      clearUploads: () => set({ uploads: {} }),
    }),
    {
      name: 'astrostack-ui',
      partialize: (s) => ({
        selectedPreset: s.selectedPreset,
        sidebarOpen: s.sidebarOpen,
        nightMode: s.nightMode,
        presetsBySession: s.presetsBySession,
        profileIdsBySession: s.profileIdsBySession,
      }),
    }
  )
);
