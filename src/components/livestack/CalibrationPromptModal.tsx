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
 * Modal shown when the user clicks "Terminer la session" in the live
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
      addToast({ variant: 'success', title: 'Session terminée' });
      queryClient.invalidateQueries({ queryKey: ['live-active'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', session.id] });
      onTerminated?.();
      onClose();
    },
    onError: (err: unknown) => {
      addToast({
        variant: 'error',
        title: 'Impossible de terminer la session',
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
      title="Terminer la session live"
      description="Profitez-en pour ajouter vos darks, flats et dark-flats — la calibration sera meilleure. Vous pouvez aussi tout sauter."
      size="lg"
    >
      <div className="space-y-4">
        <CalibrationDropzones
          sessionId={session.id}
          counts={counts}
          disabled={isFinalising}
        />

        <div className="text-xs text-text-muted bg-space-bg/40 border border-space-border rounded-md px-3 py-2">
          Astuce&nbsp;: les bias seront pris en charge prochainement.
          Les fichiers sont envoyés au fur et à mesure — vous pouvez fermer
          la session dès qu'une famille est complète.
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-space-border">
          <button
            type="button"
            onClick={() => terminateMutation.mutate()}
            disabled={isFinalising}
            className="px-4 py-2 text-sm rounded-md bg-white/5 text-text-secondary hover:bg-white/10 disabled:opacity-50"
          >
            Passer et terminer
          </button>
          <button
            type="button"
            onClick={() => terminateMutation.mutate()}
            disabled={isFinalising}
            className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50"
          >
            {isFinalising && <Loader2 size={14} className="animate-spin" />}
            Terminer la session
          </button>
        </div>
      </div>
    </Modal>
  );
}
