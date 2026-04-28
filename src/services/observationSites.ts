import api from '../lib/axios';
import type { ObservationSite, ObservationSiteCreate, ObservationSiteUpdate } from '../types';

export async function listObservationSites(): Promise<ObservationSite[]> {
  return (await api.get<ObservationSite[]>('/me/sites')).data;
}

export async function createObservationSite(
  data: ObservationSiteCreate,
): Promise<ObservationSite> {
  return (await api.post<ObservationSite>('/me/sites', data)).data;
}

export async function updateObservationSite(
  id: string,
  data: ObservationSiteUpdate,
): Promise<ObservationSite> {
  return (await api.patch<ObservationSite>(`/me/sites/${id}`, data)).data;
}

export async function deleteObservationSite(id: string): Promise<void> {
  await api.delete(`/me/sites/${id}`);
}
