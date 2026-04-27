import { useState } from 'react';
import { Download, FileImage, Database, Image as ImageIcon, RotateCcw, Loader2 } from 'lucide-react';
import { downloadPreview, downloadFits, downloadTiff } from '../../services/jobs';
import { useUiStore } from '../../store/uiStore';
import type { JobRead } from '../../types';

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

interface OutputActionsProps {
  job: JobRead;
  onReprocess?: () => void;
}

export function OutputActions({ job, onReprocess }: OutputActionsProps) {
  const addToast = useUiStore((s) => s.addToast);
  const [downloading, setDownloading] = useState<'preview' | 'tiff' | 'fits' | null>(null);

  const handleDownloadPreview = async () => {
    setDownloading('preview');
    try {
      const blob = await downloadPreview(job.id);
      triggerDownload(blob, `${job.id}-preview.jpg`);
      addToast({ variant: 'success', title: 'Preview downloaded' });
    } catch {
      addToast({ variant: 'error', title: 'Download failed', message: 'Could not download preview' });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadFits = async () => {
    setDownloading('fits');
    try {
      const blob = await downloadFits(job.id);
      triggerDownload(blob, `${job.id}-final.fits`);
      addToast({ variant: 'success', title: 'FITS downloaded' });
    } catch {
      addToast({ variant: 'error', title: 'Download failed', message: 'Could not download FITS file' });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadTiff = async () => {
    setDownloading('tiff');
    try {
      const blob = await downloadTiff(job.id);
      triggerDownload(blob, `${job.id}-final.tiff`);
      addToast({ variant: 'success', title: 'TIFF downloaded' });
    } catch {
      addToast({ variant: 'error', title: 'Download failed', message: 'Could not download TIFF file' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="hud-glass px-5 py-4 flex items-center justify-between gap-4 animate-slide-in-up">
      {/* Left: session info + re-process */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
        <span className="text-xs text-text-secondary font-medium">
          Render complete
          {job.completed_at && (
            <span className="text-text-muted ml-2 font-normal">
              {new Date(job.completed_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </span>
        {onReprocess && (
          <button
            type="button"
            onClick={onReprocess}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted border border-white/10 hover:border-white/20 hover:text-text-secondary rounded transition-all"
          >
            <RotateCcw size={11} />
            Re-process
          </button>
        )}
      </div>

      {/* Right: download buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {job.output_preview_path && (
          <button
            type="button"
            onClick={handleDownloadPreview}
            disabled={downloading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent border border-accent/25 hover:bg-accent/8 rounded transition-all disabled:opacity-50"
          >
            {downloading === 'preview' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <FileImage size={12} />
            )}
            JPEG
          </button>
        )}
        {job.output_tiff_path && (
          <button
            type="button"
            onClick={handleDownloadTiff}
            disabled={downloading !== null}
            title="16-bit TIFF — high-quality, universally readable on Linux / Windows / macOS"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 rounded transition-all disabled:opacity-50"
          >
            {downloading === 'tiff' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ImageIcon size={12} />
            )}
            TIFF
          </button>
        )}
        {job.output_fits_path && (
          <button
            type="button"
            onClick={handleDownloadFits}
            disabled={downloading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-white/10 hover:bg-white/5 hover:text-text-primary rounded transition-all disabled:opacity-50"
          >
            {downloading === 'fits' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Database size={12} />
            )}
            FITS
          </button>
        )}
        {!job.output_preview_path && !job.output_fits_path && !job.output_tiff_path && (
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted border border-white/8 rounded opacity-40 cursor-not-allowed"
          >
            <Download size={12} />
            No outputs
          </button>
        )}
      </div>
    </div>
  );
}
