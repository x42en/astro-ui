import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, Loader2, Mail } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useUiStore } from '../../store/uiStore';
import { requestGalleryDownload } from '../../services/gallery';

interface EmailDownloadModalProps {
  sessionId: string | null;
  sessionName: string;
  onClose: () => void;
}

const FORMAT_OPTIONS: {
  value: 'tiff' | 'fits';
  label: string;
  desc: string;
}[] = [
  { value: 'tiff', label: '16-bit TIFF', desc: 'For Photoshop, Affinity, GIMP' },
  { value: 'fits', label: 'FITS', desc: 'For PixInsight, Siril, AstroPixelProcessor' },
];

export function EmailDownloadModal({
  sessionId,
  sessionName,
  onClose,
}: EmailDownloadModalProps) {
  const { addToast } = useUiStore();
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState<'tiff' | 'fits'>('tiff');

  const mutation = useMutation({
    mutationFn: () =>
      requestGalleryDownload(sessionId as string, { email, format }),
    onSuccess: (data) => {
      addToast({
        variant: 'success',
        title: 'Download starting',
        message: `Your ${format.toUpperCase()} file will download shortly.`,
      });
      window.location.assign(data.download_url);
      onClose();
      setEmail('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      addToast({
        variant: 'error',
        title: 'Download request failed',
        message:
          err.response?.data?.message ?? err.message ?? 'Please try again later.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    mutation.mutate();
  };

  return (
    <Modal
      open={sessionId !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Download high-resolution file"
      description={`We'll email-tag your request and start the download for "${sessionName}".`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
        {/* Email field */}
        <div className="space-y-1.5">
          <label
            htmlFor="dl-email"
            className="text-xs font-medium text-text-secondary uppercase tracking-wider"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              id="dl-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <p className="text-[11px] text-text-muted">
            We log this address with your download for our records — no
            marketing, no third parties.
          </p>
        </div>

        {/* Format radio */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Format
          </span>
          <div className="space-y-1.5">
            {FORMAT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${
                  format === opt.value
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-space-border bg-space-bg hover:border-space-border-hover'
                }`}
              >
                <input
                  type="radio"
                  name="dl-format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={() => setFormat(opt.value)}
                  className="mt-1 accent-primary"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text-primary">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-text-muted">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !email}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
          >
            {mutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download
          </button>
        </div>
      </form>
    </Modal>
  );
}
