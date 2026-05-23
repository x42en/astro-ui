import { useState } from 'react';
import { Telescope } from 'lucide-react';
import { getObjectThumbnailUrl } from '../../services/planning';

const TYPE_GRADIENT: Record<string, string> = {
  galaxy: 'from-primary/30 to-primary/5',
  nebula: 'from-accent/30 to-accent/5',
  cluster: 'from-warning/30 to-warning/5',
  planetary: 'from-success/30 to-success/5',
  supernova: 'from-error/30 to-error/5',
  other: 'from-white/10 to-white/0',
};

interface ObjectThumbnailProps {
  catalogId: string;
  name: string;
  type?: string;
  className?: string;
  /** Aspect ratio container — defaults to 16:9. */
  aspect?: '16/9' | '1/1';
  children?: React.ReactNode;
}

/**
 * Image banner for a deep-sky object. Lazy-loads from the backend thumbnail
 * endpoint (Wikipedia → HiPS2FITS cascade). On any failure (404, network
 * error, etc.) falls back to a coloured gradient based on the object type
 * so the layout never breaks.
 *
 * Children are rendered as an absolutely-positioned overlay on top of the
 * image — used by the recommendation card to drop the altitude sparkline
 * over a dark gradient at the bottom of the banner.
 */
export function ObjectThumbnail({
  catalogId,
  name,
  type = 'other',
  className,
  aspect = '16/9',
  children,
}: ObjectThumbnailProps) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const gradient = TYPE_GRADIENT[type] ?? TYPE_GRADIENT.other;
  const aspectClass = aspect === '1/1' ? 'aspect-square' : 'aspect-video';

  return (
    <div
      className={[
        'relative w-full overflow-hidden bg-space-bg',
        aspectClass,
        className ?? '',
      ].join(' ')}
    >
      {/* Fallback / placeholder layer (always rendered, hidden once image loads). */}
      <div
        className={[
          'absolute inset-0 flex items-center justify-center bg-gradient-to-br text-text-muted/40',
          gradient,
          loaded && !errored ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-300',
        ].join(' ')}
        aria-hidden="true"
      >
        <Telescope size={32} />
      </div>
      {!errored && (
        <img
          src={getObjectThumbnailUrl(catalogId)}
          alt={`Preview of ${name}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={[
            'absolute inset-0 h-full w-full object-cover',
            loaded ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-300',
          ].join(' ')}
        />
      )}
      {children}
    </div>
  );
}
