import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { CalibrationDropzones } from '../sessions/CalibrationDropzones';
import { terminateSession } from '../../services/sessions';
import { useUiStore } from '../../store/uiStore';
import type { SessionRead } from '../../types';

interface CalibrationPromptModalProps {
  open: boolean;
  session: SessionRead;
  onClose: () => void;
  /** Callback fired after the session has been successfully terminated. */
  onTerminated?: () => void;
}

/**
 * Modal shown when the user clicks "Terminate session" in the live
 * view. We strongly suggest pushing dark / flat / dark-flat libraries
 * before closing the session, but the user can always skip — we only
 * call ``terminateSession`` once they confirm.
 */
export function CalibrationPromptModal({
  open,
  session,
  onClose,
  onTerminated,
}: CalibrationPromptModalProps) {
  const { addToast } = useUiStore();
  const queryClient = useQueryClient();
  const [isFinalising, setIsFinalising] = useState(false);

  const terminateMutation = useMutation({
    mutationFn: () => terminateSession(session.id),
    onMutate: () => {
      setIsFinalising(true);
    },
    onSuccess: () => {
      addToast({ variant: 'success', title: 'Session terminated' });
      queryClient.invalidateQueries({ queryKey: ['live-active'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', session.id] });
      onTerminated?.();
      onClose();
    },
    onError: (err: unknown) => {
      addToast({
        variant: 'error',
        title: 'Could not terminate the session',
        message: err instanceof Error ? err.message : String(err),
      });
    },
    onSettled: () => {
      setIsFinalising(false);
    },
  });

  const counts = {
    darks: session.frame_count_darks,
    flats: session.frame_count_flats,
    dark_flats: session.frame_count_dark_flats,
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !isFinalising && onClose()}
      title="Terminate live session"
      description="Take a moment to upload your darks, flats and dark-flats — calibration will improve significantly. You can also skip everything."
      size="lg"
    >
      <div className="space-y-4">
        <CalibrationDropzones
          sessionId={session.id}
          counts={counts}
          disabled={isFinalising}
        />

        <div className="text-xs text-text-muted bg-space-bg/40 border border-space-border rounded-md px-3 py-2">
          Tip: bias frames will be supported in a future iteration. Files are
          uploaded as soon as you add them — you can close this dialog the
          moment a library is complete.
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-space-border">
          <button
            type="button"
            onClick={() => terminateMutation.mutate()}
            disabled={isFinalising}
            className="px-4 py-2 text-sm rounded-md bg-white/5 text-text-secondary hover:bg-white/10 disabled:opacity-50"
          >
            Skip and terminate
          </button>
          <button
            type="button"
            onClick={() => terminateMutation.mutate()}
            disabled={isFinalising}
            className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50"
          >
            {isFinalising && <Loader2 size={14} className="animate-spin" />}
            Terminate session
          </button>
        </div>
      </div>
    </Modal>
  );
}
