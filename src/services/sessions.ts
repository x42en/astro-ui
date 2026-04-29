import api from '../lib/axios';
import { useSettingsStore } from '../store/settingsStore';
import type {
  SessionRead,
  PaginatedResponse,
  ProfilePreset,
  JobRead,
  SessionMode,
  LiveStackState,
} from '../types';

export interface SessionCreate {
  name: string;
  object_name?: string;
  inbox_path?: string;
  mode?: SessionMode;
  target_ra?: number;
  target_dec?: number;
  acquired_at?: string;
}

export async function createSession(data: SessionCreate): Promise<SessionRead> {
  const response = await api.post<SessionRead>('/sessions', data);
  return response.data;
}

export interface SessionListParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
  mine?: boolean;
}

export async function listSessions(
  params: SessionListParams = {}
): Promise<PaginatedResponse<SessionRead>> {
  const response = await api.get<PaginatedResponse<SessionRead>>('/sessions', { params });
  return response.data;
}

export async function getSession(sessionId: string): Promise<SessionRead> {
  const response = await api.get<SessionRead>(`/sessions/${sessionId}`);
  return response.data;
}

/**
 * Fetch the most recent job for ``sessionId`` regardless of its status.
 * Used to recover the rendered preview after a server restart or when the
 * client-side session→job mapping has been cleared.  Resolves to ``null``
 * when no job has ever been started for that session.
 */
export async function getLatestJobForSession(
  sessionId: string,
): Promise<JobRead | null> {
  try {
    const response = await api.get<JobRead>(`/sessions/${sessionId}/latest-job`);
    return response.data;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export async function startProcessing(
  sessionId: string,
  preset: ProfilePreset,
  profileId?: string
): Promise<{ job_id: string }> {
  const params: Record<string, string> = { preset };
  if (profileId) params.profile_id = profileId;
  const response = await api.post<{ job_id: string }>(
    `/sessions/${sessionId}/process`,
    null,
    { params }
  );
  return response.data;
}

export async function cancelSession(sessionId: string): Promise<void> {
  await api.post(`/sessions/${sessionId}/cancel`);
}

export async function resetSession(sessionId: string): Promise<SessionRead> {
  const response = await api.post<SessionRead>(`/sessions/${sessionId}/reset`);
  return response.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/sessions/${sessionId}`);
}

export function getLightPreviewUrl(sessionId: string): string {
  const base = useSettingsStore.getState().apiBaseUrl.replace(/\/$/, '');
  return `${base}/sessions/${sessionId}/light-preview`;
}

export function getStepPreviewUrl(sessionId: string, stepName: string): string {
  const base = useSettingsStore.getState().apiBaseUrl.replace(/\/$/, '');
  return `${base}/sessions/${sessionId}/step-preview/${stepName}`;
}

export interface StepPreviewInfo {
  step_name: string;
  display_name: string;
  has_preview: boolean;
}

export async function listStepPreviews(sessionId: string): Promise<StepPreviewInfo[]> {
  const response = await api.get<StepPreviewInfo[]>(
    `/sessions/${sessionId}/step-previews`,
  );
  return response.data;
}

// ── Live-stacking API ───────────────────────────────────────────────────────

/**
 * Create a new live-stacking session pre-filled with the planner pick.
 * The backend allocates the inbox path automatically.
 */
export async function createLiveSession(data: {
  name: string;
  object_name?: string;
  target_ra?: number;
  target_dec?: number;
  acquired_at?: string;
}): Promise<SessionRead> {
  const response = await api.post<SessionRead>('/sessions', { ...data, mode: 'live' });
  return response.data;
}

export async function startLive(sessionId: string): Promise<{ is_running: boolean }> {
  const response = await api.post<{ session_id: string; is_running: boolean }>(
    `/sessions/${sessionId}/live/start`,
  );
  return { is_running: response.data.is_running };
}

export async function stopLive(sessionId: string): Promise<{ is_running: boolean }> {
  const response = await api.post<{ session_id: string; is_running: boolean }>(
    `/sessions/${sessionId}/live/stop`,
  );
  return { is_running: response.data.is_running };
}

export async function getLiveState(sessionId: string): Promise<LiveStackState> {
  const response = await api.get<LiveStackState>(`/sessions/${sessionId}/live/state`);
  return response.data;
}

/**
 * Push a single frame to the live-stack pipeline.
 * Returns the queued task receipt (HTTP 202).
 */
export async function pushLiveFrame(
  sessionId: string,
  file: File,
): Promise<{ session_id: string; frame_path: string; queued: boolean }> {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post(`/sessions/${sessionId}/live-frames`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Build a cache-busted URL for the live preview JPEG.
 * Pass ``preview_generation`` from the websocket event so the browser
 * actually refetches when the worker regenerates the file.
 */
export function getLivePreviewUrl(sessionId: string, generation: number = 0): string {
  const base = useSettingsStore.getState().apiBaseUrl.replace(/\/$/, '');
  return `${base}/sessions/${sessionId}/live/preview?g=${generation}`;
}

/**
 * Return the current user's active live session, or ``null`` when no
 * such session exists (or the user is anonymous).  Used to surface a
 * "Reprendre la session" banner across the app.
 */
export async function getActiveLiveSession(): Promise<SessionRead | null> {
  const response = await api.get<SessionRead | null>('/sessions/live/active');
  return response.data ?? null;
}

/**
 * Mark a session as ``COMPLETED`` and free the user's "active live"
 * slot.  Called from the dedicated "Terminer" button in the live view.
 */
export async function terminateSession(sessionId: string): Promise<SessionRead> {
  const response = await api.post<SessionRead>(`/sessions/${sessionId}/terminate`);
  return response.data;
}

// ── Recommendations ────────────────────────────────────────────────────────

export type RecommendationSeverity = 'info' | 'warn' | 'critical';
export type RecommendationCategory =
  | 'exposure'
  | 'iso'
  | 'white_balance'
  | 'focus'
  | 'general';

export interface HistogramStats {
  median_r: number;
  median_g: number;
  median_b: number;
  clip_low_pct: number;
  clip_high_pct: number;
  last_fwhm: number | null;
  is_monochrome: boolean;
}

export interface Recommendation {
  severity: RecommendationSeverity;
  category: RecommendationCategory;
  message: string;
  action: string;
}

export interface RecommendationReport {
  stats: HistogramStats;
  recommendations: Recommendation[];
}

export async function getLiveRecommendations(
  sessionId: string,
): Promise<RecommendationReport> {
  const response = await api.get<RecommendationReport>(
    `/sessions/${sessionId}/live/recommendations`,
  );
  return response.data;
}
