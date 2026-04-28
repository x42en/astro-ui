import api from '../lib/axios';
import type { FollowedObject, FollowedObjectCreate, ObjectVisibility } from '../types';

export async function listFollowedObjects(): Promise<FollowedObject[]> {
  return (await api.get<FollowedObject[]>('/me/followed-objects')).data;
}

export async function followObject(data: FollowedObjectCreate): Promise<FollowedObject> {
  return (await api.post<FollowedObject>('/me/followed-objects', data)).data;
}

export async function unfollowObject(catalogId: string): Promise<void> {
  await api.delete(`/me/followed-objects/${encodeURIComponent(catalogId)}`);
}

export interface VisibilityForFollowedParams {
  lat: number;
  lon: number;
  elevation_m: number;
  date: string;
}

export async function getFollowedVisibility(
  catalogId: string,
  params: VisibilityForFollowedParams,
): Promise<ObjectVisibility> {
  return (
    await api.get<ObjectVisibility>(
      `/me/followed-objects/${encodeURIComponent(catalogId)}/visibility`,
      { params },
    )
  ).data;
}
