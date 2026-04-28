import api from '../lib/axios';
import { useSettingsStore } from '../store/settingsStore';
import type { SessionRead, PaginatedResponse, ProfilePreset } from '../types';

export interface SessionCreate {
  name: string;
  object_name?: string;
  inbox_path?: string;
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
