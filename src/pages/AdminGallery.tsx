import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Users, FileImage, FileCode } from 'lucide-react';
import { KpiCard } from '../components/admin/KpiCard';
import { DownloadsLineChart } from '../components/admin/DownloadsLineChart';
import { FormatDonutChart } from '../components/admin/FormatDonutChart';
import { TopSessionsBar } from '../components/admin/TopSessionsBar';
import { DownloadTable } from '../components/admin/DownloadTable';
import { getGalleryStats, getGalleryDownloads } from '../services/galleryAdmin';
import type { GalleryDownloadsQuery } from '../types';

const PERIOD_OPTIONS: { label: string; value: number }[] = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

/**
 * Admin analytics dashboard for the public gallery.
 *
 * Displays aggregated KPIs, a downloads-over-time line chart, a TIFF vs FITS
 * donut, a top-sessions bar chart, and a paginated download log.  All data is
 * fetched from the admin-protected API endpoints.
 */
export function AdminGallery() {
  const [days, setDays] = useState(30);
  const [downloadsQuery, setDownloadsQuery] = useState<GalleryDownloadsQuery>({
    page: 1,
    page_size: 25,
    sort_by: 'requested_at',
    sort_dir: 'desc',
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'gallery-stats', days],
    queryFn: () => getGalleryStats(days),
    staleTime: 60_000,
  });

  const downloadsResult = useQuery({
    queryKey: ['admin', 'gallery-downloads', downloadsQuery],
    queryFn: () => getGalleryDownloads(downloadsQuery),
    staleTime: 30_000,
  });

  function patchDownloadsQuery(patch: Partial<GalleryDownloadsQuery>) {
    setDownloadsQuery(prev => ({ ...prev, ...patch }));
  }

  const stats = statsQuery.data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent mb-1.5">
          Admin
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-text-primary">Gallery Analytics</h1>
          {/* Period selector — affects KPIs + charts */}
          <div className="flex items-center gap-1 p-0.5 bg-space-surface border border-space-border rounded-lg">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1 text-xs rounded-md transition font-medium ${
                  days === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-space-elevated'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-text-muted mt-2">
          Download activity for gallery images. Data covers the last {days} days.
        </p>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Download}
          value={stats?.total_downloads ?? 0}
          label="Total downloads"
        />
        <KpiCard
          icon={Users}
          value={stats?.unique_emails ?? 0}
          label="Unique requestors"
          accent="text-accent"
        />
        <KpiCard
          icon={FileImage}
          value={stats?.tiff_count ?? 0}
          label="TIFF downloads"
          accent="text-success"
        />
        <KpiCard
          icon={FileCode}
          value={stats?.fits_count ?? 0}
          label="FITS downloads"
          accent="text-warning"
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads over time */}
        <div className="bg-space-surface border border-space-border rounded-lg px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Downloads over time
          </h2>
          {statsQuery.isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <DownloadsLineChart data={stats?.downloads_by_day ?? []} />
          )}
        </div>

        {/* Format split */}
        <div className="bg-space-surface border border-space-border rounded-lg px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Format split
          </h2>
          {statsQuery.isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <FormatDonutChart
              tiffCount={stats?.tiff_count ?? 0}
              fitsCount={stats?.fits_count ?? 0}
            />
          )}
        </div>
      </div>

      {/* ── Top sessions bar ────────────────────────────────────────────── */}
      <div className="bg-space-surface border border-space-border rounded-lg px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Top sessions by downloads
        </h2>
        {statsQuery.isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <TopSessionsBar data={stats?.top_sessions ?? []} />
        )}
      </div>

      {/* ── Download log ────────────────────────────────────────────────── */}
      <div className="bg-space-surface border border-space-border rounded-lg px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Download log
        </h2>
        <DownloadTable
          data={downloadsResult.data}
          query={downloadsQuery}
          isLoading={downloadsResult.isLoading}
          onChange={patchDownloadsQuery}
        />
      </div>
    </div>
  );
}
