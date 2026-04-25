import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import type { Toast as ToastType, ToastVariant } from '../../store/uiStore';

const TOAST_DURATION = 4500;

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ElementType; containerClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: 'border-success/30 bg-space-elevated',
    iconClass: 'text-success',
  },
  error: {
    icon: XCircle,
    containerClass: 'border-error/30 bg-space-elevated',
    iconClass: 'text-error',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-warning/30 bg-space-elevated',
    iconClass: 'text-warning',
  },
  info: {
    icon: Info,
    containerClass: 'border-primary/30 bg-space-elevated',
    iconClass: 'text-primary',
  },
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUiStore((s) => s.removeToast);
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl
        animate-slide-in-right
        ${config.containerClass}
      `}
      role="alert"
    >
      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${config.iconClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-3rem)]"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
