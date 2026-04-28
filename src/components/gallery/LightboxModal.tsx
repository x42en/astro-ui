import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { IdentificationCard } from './IdentificationCard';
import type { GalleryItem } from '../../services/gallery';

interface LightboxModalProps {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
  onRequestDownload: (item: GalleryItem) => void;
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

              {/* Desktop: unified identification + metadata card, anchored bottom-right */}
              <div className="hidden md:block absolute bottom-4 right-4 z-20 w-[22rem] max-w-[calc(100%-2rem)]">
                <IdentificationCard
                  item={item}
                  onDownload={() => onRequestDownload(item)}
                  layout="floating"
                />
              </div>

              {/* Mobile: same card as a bottom sheet */}
              <div className="md:hidden absolute inset-x-0 bottom-0 z-20">
                <IdentificationCard
                  item={item}
                  onDownload={() => onRequestDownload(item)}
                  layout="sheet"
                />
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

