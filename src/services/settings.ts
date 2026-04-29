import api from '../lib/axios';
import type { AppSettingsRemote, AppSettingsUpdate } from '../types';

export async function getRemoteSettings(): Promise<AppSettingsRemote> {
  const response = await api.get<AppSettingsRemote>('/settings');
  return response.data;
}

export async function updateRemoteSettings(
  patch: AppSettingsUpdate
): Promise<AppSettingsRemote> {
  const response = await api.put<AppSettingsRemote>('/settings', patch);
  return response.data;
}
