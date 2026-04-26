import { useState } from 'react';
import { Download, FileImage, Database, CheckCircle2 } from 'lucide-react';
import { downloadPreview, downloadFits, getPreviewUrl } from '../../services/jobs';
import { useUiStore } from '../../store/uiStore';
import type { JobRead } from '../../types';

interface OutputActionsProps {
  job: JobRead;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function OutputActions({ job }: OutputActionsProps) {
  const addToast = useUiStore((s) => s.addToast);
  const [downloading, setDownloading] = useState<'preview' | 'fits' | null>(null);

  const handleDownloadPreview = async () => {
    setDownloading('preview');
    try {
      const blob = await downloadPreview(job.id);
      triggerDownload(blob, `${job.id}-preview.jpg`);
      addToast({ variant: 'success', title: 'Preview downloaded' });
    } catch {
      addToast({ variant: 'error', title: 'Download failed', message: 'Could not download preview image' });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadFits = async () => {
    setDownloading('fits');
    try {
      const blob = await downloadFits(job.id);
      triggerDownload(blob, `${job.id}-final.fits`);
      addToast({ variant: 'success', title: 'FITS file downloaded' });
    } catch {
      addToast({ variant: 'error', title: 'Download failed', message: 'Could not download FITS file' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-success-muted border border-success/20 rounded-md">
        <CheckCircle2 size={14} className="text-success flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-success">Processing complete</p>
          {job.completed_at && (
            <p className="text-xs text-text-muted mt-0.5">
              Finished {new Date(job.completed_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {job.output_preview_path && (
        <div className="rounded-md overflow-hidden border border-space-border bg-space-surface">
          <img
            src={getPreviewUrl(job.id)}
            alt="Final render preview"
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={handleDownloadPreview}
          disabled={downloading !== null || !job.output_preview_path}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-secondary border border-space-border hover:border-space-border-light rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === 'preview' ? (
            <Download size={12} className="animate-bounce" />
          ) : (
            <FileImage size={12} className="text-accent" />
          )}
          JPEG
        </button>

        <button
          type="button"
          onClick={handleDownloadFits}
          disabled={downloading !== null || !job.output_fits_path}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-secondary border border-space-border hover:border-space-border-light rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === 'fits' ? (
            <Download size={12} className="animate-bounce" />
          ) : (
            <Database size={12} />
          )}
          FITS
        </button>
      </div>
    </div>
  );
}
