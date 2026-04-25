import api from '../lib/axios';
import type { ProfileRead, ProfileCreate, ProfileUpdate } from '../types';

export async function listProfiles(): Promise<ProfileRead[]> {
  const response = await api.get('/profiles');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items as ProfileRead[];
  return [];
}

export async function getProfile(profileId: string): Promise<ProfileRead> {
  const response = await api.get<ProfileRead>(`/profiles/${profileId}`);
  return response.data;
}

export async function createProfile(data: ProfileCreate): Promise<ProfileRead> {
  const response = await api.post<ProfileRead>('/profiles', data);
  return response.data;
}

export async function updateProfile(
  profileId: string,
  data: ProfileUpdate
): Promise<ProfileRead> {
  const response = await api.put<ProfileRead>(`/profiles/${profileId}`, data);
  return response.data;
}

export async function deleteProfile(profileId: string): Promise<void> {
  await api.delete(`/profiles/${profileId}`);
}
