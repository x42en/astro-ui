import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Download, Star, X } from 'lucide-react';
import { MetadataCartouche } from '../processing/MetadataCartouche';
import type { GalleryItem } from '../../services/gallery';

interface LightboxModalProps {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
  onRequestDownload: (item: GalleryItem) => void;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function LightboxModal({
  items,
  index,
  onClose,
  onIndexChange,
  onRequestDownload,
}: LightboxModalProps) {
  const open = index !== null;
  const item = open ? items[index] ?? null : null;

  // Mobile bottom-sheet expand state.  Reset whenever the visible item
  // changes so each new image starts with the metadata collapsed.
  const [sheetExpanded, setSheetExpanded] = useState(false);
  useEffect(() => {
    setSheetExpanded(false);
  }, [index]);

  // Keyboard navigation (arrows).  Esc is handled natively by Radix.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index !== null && index > 0) {
        onIndexChange(index - 1);
      } else if (e.key === 'ArrowRight' && index !== null && index < items.length - 1) {
        onIndexChange(index + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, items.length, onIndexChange]);

  const goPrev = () => index !== null && index > 0 && onIndexChange(index - 1);
  const goNext = () =>
    index !== null && index < items.length - 1 && onIndexChange(index + 1);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/95 animate-fade-in" />
        <Dialog.Content
          className="fixed inset-0 z-50 focus:outline-none flex flex-col"
          aria-describedby={undefined}
        >
          {item && (
            <>
              <Dialog.Title className="sr-only">{item.name}</Dialog.Title>

              {/* Top bar — close + counter */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:p-4 pointer-events-none">
                <div className="hud-glass rounded-full px-3 py-1 text-[11px] text-white/75 font-mono pointer-events-auto">
                  {(index ?? 0) + 1} / {items.length}
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="hud-glass rounded-full p-2 text-white/85 hover:text-white pointer-events-auto"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </Dialog.Close>
              </div>

              {/* Image stage — flex-1 so it never gets crushed by the metadata sheet */}
              <div className="flex-1 min-h-0 relative flex items-center justify-center px-2 sm:px-12">
                <img
                  key={item.session_id}
                  src={item.preview_url}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain animate-fade-in"
                  draggable={false}
                />

                {/* Prev / next chevrons (desktop) */}
                {index !== null && index > 0 && (
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous"
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 hud-glass rounded-full p-2.5 text-white/75 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                {index !== null && index < items.length - 1 && (
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next"
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 hud-glass rounded-full p-2.5 text-white/75 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              {/* Desktop: floating metadata cartouche bottom-left + download bottom-right */}
              <div className="hidden md:block absolute bottom-4 left-4 z-20 max-w-sm">
                <MetadataCartouche
                  capture={item.capture_metadata}
                  profile={item.profile_summary}
                  variant="overlay"
                />
              </div>

              {/* Desktop: title strip + download CTA bottom-right */}
              <div className="hidden md:flex absolute bottom-4 right-4 z-20 hud-glass rounded-xl px-4 py-3 items-center gap-4 max-w-md">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">
                    {item.name}
                  </h2>
                  {item.object_name && (
                    <p className="text-xs text-accent font-mono truncate">
                      {item.object_name}
                    </p>
                  )}
                  <p className="text-[11px] text-white/55 truncate flex items-center gap-1.5 mt-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    {item.author_name ?? 'Astronomer'}
                    {item.acquired_at && (
                      <>
                        <span className="opacity-50">·</span>
                        {formatDate(item.acquired_at)}
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRequestDownload(item)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-black bg-white hover:bg-white/90 rounded-md transition-colors"
                >
                  <Download size={13} />
                  Download
                </button>
              </div>

              {/* Mobile bottom sheet */}
              <div className="md:hidden absolute inset-x-0 bottom-0 z-20">
                {/* Always-visible header */}
                <div className="hud-glass rounded-t-2xl border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSheetExpanded((v) => !v)}
                    className="w-full px-4 pt-2 pb-1 flex flex-col items-center"
                    aria-expanded={sheetExpanded}
                  >
                    <span className="w-10 h-1 rounded-full bg-white/25" />
                  </button>
                  <div className="px-4 pb-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </h2>
                      {item.object_name && (
                        <p className="text-xs text-accent font-mono truncate">
                          {item.object_name}
                        </p>
                      )}
                      <p className="text-[11px] text-white/55 truncate">
                        by {item.author_name ?? 'Astronomer'}
                        {item.acquired_at && ` · ${formatDate(item.acquired_at)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRequestDownload(item)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-black bg-white hover:bg-white/90 rounded-md transition-colors"
                    >
                      <Download size={13} />
                      Get
                    </button>
                  </div>
                  {sheetExpanded && (
                    <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto">
                      <MetadataCartouche
                        capture={item.capture_metadata}
                        profile={item.profile_summary}
                        variant="panel"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
