import { Modal } from '../ui/Modal';
import { CalibrationDropzones } from './CalibrationDropzones';
import type { SessionRead } from '../../types';

interface CalibrationFramesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionRead;
}

/**
 * Standalone modal that lets the user push darks / flats / dark-flats
 * to an existing session. Used from the SessionDetail page so that
 * calibration libraries can be completed long after the lights have
 * been acquired.
 */
export function CalibrationFramesModal({
  open,
  onOpenChange,
  session,
}: CalibrationFramesModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Frames de calibration"
      description="Ajouter ou compléter les bibliothèques darks, flats et dark-flats de cette session."
      size="lg"
    >
      <div className="space-y-3">
        <CalibrationDropzones
          sessionId={session.id}
          counts={{
            darks: session.frame_count_darks,
            flats: session.frame_count_flats,
            dark_flats: session.frame_count_dark_flats,
          }}
        />
        <p className="text-xs text-text-muted bg-space-bg/40 border border-space-border rounded-md px-3 py-2">
          Les fichiers sont déposés dans les sous-dossiers
          <code className="mx-1 text-text-secondary">darks/</code>,
          <code className="mx-1 text-text-secondary">flats/</code> et
          <code className="mx-1 text-text-secondary">dark_flats/</code> de la session.
          Les bias seront pris en charge prochainement.
        </p>
        <div className="flex justify-end pt-2 border-t border-space-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-hover"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
