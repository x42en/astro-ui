import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { listGallery, type GalleryItem } from '../../services/gallery';
import { useSettingsStore } from '../../store/settingsStore';

const ROTATE_INTERVAL_MS = 5000;
const TILE_WIDTH_PX = 320; // matches md tile width below

/**
 * Horizontally-scrolling preview of the public gallery shown on the landing
 * page.
 *
 * Auto-advances every {@link ROTATE_INTERVAL_MS} ms, pauses while the
 * pointer is over the strip, and degrades gracefully when the gallery is
 * still empty (decorative placeholder strip).
 */
export function LandingGalleryCarousel() {
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: listGallery,
    staleTime: 60_000,
  });

  const items: GalleryItem[] = (data ?? []).slice(0, 12);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      const node = scrollerRef.current;
      if (!node || pausedRef.current) return;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 4;
      node.scrollTo({
        left: atEnd ? 0 : node.scrollLeft + TILE_WIDTH_PX,
        behavior: 'smooth',
      });
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: dir * TILE_WIDTH_PX, behavior: 'smooth' });
  };

  if (isLoading) {
    return <CarouselSkeleton />;
  }

  if (items.length === 0) {
    return <CarouselEmpty />;
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div
        ref={scrollerRef}
        className="
          flex gap-4 overflow-x-auto pb-4
          snap-x snap-mandatory scroll-smooth
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {items.map((item) => (
          <CarouselTile key={item.session_id} item={item} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 -translate-x-1/2 hud-glass rounded-full p-2 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 translate-x-1/2 hud-glass rounded-full p-2 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

interface CarouselTileProps {
  item: GalleryItem;
  apiBaseUrl: string;
}

function CarouselTile({ item, apiBaseUrl }: CarouselTileProps) {
  // Backend returns a relative `preview_url`; resolve against the configured API base.
  const src = item.preview_url.startsWith('http')
    ? item.preview_url
    : `${apiBaseUrl.replace(/\/$/, '')}${item.preview_url}`;

  return (
    <Link
      to="/gallery"
      className="
        group/tile snap-start shrink-0
        w-[280px] sm:w-[320px] md:w-[380px] aspect-[16/10]
        relative overflow-hidden rounded-xl
        bg-space-elevated border border-white/[0.06]
        hover:border-white/15 transition-colors
      "
    >
      <img
        src={src}
        alt={item.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/tile:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
        {item.object_name && (
          <p className="text-[11px] font-mono text-accent truncate">
            {item.object_name}
          </p>
        )}
        {item.author_name && (
          <p className="text-[10px] text-white/55 truncate mt-0.5">
            by {item.author_name}
          </p>
        )}
      </div>
    </Link>
  );
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-[280px] sm:w-[320px] md:w-[380px] aspect-[16/10] rounded-xl bg-space-elevated/60 animate-pulse"
        />
      ))}
    </div>
  );
}

function CarouselEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-space-border bg-space-elevated/30 p-10 text-center">
      <Images size={28} className="mx-auto text-text-muted mb-3" />
      <p className="text-sm text-text-secondary">
        The gallery is warming up.
      </p>
      <p className="text-xs text-text-muted mt-1">
        Be the first to publish a session.
      </p>
    </div>
  );
}
