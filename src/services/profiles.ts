import api from '../lib/axios';
import type { ProfileRead, ProfileCreate, ProfileUpdate } from '../types';

export async function listProfiles(): Promise<ProfileRead[]> {
  const response = await api.get('/profiles');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items as ProfileRead[];
  return [];
}

/** List community-shared profiles (i.e. shared by other users).
 *  Backed by ``GET /profiles?shared_only=true``. */
export async function listSharedProfiles(): Promise<ProfileRead[]> {
  const response = await api.get('/profiles', { params: { shared_only: true } });
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

export async function setProfileShared(
  profileId: string,
  isShared: boolean
): Promise<ProfileRead> {
  const response = await api.patch<ProfileRead>(
    `/profiles/${profileId}/share`,
    { is_shared: isShared }
  );
  return response.data;
}

/** Trigger a browser download of the profile as a `.astroprofile.json` file. */
export async function exportProfile(profile: ProfileRead): Promise<void> {
  const response = await api.get(`/profiles/${profile.id}/export`, {
    responseType: 'blob',
  });
  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([JSON.stringify(response.data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const slug = profile.name
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'profile';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.astroprofile.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function importProfile(file: File): Promise<ProfileRead> {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post<ProfileRead>('/profiles/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
