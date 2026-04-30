import api from '../lib/axios';
import type {
  GalleryStats,
  GalleryDownloadsQuery,
  PaginatedGalleryDownloads,
} from '../types';

/**
 * Fetch aggregated gallery KPIs for the admin analytics dashboard.
 *
 * @param days - Lookback window in days for the time-series chart (default 30).
 * @returns Resolved {@link GalleryStats} payload.
 */
export async function getGalleryStats(days = 30): Promise<GalleryStats> {
  const response = await api.get<GalleryStats>('/admin/gallery/stats', {
    params: { days },
  });
  return response.data;
}

/**
 * Fetch a paginated, filtered list of gallery download records.
 *
 * @param query - Optional filter / sort / pagination parameters.
 * @returns Resolved {@link PaginatedGalleryDownloads} payload.
 */
export async function getGalleryDownloads(
  query?: GalleryDownloadsQuery
): Promise<PaginatedGalleryDownloads> {
  const response = await api.get<PaginatedGalleryDownloads>(
    '/admin/gallery/downloads',
    { params: query }
  );
  return response.data;
}
