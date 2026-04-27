import { Star, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishSession, unpublishSession } from '../../services/gallery';
import { useUiStore } from '../../store/uiStore';

interface GalleryStarToggleProps {
  sessionId: string;
  isPublished: boolean;
  /** Visual size — `sm` for thumbnails, `md` for HUD pill. */
  size?: 'sm' | 'md';
  /** Stop the click from bubbling to a parent <Link>. */
  stopPropagation?: boolean;
  className?: string;
}

export function GalleryStarToggle({
  sessionId,
  isPublished,
  size = 'sm',
  stopPropagation = true,
  className,
}: GalleryStarToggleProps) {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const mutation = useMutation({
    mutationFn: () =>
      isPublished ? unpublishSession(sessionId) : publishSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      addToast({
        variant: 'success',
        title: isPublished
          ? 'Removed from gallery'
          : 'Published to the gallery',
      });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      addToast({
        variant: 'error',
        title: 'Could not update gallery state',
        message: err.response?.data?.message ?? err.message,
      });
    },
  });

  const dim = size === 'md' ? 16 : 13;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }
        mutation.mutate();
      }}
      disabled={mutation.isPending}
      title={isPublished ? 'Remove from public gallery' : 'Publish to public gallery'}
      aria-pressed={isPublished}
      className={`hud-glass flex items-center justify-center rounded-full transition-all duration-150 disabled:opacity-50 ${
        size === 'md' ? 'w-9 h-9' : 'w-7 h-7'
      } ${
        isPublished
          ? 'text-yellow-400 hover:text-yellow-300'
          : 'text-white/55 hover:text-yellow-300'
      } ${className ?? ''}`}
    >
      {mutation.isPending ? (
        <Loader2 size={dim} className="animate-spin" />
      ) : (
        <Star
          size={dim}
          className={isPublished ? 'fill-yellow-400' : ''}
        />
      )}
    </button>
  );
}
