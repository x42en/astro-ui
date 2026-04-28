import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Download, User } from 'lucide-react';
import { MetadataBody } from '../processing/MetadataCartouche';
import type { GalleryItem } from '../../services/gallery';

interface IdentificationCardProps {
  item: GalleryItem;
  onDownload: () => void;
  /**
   * `floating` — desktop overlay anchored to the bottom-right of the lightbox
   *   stage. Constrained width, fully rounded.
   * `sheet` — full-width mobile bottom sheet, rounded only at the top.
   */
  layout?: 'floating' | 'sheet';
  className?: string;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Unified identification card for the gallery lightbox.
 *
 * Surfaces — in a single block — the identification metadata (title, object,
 * author, capture date, download CTA) and a collapsible disclosure that
 * reveals the full capture EXIF and pipeline summary on demand.  Designed to
 * sit on top of the image with a deep-black translucent banner that matches
 * the overall site theme.
 */
export function IdentificationCard({
  item,
  onDownload,
  layout = 'floating',
  className = '',
}: IdentificationCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Reset disclosure whenever the visible item changes so each new image
  // starts with the metadata collapsed (per the original UX contract).
  useEffect(() => {
    setExpanded(false);
  }, [item.session_id]);

  const date = formatDate(item.acquired_at);
  const isSheet = layout === 'sheet';

  const surfaceClass = isSheet
    ? 'rounded-t-2xl border-t border-white/[0.08]'
    : 'rounded-xl border border-white/[0.08] max-w-md';

  return (
    <div
      className={[
        'bg-black/75 backdrop-blur-2xl shadow-2xl shadow-black/60 text-white',
        surfaceClass,
        className,
      ].join(' ')}
      role="region"
      aria-label="Image details"
    >
      {/* Identification row — title, object, author, download CTA */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold text-white truncate leading-tight">
            {item.name}
          </h2>
          {item.object_name && (
            <p className="mt-1 text-[10.5px] text-accent uppercase tracking-[0.16em] font-mono truncate">
              {item.object_name}
            </p>
          )}
          <p className="mt-1.5 flex items-center gap-2 text-[10.5px] text-white/55 font-mono truncate">
            <span className="inline-flex items-center gap-1.5">
              <User size={10} className="text-white/35" />
              {item.author_name ?? 'Astronomer'}
            </span>
            {date && (
              <>
                <span className="text-white/25">·</span>
                <span>{date}</span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] font-semibold text-accent hover:text-accent-hover bg-accent/[0.08] hover:bg-accent/[0.14] border border-accent/30 hover:border-accent/55 rounded-md font-mono transition-colors"
        >
          <Download size={12} />
          Download
        </button>
      </div>

      {/* Collapsible disclosure — capture & pipeline metadata */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="lightbox-metadata-body"
        className="w-full flex items-center justify-between gap-2 px-4 py-2 border-t border-white/[0.06] text-[9.5px] uppercase tracking-[0.16em] text-white/55 hover:text-white/85 hover:bg-white/[0.02] font-mono font-semibold transition-colors"
      >
        <span>Capture &amp; pipeline</span>
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {expanded && (
        <div
          id="lightbox-metadata-body"
          className={[
            'border-t border-white/[0.04] px-4 pt-3 pb-3.5 animate-fade-in overflow-y-auto',
            isSheet ? 'max-h-[40vh]' : 'max-h-[60vh]',
          ].join(' ')}
        >
          <MetadataBody capture={item.capture_metadata} profile={item.profile_summary} />
        </div>
      )}
    </div>
  );
}
