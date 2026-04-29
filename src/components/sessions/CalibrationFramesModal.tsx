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
      title="Calibration frames"
      description="Add or top up the darks, flats and dark-flats libraries for this session."
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
          Files are stored under the
          <code className="mx-1 text-text-secondary">darks/</code>,
          <code className="mx-1 text-text-secondary">flats/</code> and
          <code className="mx-1 text-text-secondary">dark_flats/</code>
          sub-folders of this session. Bias frames will be supported in a
          future iteration.
        </p>
        <div className="flex justify-end pt-2 border-t border-space-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
