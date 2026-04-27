import api from '../lib/axios';
import type { CaptureMetadata, ProfileSummary } from '../types';

export interface GalleryItem {
  session_id: string;
  job_id: string;
  name: string;
  object_name: string | null;
  author_name: string | null;
  published_at: string | null;
  acquired_at: string | null;
  download_count: number;
  preview_url: string;
  capture_metadata: CaptureMetadata | null;
  profile_summary: ProfileSummary | null;
}

export interface DownloadRequest {
  email: string;
  format: 'tiff' | 'fits';
}

export interface DownloadResponse {
  download_url: string;
  expires_at: number;
}

export async function listGallery(): Promise<GalleryItem[]> {
  const res = await api.get<GalleryItem[]>('/gallery');
  // Defensive: if the backend isn't deployed yet, the SPA fallback may
  // serve index.html as the response body.  axios then returns the HTML
  // string and `.map` blows up downstream.  Coerce non-arrays to [].
  return Array.isArray(res.data) ? res.data : [];
}

export async function publishSession(
  sessionId: string,
  authorName?: string
): Promise<{ is_in_gallery: boolean; gallery_published_at: string | null }> {
  const res = await api.post(`/sessions/${sessionId}/publish`, {
    author_name: authorName ?? null,
  });
  return res.data;
}

export async function unpublishSession(
  sessionId: string
): Promise<{ is_in_gallery: boolean }> {
  const res = await api.delete(`/sessions/${sessionId}/publish`);
  return res.data;
}

export async function requestGalleryDownload(
  sessionId: string,
  body: DownloadRequest
): Promise<DownloadResponse> {
  const res = await api.post<DownloadResponse>(
    `/gallery/${sessionId}/request-download`,
    body
  );
  return res.data;
}
