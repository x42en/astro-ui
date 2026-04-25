import api from '../lib/axios';
import type { JobRead } from '../types';

export async function getJob(jobId: string): Promise<JobRead> {
  const response = await api.get<JobRead>(`/jobs/${jobId}`);
  return response.data;
}

export function getPreviewUrl(jobId: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
  return `${base}/jobs/${jobId}/output/preview`;
}

export function getFitsDownloadUrl(jobId: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
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
