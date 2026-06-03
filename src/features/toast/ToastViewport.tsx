import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { useToastStore, type Toast, type ToastTone } from './toastStore';

const TONE_ICON: Record<ToastTone, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const TONE_ACCENT: Record<ToastTone, string> = {
  success: 'text-emerald-400 light:text-emerald-600',
  error: 'text-rose-400 light:text-rose-600',
  info: 'text-sky-400 light:text-sky-600',
};

/**
 * Fixed, screen-corner stack of active toasts. Reads the queue from the store
 * and renders one self-dismissing card per toast.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismissToast);
  const Icon = TONE_ICON[toast.tone];

  // Auto-dismiss after the toast's duration (0 = sticky until closed).
  useEffect(() => {
    if (toast.duration <= 0) return;
    const id = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(id);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-xl shadow-slate-950/40 backdrop-blur light:border-slate-200 light:bg-white/95 light:shadow-slate-300/50"
    >
      <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', TONE_ACCENT[toast.tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 light:text-slate-900">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-slate-400 light:text-slate-600">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 light:hover:bg-slate-100 light:hover:text-slate-700"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
