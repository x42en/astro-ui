import api from '../lib/axios';
import { useSettingsStore } from '../store/settingsStore';
import type { JobRead } from '../types';

export async function getJob(jobId: string): Promise<JobRead> {
  const response = await api.get<JobRead>(`/jobs/${jobId}`);
  return response.data;
}

export function getPreviewUrl(jobId: string): string {
  const base = useSettingsStore.getState().apiBaseUrl;
  return `${base}/jobs/${jobId}/output/preview`;
}

export function getFitsDownloadUrl(jobId: string): string {
  const base = useSettingsStore.getState().apiBaseUrl;
  return `${base}/jobs/${jobId}/output/fits`;
}

export async function downloadPreview(jobId: string): Promise<Blob> {
  const response = await api.get(`/jobs/${jobId}/output/preview`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function downloadFits(jobId: string): Promise<Blob> {
  const response = await api.get(`/jobs/${jobId}/output/fits`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}
