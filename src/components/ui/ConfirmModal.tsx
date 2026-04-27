import { Modal } from './Modal';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'danger',
  onConfirm,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-500 text-white'
      : 'bg-warning hover:bg-warning/90 text-black';

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <div className="p-6 space-y-5">
        <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
