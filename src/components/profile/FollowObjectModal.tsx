import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Modal } from '../ui/Modal';
import { CatalogObjectPicker } from '../ui/CatalogObjectPicker';
import { followObject } from '../../services/followedObjects';
import { useUiStore } from '../../store/uiStore';

interface FollowObjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowObjectModal({ open, onOpenChange }: FollowObjectModalProps) {
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const mutation = useMutation({
    mutationFn: () =>
      followObject({
        catalog_id: catalogId!,
        note: note.trim() || null,
        notify_when_visible: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed_objects'] });
      addToast({ variant: 'success', title: 'Object followed' });
      setCatalogId(null);
      setNote('');
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        addToast({
          variant: 'warning',
          title: 'Already followed',
          message: 'You already follow this object.',
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      addToast({ variant: 'error', title: 'Could not follow object', message });
    },
  });

  function handleClose(open: boolean) {
    if (!open) {
      setCatalogId(null);
      setNote('');
    }
    onOpenChange(open);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Follow a new object"
      description="Get reminded when this target rises high in your sky."
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Catalog object
          </label>
          <CatalogObjectPicker value={catalogId} onChange={setCatalogId} />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Note <span className="text-text-muted">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Why this target matters to you…"
            className="w-full rounded-md bg-space-bg border border-space-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <input
            type="checkbox"
            id="notify"
            disabled
            className="accent-primary disabled:opacity-50"
          />
          <label htmlFor="notify" className="cursor-not-allowed">
            Notify me when visible
            <span className="ml-1 text-[10px] uppercase tracking-wider text-text-muted">
              (coming soon)
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-space-border">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!catalogId || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="
              flex items-center gap-1.5 px-4 py-2 text-sm rounded-md
              bg-primary hover:bg-primary-hover text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            "
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <span>Follow</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
