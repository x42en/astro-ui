import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Images, Download, Star, Telescope, LogIn } from 'lucide-react';
import { listGallery, type GalleryItem } from '../services/gallery';
import { EmailDownloadModal } from '../components/gallery/EmailDownloadModal';
import { LightboxModal } from '../components/gallery/LightboxModal';
import { useIsAuthenticated } from '../store/authStore';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function Gallery() {
  const [downloadTarget, setDownloadTarget] = useState<GalleryItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isAuthenticated = useIsAuthenticated();
  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: listGallery,
  });

  const items = Array.isArray(data) ? data : [];

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <Images size={20} className="text-primary" />
            Gallery
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {items.length > 0
              ? `${items.length} published image${items.length !== 1 ? 's' : ''}`
              : 'A curated selection of community astrophotography results.'}
          </p>
        </div>
        {!isAuthenticated && (
          <Link
            to="/login?redirect=%2Fhistory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium bg-primary/15 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
          >
            <LogIn size={14} />
            <span>Sign in to publish</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg bg-space-elevated/40 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
          {items.map((item, idx) => (
            <GalleryCard
              key={item.session_id}
              item={item}
              onOpen={() => setLightboxIndex(idx)}
              onDownload={() => setDownloadTarget(item)}
            />
          ))}
        </div>
      )}

      <LightboxModal
        items={items}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        onRequestDownload={(item) => setDownloadTarget(item)}
      />

      <EmailDownloadModal
        sessionId={downloadTarget?.session_id ?? null}
        sessionName={downloadTarget?.name ?? ''}
        onClose={() => setDownloadTarget(null)}
      />
    </div>
  );
}

interface GalleryCardProps {
  item: GalleryItem;
  onOpen: () => void;
  onDownload: () => void;
}

function GalleryCard({ item, onOpen, onDownload }: GalleryCardProps) {
  return (
    <figure className="break-inside-avoid mb-4 group relative rounded-lg overflow-hidden bg-space-elevated/40 border border-space-border hover:border-space-border-hover transition-all">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label={`Open ${item.name} in full view`}
      >
        <img
          src={item.preview_url}
          alt={item.name}
          loading="lazy"
          className="w-full h-auto block"
        />
      </button>

      {/* Star badge */}
      <div className="absolute top-2 right-2 hud-glass rounded-full p-1.5 text-yellow-400 pointer-events-none">
        <Star size={12} className="fill-yellow-400" />
      </div>

      {/* Bottom overlay */}
      <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/55 to-transparent pointer-events-none">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {item.name}
            </h3>
            {item.object_name && (
              <p className="text-xs text-accent font-mono truncate">
                {item.object_name}
              </p>
            )}
            <p className="text-[11px] text-white/55 mt-0.5 truncate">
              by {item.author_name ?? 'Astronomer'}
              {item.acquired_at && (
                <>
                  {' · '}
                  {formatDate(item.acquired_at)}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="pointer-events-auto flex-shrink-0 hud-glass rounded-md p-2 text-white/85 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Request high-resolution download"
            aria-label="Request high-resolution download"
          >
            <Download size={14} />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-space-elevated border border-space-border flex items-center justify-center mb-4">
        <Telescope size={24} className="text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">
        Gallery is empty
      </h3>
      <p className="text-sm text-text-muted mt-1 max-w-md">
        Published sessions will appear here. Open a completed session and tap
        the yellow star to share it.
      </p>
    </div>
  );
}
